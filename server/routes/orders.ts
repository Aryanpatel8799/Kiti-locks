import { Router, Request, Response } from "express";
import { z } from "zod";
import Order from "../models/Order";
import {
  authenticateToken,
  requireAdmin,
  AuthRequest,
} from "../middleware/auth";
import { getConnectionStatus } from "../config/database";
import emailService from "../services/emailService";

const router = Router();

// Create order after successful payment
router.post(
  "/create",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        paymentIntentId,
        items,
        shippingAddress,
        subtotal,
        tax,
        shipping,
        total,
        paymentStatus = "paid",
        status = "confirmed",
      } = req.body;

      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      if (!paymentIntentId || !items || !shippingAddress) {
        res.status(400).json({ error: "Missing required order information" });
        return;
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order
      const order = new Order({
        orderNumber,
        user: req.user?.userId,
        items: items.map((item: any) => ({
          product: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || "/placeholder.svg",
        })),
        subtotal: subtotal || 0,
        tax: tax || 0,
        shipping: shipping || 0,
        total: total || subtotal || 0,
        status,
        paymentStatus,
        paymentMethod: "stripe",
        paymentIntentId,
        shippingAddress: {
          type: "shipping",
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          address1: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country || "US",
          isDefault: false,
        },
        billingAddress: {
          type: "billing",
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          address1: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country || "US",
          isDefault: false,
        },
      });

      await order.save();

      // Send confirmation email (optional - will handle errors gracefully)
      try {
        await emailService.sendOrderConfirmation({
          orderId: order.orderNumber,
          customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          customerEmail: shippingAddress.email,
          items: items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          totalAmount: total,
          shippingAddress: {
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            address: shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zipCode: shippingAddress.zipCode,
            country: shippingAddress.country || "US",
          },
        });
      } catch (emailError) {
        console.warn("Failed to send confirmation email:", emailError);
        // Don't fail the order creation if email fails
      }

      res.status(201).json({
        message: "Order created successfully",
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt,
        },
      });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  },
);

// Get all orders (admin only)
router.get(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const orders = await Order.find()
        .populate("user", "name email")
        .populate("items.product", "name price")
        .sort({ createdAt: -1 })
        .select('-__v');

      res.json({ orders });
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  },
);

// Get user's orders
router.get(
  "/my",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const orders = await Order.find({ user: req.user?.userId })
        .populate("items.product", "name price images")
        .sort({ createdAt: -1 })
        .select("-__v");

      res.json({ orders });
    } catch (error) {
      console.error("Get user orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  },
);

// Get user's orders (must be above /:orderId)
router.get(
  "/my-orders",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;

      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const orders = await Order.find({ user: userId })
        .populate("items.product", "name price")
        .sort({ createdAt: -1 })
        .select('-__v');

      res.json({ orders });
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  },
);

// Get single order (must be after all specific routes)
router.get(
  "/:orderId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;

      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const order = await Order.findById(orderId)
        .populate("user", "name email")
        .populate("items.product", "name price images")
        .select('-__v');

      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      // Check if user owns this order or is admin
      if (
        req.user?.role !== "admin" &&
        order.user._id.toString() !== req.user?.userId
      ) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      res.json({ order });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  },
);

// Update order status (admin only)
router.put(
  "/:orderId/status",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;

      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const validStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ];

      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          status,
          ...(status === "shipped" && { shippedAt: new Date() }),
          ...(status === "delivered" && { deliveredAt: new Date() }),
        },
        { new: true },
      ).populate("user", "name email");

      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      // Send email notifications for specific status changes
      try {
        if (order.user && (status === "shipped" || status === "delivered")) {
          const emailData = {
            orderId: order._id.toString(),
            customerName: (order.user as any).name || "Customer",
            customerEmail: (order.user as any).email,
            items: order.items.map((item: any) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
            })),
            totalAmount: order.totalAmount,
            shippingAddress: order.shippingAddress,
          };

          if (status === "shipped") {
            await emailService.sendOrderShipped(emailData);
          } else if (status === "delivered") {
            await emailService.sendOrderDelivered(emailData);
          }
        }
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
        // Don't fail the status update if email fails
      }

      res.json({
        message: "Order status updated successfully",
        order,
      });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  },
);

export default router;

import express, { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import Order from "../models/Order";
import User from "../models/User";
import Product from "../models/Product";
import emailService from "../services/emailService";
import { createShiprocketOrderWithDefaults } from "../utils/shiprocketAuth";

const router = express.Router();

// Declare global type for demo sessions
declare global {
  var demoSessions: Map<string, any> | undefined;
}

// Initialize Razorpay with the provided keys
let razorpay: Razorpay | null = null;
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;



// Initialize Razorpay
try {
  if (razorpayKeyId && razorpayKeySecret) {
    razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });
  } else {
    console.warn("⚠️ Razorpay keys not provided, running in demo mode");

  }
} catch (error) {
  console.error("❌ Razorpay initialization failed:", error);
  razorpay = null;
}

// Create Razorpay order - requires authentication
router.post("/create-razorpay-order", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { items, currency = "INR" } = req.body;
    const userId = (req as AuthRequest).user?.userId;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart items are required" });
    }

    if (!razorpay) {
      return res.status(503).json({ error: "Payment service not available" });
    }

    // Calculate total amount from actual product prices (server-side validation)
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: "Each item must have a valid productId and quantity" });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }

    // No tax added - just product prices
    const finalAmount = Math.round(totalAmount * 100); // Convert to paise

    // Create Razorpay order
    const options = {
      amount: finalAmount,
      currency: currency.toUpperCase(),
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
      validatedItems,
      totalAmount: totalAmount, // Amount in rupees (without tax)
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// Create checkout session - calculates amounts server-side
router.post("/create-session", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { items, shippingAddress } = req.body;
    const userId = (req as AuthRequest).user?.userId;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Cart items are required" });
      return;
    }

    if (!razorpay) {
      res.status(503).json({ error: "Payment service not available" });
      return;
    }

    // Calculate total amount from actual product prices (server-side validation)
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: "Each item must have a valid productId and quantity" });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }

    // No tax added - just product prices
    const finalAmount = Math.round(totalAmount * 100); // Convert to paise

    // Create Razorpay order
    const options = {
      amount: finalAmount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
      validatedItems,
      totalAmount: totalAmount, // Amount in rupees (without tax)
      isDemoMode: false
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// Verify Razorpay payment - requires authentication
router.post("/verify-razorpay-payment", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = (req as AuthRequest).user?.userId;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification data" });
    }

    if (!razorpayKeySecret) {
      return res.status(500).json({ error: "Payment verification not available" });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      res.json({
        success: true,
        message: "Payment verified successfully",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      res.status(400).json({ error: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// Handle successful Razorpay payment
router.post("/razorpay-success", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      orderId,
      items,
      orderItems,
      shippingAddress
    } = req.body;
    const userId = (req as AuthRequest).user?.userId;



    // Use orderItems if available, fallback to items
    const finalItems = orderItems || items || [];
    


    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment details" });
    }

    // Verify payment signature
    if (!razorpayKeySecret) {
      return res.status(500).json({ error: "Payment verification not available" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Fetch payment details from Razorpay
    let paymentDetails;
    try {
      paymentDetails = await razorpay!.payments.fetch(razorpay_payment_id);
    } catch (error) {
      console.error("Error fetching payment details:", error);
      return res.status(500).json({ error: "Failed to verify payment" });
    }

    // Use items and shippingAddress from request body, or default values
    const orderItemsArray = finalItems || [];
    
    // Ensure address objects have all required fields with defaults
    const ensureAddressDefaults = (address: any, type: 'shipping' | 'billing') => ({
      type,
      firstName: address?.firstName || "Guest",
      lastName: address?.lastName || "User", 
      email: address?.email || "guest@example.com",
      phone: address?.phone || "9876543210",
      address1: address?.address1 || address?.address || "Default Address",
      city: address?.city || "Default City",
      state: address?.state || "Default State",
      zipCode: address?.zipCode || "000000",
      country: address?.country || "India",
      isDefault: false,
    });

    const orderShippingAddress = ensureAddressDefaults(shippingAddress, 'shipping');
    const orderBillingAddress = ensureAddressDefaults(shippingAddress, 'billing'); // Use shipping as billing default

    // Recalculate amount from items for additional security validation
    let calculatedAmount = 0;
    if (orderItemsArray.length > 0) {
      for (const item of orderItemsArray) {
        if (item.productId || item.product) {
          // Handle both frontend formats: item.product (from orderItems) and item.productId (from items)
          const productId = item.productId || item.product;
          const product = await Product.findById(productId);
          if (product) {
            calculatedAmount += product.price * (item.quantity || 1);
          }
        }
      }
    }

    // Create order in database
    const paymentAmount = Number(paymentDetails.amount) / 100; // Convert from paise
    
    // Use calculated amount if available, otherwise use payment amount
    const finalAmount = calculatedAmount > 0 ? calculatedAmount : paymentAmount;
    
    const order = new Order({
      orderNumber: `ORD-${Date.now()}`,
      user: userId || new mongoose.Types.ObjectId(), // Use dummy ObjectId for guest users
      items: orderItemsArray.map((item: any) => ({
        product: item.productId || item.product || new mongoose.Types.ObjectId(),
        name: item.name || "Product",
        price: item.price || 0,
        quantity: item.quantity || 1,
        image: item.image || "/placeholder.svg",
      })),
      subtotal: finalAmount, // No tax included
      tax: 0, // Explicitly no tax
      shipping: 0, // Explicitly no shipping cost
      total: finalAmount, // Same as subtotal since no tax/shipping
      paymentStatus: "paid",
      paymentMethod: "razorpay",
      paymentIntentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      shippingAddress: orderShippingAddress,
      billingAddress: orderBillingAddress,
      status: "confirmed",
    });

    try {
 

      await order.save();

      // 🚚 Automatically create Shiprocket order after successful payment
      try {
        
        // Only create Shiprocket order if we have items
        if (orderItemsArray.length === 0) {
          console.warn("⚠️ No items found in order - skipping Shiprocket order creation");
          console.warn("Available data:", { orderItemsArray, finalItems, items, orderItems });
        } else {
          const shiprocketOrderData = {
            order_id: order._id.toString(),
            customer_name: `${orderShippingAddress.firstName} ${orderShippingAddress.lastName}`.trim() || "Guest User",
            customer_email: userId ? (await User.findById(userId))?.email || "guest@example.com" : "guest@example.com",
            customer_phone: orderShippingAddress.phone || "9876543210", // Use phone from shipping address
            shipping_address: {
              address: orderShippingAddress.address1,
              city: orderShippingAddress.city,
              state: orderShippingAddress.state,
              pincode: orderShippingAddress.zipCode,
              country: orderShippingAddress.country
            },
            items: orderItemsArray.map((item: any) => ({
              name: item.name || "Product",
              sku: (item.productId || item.product)?.toString() || "SKU001",
              units: item.quantity || 1,
              selling_price: item.price || 0,
              weight: 0.5 // Default weight - you can add weight to products
            })),
            payment_method: "Prepaid" as const, // Since payment is already completed
            sub_total: finalAmount,
            comment: `Order ${order.orderNumber} - ${orderShippingAddress.firstName} ${orderShippingAddress.lastName}`
          };


          const shiprocketOrder = await createShiprocketOrderWithDefaults(shiprocketOrderData);

          // Update order with Shiprocket data
          order.shipment_id = shiprocketOrder.shipment_id;
          order.shiprocket_tracking_url = shiprocketOrder.tracking_url;
          order.order_created_on_shiprocket = true;
          await order.save();

        }

      } catch (shiprocketError) {
        console.error("❌ Shiprocket order creation failed:", shiprocketError);
        // Don't fail the entire order - just log the error
        // Order is still saved locally even if Shiprocket fails
      }

    } catch (saveError) {
      console.error("❌ Order save failed:", saveError);
      return res.status(500).json({ 
        error: "Failed to create order", 
        details: saveError instanceof Error ? saveError.message : "Unknown error"
      });
    }

    // Clear user's cart if logged in
    if (userId) {
      await User.findByIdAndUpdate(userId, { cart: [] });
    }

    res.json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      order: order,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error("Razorpay payment success error:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
});

export default router;
import express, { Request, Response } from "express";
import { z } from "zod";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import User from "../models/User";
import Product from "../models/Product";
import { getConnectionStatus } from "../config/database";

const router = express.Router();

const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  variant: z
    .object({
      name: z.string(),
      value: z.string(),
    })
    .optional(),
});

const updateCartItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().min(0, "Quantity must be at least 0"),
  variant: z
    .object({
      name: z.string(),
      value: z.string(),
    })
    .optional(),
});

// Get user's cart (for logged-in users)
router.get(
  "/",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const authReq = req as AuthRequest;
      const user = await User.findById(authReq.user?.userId).populate({
        path: "cart.product",
        model: "Product",
        populate: {
          path: "category",
          model: "Category",
        },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Filter out cart items with null product
      const filteredCart = (user.cart || []).filter((item: any) => item.product);
      res.json({ cart: filteredCart });
    } catch (error) {
      console.error("Get cart error:", error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  },
);

// Add item to cart
router.post(
  "/add",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId, quantity, variant } = addToCartSchema.parse(req.body);

      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const authReq = req as AuthRequest;
      const user = await User.findById(authReq.user?.userId);
      const product = await Product.findById(productId);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      if (product.stock < quantity) {
        res.status(400).json({ error: "Insufficient stock" });
        return;
      }

      // Initialize cart if it doesn't exist
      if (!user.cart) {
        user.cart = [];
      }

      // Check if item already exists in cart
      const existingItemIndex = user.cart.findIndex(
        (item: any) =>
          item.product.toString() === productId &&
          JSON.stringify(item.variant) === JSON.stringify(variant),
      );

      if (existingItemIndex > -1) {
        // Update existing item
        user.cart[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        user.cart.push({
          product: productId,
          quantity,
          variant,
          addedAt: new Date(),
        });
      }

      await user.save();

      res.json({ message: "Item added to cart successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }

      console.error("Add to cart error:", error);
      res.status(500).json({ error: "Failed to add item to cart" });
    }
  },
);

// Update cart item quantity
router.put(
  "/update",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId, quantity, variant } = updateCartItemSchema.parse(req.body);

      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const authReq = req as AuthRequest;
      const user = await User.findById(authReq.user?.userId);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (!user.cart) {
        res.status(404).json({ error: "Cart is empty" });
        return;
      }

      // Find the item in cart
      const itemIndex = user.cart.findIndex(
        (item: any) =>
          item.product.toString() === productId &&
          JSON.stringify(item.variant) === JSON.stringify(variant),
      );

      if (itemIndex === -1) {
        res.status(404).json({ error: "Item not found in cart" });
        return;
      }

      if (quantity === 0) {
        // Remove item if quantity is 0
        user.cart.splice(itemIndex, 1);
      } else {
        // Update quantity
        user.cart[itemIndex].quantity = quantity;
      }

      await user.save();

      res.json({ message: "Cart updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }

      console.error("Update cart error:", error);
      res.status(500).json({ error: "Failed to update cart" });
    }
  },
);

// Update cart item quantity by productId (alternative endpoint)
router.put(
  "/:productId",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;

      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      if (!productId || quantity === undefined) {
        res.status(400).json({ error: "Product ID and quantity are required" });
        return;
      }

      if (quantity < 0) {
        res.status(400).json({ error: "Quantity must be at least 0" });
        return;
      }

      const authReq = req as AuthRequest;
      const user = await User.findById(authReq.user?.userId);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (!user.cart) {
        user.cart = [];
      }

      const cartItemIndex = user.cart.findIndex(
        (item: any) => item.product.toString() === productId,
      );

      if (cartItemIndex === -1) {
        res.status(404).json({ error: "Item not found in cart" });
        return;
      }

      if (quantity === 0) {
        // Remove item if quantity is 0
        user.cart.splice(cartItemIndex, 1);
      } else {
        // Update quantity
        user.cart[cartItemIndex].quantity = quantity;
      }

      await user.save();

      // Populate cart for response
      await user.populate({
        path: "cart.product",
        model: "Product",
        populate: {
          path: "category",
          model: "Category",
        },
      });

      res.json({
        message: "Cart updated successfully",
        cart: user.cart,
      });
    } catch (error) {
      console.error("Update cart item error:", error);
      res.status(500).json({ error: "Failed to update cart item" });
    }
  },
);

// Remove item from cart
router.delete(
  "/remove/:productId",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;

      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const authReq = req as AuthRequest;
      const user = await User.findById(authReq.user?.userId);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (!user.cart) {
        res.status(404).json({ error: "Cart is empty" });
        return;
      }

      // Remove item from cart
      user.cart = user.cart.filter((item: any) => item.product.toString() !== productId);

      await user.save();

      res.json({ message: "Item removed from cart successfully" });
    } catch (error) {
      console.error("Remove from cart error:", error);
      res.status(500).json({ error: "Failed to remove item from cart" });
    }
  },
);

// Clear cart
router.delete(
  "/clear",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const authReq = req as AuthRequest;
      const user = await User.findById(authReq.user?.userId);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      user.cart = [];
      await user.save();

      res.json({ message: "Cart cleared successfully" });
    } catch (error) {
      console.error("Clear cart error:", error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  },
);

export default router;

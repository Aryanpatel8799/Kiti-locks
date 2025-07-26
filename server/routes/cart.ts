import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import User from "../models/User";
import Product from "../models/Product";
import { getConnectionStatus } from "../config/database";

const router = Router();

const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().min(1, "Quantity must be at least 1").default(1),
  variant: z
    .object({
      name: z.string(),
      value: z.string(),
    })
    .optional(),
});

const updateCartItemSchema = z.object({
  quantity: z.number().min(0, "Quantity must be non-negative"),
});

// Get user's cart (for logged-in users)
router.get(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const user = await User.findById(req.user?.userId).populate({
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
      const filteredCart = (user.cart || []).filter(item => item.product);
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
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { productId, quantity, variant } = addToCartSchema.parse(req.body);

      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const user = await User.findById(req.user?.userId);
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
  "/:productId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;
      const { quantity } = updateCartItemSchema.parse(req.body);

      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const user = await User.findById(req.user?.userId);

      if (!user || !user.cart) {
        res.status(404).json({ error: "Cart not found" });
        return;
      }

      const itemIndex = user.cart.findIndex(
        (item: any) => item.product.toString() === productId,
      );

      if (itemIndex === -1) {
        res.status(404).json({ error: "Item not found in cart" });
        return;
      }

      if (quantity === 0) {
        // Remove item from cart
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

// Remove item from cart
router.delete(
  "/:productId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;

      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const user = await User.findById(req.user?.userId);

      if (!user || !user.cart) {
        res.status(404).json({ error: "Cart not found" });
        return;
      }

      user.cart = user.cart.filter(
        (item: any) => item.product.toString() !== productId,
      );

      await user.save();

      res.json({ message: "Item removed from cart successfully" });
    } catch (error) {
      console.error("Remove from cart error:", error);
      res.status(500).json({ error: "Failed to remove item from cart" });
    }
  },
);

// Clear entire cart
router.delete(
  "/",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const user = await User.findById(req.user?.userId);

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

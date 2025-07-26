import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import User from "../models/User";
import Product from "../models/Product";
import { getConnectionStatus } from "../config/database";

const router = Router();

const addToWishlistSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

// Get user's wishlist
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
        path: "wishlist",
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

      // Transform wishlist items to match client expectations
      const wishlistItems = (user.wishlist || []).map((product: any) => ({
        _id: product._id,
        product: product,
        dateAdded: new Date().toISOString(), // We don't have actual date added, so use current
      }));

      res.json({ wishlist: wishlistItems });
    } catch (error) {
      console.error("Get wishlist error:", error);
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  },
);

// Add item to wishlist
router.post(
  "/add",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { productId } = addToWishlistSchema.parse(req.body);

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

      // Check if product is already in wishlist
      if (user.wishlist.includes(productId as any)) {
        res.status(400).json({ error: "Product already in wishlist" });
        return;
      }

      user.wishlist.push(productId as any);
      await user.save();

      res.json({ message: "Item added to wishlist successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }

      console.error("Add to wishlist error:", error);
      res.status(500).json({ error: "Failed to add item to wishlist" });
    }
  },
);

// Remove item from wishlist
router.delete(
  "/:productId",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const { productId } = req.params;

      const user = await User.findById(req.user?.userId);

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      user.wishlist = user.wishlist.filter(
        (id: any) => id.toString() !== productId,
      );

      await user.save();

      res.json({ message: "Item removed from wishlist successfully" });
    } catch (error) {
      console.error("Remove from wishlist error:", error);
      res.status(500).json({ error: "Failed to remove item from wishlist" });
    }
  },
);

// Toggle item in wishlist (add if not present, remove if present)
router.post(
  "/toggle",
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { productId } = addToWishlistSchema.parse(req.body);

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

      const isInWishlist = user.wishlist.includes(productId as any);

      if (isInWishlist) {
        // Remove from wishlist
        user.wishlist = user.wishlist.filter(
          (id: any) => id.toString() !== productId,
        );
        await user.save();
        res.json({
          message: "Item removed from wishlist",
          inWishlist: false,
        });
      } else {
        // Add to wishlist
        user.wishlist.push(productId as any);
        await user.save();
        res.json({
          message: "Item added to wishlist",
          inWishlist: true,
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }

      console.error("Toggle wishlist error:", error);
      res.status(500).json({ error: "Failed to toggle wishlist item" });
    }
  },
);

// Clear entire wishlist
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

      user.wishlist = [];
      await user.save();

      res.json({ message: "Wishlist cleared successfully" });
    } catch (error) {
      console.error("Clear wishlist error:", error);
      res.status(500).json({ error: "Failed to clear wishlist" });
    }
  },
);

export default router;

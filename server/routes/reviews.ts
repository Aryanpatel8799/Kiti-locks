import express from "express";
import Review from "../models/Review";
import Product from "../models/Product";
import Order from "../models/Order";
import { authenticateToken as auth, optionalAuth } from "../middleware/auth";
import { getConnectionStatus } from "../config/database";
import mongoose from "mongoose";

const router = express.Router();

// Get reviews for a product
router.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = "newest", rating } = req.query;

    // Require database connection
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error:
          "Database connection required. Please ensure MongoDB is connected.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Build query
    const query: any = { product: productId };
    if (rating && rating !== "all") {
      query.rating = parseInt(rating as string);
    }

    // Build sort
    let sortQuery: any = {};
    switch (sort) {
      case "newest":
        sortQuery = { createdAt: -1 };
        break;
      case "oldest":
        sortQuery = { createdAt: 1 };
        break;
      case "highest":
        sortQuery = { rating: -1 };
        break;
      case "lowest":
        sortQuery = { rating: 1 };
        break;
      case "helpful":
        sortQuery = { helpful: -1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));

    const reviews = await Review.find(query)
      .populate("user", "name avatar")
      .sort(sortQuery)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const totalReviews = await Review.countDocuments(query);

    // Get rating statistics
    const stats = await Review.calculateAverageRating(productId);

    res.json({
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalReviews,
        pages: Math.ceil(totalReviews / limitNum),
      },
      stats,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Get a single review
router.get("/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Require database connection
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error:
          "Database connection required. Please ensure MongoDB is connected.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }

    const review = await Review.findById(reviewId)
      .populate("user", "name avatar")
      .populate("product", "name slug");

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json(review);
  } catch (error) {
    console.error("Error fetching review:", error);
    res.status(500).json({ error: "Failed to fetch review" });
  }
});

// Create a new review
router.post("/", auth, async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    const userId = req.user!.userId;

    // Require database connection
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error:
          "Database connection required. Please ensure MongoDB is connected.",
      });
    }

    // Validate required fields
    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({
        error: "Product ID, rating, title, and comment are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: userId,
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ error: "You have already reviewed this product" });
    }

    // Check if user purchased this product (for verified review)
    const hasPurchased = await Order.exists({
      user: userId,
      "items.product": productId,
      status: { $in: ["completed", "delivered"] },
    });

    // Create review
    const review = new Review({
      product: productId,
      user: userId,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      verified: !!hasPurchased,
    });

    await review.save();

    // Populate user info for response
    await review.populate("user", "name avatar");

    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// Update a review
router.put("/:reviewId", auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const userId = req.user!.userId;

    // Require database connection
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error:
          "Database connection required. Please ensure MongoDB is connected.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    // Find review and check ownership
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (review.user.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "You can only edit your own reviews" });
    }

    // Update fields
    if (rating) review.rating = rating;
    if (title) review.title = title.trim();
    if (comment) review.comment = comment.trim();

    await review.save();

    // Populate user info for response
    await review.populate("user", "name avatar");

    res.json(review);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
});

// Delete a review
router.delete("/:reviewId", auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Require database connection
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error:
          "Database connection required. Please ensure MongoDB is connected.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }

    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check ownership or admin permission
    if (review.user.toString() !== userId && userRole !== "admin") {
      return res
        .status(403)
        .json({ error: "You can only delete your own reviews" });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// Mark review as helpful
router.post("/:reviewId/helpful", auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user!.userId;

    // Require database connection
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error:
          "Database connection required. Please ensure MongoDB is connected.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if user already marked as helpful
    const alreadyHelpful = review.helpfulUsers.includes(
      new mongoose.Types.ObjectId(userId),
    );

    if (alreadyHelpful) {
      // Remove helpful vote
      review.helpfulUsers = review.helpfulUsers.filter(
        (id) => id.toString() !== userId,
      );
      review.helpful = Math.max(0, review.helpful - 1);
    } else {
      // Add helpful vote
      review.helpfulUsers.push(new mongoose.Types.ObjectId(userId));
      review.helpful += 1;
    }

    await review.save();

    res.json({
      helpful: review.helpful,
      userMarkedHelpful: !alreadyHelpful,
    });
  } catch (error) {
    console.error("Error updating helpful status:", error);
    res.status(500).json({ error: "Failed to update helpful status" });
  }
});

// Get user's reviews
router.get("/user/my-reviews", auth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const { page = 1, limit = 10 } = req.query;

    // Require database connection
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error:
          "Database connection required. Please ensure MongoDB is connected.",
      });
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));

    const reviews = await Review.find({ user: userId })
      .populate("product", "name slug images")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const totalReviews = await Review.countDocuments({ user: userId });

    res.json({
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalReviews,
        pages: Math.ceil(totalReviews / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

export default router;

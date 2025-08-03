import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import Review from "../models/Review";
import Product from "../models/Product";
import Order from "../models/Order";
import { getConnectionStatus } from "../config/database";

const router = express.Router();

// Get reviews for a product
router.get("/product/:productId", async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = "newest" } = req.query;

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

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Build query
    const query = { product: productId };

    // Build sort options
    let sortOptions: any = {};
    switch (sort) {
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "oldest":
        sortOptions = { createdAt: 1 };
        break;
      case "highest":
        sortOptions = { rating: -1 };
        break;
      case "lowest":
        sortOptions = { rating: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Calculate pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Get reviews with pagination
    const reviews = await Review.find(query)
      .populate("user", "name avatar")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Review.countDocuments(query);

    // Calculate average rating
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating",
          },
        },
      },
    ]);

    const ratingStats = stats[0] || {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: [],
    };

    // Calculate rating distribution
    const distribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: ratingStats.ratingDistribution.filter((r: number) => r === rating)
        .length,
    }));

    res.json({
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalReviews: total,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      },
      stats: {
        averageRating: Math.round(ratingStats.averageRating * 10) / 10,
        totalReviews: ratingStats.totalReviews,
        distribution,
      },
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Create a new review
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { productId, rating, title, comment } = req.body;
    const authReq = req as AuthRequest;
    const userId = authReq.user!.userId;

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
router.put("/:reviewId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const authReq = req as AuthRequest;
    const userId = authReq.user!.userId;

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

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if user owns this review or is admin
    if (review.user.toString() !== userId) {
      return res.status(403).json({ error: "You can only edit your own reviews" });
    }

    // Update review
    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title.trim();
    if (comment !== undefined) review.comment = comment.trim();

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
router.delete("/:reviewId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const authReq = req as AuthRequest;
    const userId = authReq.user!.userId;
    const userRole = authReq.user!.role;

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

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if user owns this review or is admin
    if (review.user.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({ error: "You can only delete your own reviews" });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// Get user's reviews
router.get("/user", authenticateToken, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user!.userId;
    const { page = 1, limit = 10 } = req.query;

    // Require database connection
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error:
          "Database connection required. Please ensure MongoDB is connected.",
      });
    }

    // Calculate pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Get user's reviews
    const reviews = await Review.find({ user: userId })
      .populate("product", "name images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Review.countDocuments({ user: userId });

    res.json({
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalReviews: total,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ error: "Failed to fetch user reviews" });
  }
});

// Like/Unlike a review
router.post("/:reviewId/like", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const authReq = req as AuthRequest;
    const userId = authReq.user!.userId;

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

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if user already liked this review
    const hasLiked = review.likes.includes(userId);

    if (hasLiked) {
      // Unlike
      review.likes = review.likes.filter((id: any) => id.toString() !== userId);
    } else {
      // Like
      review.likes.push(userId);
    }

    await review.save();

    res.json({
      liked: !hasLiked,
      likesCount: review.likes.length,
    });
  } catch (error) {
    console.error("Error toggling review like:", error);
    res.status(500).json({ error: "Failed to toggle review like" });
  }
});

// Report a review
router.post("/:reviewId/report", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const authReq = req as AuthRequest;
    const userId = authReq.user!.userId;

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

    if (!reason) {
      return res.status(400).json({ error: "Report reason is required" });
    }

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Check if user already reported this review
    const hasReported = review.reports.some(
      (report: any) => report.user.toString() === userId,
    );

    if (hasReported) {
      return res.status(400).json({ error: "You have already reported this review" });
    }

    // Add report
    review.reports.push({
      user: userId,
      reason: reason.trim(),
      reportedAt: new Date(),
    });

    await review.save();

    res.json({ message: "Review reported successfully" });
  } catch (error) {
    console.error("Error reporting review:", error);
    res.status(500).json({ error: "Failed to report review" });
  }
});

export default router;

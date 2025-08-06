import { Router, Request, Response } from "express";
import { z } from "zod";
import User from "../models/User";
import Order from "../models/Order";
import {
  authenticateToken,
  requireAdmin,
  AuthRequest,
} from "../middleware/auth";
import { getConnectionStatus } from "../config/database";

const router = Router();

const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  role: z.enum(["user", "admin"]).optional(),
  isActive: z.boolean().optional(),
});

// Get all users (admin only)
router.get(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const { page = 1, limit = 10, search, role, isActive } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build filter object
      const filter: any = {};
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }
      
      if (role && role !== "all") {
        filter.role = role;
      }
      
      if (isActive !== undefined && isActive !== "all") {
        filter.isActive = isActive === "true";
      }

      const [users, totalUsers] = await Promise.all([
        User.find(filter)
          .select("-password -twoFactorSecret")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum),
        User.countDocuments(filter),
      ]);

      // Get user statistics
      const userStats = await User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]);

      const activeUsers = await User.countDocuments({ isActive: { $ne: false } });
      const inactiveUsers = await User.countDocuments({ isActive: false });

      res.json({
        users,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalUsers / limitNum),
          totalUsers,
          hasNext: pageNum * limitNum < totalUsers,
          hasPrev: pageNum > 1,
        },
        stats: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          byRole: userStats.reduce((acc: Record<string, number>, stat: any) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {} as Record<string, number>),
        },
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  },
);

// Get user details with order history (admin only)
router.get(
  "/:userId",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const { userId } = req.params;

      const user = await User.findById(userId)
        .select("-password -twoFactorSecret")
        .populate("wishlist", "name price images slug");

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Get user's order history
      const orders = await Order.find({ user: userId })
        .populate("items.product", "name price")
        .sort({ createdAt: -1 })
        .limit(10);

      // Calculate user statistics
      const orderStats = await Order.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: "$total" },
            averageOrderValue: { $avg: "$total" },
          },
        },
      ]);

      const stats = orderStats[0] || {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
      };

      res.json({
        user,
        orders,
        stats,
      });
    } catch (error) {
      console.error("Get user details error:", error);
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  },
);

// Update user (admin only)
router.put(
  "/:userId",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const { userId } = req.params;
      const validatedData = updateUserSchema.parse(req.body);

      // Prevent admin from changing their own role
      const currentUser = (req as AuthRequest).user;
      if (currentUser?.userId === userId && validatedData.role) {
        res.status(400).json({ error: "Cannot change your own role" });
        return;
      }

      // Check if email is already taken by another user
      if (validatedData.email) {
        const existingUser = await User.findOne({
          email: validatedData.email,
          _id: { $ne: userId },
        });
        if (existingUser) {
          res.status(400).json({ error: "Email already exists" });
          return;
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        validatedData,
        { new: true, runValidators: true }
      ).select("-password -twoFactorSecret");

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        message: "User updated successfully",
        user,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }

      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  },
);

// Delete user (admin only)
router.delete(
  "/:userId",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const { userId } = req.params;
      const currentUser = (req as AuthRequest).user;

      // Prevent admin from deleting themselves
      if (currentUser?.userId === userId) {
        res.status(400).json({ error: "Cannot delete your own account" });
        return;
      }

      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      // Check if user has orders
      const hasOrders = await Order.countDocuments({ user: userId });
      if (hasOrders > 0) {
        // Instead of deleting, deactivate the user
        user.isActive = false;
        await user.save();
        res.json({
          message: "User deactivated successfully (has order history)",
          user: { ...user.toObject(), password: undefined, twoFactorSecret: undefined },
        });
      } else {
        // Safe to delete if no orders
        await User.findByIdAndDelete(userId);
        res.json({ message: "User deleted successfully" });
      }
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  },
);

// Get user analytics (admin only)
router.get(
  "/analytics/overview",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const { period = "30" } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // User registration trends
      const registrationTrends = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
            "_id.day": 1,
          },
        },
      ]);

      // User activity metrics
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: { $ne: false } });
      const newUsersThisMonth = await User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      });

      // Top customers by order value
      const topCustomers = await Order.aggregate([
        {
          $group: {
            _id: "$user",
            totalSpent: { $sum: "$total" },
            orderCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $project: {
            name: "$user.name",
            email: "$user.email",
            totalSpent: 1,
            orderCount: 1,
          },
        },
        {
          $sort: { totalSpent: -1 },
        },
        {
          $limit: 10,
        },
      ]);

      res.json({
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        registrationTrends,
        topCustomers,
      });
    } catch (error) {
      console.error("Get user analytics error:", error);
      res.status(500).json({ error: "Failed to fetch user analytics" });
    }
  },
);

export default router;

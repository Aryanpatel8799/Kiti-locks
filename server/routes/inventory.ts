import { Router, Request, Response } from "express";
import { z } from "zod";
import Product from "../models/Product";
import Order from "../models/Order";
import {
  authenticateToken,
  requireAdmin,
  AuthRequest,
} from "../middleware/auth";
import { getConnectionStatus } from "../config/database";

const router = Router();

const inventoryUpdateSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
});

const bulkInventoryUpdateSchema = z.object({
  updates: z.array(z.object({
    productId: z.string().min(1, "Product ID is required"),
    quantity: z.number().min(0, "Quantity must be non-negative"),
    reason: z.string().min(1, "Reason is required"),
  })),
});

// Get inventory overview (admin only)
router.get(
  "/overview",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const { category, status = "active", lowStock = "10" } = req.query;
      const lowStockThreshold = parseInt(lowStock as string);

      // Build filter
      const filter: any = {};
      if (status !== "all") {
        filter.status = status;
      }
      if (category && category !== "all") {
        filter.category = category;
      }

      // Get inventory data
      const products = await Product.find(filter)
        .populate("category", "name")
        .select("name slug price stock status category images")
        .sort({ stock: 1 });

      // Calculate inventory statistics
      const totalProducts = products.length;
      const lowStockProducts = products.filter(p => p.stock <= lowStockThreshold);
      const outOfStockProducts = products.filter(p => p.stock === 0);
      const totalInventoryValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);

      // Get stock movement data (from recent orders)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const stockMovements = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            status: { $ne: "cancelled" }
          }
        },
        {
          $unwind: "$items"
        },
        {
          $group: {
            _id: "$items.product",
            totalSold: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
          }
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product"
          }
        },
        {
          $unwind: "$product"
        },
        {
          $project: {
            name: "$product.name",
            slug: "$product.slug",
            currentStock: "$product.stock",
            totalSold: 1,
            revenue: 1,
            turnoverRate: {
              $cond: {
                if: { $gt: ["$product.stock", 0] },
                then: { $divide: ["$totalSold", "$product.stock"] },
                else: 0
              }
            }
          }
        },
        {
          $sort: { totalSold: -1 }
        },
        {
          $limit: 20
        }
      ]);

      res.json({
        products,
        statistics: {
          totalProducts,
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length,
          totalInventoryValue,
          lowStockThreshold,
        },
        lowStockProducts: lowStockProducts.slice(0, 10),
        outOfStockProducts: outOfStockProducts.slice(0, 10),
        topMovingProducts: stockMovements,
      });
    } catch (error) {
      console.error("Get inventory overview error:", error);
      res.status(500).json({ error: "Failed to fetch inventory overview" });
    }
  },
);

// Update product stock (admin only)
router.put(
  "/stock/update",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const validatedData = inventoryUpdateSchema.parse(req.body);
      const { productId, quantity, reason, notes } = validatedData;

      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      const oldStock = product.stock;
      product.stock = quantity;
      await product.save();

      // Log the inventory change (in a real app, you'd have an InventoryLog model)
      console.log(`Inventory Update: ${product.name} stock changed from ${oldStock} to ${quantity}. Reason: ${reason}. Notes: ${notes || 'None'}`);

      res.json({
        message: "Stock updated successfully",
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          oldStock,
          newStock: quantity,
          difference: quantity - oldStock,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }

      console.error("Update stock error:", error);
      res.status(500).json({ error: "Failed to update stock" });
    }
  },
);

// Bulk update product stock (admin only)
router.put(
  "/stock/bulk-update",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const validatedData = bulkInventoryUpdateSchema.parse(req.body);
      const { updates } = validatedData;

      const results = [];

      for (const update of updates) {
        try {
          const product = await Product.findById(update.productId);
          if (!product) {
            results.push({
              productId: update.productId,
              success: false,
              error: "Product not found",
            });
            continue;
          }

          const oldStock = product.stock;
          product.stock = update.quantity;
          await product.save();

          results.push({
            productId: update.productId,
            name: product.name,
            success: true,
            oldStock,
            newStock: update.quantity,
            difference: update.quantity - oldStock,
          });

          // Log the inventory change
          console.log(`Bulk Inventory Update: ${product.name} stock changed from ${oldStock} to ${update.quantity}. Reason: ${update.reason}`);
        } catch (error) {
          results.push({
            productId: update.productId,
            success: false,
            error: "Failed to update",
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;

      res.json({
        message: `Bulk update completed: ${successCount} successful, ${failedCount} failed`,
        results,
        summary: {
          total: updates.length,
          successful: successCount,
          failed: failedCount,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }

      console.error("Bulk update stock error:", error);
      res.status(500).json({ error: "Failed to perform bulk update" });
    }
  },
);

// Get low stock alerts (admin only)
router.get(
  "/alerts/low-stock",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const { threshold = "10" } = req.query;
      const lowStockThreshold = parseInt(threshold as string);

      const lowStockProducts = await Product.find({
        stock: { $lte: lowStockThreshold },
        status: "active",
      })
        .populate("category", "name")
        .select("name slug stock price category images")
        .sort({ stock: 1 });

      // Calculate recommended reorder quantities based on sales velocity
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const salesData = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            status: { $ne: "cancelled" }
          }
        },
        {
          $unwind: "$items"
        },
        {
          $group: {
            _id: "$items.product",
            totalSold: { $sum: "$items.quantity" },
            averageDailySales: { $avg: "$items.quantity" }
          }
        }
      ]);

      const salesMap = new Map(salesData.map((item: any) => [item._id.toString(), item]));

      const alertsWithRecommendations = lowStockProducts.map(product => {
        const sales = salesMap.get(product._id.toString()) as any;
        const dailyVelocity = sales ? sales.totalSold / 30 : 0;
        const recommendedReorder = Math.max(Math.ceil(dailyVelocity * 30), 10); // 30 days of stock

        return {
          ...product.toObject(),
          dailyVelocity: Math.round(dailyVelocity * 100) / 100,
          recommendedReorder,
          daysUntilOutOfStock: dailyVelocity > 0 ? Math.floor(product.stock / dailyVelocity) : null,
        };
      });

      res.json({
        alerts: alertsWithRecommendations,
        summary: {
          total: lowStockProducts.length,
          critical: lowStockProducts.filter(p => p.stock === 0).length,
          warning: lowStockProducts.filter(p => p.stock > 0 && p.stock <= 5).length,
          low: lowStockProducts.filter(p => p.stock > 5).length,
        },
        threshold: lowStockThreshold,
      });
    } catch (error) {
      console.error("Get low stock alerts error:", error);
      res.status(500).json({ error: "Failed to fetch low stock alerts" });
    }
  },
);

// Get inventory analytics (admin only)
router.get(
  "/analytics",
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

      // Inventory turnover analysis
      const inventoryAnalysis = await Product.aggregate([
        {
          $lookup: {
            from: "orders",
            let: { productId: "$_id" },
            pipeline: [
              {
                $match: {
                  createdAt: { $gte: startDate },
                  status: { $ne: "cancelled" }
                }
              },
              {
                $unwind: "$items"
              },
              {
                $match: {
                  $expr: { $eq: ["$items.product", "$$productId"] }
                }
              },
              {
                $group: {
                  _id: null,
                  totalSold: { $sum: "$items.quantity" },
                  revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
                }
              }
            ],
            as: "sales"
          }
        },
        {
          $addFields: {
            totalSold: { $ifNull: [{ $arrayElemAt: ["$sales.totalSold", 0] }, 0] },
            revenue: { $ifNull: [{ $arrayElemAt: ["$sales.revenue", 0] }, 0] },
            turnoverRate: {
              $cond: {
                if: { $gt: ["$stock", 0] },
                then: { $divide: [{ $ifNull: [{ $arrayElemAt: ["$sales.totalSold", 0] }, 0] }, "$stock"] },
                else: 0
              }
            },
            inventoryValue: { $multiply: ["$stock", "$price"] }
          }
        },
        {
          $project: {
            name: 1,
            slug: 1,
            stock: 1,
            price: 1,
            totalSold: 1,
            revenue: 1,
            turnoverRate: 1,
            inventoryValue: 1,
            category: 1
          }
        },
        {
          $sort: { turnoverRate: -1 }
        }
      ]);

      // Category-wise inventory summary
      const categoryAnalysis = await Product.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo"
          }
        },
        {
          $unwind: "$categoryInfo"
        },
        {
          $group: {
            _id: "$categoryInfo.name",
            totalProducts: { $sum: 1 },
            totalStock: { $sum: "$stock" },
            totalValue: { $sum: { $multiply: ["$stock", "$price"] } },
            averagePrice: { $avg: "$price" },
            lowStockCount: {
              $sum: {
                $cond: [{ $lte: ["$stock", 10] }, 1, 0]
              }
            }
          }
        },
        {
          $sort: { totalValue: -1 }
        }
      ]);

      const totalInventoryValue = inventoryAnalysis.reduce((sum, product) => sum + product.inventoryValue, 0);
      const totalProductsSold = inventoryAnalysis.reduce((sum, product) => sum + product.totalSold, 0);
      const totalRevenue = inventoryAnalysis.reduce((sum, product) => sum + product.revenue, 0);

      res.json({
        summary: {
          totalInventoryValue,
          totalProductsSold,
          totalRevenue,
          averageTurnoverRate: inventoryAnalysis.length > 0 
            ? inventoryAnalysis.reduce((sum, p) => sum + p.turnoverRate, 0) / inventoryAnalysis.length 
            : 0,
        },
        products: inventoryAnalysis,
        categoryBreakdown: categoryAnalysis,
        topPerformers: inventoryAnalysis.slice(0, 10),
        slowMovers: inventoryAnalysis.filter(p => p.turnoverRate < 0.1).slice(0, 10),
      });
    } catch (error) {
      console.error("Get inventory analytics error:", error);
      res.status(500).json({ error: "Failed to fetch inventory analytics" });
    }
  },
);

export default router;

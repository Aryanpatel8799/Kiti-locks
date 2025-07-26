import { Router, Request, Response } from "express";
import { z } from "zod";
import mongoose from "mongoose";
import Product from "../models/Product";
import Category from "../models/Category";
import {
  authenticateToken,
  requireAdmin,
  AuthRequest,
  optionalAuth,
} from "../middleware/auth";
import { getConnectionStatus } from "../config/database";

const router = Router();

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Product description is required"),
  price: z.number().min(0, "Price must be positive"),
  comparePrice: z.number().min(0).optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).default([]),
  variants: z
    .array(
      z.object({
        name: z.string(),
        value: z.string(),
        price: z.number().optional(),
        stock: z.number().optional(),
        sku: z.string().optional(),
      }),
    )
    .default([]),
  images: z.array(z.string()).default([]),
  stock: z.number().min(0, "Stock must be non-negative").default(0),
  status: z.enum(["active", "draft", "archived"]).default("active"),
  featured: z.boolean().default(false),
  weight: z.number().min(0).optional(),
  dimensions: z
    .object({
      length: z.number().min(0),
      width: z.number().min(0),
      height: z.number().min(0),
    })
    .optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .default({}),
  // New Kiti Locks specific fields
  operationType: z.enum(["Soft Close", "Non-Soft Close"]).optional(),
  productCode: z.string().optional(),
  usageArea: z.enum(["Kitchen", "Wardrobe", "Drawer", "Overhead"]).optional(),
  finish: z
    .enum(["Chrome", "SS", "Matte", "Premium", "Aluminium", "PVC"])
    .optional(),
  trackType: z.enum(["2 Track", "3 Track", "Premium"]).optional(),
  size: z.string().optional(),
});

const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim("-");
};

router.get(
  "/",
  optionalAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        page = "1",
        limit = "12",
        category,
        search,
        minPrice,
        maxPrice,
        tags,
        status = "active",
        sort = "createdAt",
        order = "desc",
        featured,
        inStock,
        minRating,
        operationType,
        usageArea,
        finish,
        trackType,
        productCode,
        size,
      } = req.query;

      // Use mock data if MongoDB is not connected
      if (!getConnectionStatus()) {
        return res.status(503).json({
          error:
            "Database connection required. Please ensure MongoDB is connected.",
        });
      }
      const filter: any = {};

      if (req.user?.role === "admin") {
        if (status && status !== "all") {
          filter.status = status;
        }
      } else {
        filter.status = "active";
      }

      if (category) {
        // Check if category is an ObjectId or a slug
        if (mongoose.Types.ObjectId.isValid(category)) {
          filter.category = category;
        } else {
          // If it's a slug, find the category first
          const categoryDoc = await Category.findOne({ slug: category });
          if (categoryDoc) {
            filter.category = categoryDoc._id;
          }
        }
      }

      if (search) {
        filter.$text = { $search: search as string };
      }

      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }

      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        filter.tags = { $in: tagArray };
      }

      if (featured === "true") {
        filter.featured = true;
      }

      if (inStock === "true") {
        filter.stock = { $gt: 0 };
      }

      if (minRating && Number(minRating) > 0) {
        filter.averageRating = { $gte: Number(minRating) };
      }

      // New Kiti Locks filters
      if (operationType) {
        filter.operationType = operationType;
      }

      if (usageArea) {
        filter.usageArea = usageArea;
      }

      if (finish) {
        filter.finish = finish;
      }

      if (trackType) {
        filter.trackType = trackType;
      }

      if (productCode) {
        filter.productCode = { $regex: productCode as string, $options: "i" };
      }

      if (size) {
        filter.size = { $regex: size as string, $options: "i" };
      }

      const sortOrder = order === "asc" ? 1 : -1;
      const sortObj: any = { [sort as string]: sortOrder };

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const products = await Product.find(filter)
        .populate("category", "name slug")
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .select("-__v");

      const total = await Product.countDocuments(filter);
      const totalPages = Math.ceil(total / limitNum);

      res.json({
        products,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalProducts: total,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      });
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  },
);

router.get("/:slug", async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug })
      .populate("category", "name slug")
      .select("-__v");

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    if (product.status !== "active") {
      res.status(404).json({ error: "Product not available" });
      return;
    }

    res.json({ product });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// Get product by ID (for cart operations)
router.get("/id/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error:
          "Database connection required. Please ensure MongoDB is connected.",
      });
    }

    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("category", "name slug")
      .select("-__v");

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    if (product.status !== "active") {
      res.status(404).json({ error: "Product not available" });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

router.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const validatedData = productSchema.parse(req.body);

      const category = await Category.findById(validatedData.category);
      if (!category) {
        res.status(400).json({ error: "Invalid category" });
        return;
      }

      const slug = createSlug(validatedData.name);

      const existingProduct = await Product.findOne({ slug });
      if (existingProduct) {
        res
          .status(400)
          .json({ error: "Product with this name already exists" });
        return;
      }

      const product = new Product({
        ...validatedData,
        slug,
      });

      await product.save();
      await product.populate("category", "name slug");

      res.status(201).json({
        message: "Product created successfully",
        product,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }

      console.error("Create product error:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  },
);

router.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedData = productSchema.parse(req.body);

      if (validatedData.category) {
        const category = await Category.findById(validatedData.category);
        if (!category) {
          res.status(400).json({ error: "Invalid category" });
          return;
        }
      }

      let updateData: any = { ...validatedData };

      if (validatedData.name) {
        const newSlug = createSlug(validatedData.name);
        const existingProduct = await Product.findOne({
          slug: newSlug,
          _id: { $ne: id },
        });
        if (existingProduct) {
          res
            .status(400)
            .json({ error: "Product with this name already exists" });
          return;
        }
        updateData.slug = newSlug;
      }

      const product = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate("category", "name slug");

      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      res.json({
        message: "Product updated successfully",
        product,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }

      console.error("Update product error:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  },
);

router.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const product = await Product.findByIdAndDelete(id);

      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      res.json({
        message: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  },
);

// Get filter options for product filtering
router.get(
  "/filters/options",
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!getConnectionStatus()) {
        return res.status(503).json({
          error:
            "Database connection required. Please ensure MongoDB is connected.",
        });
      }

      // Get distinct values for filter options
      const [operationTypes, usageAreas, finishes, trackTypes, categories] =
        await Promise.all([
          Product.distinct("operationType", { status: "active" }),
          Product.distinct("usageArea", { status: "active" }),
          Product.distinct("finish", { status: "active" }),
          Product.distinct("trackType", { status: "active" }),
          Category.find({ featured: true }).select("name slug"),
        ]);

      res.json({
        operationTypes: operationTypes.filter(Boolean),
        usageAreas: usageAreas.filter(Boolean),
        finishes: finishes.filter(Boolean),
        trackTypes: trackTypes.filter(Boolean),
        categories,
      });
    } catch (error) {
      console.error("Get filter options error:", error);
      res.status(500).json({ error: "Failed to fetch filter options" });
    }
  },
);

export default router;

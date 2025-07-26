import { Router, Request, Response } from "express";
import { z } from "zod";
import Category from "../models/Category";
import {
  authenticateToken,
  requireAdmin,
  AuthRequest,
} from "../middleware/auth";
import { getConnectionStatus } from "../config/database";

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  image: z.string().optional(),
  parent: z.string().optional(),
  featured: z.boolean().default(false),
  sortOrder: z.number().default(0),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .default({}),
});

const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim("-");
};

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { featured, parent } = req.query;

    // Require database connection - no mock data
    if (!getConnectionStatus()) {
      res.status(503).json({
        error:
          "Database connection required. Please ensure MongoDB is connected.",
      });
      return;
    }
    const filter: any = {};

    if (featured === "true") {
      filter.featured = true;
    }

    if (parent) {
      filter.parent = parent;
    } else if (parent === "null") {
      filter.parent = null;
    }

    const categories = await Category.find(filter)
      .populate("parent", "name slug")
      .sort({ sortOrder: 1, name: 1 })
      .select("-__v");

    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get("/:slug", async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug })
      .populate("parent", "name slug")
      .select("-__v");

    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    const children = await Category.find({ parent: category._id })
      .sort({ sortOrder: 1, name: 1 })
      .select("name slug image");

    res.json({
      category,
      children,
    });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});

router.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const validatedData = categorySchema.parse(req.body);

      if (validatedData.parent) {
        const parentCategory = await Category.findById(validatedData.parent);
        if (!parentCategory) {
          res.status(400).json({ error: "Invalid parent category" });
          return;
        }
      }

      const slug = createSlug(validatedData.name);

      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
        res
          .status(400)
          .json({ error: "Category with this name already exists" });
        return;
      }

      const category = new Category({
        ...validatedData,
        slug,
      });

      await category.save();
      await category.populate("parent", "name slug");

      res.status(201).json({
        message: "Category created successfully",
        category,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }

      console.error("Create category error:", error);
      res.status(500).json({ error: "Failed to create category" });
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
      const validatedData = categorySchema.parse(req.body);

      if (validatedData.parent) {
        if (validatedData.parent === id) {
          res.status(400).json({ error: "Category cannot be its own parent" });
          return;
        }

        const parentCategory = await Category.findById(validatedData.parent);
        if (!parentCategory) {
          res.status(400).json({ error: "Invalid parent category" });
          return;
        }
      }

      let updateData: any = { ...validatedData };

      if (validatedData.name) {
        const newSlug = createSlug(validatedData.name);
        const existingCategory = await Category.findOne({
          slug: newSlug,
          _id: { $ne: id },
        });
        if (existingCategory) {
          res
            .status(400)
            .json({ error: "Category with this name already exists" });
          return;
        }
        updateData.slug = newSlug;
      }

      const category = await Category.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      }).populate("parent", "name slug");

      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }

      res.json({
        message: "Category updated successfully",
        category,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
        return;
      }

      console.error("Update category error:", error);
      res.status(500).json({ error: "Failed to update category" });
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

      const hasChildren = await Category.findOne({ parent: id });
      if (hasChildren) {
        res.status(400).json({
          error: "Cannot delete category with subcategories",
        });
        return;
      }

      const category = await Category.findByIdAndDelete(id);

      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }

      res.json({
        message: "Category deleted successfully",
      });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  },
);

export default router;

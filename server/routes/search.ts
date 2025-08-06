import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/Product";
import Category from "../models/Category";
import { getConnectionStatus } from "../config/database";

const router = express.Router();

// Advanced search with autocomplete
router.get("/autocomplete", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!getConnectionStatus()) {
      return res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected.",
      });
    }

    if (!q || typeof q !== "string" || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    const searchTerm = q.trim();

    // Get product suggestions
    const productSuggestions = await Product.aggregate([
      {
        $match: {
          status: "active",
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
            { tags: { $regex: searchTerm, $options: "i" } },
          ],
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          price: 1,
          images: { $slice: ["$images", 1] },
          type: { $literal: "product" },
        },
      },
      { $limit: 5 },
    ]);

    // Get category suggestions
    const categorySuggestions = await Category.aggregate([
      {
        $match: {
          name: { $regex: searchTerm, $options: "i" },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          type: { $literal: "category" },
        },
      },
      { $limit: 3 },
    ]);

    // Get recent popular searches (you can implement this based on your analytics)
    const popularSearches = [
      "bathroom fittings",
      "kitchen hardware",
      "door locks",
      "cabinet handles",
      "shower accessories",
    ].filter((term) =>
      term.toLowerCase().includes(searchTerm.toLowerCase())
    );

    res.json({
      suggestions: [
        ...productSuggestions,
        ...categorySuggestions,
        ...popularSearches.slice(0, 2).map((term) => ({
          name: term,
          type: "suggestion",
        })),
      ],
    });
  } catch (error) {
    console.error("Autocomplete search error:", error);
    res.status(500).json({ error: "Search autocomplete failed" });
  }
});

// Advanced search with filters
router.get("/advanced", async (req: Request, res: Response) => {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      rating,
      inStock,
      sortBy = "relevance",
      page = 1,
      limit = 12,
      operationType,
      usageArea,
      finish,
      trackType,
    } = req.query;

    if (!getConnectionStatus()) {
      return res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected.",
      });
    }

    // Build search query
    const searchQuery: any = { status: "active" };

    // Text search
    if (q && typeof q === "string" && q.trim()) {
      searchQuery.$text = { $search: q.trim() };
    }

    // Category filter
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category as string)) {
        searchQuery.category = category;
      } else {
        const categoryDoc = await Category.findOne({ slug: category });
        if (categoryDoc) {
          searchQuery.category = categoryDoc._id;
        }
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = Number(minPrice);
      if (maxPrice) searchQuery.price.$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating) {
      searchQuery.averageRating = { $gte: Number(rating) };
    }

    // Stock filter
    if (inStock === "true") {
      searchQuery.stock = { $gt: 0 };
    }

    // Kiti Locks specific filters
    if (operationType) {
      searchQuery.operationType = operationType;
    }

    if (usageArea) {
      searchQuery.usageArea = usageArea;
    }

    if (finish) {
      searchQuery.finish = finish;
    }

    if (trackType) {
      searchQuery.trackType = trackType;
    }

    // Build sort options
    let sortOptions: any = {};
    switch (sortBy) {
      case "relevance":
        if (q) {
          sortOptions = { score: { $meta: "textScore" } };
        } else {
          sortOptions = { featured: -1, createdAt: -1 };
        }
        break;
      case "price_low":
        sortOptions = { price: 1 };
        break;
      case "price_high":
        sortOptions = { price: -1 };
        break;
      case "rating":
        sortOptions = { averageRating: -1, reviewCount: -1 };
        break;
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "popular":
        sortOptions = { reviewCount: -1, averageRating: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 12;
    const skip = (pageNum - 1) * limitNum;

    // Execute search
    const products = await Product.find(searchQuery)
      .populate("category", "name slug")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .select("-__v");

    const total = await Product.countDocuments(searchQuery);

    // Get available filters for the current search
    const availableFilters = await getAvailableFilters(searchQuery);

    res.json({
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
      filters: availableFilters,
      searchTerm: q || "",
    });
  } catch (error) {
    console.error("Advanced search error:", error);
    res.status(500).json({ error: "Advanced search failed" });
  }
});

// Get available filters for search results
async function getAvailableFilters(baseQuery: any) {
  try {
    const [
      categories,
      priceRange,
      operationTypes,
      usageAreas,
      finishes,
      trackTypes,
    ] = await Promise.all([
      // Categories
      Product.aggregate([
        { $match: baseQuery },
        { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "categoryInfo" } },
        { $unwind: "$categoryInfo" },
        { $group: { _id: "$categoryInfo._id", name: { $first: "$categoryInfo.name" }, slug: { $first: "$categoryInfo.slug" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      
      // Price range
      Product.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, minPrice: { $min: "$price" }, maxPrice: { $max: "$price" } } },
      ]),
      
      // Operation types
      Product.aggregate([
        { $match: { ...baseQuery, operationType: { $exists: true, $ne: null } } },
        { $group: { _id: "$operationType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      
      // Usage areas
      Product.aggregate([
        { $match: { ...baseQuery, usageArea: { $exists: true, $ne: null } } },
        { $group: { _id: "$usageArea", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      
      // Finishes
      Product.aggregate([
        { $match: { ...baseQuery, finish: { $exists: true, $ne: null } } },
        { $group: { _id: "$finish", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      
      // Track types
      Product.aggregate([
        { $match: { ...baseQuery, trackType: { $exists: true, $ne: null } } },
        { $group: { _id: "$trackType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      categories: categories.map((cat: any) => ({
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        count: cat.count,
      })),
      priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
      operationTypes: operationTypes.map((op: any) => ({
        value: op._id,
        count: op.count,
      })),
      usageAreas: usageAreas.map((area: any) => ({
        value: area._id,
        count: area.count,
      })),
      finishes: finishes.map((finish: any) => ({
        value: finish._id,
        count: finish.count,
      })),
      trackTypes: trackTypes.map((track: any) => ({
        value: track._id,
        count: track.count,
      })),
    };
  } catch (error) {
    console.error("Error getting available filters:", error);
    return {
      categories: [],
      priceRange: { minPrice: 0, maxPrice: 0 },
      operationTypes: [],
      usageAreas: [],
      finishes: [],
      trackTypes: [],
    };
  }
}

// Search history
router.get("/history", async (req: Request, res: Response) => {
  try {
    // This would typically come from user's search history stored in database
    // For now, return popular searches
    const popularSearches = [
      { term: "bathroom fittings", count: 150 },
      { term: "kitchen hardware", count: 120 },
      { term: "door locks", count: 95 },
      { term: "cabinet handles", count: 80 },
      { term: "shower accessories", count: 70 },
    ];

    res.json({ searches: popularSearches });
  } catch (error) {
    console.error("Search history error:", error);
    res.status(500).json({ error: "Failed to get search history" });
  }
});

export default router;

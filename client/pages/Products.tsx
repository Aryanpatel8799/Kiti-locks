import { useEffect, useState } from "react";

// Store original fetch before FullStory can override it
const originalFetch = window.fetch;
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import {
  Heart,
  ShoppingCart,
  Search,
  Filter,
  Grid3X3,
  List,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ProductCardSkeleton } from "@/components/ui/loading-skeleton";
import OptimizedImage from "@/components/ui/optimized-image";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category: {
    name: string;
    slug: string;
  };
  tags: string[];
  stock: number;
  featured: boolean;
  averageRating: number;
  reviewCount: number;
  operationType?: "Soft Close" | "Non-Soft Close";
  productCode?: string;
  usageArea?: "Kitchen" | "Wardrobe" | "Drawer" | "Overhead";
  finish?: "Chrome" | "SS" | "Matte" | "Premium" | "Aluminium" | "PVC";
  trackType?: "2 Track" | "3 Track" | "Premium";
  size?: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Filters {
  search: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  tags: string[];
  sort: string;
  order: string;
  inStock: boolean;
  featured: boolean;
  minRating: number;
  operationType: string;
  usageArea: string;
  finish: string;
  trackType: string;
  productCode: string;
  size: string;
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filterOptions, setFilterOptions] = useState({
    operationTypes: [] as string[],
    usageAreas: [] as string[],
    finishes: [] as string[],
    trackTypes: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    minPrice: Number(searchParams.get("minPrice")) || 0,
    maxPrice: Number(searchParams.get("maxPrice")) || 10000,
    tags: searchParams.get("tags")?.split(",").filter(Boolean) || [],
    sort: searchParams.get("sort") || "createdAt",
    order: searchParams.get("order") || "desc",
    inStock: searchParams.get("inStock") === "true",
    featured: searchParams.get("featured") === "true",
    minRating: Number(searchParams.get("minRating")) || 0,
    operationType: searchParams.get("operationType") || "",
    usageArea: searchParams.get("usageArea") || "",
    finish: searchParams.get("finish") || "",
    trackType: searchParams.get("trackType") || "",
    productCode: searchParams.get("productCode") || "",
    size: searchParams.get("size") || "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    limit: 12, // Add limit for products per page
  });

  // Add setCurrentPage function
  const setCurrentPage = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.allSettled([
          fetchProducts(),
          fetchCategories(),
          fetchFilterOptions(),
        ]);
      } catch (error) {
        console.error("Error initializing product data:", error);
      }
    };

    initializeData();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts().catch(console.error);
    }, 100); // Small delay to prevent rapid API calls

    return () => clearTimeout(timeoutId);
  }, [filters]);

  // Detect if FullStory is interfering with fetch
  const isFullStoryInterference = () => {
    try {
      const hasFullStoryInFetch = window.fetch.toString().includes("fullstory");
      const hasFullStoryScript =
        document.querySelector('script[src*="fullstory"]') !== null;
      const hasFullStoryInWindow = "FS" in window || "_fs_namespace" in window;

      const interference =
        hasFullStoryInFetch || hasFullStoryScript || hasFullStoryInWindow;

      if (interference) {
        console.log("FullStory interference detected:", {
          hasFullStoryInFetch,
          hasFullStoryScript,
          hasFullStoryInWindow,
        });
      }

      return interference;
    } catch {
      return false;
    }
  };

  // Create a robust fetch wrapper that completely bypasses fetch when FullStory is detected
  const robustFetch = async (
    url: string,
    options: RequestInit = {},
  ): Promise<Response> => {
    // If FullStory is detected, skip fetch entirely and use XMLHttpRequest
    if (isFullStoryInterference()) {
      console.log("FullStory detected, using XMLHttpRequest for:", url);
      return xmlHttpRequestFetch(url, options);
    }

    // Try original fetch (stored before FullStory interference)
    try {
      if (originalFetch && typeof originalFetch === "function") {
        return await originalFetch(url, options);
      } else {
        return await fetch(url, options);
      }
    } catch (error) {
      console.warn(
        "Native fetch failed, falling back to XMLHttpRequest:",
        error,
      );
      return xmlHttpRequestFetch(url, options);
    }
  };

  // Pure XMLHttpRequest implementation
  const xmlHttpRequestFetch = async (
    url: string,
    options: RequestInit = {},
  ): Promise<Response> => {
    return new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const method = options.method || "GET";

      xhr.open(method, url);
      xhr.timeout = 10000; // 10 second timeout

      // Set headers
      if (options.headers) {
        const headers = options.headers as Record<string, string>;
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }

      xhr.onload = () => {
        // Create a proper Response object
        const headers = new Headers();
        xhr
          .getAllResponseHeaders()
          .split("\r\n")
          .forEach((line) => {
            const parts = line.split(": ");
            if (parts.length === 2) {
              headers.append(parts[0], parts[1]);
            }
          });

        const response = new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: headers,
        });
        resolve(response);
      };

      xhr.onerror = () => reject(new Error("XMLHttpRequest network error"));
      xhr.ontimeout = () => reject(new Error("XMLHttpRequest timeout"));
      xhr.onabort = () => reject(new Error("XMLHttpRequest aborted"));

      // Handle abort signal
      if (options.signal) {
        options.signal.addEventListener("abort", () => {
          xhr.abort();
        });
      }

      try {
        xhr.send((options.body as string) || null);
      } catch (error) {
        reject(new Error("XMLHttpRequest send failed: " + error));
      }
    });
  };

  const fetchProducts = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Test connectivity with a ping
      try {
        const pingResponse = await robustFetch("/api/ping", {
          method: "GET",
          signal: AbortSignal.timeout(3000),
        });
        if (!pingResponse.ok) {
          throw new Error("Server connectivity test failed");
        }
      } catch (pingError) {
        console.warn("API connectivity test failed, proceeding with request");
      }

      const params = new URLSearchParams();

      if (filters.search) params.append("search", filters.search);
      if (filters.category) params.append("category", filters.category);
      if (filters.minPrice > 0)
        params.append("minPrice", filters.minPrice.toString());
      if (filters.maxPrice < 10000)
        params.append("maxPrice", filters.maxPrice.toString());
      if (filters.tags.length > 0)
        params.append("tags", filters.tags.join(","));
      if (filters.inStock) params.append("inStock", "true");
      if (filters.featured) params.append("featured", "true");
      if (filters.minRating > 0)
        params.append("minRating", filters.minRating.toString());
      // New Kiti Locks filters
      if (filters.operationType)
        params.append("operationType", filters.operationType);
      if (filters.usageArea) params.append("usageArea", filters.usageArea);
      if (filters.finish) params.append("finish", filters.finish);
      if (filters.trackType) params.append("trackType", filters.trackType);
      if (filters.productCode)
        params.append("productCode", filters.productCode);
      if (filters.size) params.append("size", filters.size);
      params.append("sort", filters.sort);
      params.append("order", filters.order);
      params.append("limit", "50");

      const url = `/api/products?${params}`;
      console.log('Fetching products with URL:', url);
      console.log('Current filters:', filters);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await robustFetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setPagination(
          data.pagination ? { ...data.pagination, limit: data.pagination.limit || 12 } : {
            currentPage: 1,
            totalPages: 1,
            totalProducts: data.products?.length || 0,
            limit: 12,
          },
        );
        setError(null);
      } else if (response.status === 503) {
        setError("Database connection required. Loading demo data instead.");
        setProducts([]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalProducts: 0,
          limit: 12,
        });
      } else {
        console.error("Products API response not ok:", response.status);
        const errorText = await response.text().catch(() => "Unknown error");
        setError(`API error (${response.status}): ${errorText.slice(0, 100)}`);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);

      // Better error handling with retry logic and fallback data
      if (error instanceof Error) {
        if (error.name === "AbortError" || error.message.includes("abort")) {
          if (retryCount < 2) {
            console.log(`Request timed out, retrying... (${retryCount + 1}/2)`);
            setTimeout(() => fetchProducts(retryCount + 1), 2000);
            return;
          }
          setError(
            "Request timed out after multiple attempts. Showing available data.",
          );
        } else if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("fetch") ||
          error.message.includes("NetworkError") ||
          error.message.includes("Network error") ||
          error.message.includes("XMLHttpRequest")
        ) {
          if (retryCount < 1) {
            console.log(`Network error, retrying... (${retryCount + 1}/1)`);
            setTimeout(() => fetchProducts(retryCount + 1), 1000);
            return;
          }
          console.log("Network failed, clearing products for demo");
          setError(
            "Network temporarily unavailable. Please try refreshing the page.",
          );
        } else {
          setError(`Error: ${error.message}`);
        }
      } else {
        setError("An unexpected error occurred. Please refresh the page.");
      }

      setProducts([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
        limit: 12,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await robustFetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      } else if (response.status === 503) {
        console.warn("Database connection required for categories");
        setCategories([]);
      } else {
        console.error("Categories API response not ok:", response.status);
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Don't show error for categories as it's not critical
      setCategories([]);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await robustFetch("/api/products/filters/options");
      if (response.ok) {
        const data = await response.json();
        setFilterOptions({
          operationTypes: data.operationTypes || [],
          usageAreas: data.usageAreas || [],
          finishes: data.finishes || [],
          trackTypes: data.trackTypes || [],
        });
      } else {
        console.warn("Filter options API response not ok:", response.status);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
      // Don't show error for filter options as it's not critical
    }
  };

  const updateFilters = (newFilters: Partial<Filters>) => {
    const updated = { ...filters, ...newFilters };
    
    // Debug logging for filter changes
    console.log('Updating filters:', { 
      previous: filters, 
      new: newFilters, 
      updated 
    });
    
    setFilters(updated);

    // Update URL params
    const params = new URLSearchParams();
    if (updated.search) params.set("search", updated.search);
    if (updated.category) params.set("category", updated.category);
    if (updated.minPrice > 0)
      params.set("minPrice", updated.minPrice.toString());
    if (updated.maxPrice < 10000)
      params.set("maxPrice", updated.maxPrice.toString());
    if (updated.tags.length > 0) params.set("tags", updated.tags.join(","));
    if (updated.inStock) params.set("inStock", "true");
    if (updated.featured) params.set("featured", "true");
    if (updated.minRating > 0)
      params.set("minRating", updated.minRating.toString());
    // New Kiti Locks filter params
    if (updated.operationType)
      params.set("operationType", updated.operationType);
    if (updated.usageArea) params.set("usageArea", updated.usageArea);
    if (updated.finish) params.set("finish", updated.finish);
    if (updated.trackType) params.set("trackType", updated.trackType);
    if (updated.productCode) params.set("productCode", updated.productCode);
    if (updated.size) params.set("size", updated.size);
    params.set("sort", updated.sort);
    params.set("order", updated.order);

    setSearchParams(params);
  };

  const clearFilters = () => {
    const cleared = {
      search: "",
      category: "",
      minPrice: 0,
      maxPrice: 10000,
      tags: [],
      sort: "createdAt",
      order: "desc",
      inStock: false,
      featured: false,
      minRating: 0,
      operationType: "",
      usageArea: "",
      finish: "",
      trackType: "",
      productCode: "",
      size: "",
    };
    setFilters(cleared);
    setSearchParams({});
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const calculateDiscount = (price: number, comparePrice?: number) => {
    if (!comparePrice || comparePrice <= price) return 0;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    updateFilters({ tags: newTags });
  };

  const allTags = Array.from(new Set(products?.flatMap((p) => p.tags) || []));

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to your cart", {
        action: {
          label: "Sign In",
          onClick: () => (window.location.href = "/login"),
        },
      });
      return;
    }

    try {
      await addToCart(product._id);
      toast.success(`${product.name} added to cart!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to add item to cart");
    }
  };

  const handleToggleWishlist = async (
    product: Product,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await toggleWishlist(product._id);
      const isInWishlistNow = isInWishlist(product._id);
      toast.success(
        isInWishlistNow
          ? `${product.name} removed from wishlist`
          : `${product.name} added to wishlist!`,
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to update wishlist");
    }
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Elegant Category Filter */}
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 border border-gray-200 shadow-sm">
        <Label className="text-sm font-semibold mb-3 text-gray-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
          Category
        </Label>
        <Select
          value={filters.category}
          onValueChange={(value) =>
            updateFilters({ category: value === "all" ? "" : value })
          }
        >
          <SelectTrigger className="bg-white backdrop-blur-sm border border-gray-300 focus:border-gray-500 focus:ring-gray-200 rounded-xl transition-all duration-300 hover:shadow-md">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-white backdrop-blur-xl border-gray-200 rounded-xl">
            <SelectItem value="all" className="focus:bg-gray-50 rounded-lg">
              All Categories
            </SelectItem>
            {categories?.map((category) => (
              <SelectItem 
                key={category._id} 
                value={category.slug}
                className="focus:bg-gray-50 rounded-lg"
              >
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Refined Price Range */}
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 border border-gray-200 shadow-sm">
        <Label className="text-sm font-semibold mb-3 text-gray-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
          Price Range
        </Label>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 font-medium bg-gray-100 px-3 py-1 rounded-full border">
              {formatPrice(filters.minPrice)}
            </span>
            <span className="text-gray-500 font-medium">to</span>
            <span className="text-gray-700 font-medium bg-gray-100 px-3 py-1 rounded-full border">
              {formatPrice(filters.maxPrice)}
            </span>
          </div>
          <div className="px-2">
            <Slider
              value={[filters.minPrice, filters.maxPrice]}
              onValueChange={([min, max]) => {
                console.log('Price range changed:', { min, max });
                updateFilters({ minPrice: min, maxPrice: max });
              }}
              max={10000}
              min={0}
              step={100}
              className="w-full [&>span:first-child]:bg-gradient-to-r [&>span:first-child]:from-gray-600 [&>span:first-child]:to-gray-800"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>{formatPrice(0)}</span>
              <span>{formatPrice(10000)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Refined Rating Filter */}
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 border border-gray-200 shadow-sm">
        <Label className="text-sm font-semibold mb-3 text-gray-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
          Minimum Rating
        </Label>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-medium bg-gray-100 px-3 py-1 rounded-full border">
              {filters.minRating === 0 ? 'Any Rating' : `${filters.minRating}+ Stars`}
            </span>
            {filters.minRating > 0 && (
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < filters.minRating
                        ? "text-amber-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="px-2">
            <Slider
              value={[filters.minRating]}
              onValueChange={([rating]) => {
                console.log('Rating changed:', rating);
                updateFilters({ minRating: rating });
              }}
              max={5}
              min={0}
              step={0.5}
              className="w-full [&>span:first-child]:bg-gradient-to-r [&>span:first-child]:from-gray-600 [&>span:first-child]:to-gray-800"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Any</span>
              <span>5★</span>
            </div>
          </div>
        </div>
      </div>

      {/* Refined Quick Filters */}
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 border border-gray-200 shadow-sm">
        <Label className="text-sm font-semibold mb-3 text-gray-800 flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
          Quick Filters
        </Label>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 transition-all duration-300 hover:bg-white">
            <Checkbox
              id="inStock"
              checked={filters.inStock}
              onCheckedChange={(checked) => updateFilters({ inStock: !!checked })}
              className="border-gray-400 data-[state=checked]:bg-gray-600"
            />
            <label htmlFor="inStock" className="text-sm text-gray-700 font-medium cursor-pointer">
              In Stock Only
            </label>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 transition-all duration-300 hover:bg-white">
            <Checkbox
              id="featured"
              checked={filters.featured}
              onCheckedChange={(checked) => updateFilters({ featured: !!checked })}
              className="border-gray-400 data-[state=checked]:bg-gray-600"
            />
            <label htmlFor="featured" className="text-sm text-gray-700 font-medium cursor-pointer">
              Featured Products
            </label>
          </div>
        </div>
      </div>

      {/* Refined Tags Filter */}
      {allTags.length > 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 border border-gray-200 shadow-sm">
          <Label className="text-sm font-semibold mb-3 text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
            Tags
          </Label>
          <div className="space-y-2">
            {allTags?.slice(0, 10).map((tag) => (
              <div key={tag} className="flex items-center space-x-2 p-2 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 transition-all duration-300 hover:bg-white">
                <Checkbox
                  id={tag}
                  checked={filters.tags.includes(tag)}
                  onCheckedChange={() => toggleTag(tag)}
                  className="border-gray-400 data-[state=checked]:bg-gray-600"
                />
                <label
                  htmlFor={tag}
                  className="text-sm text-gray-700 font-medium capitalize cursor-pointer"
                >
                  {tag.replace("-", " ")}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refined Clear Filters */}
      <Button 
        variant="outline" 
        onClick={clearFilters} 
        className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white border-0 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 font-medium hover:from-gray-800 hover:to-black"
      >
        <X className="w-4 h-4 mr-2" />
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Elegant Header */}
        {/* <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 sm:mb-8"
        >
          <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 rounded-3xl p-8 sm:p-12 shadow-2xl border border-gray-700">
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-32 -translate-x-32"></div>
            
            <div className="relative z-10">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-light text-white mb-6 leading-tight tracking-wide">
                Premium Kitchen
                <span className="block font-bold bg-gradient-to-r from-gray-300 to-white bg-clip-text text-transparent">
                  Hardware Collection
                </span>
              </h1>
              <p className="text-gray-300 text-base sm:text-lg max-w-3xl leading-relaxed mb-8 font-light">
                Discover our complete range of premium kitchen hardware and
                accessories by Kiti Locks - crafted for durability and elegance
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                  <div className="w-2 h-2 bg-white rounded-full opacity-70"></div>
                  <span className="font-medium text-white text-sm">{products.length} Products Available</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                  <div className="w-2 h-2 bg-white rounded-full opacity-70"></div>
                  <span className="font-medium text-white text-sm">Premium Quality</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                  <div className="w-2 h-2 bg-white rounded-full opacity-70"></div>
                  <span className="font-medium text-white text-sm">Trusted Worldwide</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div> */}

        {/* Refined Search and Controls */}


        <div className="flex gap-6 lg:gap-8">
          {/* Elegant Desktop Filters Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-4 space-y-4">
              <Card className="bg-white/90 backdrop-blur-xl border-2 border-gray-200/50 shadow-2xl rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl">
                        <SlidersHorizontal className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-lg">Filters</h2>
                        <p className="text-gray-300 text-sm mt-1">Find exactly what you need</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <FilterContent />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enhanced Products Grid */}
          <div className="flex-1">
            {/* Elegant Results count */}
            {/* <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6"
            >
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl px-6 py-4 border border-gray-200/50 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-gray-600 rounded-full animate-pulse"></div>
                    <span className="text-gray-900 font-semibold text-lg">
                      {products.length} Products Found
                    </span>
                    <span className="text-gray-500 text-sm bg-gray-100 px-3 py-1 rounded-full">
                      of {pagination.totalProducts} total
                    </span>
                  </div>
                  {products.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-gradient-to-r from-gray-100 to-slate-100 px-4 py-2 rounded-full border border-gray-200">
                      <Star className="w-4 h-4 text-gray-600" />
                      Premium Quality
                    </div>
                  )}
                </div>
              </div>
            </motion.div> */}

            {loading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm animate-pulse">
                      <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="bg-white border border-red-200 rounded-lg p-8 max-w-lg mx-auto shadow-sm">
                  <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-800 mb-3">
                    Oops! Something went wrong
                  </h3>
                  <p className="text-red-700 mb-6 text-base leading-relaxed">{error}</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => fetchProducts(0)}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50 text-sm sm:text-base"
                    >
                      Try Again
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 text-sm sm:text-base"
                    >
                      Reload Page
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : products.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
                    : "space-y-4"
                }
              >
                {products?.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="w-full"
                  >
                    <Link to={`/products/${product.slug}`}>
                      <Card className="group cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-200 hover:border-gray-300 bg-white h-full hover:scale-[1.02]">
                        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                          {product.images.length > 0 ? (
                            <OptimizedImage
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              priority={index < 3} // Prioritize first 3 images
                              width={400}
                              height={400}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-sm sm:text-base font-medium">No Image</span>
                            </div>
                          )}
                          <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent flex items-center justify-center"
                          >
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              whileHover={{ scale: 1, rotate: 0 }}
                              transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                              className="bg-white rounded-full p-3 sm:p-4 shadow-xl border border-gray-200"
                            >
                              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                            </motion.div>
                          </motion.div>
                          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                            <motion.div
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.8 }}
                            >
                              <Button
                                size="sm"
                                variant="secondary"
                                className={`w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg border transition-all duration-300 ${
                                  isInWishlist(product._id)
                                    ? "border-red-300 text-red-500"
                                    : "border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500"
                                }`}
                                onClick={(e) =>
                                  handleToggleWishlist(product, e)
                                }
                              >
                                <Heart
                                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${
                                    isInWishlist(product._id)
                                      ? "fill-current scale-110"
                                      : ""
                                  }`}
                                />
                              </Button>
                            </motion.div>
                          </div>
                          {product.comparePrice &&
                            calculateDiscount(
                              product.price,
                              product.comparePrice,
                            ) > 0 && (
                              <Badge
                                variant="destructive"
                                className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-red-600 text-white text-xs sm:text-sm font-semibold shadow-lg border-0"
                              >
                                -
                                {calculateDiscount(
                                  product.price,
                                  product.comparePrice,
                                )}
                                % OFF
                              </Badge>
                            )}
                          {product.stock <= 5 && product.stock > 0 && (
                            <Badge
                              variant="secondary"
                              className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 bg-orange-500 text-white text-xs sm:text-sm font-semibold shadow-lg border-0"
                            >
                              Only {product.stock} left
                            </Badge>
                          )}
                          {product.stock === 0 && (
                            <Badge
                              variant="destructive"
                              className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 bg-gray-500 text-white text-xs sm:text-sm font-semibold shadow-lg border-0"
                            >
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-4 sm:p-5">
                          <div className="mb-3">
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-gray-50 border-gray-300 text-gray-700 font-medium"
                            >
                              {product.category.name}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors line-clamp-2 text-sm sm:text-base leading-snug">
                            {product.name}
                          </h3>
                          {/* Elegant Rating */}
                          {product.reviewCount > 0 && (
                            <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= Math.round(product.averageRating)
                                        ? "text-amber-400 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-amber-700 font-medium">
                                ({product.reviewCount})
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col">
                              <span className="text-lg sm:text-xl font-bold text-gray-900">
                                {formatPrice(product.price)}
                              </span>
                              {product.comparePrice && (
                                <span className="text-xs sm:text-sm text-gray-500 line-through">
                                  {formatPrice(product.comparePrice)}
                                </span>
                              )}
                            </div>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-900 text-white border-0 rounded-xl transition-all duration-300 hover:shadow-lg hover:bg-gray-800 font-medium"
                                disabled={product.stock === 0}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAddToCart(product);
                                }}
                              >
                                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                {product.stock === 0 ? "Sold Out" : "Add"}
                              </Button>
                            </motion.div>
                          </div>

                          {/* Elegant Tags */}
                          {product.tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-1">
                              {product.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-full font-medium"
                                >
                                  {tag.replace("-", " ")}
                                </Badge>
                              ))}
                              {product.tags.length > 3 && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-2 py-1 bg-gray-200 text-gray-700 border border-gray-300 rounded-full font-semibold"
                                >
                                  +{product.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="max-w-md mx-auto bg-white rounded-lg p-6 sm:p-8 border border-gray-200 shadow-sm">
                  <div className="text-gray-600 mb-4">
                    <Search className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm sm:text-base">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button 
                    onClick={clearFilters}
                    className="bg-gray-900 hover:bg-gray-800 text-white border-0"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Elegant Pagination */}
            {pagination.totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12 flex justify-center items-center"
              >
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-xl">
                  <Pagination>
                    <PaginationContent className="flex items-center gap-2">
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (pagination.currentPage > 1) {
                              setCurrentPage(pagination.currentPage - 1);
                            }
                          }}
                          className={`${
                            pagination.currentPage === 1
                              ? "pointer-events-none opacity-50 bg-gray-100 text-gray-400"
                              : "bg-gray-900 text-white hover:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                          } rounded-xl px-4 py-2 font-medium`}
                        />
                      </PaginationItem>

                      {/* Page Numbers */}
                      {(() => {
                        const pageNumbers = [];
                        const startPage = Math.max(1, pagination.currentPage - 2);
                        const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

                        // Add first page if not included
                        if (startPage > 1) {
                          pageNumbers.push(
                            <PaginationItem key={1}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(1);
                                }}
                                className="rounded-xl px-4 py-2 border-0 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-all duration-300 font-medium"
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                          );
                          if (startPage > 2) {
                            pageNumbers.push(
                              <PaginationItem key="ellipsis1">
                                <PaginationEllipsis className="text-gray-500" />
                              </PaginationItem>
                            );
                          }
                        }

                        // Add page range
                        for (let i = startPage; i <= endPage; i++) {
                          pageNumbers.push(
                            <PaginationItem key={i}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(i);
                                }}
                                isActive={pagination.currentPage === i}
                                className={`rounded-xl px-4 py-2 border-0 font-medium transition-all duration-300 ${
                                  pagination.currentPage === i
                                    ? "bg-gray-900 text-white shadow-lg"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                                }`}
                              >
                                {i}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }

                        // Add last page if not included
                        if (endPage < pagination.totalPages) {
                          if (endPage < pagination.totalPages - 1) {
                            pageNumbers.push(
                              <PaginationItem key="ellipsis2">
                                <PaginationEllipsis className="text-gray-500" />
                              </PaginationItem>
                            );
                          }
                          pageNumbers.push(
                            <PaginationItem key={pagination.totalPages}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(pagination.totalPages);
                                }}
                                className="rounded-xl px-4 py-2 border-0 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-all duration-300 font-medium"
                              >
                                {pagination.totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }

                        return pageNumbers;
                      })()}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (pagination.currentPage < pagination.totalPages) {
                              setCurrentPage(pagination.currentPage + 1);
                            }
                          }}
                          className={`${
                            pagination.currentPage === pagination.totalPages
                              ? "pointer-events-none opacity-50 bg-gray-100 text-gray-400"
                              : "bg-gray-900 text-white hover:bg-gray-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                          } rounded-xl px-4 py-2 font-medium`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  
                  {/* Page Info */}
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                      Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                      {Math.min(pagination.currentPage * pagination.limit, pagination.totalProducts)} of{" "}
                      <span className="font-semibold text-gray-900">{pagination.totalProducts}</span> products
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

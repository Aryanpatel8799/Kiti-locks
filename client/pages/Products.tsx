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
  });

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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await robustFetch(`/api/products?${params}`, {
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
          data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalProducts: data.products?.length || 0,
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

  const allTags = Array.from(new Set(products.flatMap((p) => p.tags)));

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
      {/* Category Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Category</Label>
        <Select
          value={filters.category}
          onValueChange={(value) =>
            updateFilters({ category: value === "all" ? "" : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Price Range: {formatPrice(filters.minPrice)} - {formatPrice(filters.maxPrice)}
        </Label>
        <div className="px-3">
          <Slider
            value={[filters.minPrice, filters.maxPrice]}
            onValueChange={([min, max]) => updateFilters({ minPrice: min, maxPrice: max })}
            max={10000}
            min={0}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{formatPrice(0)}</span>
            <span>{formatPrice(10000)}</span>
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Minimum Rating ({filters.minRating} stars)
        </Label>
        <div className="px-3">
          <Slider
            value={[filters.minRating]}
            onValueChange={([rating]) => updateFilters({ minRating: rating })}
            max={5}
            min={0}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>Any</span>
            <span>5★</span>
          </div>
        </div>
      </div>

      {/* Stock & Featured Filters */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="inStock"
            checked={filters.inStock}
            onCheckedChange={(checked) => updateFilters({ inStock: !!checked })}
          />
          <label htmlFor="inStock" className="text-sm cursor-pointer">
            In Stock Only
          </label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="featured"
            checked={filters.featured}
            onCheckedChange={(checked) =>
              updateFilters({ featured: !!checked })
            }
          />
          <label htmlFor="featured" className="text-sm cursor-pointer">
            Featured Products
          </label>
        </div>
      </div>

      {/* Tags Filter */}
      {allTags.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-3 block">Tags</Label>
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 10).map((tag) => (
              <div key={tag} className="flex items-center space-x-2">
                <Checkbox
                  id={tag}
                  checked={filters.tags.includes(tag)}
                  onCheckedChange={() => toggleTag(tag)}
                />
                <label
                  htmlFor={tag}
                  className="text-sm capitalize cursor-pointer"
                >
                  {tag.replace("-", " ")}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      <Button variant="outline" onClick={clearFilters} className="w-full">
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Kitchen Hardware Products
          </h1>
          <p className="text-slate-600">
            Discover our complete range of premium kitchen hardware and
            accessories by Kiti Locks
          </p>
        </div>

        {/* Search and Controls */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              type="search"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Sort */}
            <Select
              value={`${filters.sort}-${filters.order}`}
              onValueChange={(value) => {
                const [sort, order] = value.split("-");
                updateFilters({ sort, order });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="averageRating-desc">
                  Highest Rated
                </SelectItem>
                <SelectItem value="reviewCount-desc">Most Reviewed</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
                <SelectItem value="featured-desc">Featured First</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center bg-white rounded-lg border">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Filter Toggle */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  <h2 className="font-semibold">Filters</h2>
                </div>
                <FilterContent />
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results count */}
            <div className="mb-6">
              <p className="text-slate-600">
                Showing {products.length} of {pagination.totalProducts} products
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                  <div className="text-red-600 mb-2">
                    <Search className="w-8 h-8 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    Unable to Load Products
                  </h3>
                  <p className="text-red-700 mb-4">{error}</p>
                  <div className="space-x-2">
                    <Button
                      onClick={() => fetchProducts(0)}
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Try Again
                    </Button>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      Reload Page
                    </Button>
                  </div>
                </div>
              </div>
            ) : products.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "space-y-4"
                }
              >
                {products.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Link to={`/products/${product.slug}`}>
                      <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-0 bg-white h-full">
                        <div className="relative aspect-square overflow-hidden bg-slate-100">
                          {product.images.length > 0 ? (
                            <OptimizedImage
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              priority={index < 3} // Prioritize first 3 images
                              width={400}
                              height={400}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                              <span className="text-slate-500">No Image</span>
                            </div>
                          )}
                          <motion.div
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            className="absolute inset-0 bg-black/20 flex items-center justify-center"
                          >
                            <motion.div
                              initial={{ scale: 0 }}
                              whileHover={{ scale: 1 }}
                              transition={{ delay: 0.1 }}
                              className="bg-white rounded-full p-3 shadow-lg"
                            >
                              <ShoppingCart className="w-5 h-5 text-blue-600" />
                            </motion.div>
                          </motion.div>
                          <div className="absolute top-3 right-3">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                size="sm"
                                variant="secondary"
                                className={`w-8 h-8 p-0 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white ${
                                  isInWishlist(product._id)
                                    ? "text-red-500"
                                    : "text-slate-600"
                                }`}
                                onClick={(e) =>
                                  handleToggleWishlist(product, e)
                                }
                              >
                                <Heart
                                  className={`w-4 h-4 ${
                                    isInWishlist(product._id)
                                      ? "fill-current"
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
                                className="absolute top-3 left-3"
                              >
                                -
                                {calculateDiscount(
                                  product.price,
                                  product.comparePrice,
                                )}
                                %
                              </Badge>
                            )}
                          {product.stock <= 5 && product.stock > 0 && (
                            <Badge
                              variant="secondary"
                              className="absolute bottom-3 left-3 bg-orange-100 text-orange-800"
                            >
                              Only {product.stock} left
                            </Badge>
                          )}
                          {product.stock === 0 && (
                            <Badge
                              variant="destructive"
                              className="absolute bottom-3 left-3"
                            >
                              Out of Stock
                            </Badge>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="mb-2">
                            <Badge variant="outline" className="text-xs">
                              {product.category.name}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                          {/* Rating */}
                          {product.reviewCount > 0 && (
                            <div className="flex items-center gap-1 mb-2">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${
                                      star <= Math.round(product.averageRating)
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-slate-600">
                                ({product.reviewCount})
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-lg font-bold text-slate-900">
                                {formatPrice(product.price)}
                              </span>
                              {product.comparePrice && (
                                <span className="text-sm text-slate-500 line-through">
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
                                className="px-3 py-1.5 hover:bg-blue-50 hover:border-blue-200"
                                disabled={product.stock === 0}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleAddToCart(product);
                                }}
                              >
                                <ShoppingCart className="w-4 h-4 mr-1" />
                                {product.stock === 0 ? "Sold Out" : "Add"}
                              </Button>
                            </motion.div>
                          </div>

                          {/* Tags */}
                          {product.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {product.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5"
                                >
                                  {tag.replace("-", " ")}
                                </Badge>
                              ))}
                              {product.tags.length > 3 && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5"
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
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Try adjusting your search criteria or filters
                  </p>
                  <Button onClick={clearFilters}>Clear All Filters</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

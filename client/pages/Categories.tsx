import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { Search, Grid, List, Package, TrendingUp, Star } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: Category;
  productCount: number;
  featured: boolean;
  seo?: {
    title?: string;
    description?: string;
  };
}

interface CategoryStats {
  totalCategories: number;
  featuredCategories: number;
  categoriesWithProducts: number;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterBy, setFilterBy] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [stats, setStats] = useState<CategoryStats>({
    totalCategories: 0,
    featuredCategories: 0,
    categoriesWithProducts: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    filterAndSortCategories();
  }, [categories, searchTerm, sortBy, filterBy]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/categories?includeStats=true");
      
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();
      setCategories(data.categories || []);
      
      // Calculate stats
      const totalCategories = data.categories?.length || 0;
      const featuredCategories = data.categories?.filter((cat: Category) => cat.featured).length || 0;
      const categoriesWithProducts = data.categories?.filter((cat: Category) => cat.productCount > 0).length || 0;
      
      setStats({
        totalCategories,
        featuredCategories,
        categoriesWithProducts,
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCategories = () => {
    let filtered = [...categories];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (category) =>
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    switch (filterBy) {
      case "featured":
        filtered = filtered.filter((category) => category.featured);
        break;
      case "with-products":
        filtered = filtered.filter((category) => category.productCount > 0);
        break;
      case "parent":
        filtered = filtered.filter((category) => !category.parent);
        break;
      case "subcategory":
        filtered = filtered.filter((category) => category.parent);
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "products":
        filtered.sort((a, b) => b.productCount - a.productCount);
        break;
      case "featured":
        filtered.sort((a, b) => Number(b.featured) - Number(a.featured));
        break;
    }

    setFilteredCategories(filtered);
  };

  const getCategoryImage = (category: Category) => {
    return category.image || "/placeholder-category.svg";
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredCategories.map((category, index) => (
        <motion.div
          key={category._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link to={`/products?category=${category.slug}`}>
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="relative overflow-hidden rounded-t-lg">
                <img
                  src={getCategoryImage(category)}
                  alt={category.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {category.featured && (
                  <Badge className="absolute top-2 left-2 bg-blue-600 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-white/90 text-gray-800">
                    {category.productCount} products
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {category.description}
                  </p>
                )}
                {category.parent && (
                  <Badge variant="outline" className="text-xs">
                    {category.parent.name}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-4">
      {filteredCategories.map((category, index) => (
        <motion.div
          key={category._id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Link to={`/products?category=${category.slug}`}>
            <Card className="group hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={getCategoryImage(category)}
                    alt={category.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                        {category.name}
                      </h3>
                      {category.featured && (
                        <Badge className="bg-blue-600 text-white">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-1">
                        {category.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Package className="w-4 h-4 mr-1" />
                        {category.productCount} products
                      </span>
                      {category.parent && (
                        <Badge variant="outline" className="text-xs">
                          {category.parent.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Categories</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Categories</h1>
        <p className="text-gray-600">
          Browse our complete range of bathroom and kitchen hardware products
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Categories</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-gray-900">{stats.featuredCategories}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">With Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.categoriesWithProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-4">
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="with-products">With Products</SelectItem>
                  <SelectItem value="parent">Parent Categories</SelectItem>
                  <SelectItem value="subcategory">Subcategories</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="products">Product Count</SelectItem>
                  <SelectItem value="featured">Featured First</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex rounded-md border">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "No categories available at the moment"}
            </p>
            {searchTerm && (
              <Button onClick={() => setSearchTerm("")} variant="outline">
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {filteredCategories.length} of {categories.length} categories
            </p>
          </div>
          {viewMode === "grid" ? renderGridView() : renderListView()}
        </>
      )}
    </div>
  );
}

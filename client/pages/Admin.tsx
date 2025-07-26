import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  description: string;
  category?: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  images: string[];
  stock: number;
  status: string;
  featured: boolean;
  tags: string[];
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  featured: boolean;
}

interface Order {
  _id: string;
  orderNumber: string;
  user?: {
    name: string;
    email: string;
  } | null;
  items: Array<{
    product: {
      name: string;
    };
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
  });

  // Product form state
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    comparePrice: "",
    category: "",
    tags: "",
    stock: "",
    featured: false,
    images: [] as string[],
    status: "active", // <-- add status, default to 'active'
  });

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    featured: false,
  });

  // API call helper with comprehensive error handling
  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      return response;
    } catch (error) {
      // Return a mock response for failed fetches to prevent console errors
      return {
        ok: false,
        status: 0,
        statusText: "Network Error",
        json: async () => ({ error: "Network error" }),
        text: async () => "Network error",
      } as Response;
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") {
      return;
    }
    // Add small delay to prevent immediate fetch errors on page load
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Make API calls - error handling is now in apiCall helper
      const [productsRes, categoriesRes, ordersRes, usersRes] = await Promise.all([
        apiCall("/api/products?status=all&limit=100"),
        apiCall("/api/categories"),
        apiCall("/api/orders"),
        apiCall("/api/auth/users/count"),
      ]);

      // Handle products response
      try {
        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.products || []);
          setStats((prev) => ({
            ...prev,
            totalProducts: data.products?.length || 0,
          }));
        } else {
          setProducts([]);
        }
      } catch (error) {
        setProducts([]);
      }

      // Handle categories response
      try {
        if (categoriesRes.ok) {
          const data = await categoriesRes.json();
          setCategories(data.categories || []);
        } else {
          setCategories([]);
        }
      } catch (error) {
        setCategories([]);
      }

      // Handle orders response
      try {
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          const orderData = data.orders || [];
          setOrders(orderData);
          setStats((prev) => ({
            ...prev,
            totalOrders: orderData.length,
            totalRevenue: orderData.reduce(
              (sum: number, order: Order) => sum + order.total,
              0,
            ),
          }));
        } else {
          setOrders([]);
        }
      } catch (error) {
        setOrders([]);
      }

      // Handle users count response
      try {
        if (usersRes.ok) {
          const data = await usersRes.json();
          setStats((prev) => ({
            ...prev,
            totalUsers: data.count || 0,
          }));
        }
      } catch (error) {
        // Optionally handle error
      }
    } catch (error) {
      // Silently handle network errors for better UX in demo mode
      setProducts([]);
      setCategories([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch("/api/upload/images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrls = data.images.map((img: any) => img.url);
        setProductForm((prev) => ({
          ...prev,
          images: [...prev.images, ...imageUrls],
        }));
        toast.success("Images uploaded successfully");
      } else {
        toast.error("Upload failed. Feature not available in demo mode.");
      }
    } catch (error) {
      // For network errors, provide a user-friendly message
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        toast.error("Upload feature not available in demo mode");
      } else {
        toast.error("Failed to upload images");
      }
    } finally {
      setUploadingImages(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        comparePrice: productForm.comparePrice
          ? parseFloat(productForm.comparePrice)
          : undefined,
        category: productForm.category,
        tags: productForm.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        stock: parseInt(productForm.stock),
        featured: productForm.featured,
        images: productForm.images,
        status: productForm.status, // <-- include status
      };

      const url = editingProduct
        ? `/api/products/${editingProduct._id}`
        : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const response = await apiCall(url, {
        method,
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        toast.success(
          editingProduct
            ? "Product updated successfully"
            : "Product created successfully",
        );
        setIsProductDialogOpen(false);
        resetProductForm();
        try {
          await fetchData();
        } catch (fetchError) {
          // Silently handle fetch error after successful save
        }
      } else {
        toast.error(
          "Failed to save product. Feature not available in demo mode.",
        );
      }
    } catch (error) {
      // For network errors, provide a user-friendly message
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        toast.error("Product management not available in demo mode");
      } else {
        toast.error("Failed to save product");
      }
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory._id}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const response = await apiCall(url, {
        method,
        body: JSON.stringify(categoryForm),
      });

      if (response.ok) {
        toast.success(
          editingCategory
            ? "Category updated successfully"
            : "Category created successfully",
        );
        setIsCategoryDialogOpen(false);
        resetCategoryForm();
        try {
          await fetchData();
        } catch (fetchError) {
          // Silently handle fetch error after successful save
        }
      } else {
        toast.error(
          "Failed to save category. Feature not available in demo mode.",
        );
      }
    } catch (error) {
      // For network errors, provide a user-friendly message
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        toast.error("Category management not available in demo mode");
      } else {
        toast.error("Failed to save category");
      }
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await apiCall(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Product deleted successfully");
        try {
          await fetchData();
        } catch (fetchError) {
          // Silently handle fetch error after successful delete
        }
      } else {
        toast.error(
          "Failed to delete product. Feature not available in demo mode.",
        );
      }
    } catch (error) {
      // For network errors, provide a user-friendly message
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        toast.error("Product deletion not available in demo mode");
      } else {
        toast.error("Failed to delete product");
      }
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const response = await apiCall(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Category deleted successfully");
        try {
          await fetchData();
        } catch (fetchError) {
          // Silently handle fetch error after successful delete
        }
      } else {
        toast.error(
          "Failed to delete category. Feature not available in demo mode.",
        );
      }
    } catch (error) {
      // For network errors, provide a user-friendly message
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        toast.error("Category deletion not available in demo mode");
      } else {
        toast.error("Failed to delete category");
      }
    }
  };

  const handleOrderStatusChange = async (
    orderId: string,
    newStatus: string,
  ) => {
    try {
      const response = await apiCall(`/api/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(`Order status updated to ${newStatus}`);
        try {
          await fetchData();
        } catch (fetchError) {
          // Silently handle fetch error after successful update
        }
      } else {
        toast.error(
          "Failed to update order status. Feature not available in demo mode.",
        );
      }
    } catch (error) {
      // For network errors, provide a user-friendly message
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        toast.error("Order status update not available in demo mode");
      } else {
        toast.error("Failed to update order status");
      }
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      price: "",
      comparePrice: "",
      category: "",
      tags: "",
      stock: "",
      featured: false,
      images: [],
      status: "active", // <-- reset to 'active'
    });
    setEditingProduct(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      name: "",
      description: "",
      featured: false,
    });
    setEditingCategory(null);
  };

  const editProduct = (product: Product) => {
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      comparePrice: product.comparePrice?.toString() || "",
      category: product.category ? product.category._id : "",
      tags: product.tags.join(", "),
      stock: product.stock.toString(),
      featured: product.featured,
      images: product.images,
      status: product.status || "active", // <-- load status
    });
    setEditingProduct(product);
    setIsProductDialogOpen(true);
  };

  const editCategory = (category: Category) => {
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      featured: category.featured,
    });
    setEditingCategory(category);
    setIsCategoryDialogOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Access Denied
            </h2>
            <p className="text-slate-600">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">Manage your bathroom hardware store</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">
                    Total Products
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.totalProducts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">
                    Total Orders
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.totalOrders}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatPrice(stats.totalRevenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {stats.totalUsers}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Products Management</CardTitle>
                <Dialog
                  open={isProductDialogOpen}
                  onOpenChange={setIsProductDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button onClick={resetProductForm}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingProduct ? "Edit Product" : "Add New Product"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="name">Product Name</Label>
                          <Input
                            id="name"
                            value={productForm.name}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                name: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={productForm.category}
                            onValueChange={(value) =>
                              setProductForm({
                                ...productForm,
                                category: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem
                                  key={category._id}
                                  value={category._id}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={productForm.status}
                            onValueChange={(value) =>
                              setProductForm({ ...productForm, status: value })
                            }
                          >
                            <SelectTrigger id="status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={productForm.description}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              description: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="price">Price ($)</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={productForm.price}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                price: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="comparePrice">
                            Compare Price ($)
                          </Label>
                          <Input
                            id="comparePrice"
                            type="number"
                            step="0.01"
                            value={productForm.comparePrice}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                comparePrice: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="stock">Stock</Label>
                          <Input
                            id="stock"
                            type="number"
                            value={productForm.stock}
                            onChange={(e) =>
                              setProductForm({
                                ...productForm,
                                stock: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          value={productForm.tags}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              tags: e.target.value,
                            })
                          }
                          placeholder="ceramic, wall-mounted, modern"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="featured"
                          checked={productForm.featured}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              featured: e.target.checked,
                            })
                          }
                        />
                        <Label htmlFor="featured">Featured Product</Label>
                      </div>

                      {/* Image Upload */}
                      <div>
                        <Label>Product Images</Label>
                        <div className="mt-2">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files) {
                                handleImageUpload(e.target.files);
                              }
                            }}
                            className="hidden"
                            id="image-upload"
                          />
                          <label
                            htmlFor="image-upload"
                            className="cursor-pointer inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {uploadingImages ? "Uploading..." : "Upload Images"}
                          </label>
                        </div>

                        {productForm.images.length > 0 && (
                          <div className="mt-4 grid grid-cols-4 gap-4">
                            {productForm.images.map((image, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={image}
                                  alt={`Product image ${index + 1}`}
                                  className="w-full h-20 object-cover rounded"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                                  onClick={() => {
                                    setProductForm({
                                      ...productForm,
                                      images: productForm.images.filter(
                                        (_, i) => i !== index,
                                      ),
                                    });
                                  }}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsProductDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={uploadingImages}>
                          {editingProduct ? "Update Product" : "Create Product"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-slate-100 rounded overflow-hidden">
                              {product.images && product.images.length > 0 ? (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-200"></div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{product ? product.name : "Unknown Product"}</p>
                              {product && product.featured && (
                                <Badge variant="secondary" className="text-xs">
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{product && product.category ? product.category.name : "Unknown Category"}</TableCell>
                        <TableCell>{formatPrice(product.price)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.stock > 10
                                ? "default"
                                : product.stock > 0
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editProduct(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteProduct(product._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Categories Management</CardTitle>
                <Dialog
                  open={isCategoryDialogOpen}
                  onOpenChange={setIsCategoryDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button onClick={resetCategoryForm}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingCategory ? "Edit Category" : "Add New Category"}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCategorySubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="categoryName">Category Name</Label>
                        <Input
                          id="categoryName"
                          value={categoryForm.name}
                          onChange={(e) =>
                            setCategoryForm({
                              ...categoryForm,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="categoryDescription">Description</Label>
                        <Textarea
                          id="categoryDescription"
                          value={categoryForm.description}
                          onChange={(e) =>
                            setCategoryForm({
                              ...categoryForm,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="categoryFeatured"
                          checked={categoryForm.featured}
                          onChange={(e) =>
                            setCategoryForm({
                              ...categoryForm,
                              featured: e.target.checked,
                            })
                          }
                        />
                        <Label htmlFor="categoryFeatured">
                          Featured Category
                        </Label>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCategoryDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingCategory
                            ? "Update Category"
                            : "Create Category"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Featured</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category._id}>
                        <TableCell className="font-medium">
                          {category.name}
                        </TableCell>
                        <TableCell>{category.description || "—"}</TableCell>
                        <TableCell>
                          {category.featured ? (
                            <Badge>Featured</Badge>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editCategory(category)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCategory(category._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Orders Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.user ? order.user.name : "Unknown User"}</p>
                            <p className="text-sm text-slate-500">
                              {order.user ? order.user.email : "No email"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.items.reduce(
                            (sum, item) => sum + item.quantity,
                            0,
                          )}{" "}
                          items
                        </TableCell>
                        <TableCell>{formatPrice(order.total)}</TableCell>
                        <TableCell>
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleOrderStatusChange(order._id, e.target.value)
                            }
                            className="px-3 py-1 border border-slate-300 rounded-md text-sm bg-white"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

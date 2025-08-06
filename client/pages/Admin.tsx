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
  BarChart3,
  Settings,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { InventoryAlerts, QuickActions } from "@/components/admin/DashboardComponents";
import UserManagement from "@/components/admin/UserManagement";
import InventoryManagement from "@/components/admin/InventoryManagement";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import { motion } from "framer-motion";

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
    phone?: string;
  } | null;
  items: Array<{
    product: {
      name: string;
      _id: string;
    };
    name: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  notes?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Admin() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
  });

  // Inventory alerts state
  const [inventoryAlerts, setInventoryAlerts] = useState<Product[]>([]);

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

  // Order tracking form state
  const [trackingForm, setTrackingForm] = useState({
    trackingNumber: "",
    trackingUrl: "",
    estimatedDelivery: "",
    notes: "",
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

      // Fetch inventory alerts
      try {
        const alertsRes = await apiCall("/api/inventory/alerts/low-stock?threshold=10");
        if (alertsRes.ok) {
          const data = await alertsRes.json();
          setInventoryAlerts(data.alerts || []);
        }
      } catch (error) {
        // Silently handle error
      }
    } catch (error) {
      // Silently handle network errors
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
        toast.error("Failed to upload images");
      }
    } catch (error) {
      toast.error("Failed to upload images");
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
        toast.error("Failed to save product");
      }
    } catch (error) {
      toast.error("Failed to save product");
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
        toast.error("Failed to save category");
      }
    } catch (error) {
      toast.error("Failed to save category");
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
        toast.error("Failed to delete product");
      }
    } catch (error) {
      toast.error("Failed to delete product");
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
        toast.error("Failed to delete category");
      }
    } catch (error) {
      toast.error("Failed to delete category");
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
        toast.error("Failed to update order status");
      }
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const handleViewOrderDetails = async (orderId: string) => {
    try {
      const response = await apiCall(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data.order);
        setIsOrderDetailsOpen(true);
      } else {
        toast.error("Failed to fetch order details");
      }
    } catch (error) {
      toast.error("Failed to fetch order details");
    }
  };

  const handleUpdateTracking = async () => {
    if (!selectedOrder) return;

    try {
      const response = await apiCall(`/api/orders/${selectedOrder._id}/tracking`, {
        method: "PUT",
        body: JSON.stringify(trackingForm),
      });

      if (response.ok) {
        toast.success("Tracking information updated successfully");
        setIsTrackingDialogOpen(false);
        resetTrackingForm();
        await fetchData();
        // Update selected order if details are open
        if (selectedOrder) {
          await handleViewOrderDetails(selectedOrder._id);
        }
      } else {
        toast.error("Failed to update tracking information");
      }
    } catch (error) {
      toast.error("Failed to update tracking information");
    }
  };

  const resetTrackingForm = () => {
    setTrackingForm({
      trackingNumber: "",
      trackingUrl: "",
      estimatedDelivery: "",
      notes: "",
    });
  };

  const openTrackingDialog = (order: Order) => {
    setSelectedOrder(order);
    setTrackingForm({
      trackingNumber: order.trackingNumber || "",
      trackingUrl: order.trackingUrl || "",
      estimatedDelivery: order.estimatedDelivery 
        ? new Date(order.estimatedDelivery).toISOString().split('T')[0] 
        : "",
      notes: order.notes || "",
    });
    setIsTrackingDialogOpen(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-purple-100 text-purple-800";
      case "shipped":
        return "bg-orange-100 text-orange-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
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

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="max-w-md shadow-lg border-0">
            <CardContent className="text-center p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to access the admin panel.
              </p>
              <Button 
                onClick={() => window.history.back()}
                className="bg-gray-900 hover:bg-gray-800"
              >
                Go Back
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading admin panel...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
 
        {/* Enhanced Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Total Products</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.totalProducts}</p>
                </div>
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-green-900">{stats.totalOrders}</p>
                </div>
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.totalUsers}</p>
                </div>
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600 mb-1">Revenue</p>
                  <p className="text-3xl font-bold text-yellow-900">{formatPrice(stats.totalRevenue)}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Enhanced Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs defaultValue="dashboard" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <TabsList className="grid w-full grid-cols-6 bg-gray-100 p-1 rounded-lg">
                  <TabsTrigger 
                    value="dashboard" 
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger 
                    value="products"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Products
                  </TabsTrigger>
                  <TabsTrigger 
                    value="categories"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Categories
                  </TabsTrigger>
                  <TabsTrigger 
                    value="inventory"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Inventory
                  </TabsTrigger>
                  <TabsTrigger 
                    value="users"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Users
                  </TabsTrigger>
                  <TabsTrigger 
                    value="orders"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Orders
                  </TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>

          {/* Enhanced Dashboard Tab */}
            <TabsContent value="dashboard">
              <div className="space-y-6">
                {/* Enhanced Analytics Section */}
                <AnalyticsDashboard />
                
                {/* Original Dashboard Components */}
                <div className="grid gap-6 md:grid-cols-2">
                  <InventoryAlerts 
                    alerts={inventoryAlerts?.map(product => ({
                      ...product,
                      category: product.category ? { name: product.category.name } : undefined
                    })) || []} 
                    loading={loading} 
                  />
                  <QuickActions
                    actions={[
                      {
                        title: "Add Product",
                        description: "Create a new product listing",
                        icon: <Package className="w-4 h-4" />,
                        onClick: () => {
                          resetProductForm();
                          setIsProductDialogOpen(true);
                        },
                        color: "blue",
                      },
                      {
                        title: "View Orders",
                        description: "Check recent orders and status",
                        icon: <ShoppingCart className="w-4 h-4" />,
                        onClick: () => {
                          const tabsList = document.querySelector('[role="tablist"]');
                          const ordersTab = tabsList?.querySelector('[value="orders"]') as HTMLElement;
                          ordersTab?.click();
                        },
                        color: "green",
                      },
                      {
                        title: "Manage Users",
                        description: "View and manage user accounts",
                        icon: <Users className="w-4 h-4" />,
                        onClick: () => {
                          const tabsList = document.querySelector('[role="tablist"]');
                          const usersTab = tabsList?.querySelector('[value="users"]') as HTMLElement;
                          usersTab?.click();
                        },
                        color: "yellow",
                      },
                      {
                        title: "Inventory Check",
                        description: "Monitor stock levels and alerts",
                        icon: <Package className="w-4 h-4" />,
                        onClick: () => {
                          const tabsList = document.querySelector('[role="tablist"]');
                          const inventoryTab = tabsList?.querySelector('[value="inventory"]') as HTMLElement;
                          inventoryTab?.click();
                        },
                        color: "red",
                      },
                    ]}
                  />
                </div>
              </div>
            </TabsContent>          {/* Inventory Management Tab */}
          <TabsContent value="inventory">
            <InventoryManagement apiCall={apiCall} />
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users">
            <UserManagement apiCall={apiCall} />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      Products Management
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Manage your product catalog</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search products..."
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Dialog
                      open={isProductDialogOpen}
                      onOpenChange={setIsProductDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button onClick={resetProductForm} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Product
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold">
                            {editingProduct ? "Edit Product" : "Add New Product"}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleProductSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="name" className="text-sm font-medium">Product Name</Label>
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
                                  className="mt-1"
                                  placeholder="Enter product name"
                                />
                              </div>
                              <div>
                                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                                <Select
                                  value={productForm.category}
                                  onValueChange={(value) =>
                                    setProductForm({
                                      ...productForm,
                                      category: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories?.map((category) => (
                                      <SelectItem
                                        key={category._id}
                                        value={category._id}
                                      >
                                        {category.name}
                                      </SelectItem>
                                    )) || []}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                                <Select
                                  value={productForm.status}
                                  onValueChange={(value) =>
                                    setProductForm({ ...productForm, status: value })
                                  }
                                >
                                  <SelectTrigger id="status" className="mt-1">
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

                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="price" className="text-sm font-medium">Price (₹)</Label>
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
                                    className="mt-1"
                                    placeholder="0.00"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="comparePrice" className="text-sm font-medium">
                                    Compare Price (₹)
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
                                    className="mt-1"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="stock" className="text-sm font-medium">Stock Quantity</Label>
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
                                  className="mt-1"
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <Label htmlFor="tags" className="text-sm font-medium">Tags</Label>
                                <Input
                                  id="tags"
                                  value={productForm.tags}
                                  onChange={(e) =>
                                    setProductForm({
                                      ...productForm,
                                      tags: e.target.value,
                                    })
                                  }
                                  className="mt-1"
                                  placeholder="Enter tags separated by commas"
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
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
                              className="mt-1"
                              rows={4}
                              placeholder="Enter product description"
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
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor="featured" className="text-sm font-medium">Featured Product</Label>
                          </div>

                          {/* Enhanced Image Upload Section */}
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                            <Label className="text-sm font-medium">Product Images</Label>
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
                                className="cursor-pointer flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm font-medium text-gray-600">
                                  {uploadingImages ? "Uploading..." : "Click to upload images"}
                                </span>
                                <span className="text-xs text-gray-500 mt-1">
                                  PNG, JPG, GIF up to 10MB each
                                </span>
                              </label>
                            </div>

                            {productForm.images && productForm.images.length > 0 && (
                              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {productForm.images?.map((image, index) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={image}
                                      alt={`Product image ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg"
                                    />
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="destructive"
                                      className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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

                          <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsProductDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              disabled={uploadingImages}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {editingProduct ? "Update Product" : "Create Product"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Product</TableHead>
                        <TableHead className="font-semibold">Category</TableHead>
                        <TableHead className="font-semibold">Price</TableHead>
                        <TableHead className="font-semibold">Stock</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products?.map((product) => (
                        <TableRow key={product._id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                {product.images && product.images.length > 0 ? (
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <Package className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{product ? product.name : "Unknown Product"}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {product && product.featured && (
                                    <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                                      Featured
                                    </Badge>
                                  )}
                                  <span className="text-xs text-gray-500">ID: {product._id.slice(-6)}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-900">
                              {product && product.category ? product.category.name : "Uncategorized"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <span className="font-medium text-gray-900">{formatPrice(product.price)}</span>
                              {product.comparePrice && (
                                <div className="text-xs text-gray-500 line-through">
                                  {formatPrice(product.comparePrice)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                product.stock > 20
                                  ? "default"
                                  : product.stock > 5
                                    ? "secondary"
                                    : product.stock > 0
                                      ? "destructive"
                                      : "destructive"
                              }
                              className={
                                product.stock > 20
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : product.stock > 5
                                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                    : "bg-red-100 text-red-800 hover:bg-red-100"
                              }
                            >
                              {product.stock} {product.stock === 0 ? "Out of Stock" : "in stock"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                product.status === "active"
                                  ? "default"
                                  : product.status === "draft"
                                    ? "secondary"
                                    : "outline"
                              }
                              className={
                                product.status === "active"
                                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                                  : product.status === "draft"
                                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                              }
                            >
                              {product.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-blue-50 hover:border-blue-300"
                                onClick={() => editProduct(product)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-red-50 hover:border-red-300 text-red-600"
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
                </div>
                {products.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                    <p className="text-gray-600 mb-4">Get started by adding your first product.</p>
                    <Button 
                      onClick={() => {
                        resetProductForm();
                        setIsProductDialogOpen(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-green-600" />
                      Categories Management
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Organize your product categories</p>
                  </div>
                  <Dialog
                    open={isCategoryDialogOpen}
                    onOpenChange={setIsCategoryDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button onClick={resetCategoryForm} className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Category
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold">
                          {editingCategory ? "Edit Category" : "Add New Category"}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCategorySubmit} className="space-y-6">
                        <div>
                          <Label htmlFor="categoryName" className="text-sm font-medium">Category Name</Label>
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
                            className="mt-1"
                            placeholder="Enter category name"
                          />
                        </div>

                        <div>
                          <Label htmlFor="categoryDescription" className="text-sm font-medium">Description</Label>
                          <Textarea
                            id="categoryDescription"
                            value={categoryForm.description}
                            onChange={(e) =>
                              setCategoryForm({
                                ...categoryForm,
                                description: e.target.value,
                              })
                            }
                            className="mt-1"
                            rows={4}
                            placeholder="Enter category description"
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
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="categoryFeatured" className="text-sm font-medium">
                            Featured Category
                          </Label>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCategoryDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" className="bg-green-600 hover:bg-green-700">
                            {editingCategory
                              ? "Update Category"
                              : "Create Category"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Products</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories?.map((category) => (
                        <TableRow key={category._id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Settings className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{category.name}</p>
                                <p className="text-xs text-gray-500">ID: {category._id.slice(-6)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-gray-900 max-w-xs truncate">
                              {category.description || "No description"}
                            </p>
                          </TableCell>
                          <TableCell>
                            {category.featured ? (
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                Featured
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600">
                                Standard
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {products.filter(p => p.category?._id === category._id).length} products
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-green-50 hover:border-green-300"
                                onClick={() => editCategory(category)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-red-50 hover:border-red-300 text-red-600"
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
                </div>
                {categories.length === 0 && (
                  <div className="text-center py-12">
                    <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                    <p className="text-gray-600 mb-4">Get started by creating your first category.</p>
                    <Button 
                      onClick={() => {
                        resetCategoryForm();
                        setIsCategoryDialogOpen(true);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-purple-600" />
                      Orders Management
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Track and manage customer orders</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search orders..."
                        className="pl-10 w-64"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Order #</TableHead>
                        <TableHead className="font-semibold">Customer</TableHead>
                        <TableHead className="font-semibold">Items</TableHead>
                        <TableHead className="font-semibold">Total</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Payment</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders?.map((order) => (
                        <TableRow key={order._id} className="hover:bg-gray-50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-blue-600">{order.orderNumber}</p>
                              <p className="text-xs text-gray-500">ID: {order._id.slice(-6)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {order.user ? order.user.name : "Guest User"}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {order.user ? order.user.email : "No email"}
                                </p>
                                {order.user?.phone && (
                                  <p className="text-xs text-gray-500 flex items-center">
                                    <Phone className="w-3 h-3 mr-1" />
                                    {order.user.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">
                                {order.items.reduce(
                                  (sum, item) => sum + item.quantity,
                                  0,
                                )} items
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
                              <p className="text-xs text-gray-500">
                                Subtotal: {formatPrice(order.subtotal)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              <Select
                                value={order.status}
                                onValueChange={(value) =>
                                  handleOrderStatusChange(order._id, value)
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                </SelectContent>
                              </Select>
                              <Badge 
                                className={`text-xs ${getStatusBadgeColor(order.status)}`}
                              >
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge 
                                variant={order.paymentStatus === "paid" ? "default" : "secondary"}
                                className={
                                  order.paymentStatus === "paid" 
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                }
                              >
                                {order.paymentStatus}
                              </Badge>
                              <p className="text-xs text-gray-500">{order.paymentMethod}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              <div className="flex items-center text-gray-900">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(order.createdAt).toLocaleDateString()}
                              </div>
                              <p className="text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleTimeString()}
                              </p>
                              {order.shippedAt && (
                                <p className="text-xs text-blue-600">
                                  Shipped: {new Date(order.shippedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-blue-50 hover:border-blue-300"
                                onClick={() => handleViewOrderDetails(order._id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover:bg-purple-50 hover:border-purple-300"
                                onClick={() => openTrackingDialog(order)}
                              >
                                <MapPin className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {orders.length === 0 && (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                    <p className="text-gray-600">Orders will appear here when customers make purchases.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>



          {/* Enhanced Order Details Dialog */}
          <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600" />
                  Order Details
                </DialogTitle>
              </DialogHeader>
              {selectedOrder && (
                <div className="space-y-6">
                  {/* Enhanced Order Header */}
                  <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div>
                          <h3 className="font-bold text-xl text-blue-900 mb-2">{selectedOrder.orderNumber}</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-blue-700">
                              <Calendar className="w-4 h-4" />
                              <span>Order Date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-blue-700">
                              <Clock className="w-4 h-4" />
                              <span>Time: {new Date(selectedOrder.createdAt).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          <div className="flex items-center gap-3">
                            <Badge className={`text-sm px-4 py-2 ${getStatusBadgeColor(selectedOrder.status)}`}>
                              {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                            </Badge>
                            <Badge 
                              variant={selectedOrder.paymentStatus === "paid" ? "default" : "secondary"}
                              className={`text-sm px-4 py-2 ${
                                selectedOrder.paymentStatus === "paid" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-blue-900">{formatPrice(selectedOrder.total)}</p>
                          <p className="text-blue-700 flex items-center justify-end gap-1">
                            <DollarSign className="w-4 h-4" />
                            Payment: {selectedOrder.paymentMethod}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer and Shipping Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader className="bg-green-50">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="w-5 h-5 text-green-600" />
                          Customer Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        {selectedOrder.user ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{selectedOrder.user.name}</p>
                                <p className="text-sm text-gray-600">Customer</p>
                              </div>
                            </div>
                            <div className="space-y-2 pl-13">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{selectedOrder.user.email}</span>
                              </div>
                              {selectedOrder.user.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">{selectedOrder.user.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 py-4">
                            <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p>Customer information not available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                      <CardHeader className="bg-blue-50">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-600" />
                          Shipping Address
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <p className="font-semibold text-gray-900">
                            {selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}
                          </p>
                          <div className="text-sm text-gray-700 space-y-1">
                            <p>{selectedOrder.shippingAddress.address1}</p>
                            {selectedOrder.shippingAddress.address2 && (
                              <p>{selectedOrder.shippingAddress.address2}</p>
                            )}
                            <p>
                              {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                            </p>
                            <p className="font-medium">{selectedOrder.shippingAddress.country}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Enhanced Order Items */}
                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="bg-purple-50">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="w-5 h-5 text-purple-600" />
                        Order Items
                        <Badge variant="secondary" className="ml-2">
                          {selectedOrder.items.length} items
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold">Item</TableHead>
                              <TableHead className="font-semibold text-center">Quantity</TableHead>
                              <TableHead className="font-semibold text-right">Unit Price</TableHead>
                              <TableHead className="font-semibold text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedOrder?.items?.map((item, index) => (
                              <TableRow key={index} className="border-b">
                                <TableCell>
                                  <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                      <img 
                                        src={item.image} 
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <p className="font-medium text-gray-900">{item.name}</p>
                                      <p className="text-sm text-gray-500">SKU: {item.product._id.slice(-6)}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="px-3 py-1">
                                    {item.quantity}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatPrice(item.price)}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  {formatPrice(item.price * item.quantity)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      {/* Enhanced Order Summary */}
                      <div className="p-6 bg-gray-50 border-t">
                        <div className="max-w-md ml-auto space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">{formatPrice(selectedOrder.subtotal)}</span>
                          </div>
                          {selectedOrder.tax > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Tax:</span>
                              <span className="font-medium">{formatPrice(selectedOrder.tax)}</span>
                            </div>
                          )}
                          {selectedOrder.shipping > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Shipping:</span>
                              <span className="font-medium">{formatPrice(selectedOrder.shipping)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-lg font-bold border-t pt-3">
                            <span>Total:</span>
                            <span className="text-blue-600">{formatPrice(selectedOrder.total)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Enhanced Tracking Information */}
                  {(selectedOrder.trackingNumber || selectedOrder.notes) && (
                    <Card className="border-l-4 border-l-orange-500">
                      <CardHeader className="bg-orange-50">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-orange-600" />
                          Tracking & Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        {selectedOrder.trackingNumber && (
                          <div className="bg-white border rounded-lg p-4">
                            <Label className="font-semibold text-gray-900">Tracking Number:</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                                {selectedOrder.trackingNumber}
                              </code>
                              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(selectedOrder.trackingNumber || '')}>
                                Copy
                              </Button>
                            </div>
                          </div>
                        )}
                        {selectedOrder.trackingUrl && (
                          <div className="bg-white border rounded-lg p-4">
                            <Label className="font-semibold text-gray-900">Tracking URL:</Label>
                            <a 
                              href={selectedOrder.trackingUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline block mt-1 break-all"
                            >
                              {selectedOrder.trackingUrl}
                            </a>
                          </div>
                        )}
                        {selectedOrder.estimatedDelivery && (
                          <div className="bg-white border rounded-lg p-4">
                            <Label className="font-semibold text-gray-900">Estimated Delivery:</Label>
                            <p className="mt-1 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {selectedOrder.notes && (
                          <div className="bg-white border rounded-lg p-4">
                            <Label className="font-semibold text-gray-900">Notes:</Label>
                            <p className="text-gray-700 mt-1 leading-relaxed">{selectedOrder.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Enhanced Tracking Information Dialog */}
          <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Update Tracking Information
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Package className="w-5 h-5" />
                    <span className="font-medium">
                      Order: {selectedOrder?.orderNumber}
                    </span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Customer: {selectedOrder?.user?.name || 'Guest User'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="trackingNumber" className="text-sm font-medium">Tracking Number</Label>
                    <Input
                      id="trackingNumber"
                      value={trackingForm.trackingNumber}
                      onChange={(e) =>
                        setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })
                      }
                      placeholder="Enter tracking number"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="estimatedDelivery" className="text-sm font-medium">Estimated Delivery Date</Label>
                    <Input
                      id="estimatedDelivery"
                      type="date"
                      value={trackingForm.estimatedDelivery}
                      onChange={(e) =>
                        setTrackingForm({ ...trackingForm, estimatedDelivery: e.target.value })
                      }
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="trackingUrl" className="text-sm font-medium">Tracking URL</Label>
                  <Input
                    id="trackingUrl"
                    value={trackingForm.trackingUrl}
                    onChange={(e) =>
                      setTrackingForm({ ...trackingForm, trackingUrl: e.target.value })
                    }
                    placeholder="https://tracking.example.com/..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notes" className="text-sm font-medium">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={trackingForm.notes}
                    onChange={(e) =>
                      setTrackingForm({ ...trackingForm, notes: e.target.value })
                    }
                    placeholder="Additional notes about the order status, shipping details, etc..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsTrackingDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateTracking}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Update Tracking
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </Tabs>
      </motion.div>
    </div>
  </div>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Eye,
  Calendar,
  Download,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  conversionRate: number;
  averageOrderValue: number;
  topProducts?: Array<{
    _id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    type: "order" | "signup" | "product_view";
    user: string;
    timestamp: string;
    details: string;
  }>;
  salesData: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

interface AnalyticsDashboardProps {
  apiCall: (url: string, options?: RequestInit) => Promise<Response>;
}

export default function AnalyticsDashboard({}: AnalyticsDashboardProps) {
  const { user, isAuthenticated } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("7days");

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchAnalytics();
    }
  }, [dateRange, isAuthenticated, user]);

    const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Check authentication status
      if (!isAuthenticated || user?.role !== "admin") {
        console.log('User not authenticated or not admin:', { isAuthenticated, role: user?.role });
        setLoading(false);
        return;
      }
      
      // Get the token for authentication
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }
      
      // Fetch data from multiple endpoints
      const [ordersResponse, usersResponse] = await Promise.all([
        fetch('/api/orders/analytics', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/users/analytics/overview', {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);
      
      if (!ordersResponse.ok || !usersResponse.ok) {
        const ordersError = !ordersResponse.ok ? await ordersResponse.text() : null;
        const usersError = !usersResponse.ok ? await usersResponse.text() : null;
        console.error('Analytics API errors:', { ordersError, usersError });
        throw new Error(`Failed to fetch analytics: Orders(${ordersResponse.status}) Users(${usersResponse.status})`);
      }
      
      const ordersData = await ordersResponse.json();
      const usersData = await usersResponse.json();
      
      // Combine the data
      const combinedData: AnalyticsData = {
        totalRevenue: ordersData.totalRevenue || 0,
        totalOrders: ordersData.totalOrders || 0,
        totalCustomers: usersData.totalUsers || 0,
        conversionRate: usersData.totalUsers > 0 ? (ordersData.totalOrders / usersData.totalUsers) * 100 : 0,
        averageOrderValue: ordersData.totalOrders > 0 ? ordersData.totalRevenue / ordersData.totalOrders : 0,
        topProducts: [], // Will need to add this endpoint later
        recentActivity: (ordersData.recentOrders || []).map((order: any) => ({
          type: "order" as const,
          user: order.user?.name || "Unknown",
          timestamp: order.createdAt,
          details: `Order #${order.orderNumber} - ₹${order.total}`
        })),
        salesData: (ordersData.ordersByMonth || []).map((month: any) => ({
          date: `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`,
          sales: month.revenue || 0,
          orders: month.count || 0
        }))
      };
      
      setData(combinedData);
    } catch (error) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingCart className="w-4 h-4 text-green-600" />;
      case "signup":
        return <Users className="w-4 h-4 text-blue-600" />;
      case "product_view":
        return <Eye className="w-4 h-4 text-purple-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Required</h3>
          <p className="text-gray-600">You need to be logged in as an admin to view analytics.</p>
        </div>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Analytics Dashboard
          </h2>
          <p className="text-gray-600">Insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
      >
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900">{formatCurrency(data.totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Orders</p>
                <p className="text-2xl font-bold text-blue-900">{data.totalOrders}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Customers</p>
                <p className="text-2xl font-bold text-purple-900">{data.totalCustomers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-orange-900">{data.conversionRate.toFixed(1)}%</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(data.averageOrderValue)}</p>
              </div>
              <Package className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Top Performing Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topProducts?.map((product, index) => (
                  <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.sales} sales</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivity?.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{activity.user}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

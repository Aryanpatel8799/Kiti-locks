import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Eye,
  ExternalLink,
  MapPin,
  Calendar,
  CreditCard
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

interface Order {
  _id: string;
  createdAt: string;
  status: string;
  total: number;
  paymentStatus?: string;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
  shipment_id?: string;
  awb_code?: string;
  courier_company_id?: string;
  shiprocket_tracking_url?: string;
  order_created_on_shiprocket?: boolean;
}

export default function Orders() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!loading && isAuthenticated) {
      fetchOrders();
    }
    // eslint-disable-next-line
  }, [isAuthenticated, loading]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/orders/my-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchOrderTracking = async (orderId: string) => {
    setTrackingOrder(orderId);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/orders/track/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Update the specific order with tracking data
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, ...data.order }
              : order
          )
        );
      }
    } catch (error) {
      console.error("Error fetching tracking:", error);
    } finally {
      setTrackingOrder(null);
    }
  };

  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "processing":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "shipped":
        return <Truck className="h-4 w-4 text-purple-500" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 flex items-center gap-3">
              <Package className="w-8 h-8 text-gray-600" />
              My Orders
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mt-2">
              Track and manage your orders
            </p>
          </div>
        </div>

        {loadingOrders ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 max-w-md mx-auto">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
              <Button 
                className="bg-gray-900 hover:bg-gray-800 text-white" 
                onClick={() => navigate("/products")}
              >
                Start Shopping
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order._id} className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-6">
                  {/* Order Header */}
                  <div className="flex flex-col gap-4 mb-6">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </h3>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <Badge className={getStatusColor(order.status)}>
                            {order.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        {order.paymentStatus && (
                          <div className="flex items-center gap-1">
                            <CreditCard className="w-4 h-4" />
                            <Badge className={getPaymentStatusColor(order.paymentStatus)} variant="outline">
                              {order.paymentStatus.toUpperCase()}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <div className="flex-1 sm:text-right">
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          {formatPrice(order.total)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {expandedOrder === order._id ? 'Hide' : 'Details'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchOrderTracking(order._id)}
                          disabled={trackingOrder === order._id}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 w-full sm:w-auto"
                        >
                          <Truck className="w-4 h-4 mr-1" />
                          {trackingOrder === order._id ? 'Loading...' : 'Track'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <div className="space-y-2">
                      {order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">{item.name} × {item.quantity}</span>
                          <span className="font-medium text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-500 italic">
                          +{order.items.length - 3} more {order.items.length - 3 === 1 ? 'item' : 'items'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedOrder === order._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-200 pt-6 mt-4"
                      >
                        {/* All Items */}
                        {order.items.length > 3 && (
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-3">All Items</h4>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-b-0">
                                  <span className="text-gray-700">{item.name} × {item.quantity}</span>
                                  <span className="font-medium text-gray-900">
                                    {formatPrice(item.price * item.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Shipping Address */}
                        {order.shippingAddress && (
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Shipping Address
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                              <p className="font-medium">
                                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                              </p>
                              <p>{order.shippingAddress.address}</p>
                              <p>
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                              </p>
                              {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                            </div>
                          </div>
                        )}

                        {/* Tracking Information */}
                        {order.order_created_on_shiprocket && (
                          <div className="mb-6">
                            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <Truck className="w-4 h-4" />
                              Shipping Details
                            </h4>
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {order.shipment_id && (
                                  <div>
                                    <span className="font-medium text-gray-700">Shipment ID:</span>
                                    <p className="text-gray-900">{order.shipment_id}</p>
                                  </div>
                                )}
                                {order.awb_code && (
                                  <div>
                                    <span className="font-medium text-gray-700">AWB Code:</span>
                                    <p className="text-gray-900">{order.awb_code}</p>
                                  </div>
                                )}
                                {order.courier_company_id && (
                                  <div>
                                    <span className="font-medium text-gray-700">Courier:</span>
                                    <p className="text-gray-900">{order.courier_company_id}</p>
                                  </div>
                                )}
                              </div>
                              
                              {order.shiprocket_tracking_url && (
                                <div className="mt-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(order.shiprocket_tracking_url, '_blank')}
                                    className="bg-white border-blue-300 text-blue-700 hover:bg-blue-50"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Track on Shiprocket
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Order Status */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Order Status</h4>
                          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(order.status)}
                              <span className="font-medium text-gray-900">
                                Current Status: {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                            {!order.order_created_on_shiprocket && order.status === 'pending' && (
                              <div className="text-sm text-gray-600">
                                Shipment will be created once processed
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
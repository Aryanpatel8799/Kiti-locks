import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      handleSuccessfulPayment();
    } else if (orderId) {
      handleOrderSuccess();
    } else {
      setLoading(false);
      setError("No payment session or order found");
    }
  }, [sessionId, orderId]);

  const handleSuccessfulPayment = async () => {
    try {
      const response = await fetch("/api/checkout/success", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        clearCart(); // Clear cart after successful payment
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Payment processing failed");
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      setError("Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderSuccess = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Order data received:", data);
        setOrder(data.order || data); // Handle both { order: ... } and direct order object
        clearCart(); // Clear cart after successful order
      } else {
        const errorText = await response.text();
        console.error("Failed to fetch order:", response.status, errorText);
        setError(`Failed to load order details (${response.status})`);
      }
    } catch (error) {
      console.error("Order loading error:", error);
      setError("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Processing your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">❌</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Payment Failed
            </h2>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={() => navigate("/cart")} className="w-full">
              Return to Cart
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-4 py-8 sm:py-16">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-base sm:text-lg text-slate-600 px-4">
            Thank you for your order. Your payment has been processed
            successfully.
          </p>
        </div>

        {order && (
          <div className="space-y-6">
            {/* Debug information - remove in production */}
            {/* {process.env.NODE_ENV === 'development' && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <details>
                    <summary className="text-yellow-800 font-medium cursor-pointer">Debug Order Data</summary>
                    <pre className="text-xs mt-2 text-yellow-700 overflow-auto">
                      {JSON.stringify(order, null, 2)}
                    </pre>
                  </details>
                </CardContent>
              </Card>
            )} */}

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Order ID:</span>
                    <Badge variant="outline">{order._id}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Status:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Payment Status:</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {order.paymentStatus}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span>{formatPrice(order.total || order.totalAmount || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 mb-1">
                          {item.name}
                        </h4>
                        <p className="text-sm text-slate-600">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-medium text-lg">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <p className="text-sm text-slate-600">
                          {formatPrice(item.price)} each
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-slate-700">
                    <p>
                      {order.shippingAddress.firstName}{" "}
                      {order.shippingAddress.lastName}
                    </p>
                    <p>{order.shippingAddress.address1 || order.shippingAddress.address}</p>
                    <p>
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state}{" "}
                      {order.shippingAddress.zipCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                    {order.shippingAddress.email && (
                      <p className="text-sm text-slate-600 mt-2">
                        {order.shippingAddress.email}
                      </p>
                    )}
                    {order.shippingAddress.phone && (
                      <p className="text-sm text-slate-600">
                        {order.shippingAddress.phone}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-900 mb-3">
                  What happens next?
                </h3>
                <ul className="space-y-2 text-slate-600">
                  <li>• You'll receive an order confirmation email shortly</li>
                  <li>• We'll send you shipping updates as your order moves</li>
                  <li>
                    • Your order will be processed and shipped within 1-2
                    business days
                  </li>
                  <li>• Estimated delivery: 3-5 business days</li>
                </ul>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate("/products")}
                className="flex-1"
                variant="outline"
              >
                Continue Shopping
              </Button>
              {user && (
                <Button
                  onClick={() => navigate("/orders")}
                  className="flex-1"
                >
                  View All Orders
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

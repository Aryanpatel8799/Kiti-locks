import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Minus, Plus, X, ShoppingBag, ArrowLeft, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const {
    items,
    itemsCount,
    totalAmount,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Filter out items with null product
  const validItems = items.filter((item) => item.product);

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto p-6 sm:p-8 bg-white rounded-lg shadow-md border border-gray-200">
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
            Sign in to view your cart
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed">
            Please sign in to see items in your cart and proceed to checkout.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              asChild 
              className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Link to="/login">Sign In</Link>
            </Button>
            <Button 
              variant="outline" 
              asChild 
              className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Link to="/register">Create Account</Link>
            </Button>
          </div>
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

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity < 0) return;

    setUpdatingItems((prev) => new Set(prev).add(productId));

    try {
      if (newQuantity === 0) {
        await removeFromCart(productId);
        toast.success("Item removed from cart");
      } else {
        await updateQuantity(productId, newQuantity);
      }
    } catch (error) {
      toast.error("Failed to update cart");
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleRemoveItem = async (productId: string) => {
    setUpdatingItems((prev) => new Set(prev).add(productId));

    try {
      await removeFromCart(productId);
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
      toast.success("Cart cleared");
    } catch (error) {
      toast.error("Failed to clear cart");
    }
  };

  const shipping = totalAmount > 2000 ? 0 : 100;
  const finalTotal = totalAmount + shipping;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (validItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="h-24 w-24 sm:h-32 sm:w-32 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              Your cart is empty
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mb-8 leading-relaxed">
              Looks like you haven't added any items to your cart yet. Discover our amazing products!
            </p>
            <Button 
              asChild 
              className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white"
            >
              <Link to="/products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Simple Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Shopping Cart
              </h1>
              <p className="text-gray-600 mt-1">
                {itemsCount} {itemsCount === 1 ? "item" : "items"} in your cart
              </p>
            </div>
            <Button 
              asChild 
              variant="outline" 
              className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700"
            >
              <Link to="/products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="xl:col-span-2 space-y-4 lg:space-y-6">
            <Card className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              <CardHeader className="bg-gray-900 text-white p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    Your Items
                  </CardTitle>
                  {validItems.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearCart}
                      className="text-red-200 hover:text-white hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Cart
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {validItems.map((item) => (
                  <div
                    key={item.product._id}
                    className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-full sm:w-32 lg:w-28 h-32 lg:h-28 bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                        {item.product && item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm text-gray-500 font-medium">No Image</span>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                          <div className="flex-1 pr-4">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                              {item.product ? item.product.name : "Unknown Product"}
                            </h3>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200 text-gray-700">
                                {item.product && item.product.category ? item.product.category.name : "Unknown Category"}
                              </Badge>
                              {item.product && item.product.stock <= 5 && (
                                <Badge variant="outline" className="text-xs bg-orange-50 border-orange-200 text-orange-700">
                                  Only {item.product.stock} left!
                                </Badge>
                              )}
                            </div>
                            {item.variant && (
                              <div className="mb-3">
                                <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 border border-gray-200">
                                  <span className="font-medium">{item.variant.name}:</span> {item.variant.value}
                                </Badge>
                              </div>
                            )}
                            <div className="flex items-center gap-3 mb-3">
                              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {item.product ? formatPrice(item.product.price) : "N/A"}
                              </p>
                              {item.product && item.product.comparePrice && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500 line-through">
                                    {formatPrice(item.product.comparePrice)}
                                  </span>
                                  <Badge variant="destructive" className="text-xs bg-red-500 text-white">
                                    Save {Math.round(((item.product.comparePrice - item.product.price) / item.product.comparePrice) * 100)}%
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Remove Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-10 h-10 p-0 text-red-500 hover:text-white hover:bg-red-500 rounded-full transition-all duration-200 border border-red-200 hover:border-red-500"
                            onClick={() => item.product && handleRemoveItem(item.product._id)}
                            disabled={item.product ? updatingItems.has(item.product._id) : true}
                          >
                            <X className="w-5 h-5" />
                          </Button>
                        </div>

                        {/* Quantity Controls and Total */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-700">Quantity:</span>
                            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg p-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-8 h-8 p-0 hover:bg-white"
                                onClick={() =>
                                  item.product && handleQuantityChange(item.product._id, item.quantity - 1)
                                }
                                disabled={
                                  item.product ? updatingItems.has(item.product._id) || item.quantity <= 1 : true
                                }
                              >
                                <Minus className="w-4 h-4" />
                              </Button>

                              <Input
                                type="number"
                                min="1"
                                max={item.product ? item.product.stock : 1}
                                value={item.quantity}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (value && value > 0 && item.product) {
                                    handleQuantityChange(item.product._id, value);
                                  }
                                }}
                                className="w-16 h-8 text-center border-0 bg-white text-sm font-semibold"
                                disabled={item.product ? updatingItems.has(item.product._id) : true}
                              />

                              <Button
                                size="sm"
                                variant="ghost"
                                className="w-8 h-8 p-0 hover:bg-white"
                                onClick={() =>
                                  item.product && handleQuantityChange(item.product._id, item.quantity + 1)
                                }
                                disabled={
                                  item.product
                                    ? updatingItems.has(item.product._id) || item.quantity >= item.product.stock
                                    : true
                                }
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <span className="text-sm text-gray-600">Subtotal:</span>
                            <span className="text-lg font-bold text-gray-900">
                              {item.product ? formatPrice(item.product.price * item.quantity) : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="xl:col-span-1">
            <Card className="sticky top-4 bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
              <CardHeader className="bg-gray-900 text-white p-6">
                <CardTitle className="text-xl sm:text-2xl font-semibold">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      Subtotal ({validItems.length} {validItems.length === 1 ? "item" : "items"})
                    </span>
                    <span className="font-semibold text-lg">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-lg">
                      {shipping === 0 ? (
                        <span className="text-gray-900">Free</span>
                      ) : (
                        formatPrice(shipping)
                      )}
                    </span>
                  </div>

                  {totalAmount <= 2000 && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      Add {formatPrice(2000 - totalAmount)} more for free shipping!
                    </div>
                  )}
                </div>

                <Separator className="bg-gray-200" />

                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span className="text-2xl text-gray-900">
                    {formatPrice(finalTotal)}
                  </span>
                </div>

                <Button 
                  asChild 
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white text-lg font-medium"
                >
                  <Link to="/checkout/form">
                    Proceed to Checkout
                  </Link>
                </Button>

                <div className="text-center">
                  <Button variant="outline" asChild className="w-full bg-white hover:bg-gray-50 border-gray-300">
                    <Link to="/products">Continue Shopping</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

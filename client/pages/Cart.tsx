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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <ShoppingBag className="mx-auto h-16 w-16 text-slate-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Sign in to view your cart
          </h2>
          <p className="text-slate-600 mb-6">
            Please sign in to see items in your cart and proceed to checkout.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
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

  const handleQuantityChange = async (
    productId: string,
    newQuantity: number,
  ) => {
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

  // const estimatedTax = totalAmount * 0.08; // 8% tax
  const shipping = totalAmount > 100 ? 0 : 10; // Free shipping over $100
  const finalTotal = totalAmount + shipping;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (validItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <ShoppingBag className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-slate-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Button asChild>
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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Shopping Cart
              </h1>
              <p className="text-slate-600 mt-1">
                {itemsCount} {itemsCount === 1 ? "item" : "items"} in your cart
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Cart Items</CardTitle>
                {validItems.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCart}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Cart
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {validItems.map((item) => (
                  <div
                    key={item.product._id}
                    className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-24 h-24 bg-slate-100 rounded-lg overflow-hidden">
                        {item.product && item.product.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                            <span className="text-xs text-slate-500">
                              No Image
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-base font-semibold text-slate-900 mb-1">
                              {item.product ? item.product.name : "Unknown Product"}
                            </h3>
                            <p className="text-sm text-slate-500 mb-2">
                              {item.product && item.product.category ? item.product.category.name : "Unknown Category"}
                            </p>
                            {item.variant && (
                              <Badge
                                variant="secondary"
                                className="text-xs mb-2"
                              >
                                {item.variant.name}: {item.variant.value}
                              </Badge>
                            )}
                            <p className="text-lg font-semibold text-slate-900">
                              {item.product ? formatPrice(item.product.price) : "N/A"}
                            </p>
                            {item.product && item.product.stock <= 5 && (
                              <p className="text-sm text-orange-600 mt-1">
                                Only {item.product.stock} left in stock
                              </p>
                            )}
                          </div>

                          {/* Remove Button - Top right on mobile */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-8 h-8 p-0 text-red-600 hover:text-red-700 sm:hidden"
                            onClick={() => item.product && handleRemoveItem(item.product._id)}
                            disabled={item.product ? updatingItems.has(item.product._id) : true}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Quantity Controls and Total - Bottom row on mobile */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-700">
                              Quantity:
                            </span>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-8 h-8 p-0"
                                onClick={() =>
                                  item.product && handleQuantityChange(
                                    item.product._id,
                                    item.quantity - 1,
                                  )
                                }
                                disabled={
                                  item.product
                                    ? updatingItems.has(item.product._id) ||
                                      item.quantity <= 1
                                    : true
                                }
                              >
                                <Minus className="w-3 h-3" />
                              </Button>

                              <Input
                                type="number"
                                min="1"
                                max={item.product ? item.product.stock : 1}
                                value={item.quantity}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (value && value > 0 && item.product) {
                                    handleQuantityChange(
                                      item.product._id,
                                      value,
                                    );
                                  }
                                }}
                                className="w-16 h-8 text-center"
                                disabled={item.product ? updatingItems.has(item.product._id) : true}
                              />

                              <Button
                                size="sm"
                                variant="outline"
                                className="w-8 h-8 p-0"
                                onClick={() =>
                                  item.product && handleQuantityChange(
                                    item.product._id,
                                    item.quantity + 1,
                                  )
                                }
                                disabled={
                                  item.product
                                    ? updatingItems.has(item.product._id) ||
                                      item.quantity >= item.product.stock
                                    : true
                                }
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            {/* Item Total */}
                            <div className="text-right">
                              <p className="text-lg font-bold text-slate-900">
                                {item.product ? formatPrice(item.product.price * item.quantity) : "N/A"}
                              </p>
                              <p className="text-sm text-slate-500">
                                {item.quantity} ×{" "}
                                {item.product ? formatPrice(item.product.price) : "N/A"}
                              </p>
                            </div>

                            {/* Remove Button - Right side on desktop */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="hidden sm:flex w-8 h-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => item.product && handleRemoveItem(item.product._id)}
                              disabled={item.product ? updatingItems.has(item.product._id) : true}
                            >
                              <X className="w-4 h-4" />
                            </Button>
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
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Subtotal ({validItems.length} {validItems.length === 1 ? "item" : "items"})
                  </span>
                  <span className="font-medium">
                    {formatPrice(totalAmount)}
                  </span>
                </div>

                {/* <div className="flex justify-between">
                  <span className="text-slate-600">Estimated Tax</span>
                  <span className="font-medium">
                    {formatPrice(estimatedTax)}
                  </span>
                </div> */}

                <div className="flex justify-between">
                  <span className="text-slate-600">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>

                {totalAmount < 100 && (
                  <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                    Add {formatPrice(100 - totalAmount)} more to qualify for
                    free shipping
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>

                <Button className="w-full" size="lg" asChild>
                  <Link to="/checkout/form">Proceed to Checkout</Link>
                </Button>

                <div className="text-center text-sm text-slate-500">
                  <p>Secure checkout powered by Razorpay</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

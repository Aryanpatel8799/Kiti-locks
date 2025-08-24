import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Heart, ShoppingCart, ArrowLeft, X, Trash2, Loader2 } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function Wishlist() {
  const { items, itemsCount, loading, removeFromWishlist, clearWishlist } =
    useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [isMovingAll, setIsMovingAll] = useState(false);

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

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      toast.success("Item removed from wishlist");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove item");
    }
  };

  const handleAddToCart = async (productId: string, product?: any) => {
    try {
      await addToCart(productId, 1, undefined, product);
      toast.success("Item added to cart!");
    } catch (error) {
      toast.error("Failed to add item to cart");
    }
  };

  const handleClearWishlist = async () => {
    try {
      await clearWishlist();
      toast.success("Wishlist cleared");
    } catch (error: any) {
      toast.error(error.message || "Failed to clear wishlist");
    }
  };

  const handleMoveAllToCart = async () => {
    setIsMovingAll(true);
    try {
      for (const item of items) {
        await addToCart(item.product._id, 1, undefined, item.product);
      }
      await clearWishlist();
      toast.success("All items moved to cart!");
    } catch (error) {
      toast.error("Failed to move items to cart");
    } finally {
      setIsMovingAll(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6 sm:p-8 bg-white rounded-lg shadow-md border"
        >
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-3">
            Sign in to view your wishlist
          </h2>
          <p className="text-gray-600 text-sm sm:text-base mb-6 leading-relaxed">
            Save your favorite items and never lose track of what you love.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              asChild 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link to="/login">Sign In</Link>
            </Button>
            <Button 
              variant="outline" 
              asChild 
              className="w-full sm:w-auto"
            >
              <Link to="/register">Create Account</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md mx-auto"
          >
            <div className="h-24 w-24 sm:h-32 sm:w-32 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-slate-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Your wishlist is empty
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mb-8 leading-relaxed">
              Start adding items you love to keep track of them and never miss out on your favorites.
            </p>
            <Button 
              asChild 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link to="/products">
                Explore Products
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 lg:mb-12"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 flex items-center gap-3">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 fill-current" />
                My Wishlist
              </h1>
              <p className="text-gray-600 text-sm sm:text-base mt-2">
                {itemsCount} {itemsCount === 1 ? "item" : "items"} saved
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {items.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearWishlist}
                  className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:border-red-300 bg-white hover:bg-red-50 border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
              <Button 
                asChild 
                variant="outline" 
                className="w-full sm:w-auto"
              >
                <Link to="/products">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Wishlist Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="w-full"
            >
              <Card className="group relative overflow-hidden border bg-white hover:shadow-xl transition-all duration-300 h-full">
                {/* Remove Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleRemoveFromWishlist(item.product._id)}
                  className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 w-7 h-7 sm:w-8 sm:h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:text-red-600 hover:bg-white transition-all shadow-lg"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </motion.button>

                <Link to={`/products/${item.product.slug}`}>
                  <div className="relative aspect-square overflow-hidden bg-slate-100">
                    {item.product.images.length > 0 ? (
                      <motion.img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                        <span className="text-slate-500 text-sm sm:text-base">No Image</span>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/20 flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        whileHover={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-full p-2 sm:p-3 shadow-lg"
                      >
                        <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </motion.div>
                    </motion.div>

                    {/* Discount Badge */}
                    {item.product.comparePrice &&
                      calculateDiscount(
                        item.product.price,
                        item.product.comparePrice,
                      ) > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Badge
                            variant="destructive"
                            className="absolute top-2 sm:top-3 left-2 sm:left-3 text-xs sm:text-sm"
                          >
                            -
                            {calculateDiscount(
                              item.product.price,
                              item.product.comparePrice,
                            )}
                            %
                          </Badge>
                        </motion.div>
                      )}
                  </div>
                </Link>

                <CardContent className="p-3 sm:p-4">
                  <div className="mb-2">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-blue-50 border-blue-200 text-blue-700"
                    >
                      {item.product.category.name}
                    </Badge>
                  </div>
                  <Link to={`/products/${item.product.slug}`}>
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-all line-clamp-2 text-sm sm:text-base">
                      {item.product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <span className="text-base sm:text-lg font-bold text-gray-900">
                        {formatPrice(item.product.price)}
                      </span>
                      {item.product.comparePrice && (
                        <span className="text-xs sm:text-sm text-gray-500 line-through">
                          {formatPrice(item.product.comparePrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 text-sm sm:text-base py-2 sm:py-2.5"
                      onClick={() =>
                        handleAddToCart(item.product._id, item.product)
                      }
                    >
                      <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </motion.div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Added {new Date(item.dateAdded).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Move to Cart All */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 sm:mt-12 text-center"
          >
                        <div className="bg-white rounded-lg p-6 sm:p-8 border shadow-sm">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                Move All to Cart
              </h3>
              <p className="text-gray-600 mb-6">
                Add all wishlist items to your cart with one click
              </p>
              <Button
                onClick={handleMoveAllToCart}
                disabled={isMovingAll}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-medium"
              >
                {isMovingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Moving to Cart...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Move All to Cart ({items.length} items)
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

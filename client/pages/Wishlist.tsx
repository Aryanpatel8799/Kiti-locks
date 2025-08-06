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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg mx-auto p-8 bg-white rounded-lg shadow-md border border-gray-200"
        >
          <div className="relative mb-8">
            <div className="h-24 w-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto">
              <Heart className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
            Sign in to view your wishlist
          </h2>
          <p className="text-gray-600 mb-8 leading-relaxed text-lg">
            Save your favorite items and never lose track of what you love.
          </p>
          <div className="flex flex-col gap-4 justify-center">
            <Button 
              asChild 
              className="bg-gray-900 hover:bg-gray-800 text-white h-12 text-lg"
            >
              <Link to="/login">Sign In</Link>
            </Button>
            <Button 
              variant="outline" 
              asChild 
              className="border-gray-300 text-gray-700 hover:bg-gray-50 h-12 text-lg"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-gray-900 mx-auto"></div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Loading your wishlist...</p>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-lg mx-auto"
          >
            <div className="bg-white rounded-lg p-10 shadow-md border border-gray-200">
              <div className="relative mb-8">
                <div className="h-32 w-32 bg-gray-600 rounded-full flex items-center justify-center mx-auto">
                  <Heart className="h-16 w-16 text-white" />
                </div>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">
                Your wishlist is empty
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                Start adding items you love to keep track of them and never miss out on your favorites.
              </p>
              <Button 
                asChild 
                className="bg-gray-900 hover:bg-gray-800 text-white h-12 text-lg px-8"
              >
                <Link to="/products">
                  Explore Products
                  <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header Section */}
      {/* <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-lg">
                <Heart className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
              My Wishlist
            </h1>
            <p className="text-gray-300 text-lg max-w-3xl mx-auto">
              <span className="inline-flex items-center px-4 py-2 rounded-lg text-base font-medium bg-white/10 mr-3">
                {itemsCount} {itemsCount === 1 ? "item" : "items"}
              </span>
              saved for later
            </p>
          </motion.div>
        </div>
      </div> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col sm:flex-row gap-4 justify-end"
        >
          {items.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearWishlist}
              className="border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 h-12 px-6"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
          <Button 
            asChild 
            variant="outline" 
            className="bg-white/70 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 rounded-2xl backdrop-blur-sm h-12 px-6"
          >
            <Link to="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </motion.div>

        {/* Wishlist Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {items.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="w-full"
            >
              <Card className="group relative overflow-hidden border-0 bg-white/90 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 h-full rounded-3xl shadow-xl">
                {/* Remove Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleRemoveFromWishlist(item.product._id)}
                  className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-white transition-all shadow-xl border border-gray-200/50"
                >
                  <X className="w-5 h-5" />
                </motion.button>

                <Link to={`/products/${item.product.slug}`}>
                  <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-t-3xl">
                    {item.product.images.length > 0 ? (
                      <motion.img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-lg font-medium">No Image</span>
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
                        className="bg-white/90 backdrop-blur-sm rounded-full p-4 shadow-2xl"
                      >
                        <ShoppingCart className="w-6 h-6 text-gray-900" />
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
                            className="absolute top-4 left-4 text-sm bg-red-500 text-white rounded-full px-3 py-1 shadow-lg"
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

                <CardContent className="p-6">
                  <div className="mb-3">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-slate-50 border-slate-300 text-slate-700 rounded-full px-3 py-1"
                    >
                      {item.product.category.name}
                    </Badge>
                  </div>
                  <Link to={`/products/${item.product.slug}`}>
                    <h3 className="font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-all line-clamp-2 text-lg">
                      {item.product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-xl font-bold text-gray-900">
                        {formatPrice(item.product.price)}
                      </span>
                      {item.product.comparePrice && (
                        <span className="text-sm text-gray-500 line-through">
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
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white text-base py-3"
                      onClick={() =>
                        handleAddToCart(item.product._id, item.product)
                      }
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </motion.div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
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
            className="mt-16 text-center"
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-10 border border-gray-100 shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Move All to Cart
              </h3>
              <p className="text-gray-600 mb-8 text-lg">
                Add all wishlist items to your cart with one click
              </p>
              <Button
                onClick={handleMoveAllToCart}
                disabled={isMovingAll}
                className="bg-gray-900 hover:bg-gray-800 text-white px-10 py-4 text-lg font-semibold"
              >
                {isMovingAll ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Moving to Cart...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
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

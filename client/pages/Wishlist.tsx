import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Heart, ShoppingCart, ArrowLeft, X, Trash2 } from "lucide-react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

export default function Wishlist() {
  const { items, itemsCount, loading, removeFromWishlist, clearWishlist } =
    useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <Heart className="mx-auto h-16 w-16 text-slate-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Sign in to view your wishlist
          </h2>
          <p className="text-slate-600 mb-6">
            Save your favorite items and never lose track of what you love.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button variant="outline" asChild>
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            className="text-center"
          >
            <Heart className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Your wishlist is empty
            </h2>
            <p className="text-slate-600 mb-8">
              Start adding items you love to keep track of them.
            </p>
            <Button asChild>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500 fill-current" />
                My Wishlist
              </h1>
              <p className="text-slate-600 mt-1">
                {itemsCount} {itemsCount === 1 ? "item" : "items"} saved
              </p>
            </div>
            <div className="flex gap-3">
              {items.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearWishlist}
                  className="text-red-600 hover:text-red-700 hover:border-red-200"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to="/products">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Wishlist Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="group relative overflow-hidden border-0 bg-white hover:shadow-xl transition-all duration-300 h-full">
                {/* Remove Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleRemoveFromWishlist(item.product._id)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-600 hover:text-red-600 hover:bg-white transition-all"
                >
                  <X className="w-4 h-4" />
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
                      <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                        <span className="text-slate-500">No Image</span>
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
                        className="bg-white rounded-full p-3 shadow-lg"
                      >
                        <ShoppingCart className="w-5 h-5 text-blue-600" />
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
                            className="absolute top-3 left-3"
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

                <CardContent className="p-4">
                  <div className="mb-2">
                    <Badge variant="outline" className="text-xs">
                      {item.product.category.name}
                    </Badge>
                  </div>
                  <Link to={`/products/${item.product.slug}`}>
                    <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {item.product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-slate-900">
                        {formatPrice(item.product.price)}
                      </span>
                      {item.product.comparePrice && (
                        <span className="text-sm text-slate-500 line-through">
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
                      className="w-full"
                      onClick={() =>
                        handleAddToCart(item.product._id, item.product)
                      }
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </motion.div>
                  <p className="text-xs text-slate-500 mt-2">
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
            className="mt-12 text-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="px-8 py-3"
                onClick={async () => {
                  try {
                    const promises = items.map((item) =>
                      addToCart(item.product._id, 1, undefined, item.product),
                    );
                    await Promise.all(promises);
                    toast.success("All items added to cart!");
                  } catch (error) {
                    toast.error("Failed to add some items to cart");
                  }
                }}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add All to Cart
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

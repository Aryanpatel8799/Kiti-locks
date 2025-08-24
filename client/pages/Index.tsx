import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Heart,
  ShoppingCart,
  Star,
  ArrowRight,
  Sparkles,
  Package,
  Shield,
  Truck,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/SEO";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category: {
    name: string;
    slug: string;
  };
  featured: boolean;
  averageRating: number;
  reviewCount: number;
  operationType?: "Soft Close" | "Non-Soft Close";
  productCode?: string;
  usageArea?: "Kitchen" | "Wardrobe" | "Drawer" | "Overhead";
  finish?: "Chrome" | "SS" | "Matte" | "Premium" | "Aluminium" | "PVC";
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  featured: boolean;
}

export default function Index() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      console.log("Fetching home data...");

      // Test API connectivity first
      try {
        const pingRes = await fetch("/api/ping");
        if (pingRes.ok) {
          const pingData = await pingRes.json();
          console.log("✅ API connectivity test passed:", pingData.message);
        } else {
          console.warn("⚠️ API ping failed with status:", pingRes.status);
        }
      } catch (pingError) {
        console.error("❌ API ping failed:", pingError);
      }

      // Mock data fallback for demo purposes
      const mockProducts: Product[] = [
        {
          _id: "mock-1",
          name: "KITI SOFT CLOSE HINGES - 8MM CUP",
          slug: "kiti-soft-close-hinges-8mm-cup",
          price: 299.99,
          comparePrice: 399.99,
          images: [
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          ],
          category: { name: "Soft Close Hinges", slug: "soft-close-hinges" },
          featured: true,
          averageRating: 4.5,
          reviewCount: 24,
          operationType: "Soft Close",
          productCode: "KITI-HG08",
          usageArea: "Kitchen",
          finish: "Chrome",
        },
        {
          _id: "mock-2",
          name: "KITI TELESCOPIC CHANNEL - 45MM",
          slug: "kiti-telescopic-channel-45mm",
          price: 459.99,
          comparePrice: 599.99,
          images: [
            "https://images.unsplash.com/photo-1620626011761-996317b8d101?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          ],
          category: {
            name: "Telescopic & Soft Close Channels",
            slug: "telescopic-soft-close-channels",
          },
          featured: true,
          averageRating: 4.8,
          reviewCount: 31,
          operationType: "Non-Soft Close",
          productCode: "KITI-TC45",
          usageArea: "Drawer",
          finish: "SS",
        },
        {
          _id: "mock-3",
          name: "AVENTOS HF - LIFT-UP SYSTEM",
          slug: "aventos-hf-lift-up-system",
          price: 2299.99,
          comparePrice: 2999.99,
          images: [
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
          ],
          category: { name: "Lift-Up Systems", slug: "lift-up-systems" },
          featured: true,
          averageRating: 5.0,
          reviewCount: 18,
          operationType: "Soft Close",
          productCode: "KITI-AVHF",
          usageArea: "Overhead",
          finish: "Premium",
        },
      ];

      const mockCategories: Category[] = [
        {
          _id: "mock-cat-1",
          name: "Soft Close Hinges",
          slug: "soft-close-hinges",
          featured: true,
        },
        {
          _id: "mock-cat-2",
          name: "Telescopic & Soft Close Channels",
          slug: "telescopic-soft-close-channels",
          featured: true,
        },
        {
          _id: "mock-cat-3",
          name: "Lift-Up Systems",
          slug: "lift-up-systems",
          featured: true,
        },
      ];

      // Fetch products with better error handling
      let productsData = null;
      try {
        const productsRes = await fetch("/api/products?featured=true&limit=8");
        if (productsRes.ok) {
          productsData = await productsRes.json();
          console.log("Products data:", productsData);
          setFeaturedProducts(productsData.products || mockProducts);
        } else {
          console.warn(
            "Products API returned non-ok status, using mock data:",
            productsRes.status,
          );
          setFeaturedProducts(mockProducts);
        }
      } catch (productsError) {
        console.error("Products fetch error, using mock data:", productsError);
        setFeaturedProducts(mockProducts);
      }

      // Fetch categories with better error handling
      let categoriesData = null;
      try {
        const categoriesRes = await fetch("/api/categories?featured=true");
        if (categoriesRes.ok) {
          categoriesData = await categoriesRes.json();
          console.log("Categories data:", categoriesData);
          setFeaturedCategories(categoriesData.categories || mockCategories);
        } else {
          console.warn(
            "Categories API returned non-ok status, using mock data:",
            categoriesRes.status,
          );
          setFeaturedCategories(mockCategories);
        }
      } catch (categoriesError) {
        console.error(
          "Categories fetch error, using mock data:",
          categoriesError,
        );
        setFeaturedCategories(mockCategories);
      }
    } catch (error) {
      console.error("Error fetching home data:", error);
      // Set fallback data for demo
      setFeaturedProducts([]);
      setFeaturedCategories([]);
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

  const calculateDiscount = (price: number, comparePrice?: number) => {
    if (!comparePrice || comparePrice <= price) return 0;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to your cart", {
        action: {
          label: "Sign In",
          onClick: () => (window.location.href = "/login"),
        },
      });
      return;
    }

    try {
      await addToCart(product._id);
      toast.success(`${product.name} added to cart!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to add item to cart");
    }
  };

  const handleToggleWishlist = async (
    product: Product,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await toggleWishlist(product._id);
      const isInWishlistNow = isInWishlist(product._id);
      toast.success(
        isInWishlistNow
          ? `${product.name} removed from wishlist`
          : `${product.name} added to wishlist!`,
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to update wishlist");
    }
  };

  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });

  const homeStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Kiti Store",
    "url": "https://kitistore.com",
    "description": "Premium modular kitchen hardware manufacturer in India",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://kitistore.com/products?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <SEO
        title="Kiti Store – Premium Modular Kitchen Hardware India"
        description="Explore luxury kitchen hardware by Kiti Store – Hydraulic Hinges, Soft-Close Channels, Lift-Up Systems & more. Premium modular kitchen solutions for Indian homes."
        keywords="kitchen hardware, modular kitchen India, soft close channels, lift up hardware, Kiti Store, Khuntia Enterprises, hydraulic hinges, premium kitchen accessories"
        structuredData={homeStructuredData}
      />
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <motion.div
            className="absolute top-4 left-4 sm:top-10 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, -25, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute bottom-4 right-4 sm:bottom-10 sm:right-10 w-60 h-60 sm:w-96 sm:h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"
            animate={{
              x: [0, -60, 0],
              y: [0, 40, 0],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>
        <div
          ref={heroRef}
          className="relative max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-12 xs:py-16 sm:py-20 md:py-24 lg:py-32 xl:py-36"
        >
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <Badge
                variant="secondary"
                className="mb-3 xs:mb-4 sm:mb-6 px-2 xs:px-3 sm:px-4 py-1 xs:py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-white/80 backdrop-blur-sm"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-600" />
                <span className="text-xs xs:text-sm">New Collection Available</span>
              </Badge>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-slate-900 mb-3 xs:mb-4 sm:mb-6 leading-tight tracking-tight"
            >
              <span className="block xs:inline">Where Design </span>
              <span className="block xs:inline">Meets</span>
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isHeroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800"
              >
                Durability
              </motion.span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 mb-6 xs:mb-8 sm:mb-10 max-w-xs xs:max-w-sm sm:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed px-2 xs:px-4 sm:px-0"
            >
              Premium Kitchen Hardware by Kiti Store. Discover
              precision-engineered hydraulic hinges, soft-close channels,
              lift-up systems, and designer accessories for modern Indian
              kitchens.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col xs:flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch xs:items-center px-3 xs:px-4 sm:px-0 max-w-md xs:max-w-lg sm:max-w-none mx-auto"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full xs:w-full sm:w-auto"
              >
                <Button
                  asChild
                  size="lg"
                  className="w-full sm:w-auto px-6 xs:px-8 sm:px-10 py-3 xs:py-3.5 sm:py-4 text-sm xs:text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Link to="/products">
                    Shop Now
                    <ArrowRight className="ml-2 w-4 h-4 xs:w-5 xs:h-5 sm:w-5 sm:h-5" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full xs:w-full sm:w-auto"
              >
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-6 xs:px-8 sm:px-10 py-3 xs:py-3.5 sm:py-4 text-sm xs:text-base sm:text-lg font-semibold border-2 bg-white/80 backdrop-blur-sm hover:bg-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Link to="/categories">View Collections</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-10 xs:h-16 sm:h-20 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-8 xs:py-12 sm:py-16 lg:py-20 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-6 xs:mb-8 sm:mb-12 lg:mb-16"
          >
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 xs:mb-3 sm:mb-4">
              Why Choose Kiti Store?
            </h2>
            <p className="text-sm xs:text-base sm:text-lg lg:text-xl text-slate-600 px-4 xs:px-6 sm:px-0 max-w-3xl mx-auto">
              World-class kitchen hardware that blends innovation, luxury, and
              practicality
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xs:gap-6 sm:gap-8 lg:gap-10">
            {[
              {
                icon: Package,
                title: "Premium Quality",
                description:
                  "Hand-picked products from trusted manufacturers with lifetime warranties",
                delay: 0,
              },
              {
                icon: Truck,
                title: "Fast Shipping",
                description:
                  "Free shipping on orders over ₹3000 with 2-3 day delivery",
                delay: 0.2,
              },
              {
                icon: Shield,
                title: "Secure Shopping",
                description:
                  "Your data is protected with industry-leading security measures",
                delay: 0.4,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: feature.delay }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-3 xs:mb-4 sm:mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center group-hover:shadow-lg transition-shadow"
                >
                  <feature.icon className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-blue-600" />
                </motion.div>
                <h3 className="text-base xs:text-lg sm:text-xl lg:text-2xl font-semibold text-slate-900 mb-2 xs:mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-xs xs:text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed px-2 xs:px-4 sm:px-0 max-w-md mx-auto">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      {featuredCategories.length > 0 && (
        <section className="py-8 xs:py-12 sm:py-16 lg:py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-6 xs:mb-8 sm:mb-12 lg:mb-16"
            >
              <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 xs:mb-3 sm:mb-4">
                Shop by Category
              </h2>
              <p className="text-sm xs:text-base sm:text-lg lg:text-xl text-slate-600 px-4 xs:px-6 sm:px-0 max-w-3xl mx-auto">
                Find exactly what you're looking for
              </p>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 lg:gap-8">
              {featuredCategories.slice(0, 4).map((category, index) => (
                <motion.div
                  key={category._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                >
                  <Link to={`/products?category=${category.slug}`}>
                    <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white via-slate-50 to-white overflow-hidden h-full">
                      <CardContent className="p-3 xs:p-4 sm:p-6 lg:p-8 text-center">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 10 }}
                          className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto mb-2 xs:mb-3 sm:mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center group-hover:shadow-lg transition-shadow"
                        >
                          <div className="w-5 h-5 xs:w-6 xs:h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg"></div>
                        </motion.div>
                        <h3 className="text-xs xs:text-sm sm:text-base lg:text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
                          {category.name}
                        </h3>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="py-8 xs:py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-6 xs:mb-8 sm:mb-12 lg:mb-16"
          >
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-2 xs:mb-3 sm:mb-4">
              Featured Products
            </h2>
            <p className="text-sm xs:text-base sm:text-lg lg:text-xl text-slate-600 px-4 xs:px-6 sm:px-0 max-w-3xl mx-auto">
              Hand-picked favorites from our collection
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3 xs:gap-4 sm:gap-6 lg:gap-8">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-square bg-slate-200 animate-pulse"></div>
                  <CardContent className="p-2 xs:p-3 sm:p-4">
                    <div className="h-2 xs:h-3 sm:h-4 bg-slate-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 xs:h-5 sm:h-6 bg-slate-200 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3 xs:gap-4 sm:gap-6 lg:gap-8">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                >
                  <Link to={`/products/${product.slug}`}>
                    <Card className="group cursor-pointer hover:shadow-2xl transition-all duration-300 overflow-hidden border-0 bg-white h-full">
                      <div className="relative aspect-square overflow-hidden bg-slate-100">
                        {product.images.length > 0 ? (
                          <motion.img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                            <span className="text-slate-500">No Image</span>
                          </div>
                        )}
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
                            <ArrowRight className="w-5 h-5 text-blue-600" />
                          </motion.div>
                        </motion.div>
                        <div className="absolute top-1.5 xs:top-2 sm:top-3 right-1.5 xs:right-2 sm:right-3">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              size="sm"
                              variant="secondary"
                              className={`w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 p-0 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white ${
                                isInWishlist(product._id)
                                  ? "text-red-500"
                                  : "text-slate-600"
                              }`}
                              onClick={(e) => handleToggleWishlist(product, e)}
                            >
                              <Heart
                                className={`w-3 h-3 xs:w-3 xs:h-3 sm:w-4 sm:h-4 ${
                                  isInWishlist(product._id)
                                    ? "fill-current"
                                    : ""
                                }`}
                              />
                            </Button>
                          </motion.div>
                        </div>
                        {product.comparePrice &&
                          calculateDiscount(
                            product.price,
                            product.comparePrice,
                          ) > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.2 }}
                            >
                              <Badge
                                variant="destructive"
                                className="absolute top-1.5 xs:top-2 sm:top-3 left-1.5 xs:left-2 sm:left-3 text-xs"
                              >
                                -
                                {calculateDiscount(
                                  product.price,
                                  product.comparePrice,
                                )}
                                %
                              </Badge>
                            </motion.div>
                          )}
                      </div>
                      <CardContent className="p-2 xs:p-3 sm:p-4 lg:p-5">
                        <div className="mb-1.5 xs:mb-2">
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            {product.category.name}
                          </Badge>
                        </div>
                        <h3 className="text-xs xs:text-sm sm:text-base lg:text-lg font-semibold text-slate-900 mb-1.5 xs:mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                        {/* Rating */}
                        {product.reviewCount > 0 && (
                          <div className="flex items-center gap-1 mb-1.5 xs:mb-2">
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-2.5 h-2.5 xs:w-3 xs:h-3 ${
                                    star <= Math.round(product.averageRating)
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-slate-600">
                              ({product.reviewCount})
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm xs:text-base sm:text-lg lg:text-xl font-bold text-slate-900">
                              {formatPrice(product.price)}
                            </span>
                            {product.comparePrice && (
                              <span className="text-xs xs:text-xs sm:text-sm text-slate-500 line-through">
                                {formatPrice(product.comparePrice)}
                              </span>
                            )}
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="px-1.5 xs:px-2 sm:px-3 py-1 xs:py-1 sm:py-1.5 text-xs sm:text-sm hover:bg-blue-50 hover:border-blue-200"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                            >
                              <ShoppingCart className="w-3 h-3 xs:w-3 xs:h-3 sm:w-4 sm:h-4 mr-0.5 xs:mr-1" />
                              <span className="hidden xs:inline">Add</span>
                            </Button>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 xs:py-8 sm:py-12">
              <p className="text-slate-600 px-4 sm:px-0">No featured products available</p>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-6 xs:mt-8 sm:mt-12"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="px-6 xs:px-8 sm:px-10 py-2.5 xs:py-3 sm:py-3.5 text-sm xs:text-base sm:text-lg hover:bg-blue-50 hover:border-blue-200 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Link to="/products">
                  View All Products
                  <ArrowRight className="ml-2 w-4 h-4 xs:w-5 xs:h-5 sm:w-5 sm:h-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
    </>
  );
}

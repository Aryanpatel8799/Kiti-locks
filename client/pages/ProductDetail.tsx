import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  ShoppingCart,
  ArrowLeft,
  Star,
  Minus,
  Plus,
  Share2,
  Truck,
  Shield,
  RotateCcw,
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import ProductReviews from "@/components/ProductReviews";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  description: string;
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  images: string[];
  stock: number;
  status: string;
  featured: boolean;
  tags: string[];
  variants: Array<{
    name: string;
    value: string;
    price?: number;
    stock?: number;
  }>;
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);

        // Initialize selected variants with first option of each variant type
        if (data.product?.variants.length > 0) {
          const variantTypes = Array.from(
            new Set(data.product.variants.map((v: any) => v.name)),
          );
          const initialVariants: Record<string, string> = {};
          variantTypes.forEach((type) => {
            const firstVariant = data.product.variants.find(
              (v: any) => v.name === type,
            );
            if (firstVariant) {
              initialVariants[type] = firstVariant.value;
            }
          });
          setSelectedVariants(initialVariants);
        }
      } else {
        toast.error("Product not found");
        navigate("/products");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
      navigate("/products");
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

  const handleAddToCart = async () => {
    if (!product) return;

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
      // Convert selected variants to the format expected by the cart
      const variant =
        Object.keys(selectedVariants).length > 0
          ? {
              name: Object.keys(selectedVariants)[0],
              value: selectedVariants[Object.keys(selectedVariants)[0]],
            }
          : undefined;

      await addToCart(product._id, quantity, variant);
      toast.success(`${product.name} added to cart!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to add item to cart");
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 0)) {
      setQuantity(newQuantity);
    }
  };

  const getVariantsByType = (type: string) => {
    if (!product) return [];
    return product.variants.filter((variant) => variant.name === type);
  };

  const getUniqueVariantTypes = () => {
    if (!product) return [];
    return Array.from(new Set(product.variants.map((v) => v.name)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Product Not Found
            </h2>
            <p className="text-slate-600 mb-4">
              The product you're looking for doesn't exist.
            </p>
            <Button asChild>
              <Link to="/products">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Products
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-slate-600 mb-8">
          <Link to="/" className="hover:text-blue-600">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-blue-600">
            Products
          </Link>
          <span>/</span>
          <Link
            to={`/products?category=${product.category.slug}`}
            className="hover:text-blue-600"
          >
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-slate-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
              {product.images.length > 0 ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                  <span className="text-slate-500 text-lg">No Image</span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index
                        ? "border-blue-500"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{product.category.name}</Badge>
                <Button variant="ghost" size="sm">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {product.name}
              </h1>

              {/* Rating placeholder */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-slate-600">(23 reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-3xl font-bold text-slate-900">
                  {formatPrice(product.price)}
                </span>
                {product.comparePrice && (
                  <>
                    <span className="text-xl text-slate-500 line-through">
                      {formatPrice(product.comparePrice)}
                    </span>
                    <Badge variant="destructive">
                      -{calculateDiscount(product.price, product.comparePrice)}%
                    </Badge>
                  </>
                )}
              </div>

              {/* Stock Status */}
              <div className="mb-6">
                {product.stock > 0 ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700">
                      {product.stock > 5
                        ? "In Stock"
                        : `Only ${product.stock} left`}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-700">Out of Stock</span>
                  </div>
                )}
              </div>
            </div>

            {/* Variants */}
            {getUniqueVariantTypes().length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">Options</h3>
                {getUniqueVariantTypes().map((type) => (
                  <div key={type}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {type}
                    </label>
                    <Select
                      value={selectedVariants[type] || ""}
                      onValueChange={(value) =>
                        setSelectedVariants({
                          ...selectedVariants,
                          [type]: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={`Select ${type}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {getVariantsByType(type).map((variant, index) => (
                          <SelectItem key={index} value={variant.value}>
                            {variant.value}
                            {variant.price &&
                              ` (+${formatPrice(variant.price)})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="text-sm text-slate-600 ml-4">
                  {product.stock} available
                </span>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="space-y-3">
              <Button
                className="w-full h-12 text-lg"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
              <Button variant="outline" className="w-full h-12">
                <Heart className="w-5 h-5 mr-2" />
                Add to Wishlist
              </Button>
            </div>

            {/* Features */}
            <div className="space-y-3 pt-6 border-t">
              <div className="flex items-center space-x-3 text-sm text-slate-600">
                <Truck className="w-5 h-5 text-green-600" />
                <span>Free shipping on orders over ₹2000</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-600">
                <Shield className="w-5 h-5 text-blue-600" />
                <span>2-year warranty included</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-slate-600">
                <RotateCcw className="w-5 h-5 text-purple-600" />
                <span>30-day return policy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="mt-16">
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Product Description
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 leading-relaxed">
                {product.description}
              </p>

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag.replace("-", " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Reviews */}
        <div className="mt-16">
          <ProductReviews productId={product._id} productName={product.name} />
        </div>

        {/* Back to Products */}
        <div className="mt-12">
          <Button variant="outline" asChild>
            <Link to="/products">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Products
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

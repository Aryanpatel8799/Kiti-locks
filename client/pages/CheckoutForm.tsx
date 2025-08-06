import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Lock, Truck, MapPin } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import RazorpayPaymentForm from "@/components/RazorpayPaymentForm";

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

export default function CheckoutForm() {
  const navigate = useNavigate();
  const { items, itemsCount, totalAmount } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
  });

  // Initialize shipping address when user data is available
  useEffect(() => {
    if (user && !shippingAddress.firstName) {
      setShippingAddress(prev => ({
        ...prev,
        firstName: user.name?.split(" ")[0] || "",
        lastName: user.name?.split(" ")[1] || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (only after loading is complete)
  if (!authLoading && !isAuthenticated) {
    navigate("/login?redirect=/checkout/form");
    return null;
  }

  // Redirect to cart if no items (only after auth check is complete)
  if (!authLoading && items.length === 0) {
    navigate("/cart");
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  // No tax and no shipping - just product prices
  const finalTotal = totalAmount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Special validation for ZIP code (PIN code)
    if (name === "zipCode") {
      // Only allow 6 digits for Indian PIN code
      if (!/^\d{0,6}$/.test(value)) {
        return;
      }
    }

    setShippingAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStateChange = (value: string) => {
    setShippingAddress((prev) => ({
      ...prev,
      state: value,
    }));
  };

  const validatePinCode = (pinCode: string) => {
    return /^\d{6}$/.test(pinCode);
  };

  const validateForm = () => {
    const required = [
      "firstName",
      "lastName",
      "email",
      "address",
      "city",
      "state",
      "zipCode",
    ];
    const allFieldsFilled = required.every((field) =>
      shippingAddress[field as keyof ShippingAddress].trim(),
    );

    // Also validate PIN code format
    const pinCodeValid = validatePinCode(shippingAddress.zipCode);

    return allFieldsFilled && pinCodeValid;
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      setLoading(true);
      console.log("✅ Payment successful, order already created via Razorpay handler:", paymentData);
      
      // Order is already created by the Razorpay success handler
      // Just navigate to success page
      const orderId = paymentData.orderData?.orderId || paymentData.orderData?.order?._id;
      
      if (orderId) {
        toast.success("Order placed successfully!");
        navigate(`/checkout/success?order_id=${orderId}`);
      } else {
        console.warn("No order ID found in payment data:", paymentData);
        toast.success("Payment successful! Redirecting...");
        navigate(`/orders`); // Fallback to orders page
      }
    } catch (error) {
      console.error("Post-payment processing error:", error);
      // Even if navigation fails, the order was created successfully
      toast.success("Payment successful! Please check your orders.");
      navigate(`/orders`);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: string) => {
    setLoading(false); // Reset loading state on error
    toast.error(error);
  };

  const handlePaymentCancel = () => {
    setLoading(false); // Reset loading state on cancellation
    toast.info("Payment was cancelled");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/cart")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">
            Secure Checkout
          </h1>
          <p className="text-slate-600 mt-1">
            Complete your order with Razorpay payment
          </p>
        </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Checkout Form */}
            <div className="space-y-6">
              {/* Shipping Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Shipping Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={shippingAddress.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={shippingAddress.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={shippingAddress.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="number"
                      maxLength={10}
                      pattern="\d{10}"
                      value={shippingAddress.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      value={shippingAddress.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        value={shippingAddress.city}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Select
                        value={shippingAddress.state}
                        onValueChange={handleStateChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">PIN Code *</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={shippingAddress.zipCode}
                        onChange={handleInputChange}
                        placeholder="Enter 6-digit PIN code"
                        maxLength={6}
                        pattern="\d{6}"
                        className={
                          !validatePinCode(shippingAddress.zipCode) &&
                          shippingAddress.zipCode
                            ? "border-red-500"
                            : ""
                        }
                        required
                      />
                      {shippingAddress.zipCode &&
                        !validatePinCode(shippingAddress.zipCode) && (
                          <p className="text-sm text-red-500">
                            Please enter a valid 6-digit PIN code
                          </p>
                        )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        name="country"
                        value={shippingAddress.country}
                        onChange={handleInputChange}
                        disabled
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Form */}
              {validateForm() && (
                <RazorpayPaymentForm
                  amount={finalTotal}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                  loading={loading}
                  customerInfo={{
                    name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                    email: shippingAddress.email,
                    contact: shippingAddress.phone,
                  }}
                  cartItems={items}
                  shippingAddress={shippingAddress}
                />
              )}

              {!validateForm() && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">
                      Please complete the shipping information above to continue
                      with payment.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center space-x-3 sm:space-x-4"
                      >
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.product.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <span className="text-slate-500 text-xs">
                              No Image
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {item.product.name}
                          </h4>
                          <p className="text-slate-600 text-sm">
                            Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-medium text-sm">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal ({itemsCount} items)</span>
                      <span>{formatPrice(totalAmount)}</span>
                    </div>
                    {/* <div className="flex justify-between text-sm">
                      <span>Estimated Tax</span>
                      <span>{formatPrice(estimatedTax)}</span>
                    </div> */}
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>
                        <Badge variant="secondary">FREE</Badge>
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(finalTotal)}</span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <Lock className="w-4 h-4" />
                      <span>Secure checkout powered by Razorpay</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Your payment information is encrypted and secure
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

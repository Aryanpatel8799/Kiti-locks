import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Shield, Lock } from "lucide-react";
import { loadRazorpay, razorpayKeyId } from "@/lib/razorpay";
import { toast } from "sonner";

interface RazorpayPaymentFormProps {
  amount: number;
  currency?: string;
  orderId?: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
  onCancel?: () => void; // Add cancel handler
  customerInfo: {
    name: string;
    email: string;
    contact?: string;
  };
  loading?: boolean;
  cartItems?: any[]; // Add cart items prop
  shippingAddress?: any; // Add shipping address prop
}

export default function RazorpayPaymentForm({
  amount,
  currency = "INR",
  orderId,
  onSuccess,
  onError,
  onCancel,
  customerInfo,
  loading = false,
  cartItems = [],
  shippingAddress,
}: RazorpayPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: customerInfo.name || "",
    email: customerInfo.email || "",
    contact: customerInfo.contact || "",
  });

  // Payment form initialized with currency and orderId
  // Used props: currency, orderId

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      // Load Razorpay script
      const res = await loadRazorpay();
      if (!res) {
        toast.error("Failed to load payment gateway");
        return;
      }

      // Create order on backend
      const orderResponse = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          items: cartItems.length > 0 
            ? cartItems.map(item => ({
                productId: item.product._id,
                quantity: item.quantity,
                price: item.product.price
              }))
            : [{ 
                productId: "temp", 
                quantity: 1, 
                price: amount 
              }], // Fallback for demo
          shippingAddress: shippingAddress || {
            firstName: billingDetails.name.split(' ')[0] || billingDetails.name,
            lastName: billingDetails.name.split(' ')[1] || '',
            email: billingDetails.email,
            phone: billingDetails.contact,
            // Add other required shipping fields as needed
          },
        }),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        throw new Error(error.message || "Failed to create order");
      }

      const orderData = await orderResponse.json();

      // Check if we're in demo mode or live mode
      if (orderData.isDemoMode) {
        // Handle demo mode (should not happen in live)
        console.warn("Demo mode detected in live environment");
        toast.error("Payment gateway is in demo mode");
        return;
      }

      // Razorpay payment options for live mode
      const options = {
        key: orderData.razorpayKeyId || razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Kiti Store",
        description: "Premium Kitchen Hardware",
        image: "/logo.png",
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {


            // Prepare order items from cart or create fallback
            const preparedOrderItems = cartItems && cartItems.length > 0 
              ? cartItems.map(item => ({
                  product: item.product?._id || item._id, // Handle both cart item structures
                  name: item.product?.name || item.name,
                  quantity: item.quantity,
                  price: item.product?.price || item.price,
                  image: item.product?.images?.[0] || item.image,
                  variant: item.variant || undefined,
                }))
              : [{ 
                  product: "fallback_product_id",
                  name: "Payment Order",
                  quantity: 1, 
                  price: amount / 100, // Convert from paise to rupees
                  image: "/placeholder.svg"
                }];


            // Send payment details to backend for verification and order creation
            const verifyResponse = await fetch("/api/checkout/razorpay-success", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                shippingAddress: {
                  type: "shipping",
                  firstName: shippingAddress?.firstName || billingDetails.name.split(' ')[0] || billingDetails.name,
                  lastName: shippingAddress?.lastName || billingDetails.name.split(' ')[1] || '',
                  email: shippingAddress?.email || billingDetails.email,
                  phone: shippingAddress?.phone || billingDetails.contact,
                  address1: shippingAddress?.address || "Default Address",
                  city: shippingAddress?.city || "Default City", 
                  state: shippingAddress?.state || "Default State",
                  zipCode: shippingAddress?.zipCode || "000000",
                  country: shippingAddress?.country || "India",
                },
                billingAddress: {
                  type: "billing",
                  firstName: shippingAddress?.firstName || billingDetails.name.split(' ')[0] || billingDetails.name,
                  lastName: shippingAddress?.lastName || billingDetails.name.split(' ')[1] || '',
                  email: shippingAddress?.email || billingDetails.email,
                  phone: shippingAddress?.phone || billingDetails.contact,
                  address1: shippingAddress?.address || "Default Address",
                  city: shippingAddress?.city || "Default City",
                  state: shippingAddress?.state || "Default State", 
                  zipCode: shippingAddress?.zipCode || "000000",
                  country: shippingAddress?.country || "India",
                },
                orderItems: preparedOrderItems,
              }),
            });

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              onSuccess({
                ...response,
                verified: true,
                orderData: verifyData,
              });
              toast.success("Payment successful!");
            } else {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.error || "Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            setIsProcessing(false);
            const errorMessage = error instanceof Error ? error.message : "Payment verification failed";
            onError(errorMessage);
            toast.error(errorMessage);
          }
        },
        prefill: {
          name: billingDetails.name,
          email: billingDetails.email,
          contact: billingDetails.contact,
        },
        notes: {
          address: "Kiti Store Corporate Office",
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            if (onCancel) {
              onCancel();
            } else {
              toast.info("Payment cancelled");
            }
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment error:", error);
      setIsProcessing(false);
      const errorMessage = error instanceof Error ? error.message : "Payment failed. Please try again.";
      onError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Complete Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Billing Details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900">Billing Details</h3>
          
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={billingDetails.name}
              onChange={(e) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={billingDetails.email}
              onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact">Phone Number</Label>
            <Input
              id="contact"
              type="tel"
              value={billingDetails.contact}
              onChange={(e) => setBillingDetails(prev => ({ ...prev, contact: e.target.value }))}
              placeholder="Enter your phone number"
              required
            />
          </div>
        </div>

        <Separator />

        {/* Payment Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Subtotal:</span>
            <span>₹{amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total:</span>
            <span>₹{amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing || loading || !billingDetails.name || !billingDetails.email || !billingDetails.contact}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Pay ₹{amount.toFixed(2)}
            </div>
          )}
        </Button>

        {/* Security Notice */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Shield className="w-4 h-4" />
          <span>Secure payment powered by Razorpay</span>
        </div>
      </CardContent>
    </Card>
  );
}

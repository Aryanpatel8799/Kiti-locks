import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Shield, Check, AlertCircle, CreditCard } from "lucide-react";

export default function DemoPayment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("4111 1111 1111 1111");
  const [expiryDate, setExpiryDate] = useState("12/25");
  const [cvv, setCvv] = useState("123");
  const [name, setName] = useState("John Doe");

  useEffect(() => {
    if (!sessionId) {
      toast.error("Invalid payment session");
      navigate("/cart");
    }
  }, [sessionId, navigate]);

  const handlePayment = async (success: boolean = true) => {
    if (!sessionId) return;

    setProcessing(true);

    try {
      if (success) {
        // Simulate successful payment
        const response = await fetch("/api/checkout/demo-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            sessionId,
            paymentMethod: "demo_card",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          toast.success("Payment successful!");
          navigate(
            `/checkout/success?session_id=${sessionId}&order_id=${data.orderId}`,
          );
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Payment failed");
        }
      } else {
        // Simulate failed payment
        toast.error("Payment failed. Please try again.");
        setTimeout(() => {
          navigate("/cart");
        }, 2000);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\s/g, "")
      .replace(/(\d{4})/g, "$1 ")
      .trim();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Demo Payment Gateway
          </h1>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            <AlertCircle className="w-4 h-4" />
            This is a demo - no real money will be charged
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Secure Payment
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Demo Payment Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardNumber" className="text-sm font-medium">
                  Card Number
                </Label>
                <Input
                  id="cardNumber"
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(formatCardNumber(e.target.value))
                  }
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry" className="text-sm font-medium">
                    Expiry Date
                  </Label>
                  <Input
                    id="expiry"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cvv" className="text-sm font-medium">
                    CVV
                  </Label>
                  <Input
                    id="cvv"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="name" className="text-sm font-medium">
                  Cardholder Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>
            </div>

            <Separator />

            {/* Test Card Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Demo Test Cards:
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div>• Success: 4242 4242 4242 4242</div>
                <div>• Declined: 4000 0000 0000 0002</div>
                <div>• Any future expiry date and CVV will work</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handlePayment(true)}
                disabled={processing}
                className="flex-1 bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Simulate Successful Payment
                  </>
                )}
              </Button>

              <Button
                onClick={() => handlePayment(false)}
                disabled={processing}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Simulate Failed Payment
              </Button>
            </div>

            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => navigate("/cart")}
                disabled={processing}
              >
                Cancel and Return to Cart
              </Button>
            </div>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-6">
              <Shield className="w-4 h-4" />
              Your demo payment is secured with 256-bit SSL encryption
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

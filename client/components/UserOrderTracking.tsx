import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Truck, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface TrackingInfo {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };
  shipment_id?: string;
  awb_code?: string;
  courier_company_id?: string;
  shiprocket_tracking_url?: string;
  order_created_on_shiprocket?: boolean;
}

const UserOrderTracking: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTrackOrder = async () => {
    if (!orderNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter an order number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/orders/track/${orderNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Order not found or access denied');
      }

      const data = await response.json();
      setTrackingInfo(data.order);
      
      toast({
        title: "Success",
        description: "Order tracking information loaded",
      });
    } catch (error) {
      console.error('Error tracking order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to track order",
        variant: "destructive",
      });
      setTrackingInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Track Your Order
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="Enter your order number"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTrackOrder()}
              className="flex-1"
            />
            <Button onClick={handleTrackOrder} disabled={loading}>
              {loading ? 'Tracking...' : 'Track Order'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {trackingInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order Details</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(trackingInfo.status)}
                <Badge className={getStatusColor(trackingInfo.status)}>
                  {trackingInfo.status.toUpperCase()}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Order Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Order Number:</span> {trackingInfo.orderNumber}
                  </div>
                  <div>
                    <span className="font-medium">Total Amount:</span> ₹{trackingInfo.total}
                  </div>
                  <div>
                    <span className="font-medium">Order Date:</span>{' '}
                    {new Date(trackingInfo.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Payment Status:</span>
                    <Badge className={getPaymentStatusColor(trackingInfo.paymentStatus)}>
                      {trackingInfo.paymentStatus.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <div className="text-sm">
                  <p>{trackingInfo.shippingAddress.firstName} {trackingInfo.shippingAddress.lastName}</p>
                  <p>{trackingInfo.shippingAddress.address}</p>
                  <p>
                    {trackingInfo.shippingAddress.city}, {trackingInfo.shippingAddress.state} {trackingInfo.shippingAddress.zipCode}
                  </p>
                  {trackingInfo.shippingAddress.country && (
                    <p>{trackingInfo.shippingAddress.country}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Shiprocket Tracking Info */}
            {trackingInfo.order_created_on_shiprocket && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm">
                    {trackingInfo.shipment_id && (
                      <div>
                        <span className="font-medium">Shipment ID:</span> {trackingInfo.shipment_id}
                      </div>
                    )}
                    {trackingInfo.awb_code && (
                      <div>
                        <span className="font-medium">AWB Code:</span> {trackingInfo.awb_code}
                      </div>
                    )}
                    {trackingInfo.courier_company_id && (
                      <div>
                        <span className="font-medium">Courier Company ID:</span> {trackingInfo.courier_company_id}
                      </div>
                    )}
                  </div>
                  {trackingInfo.shiprocket_tracking_url && (
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(trackingInfo.shiprocket_tracking_url, '_blank')}
                        className="w-full"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Track on Shiprocket
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Order Status Timeline */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Order Status</h3>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  {getStatusIcon(trackingInfo.status)}
                  <span className="font-medium">Current Status: {trackingInfo.status}</span>
                </div>
                {!trackingInfo.order_created_on_shiprocket && trackingInfo.status === 'pending' && (
                  <div className="text-sm text-gray-600">
                    Shipment will be created by admin once your order is processed
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserOrderTracking;

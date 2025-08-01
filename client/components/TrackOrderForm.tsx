import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import { Truck, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TrackingEvent {
  date: string;
  status: string;
  location: string;
  description: string;
}

interface TrackingResponse {
  awb_code: string;
  current_status: string;
  shipment_status: string;
  tracking_data: {
    track_status: number;
    shipment_track: TrackingEvent[];
  };
  etd?: string;
  delivered_date?: string;
  courier_company_id?: string;
  courier_name?: string;
}

const TrackOrderForm: React.FC = () => {
  const [awbCode, setAwbCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!awbCode.trim()) {
      toast.error('Please enter an AWB code');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/shiprocket/track/${awbCode}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to track order');
      }

      const data = await response.json();
      
      if (data.success) {
        setTrackingData(data.data);
        toast.success('Order tracking retrieved successfully!');
      } else {
        toast.error(data.message || 'Failed to track order');
      }
    } catch (error) {
      console.error('Tracking error:', error);
      toast.error('Failed to track order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('delivered')) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (lowerStatus.includes('transit') || lowerStatus.includes('pickup')) {
      return <Truck className="w-5 h-5 text-blue-500" />;
    } else if (lowerStatus.includes('manifest') || lowerStatus.includes('booked')) {
      return <Package className="w-5 h-5 text-yellow-500" />;
    } else if (lowerStatus.includes('exception') || lowerStatus.includes('delay')) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    } else {
      return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('delivered')) {
      return 'bg-green-100 text-green-800';
    } else if (lowerStatus.includes('transit') || lowerStatus.includes('pickup')) {
      return 'bg-blue-100 text-blue-800';
    } else if (lowerStatus.includes('manifest') || lowerStatus.includes('booked')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (lowerStatus.includes('exception') || lowerStatus.includes('delay')) {
      return 'bg-red-100 text-red-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Track Your Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="awb_code">AWB Code / Tracking Number</Label>
              <Input
                id="awb_code"
                value={awbCode}
                onChange={(e) => setAwbCode(e.target.value)}
                placeholder="Enter your AWB code"
                required
              />
            </div>
            
            <Button type="submit" disabled={loading}>
              {loading ? 'Tracking...' : 'Track Order'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {trackingData && (
        <>
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">AWB Code</Label>
                  <p className="font-mono text-sm">{trackingData.awb_code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Current Status</Label>
                  <Badge className={getStatusColor(trackingData.current_status)}>
                    {trackingData.current_status}
                  </Badge>
                </div>
                {trackingData.courier_name && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Courier</Label>
                    <p className="text-sm">{trackingData.courier_name}</p>
                  </div>
                )}
                {trackingData.etd && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Expected Delivery</Label>
                    <p className="text-sm">{new Date(trackingData.etd).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tracking Timeline */}
          {trackingData.tracking_data?.shipment_track && (
            <Card>
              <CardHeader>
                <CardTitle>Tracking Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trackingData.tracking_data.shipment_track
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((event, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(event.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant="outline" 
                              className={getStatusColor(event.status)}
                            >
                              {event.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(event.date).toLocaleDateString()} {new Date(event.date).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          {event.location && (
                            <p className="text-xs text-gray-500 mt-1">📍 {event.location}</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery Confirmation */}
          {trackingData.delivered_date && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Package Delivered</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Delivered on {new Date(trackingData.delivered_date).toLocaleDateString()} at {new Date(trackingData.delivered_date).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default TrackOrderForm;

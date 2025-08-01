import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { XCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CancelResponse {
  success: boolean;
  message: string;
  data?: {
    order_id: string;
    awb_code: string;
    status: string;
    cancellation_reason?: string;
  };
}

const CancelOrderForm: React.FC = () => {
  const [awbCode, setAwbCode] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelResponse, setCancelResponse] = useState<CancelResponse | null>(null);

  const handleCancel = async () => {
    if (!awbCode.trim()) {
      toast.error('Please enter an AWB code');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/shiprocket/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          awb_code: awbCode,
          reason: reason,
        }),
      });

      const data = await response.json();
      setCancelResponse(data);

      if (data.success) {
        toast.success('Order cancelled successfully!');
        setAwbCode('');
        setReason('');
      } else {
        toast.error(data.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAwbCode('');
    setReason('');
    setCancelResponse(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            Cancel Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Warning Message */}
            <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  Important Notice
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Order cancellation may not be possible once the shipment has been picked up by the courier. 
                  Please check the order status before attempting cancellation.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="awb_code">AWB Code / Tracking Number *</Label>
              <Input
                id="awb_code"
                value={awbCode}
                onChange={(e) => setAwbCode(e.target.value)}
                placeholder="Enter AWB code to cancel"
                required
              />
            </div>

            <div>
              <Label htmlFor="reason">Cancellation Reason *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                rows={3}
                required
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={!awbCode.trim() || !reason.trim() || loading}
                  className="w-full"
                >
                  {loading ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Confirm Order Cancellation
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>Are you sure you want to cancel this order?</p>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <p><strong>AWB Code:</strong> {awbCode}</p>
                      <p><strong>Reason:</strong> {reason}</p>
                    </div>
                    <p className="text-red-600 font-medium">
                      This action cannot be undone. The order will be permanently cancelled.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Order</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Yes, Cancel Order
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Response */}
      {cancelResponse && (
        <Card className={cancelResponse.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${cancelResponse.success ? 'text-green-700' : 'text-red-700'}`}>
              {cancelResponse.success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Cancellation Successful
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5" />
                  Cancellation Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className={`text-sm ${cancelResponse.success ? 'text-green-700' : 'text-red-700'}`}>
                {cancelResponse.message}
              </p>
              
              {cancelResponse.success && cancelResponse.data && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium text-green-700">Order ID:</Label>
                    <p className="text-sm text-green-600">{cancelResponse.data.order_id}</p>
                  </div>
                  <div>
                    <Label className="font-medium text-green-700">AWB Code:</Label>
                    <p className="text-sm text-green-600 font-mono">{cancelResponse.data.awb_code}</p>
                  </div>
                  <div>
                    <Label className="font-medium text-green-700">Status:</Label>
                    <Badge variant="destructive">{cancelResponse.data.status}</Badge>
                  </div>
                  {cancelResponse.data.cancellation_reason && (
                    <div>
                      <Label className="font-medium text-green-700">Reason:</Label>
                      <p className="text-sm text-green-600">{cancelResponse.data.cancellation_reason}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={resetForm}>
                  Cancel Another Order
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cancellation Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Orders can typically be cancelled before pickup by the courier partner</p>
            <p>• Once shipped, cancellation may not be possible - returns process may apply instead</p>
            <p>• Refund processing (if applicable) may take 5-7 business days</p>
            <p>• For prepaid orders, refunds will be processed to the original payment method</p>
            <p>• COD orders don't require refund processing</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CancelOrderForm;

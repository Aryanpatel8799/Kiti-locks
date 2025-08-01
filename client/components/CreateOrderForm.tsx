import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Trash2, Package, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface OrderItem {
  name: string;
  sku: string;
  quantity: number;
  price: number;
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
}

interface AddressData {
  full: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface CreateOrderFormData {
  order_id: string;
  customer: CustomerData;
  address: AddressData;
  items: OrderItem[];
  payment_method: 'COD' | 'Prepaid';
  weight?: number;
  dimensions?: {
    length: number;
    breadth: number;
    height: number;
  };
  shipping_charges?: number;
  total_discount?: number;
  comment?: string;
}

const CreateOrderForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateOrderFormData>({
    order_id: `ORD-${Date.now()}`,
    customer: {
      name: '',
      email: '',
      phone: ''
    },
    address: {
      full: '',
      city: '',
      state: '',
      country: 'India',
      pincode: ''
    },
    items: [{
      name: '',
      sku: '',
      quantity: 1,
      price: 0,
      weight: 0.1
    }],
    payment_method: 'Prepaid',
    weight: 0.5,
    dimensions: {
      length: 10,
      breadth: 10,
      height: 10
    },
    shipping_charges: 0,
    total_discount: 0,
    comment: ''
  });

  const [orderResponse, setOrderResponse] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [success, setSuccess] = useState<string>('');

  const handleInputChange = (section: keyof CreateOrderFormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section] as any,
        [field]: value
      }
    }));
  };

  const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        name: '',
        sku: '',
        quantity: 1,
        price: 0,
        weight: 0.1
      }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const calculateTotalValue = () => {
    return formData.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const validateForm = (): boolean => {
    if (!formData.order_id.trim()) {
      toast.error('Order ID is required');
      return false;
    }

    if (!formData.customer.name.trim() || !formData.customer.email.trim() || !formData.customer.phone.trim()) {
      toast.error('All customer fields are required');
      return false;
    }

    if (!formData.address.full.trim() || !formData.address.city.trim() || !formData.address.state.trim() || !formData.address.pincode.trim()) {
      toast.error('All address fields are required');
      return false;
    }

    if (formData.items.some(item => !item.name.trim() || !item.sku.trim() || item.quantity <= 0 || item.price <= 0)) {
      toast.error('All item fields are required with valid values');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRecommendations([]);
    setSuccess('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/shiprocket/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setOrderResponse(result.data);
        setSuccess('Order created successfully! AWB: ' + result.data.awb_code);
        
        // Reset form
        setFormData({
          ...formData,
          order_id: `ORD-${Date.now()}`,
          customer: { name: '', email: '', phone: '' },
          address: { full: '', city: '', state: '', country: 'India', pincode: '' },
          items: [{ name: '', sku: '', quantity: 1, price: 0, weight: 0.1 }],
          comment: ''
        });
      } else {
        // Handle specific Shiprocket permission errors
        if (result.error && result.error.includes('Permission Error')) {
          setError(`Shiprocket API Permission Error: ${result.details || result.error}`);
          setRecommendations(result.recommendations || [
            'Contact Shiprocket support to enable API permissions',
            'Verify your Shiprocket account is fully activated',
            'Check if your account has the required API access level'
          ]);
        } else {
          setError(result.error || 'Failed to create order');
        }
      }
    } catch (error) {
      console.error('Order creation error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Create Shiprocket Order
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="order_id">Order ID *</Label>
                <Input
                  id="order_id"
                  value={formData.order_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, order_id: e.target.value }))}
                  placeholder="ORD-123456"
                  required
                />
              </div>
              <div>
                <Label htmlFor="payment_method">Payment Method *</Label>
                <Select 
                  value={formData.payment_method}
                  onValueChange={(value: 'COD' | 'Prepaid') => 
                    setFormData(prev => ({ ...prev, payment_method: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prepaid">Prepaid</SelectItem>
                    <SelectItem value="COD">Cash on Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="customer_name">Name *</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer.name}
                      onChange={(e) => handleInputChange('customer', 'name', e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_email">Email *</Label>
                    <Input
                      id="customer_email"
                      type="email"
                      value={formData.customer.email}
                      onChange={(e) => handleInputChange('customer', 'email', e.target.value)}
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customer_phone">Phone *</Label>
                    <Input
                      id="customer_phone"
                      value={formData.customer.phone}
                      onChange={(e) => handleInputChange('customer', 'phone', e.target.value)}
                      placeholder="9876543210"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address_full">Full Address *</Label>
                  <Textarea
                    id="address_full"
                    value={formData.address.full}
                    onChange={(e) => handleInputChange('address', 'full', e.target.value)}
                    placeholder="House/Flat no, Street, Area"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="address_city">City *</Label>
                    <Input
                      id="address_city"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                      placeholder="Mumbai"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_state">State *</Label>
                    <Input
                      id="address_state"
                      value={formData.address.state}
                      onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                      placeholder="Maharashtra"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_pincode">Pincode *</Label>
                    <Input
                      id="address_pincode"
                      value={formData.address.pincode}
                      onChange={(e) => handleInputChange('address', 'pincode', e.target.value)}
                      placeholder="400001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_country">Country *</Label>
                    <Input
                      id="address_country"
                      value={formData.address.country}
                      onChange={(e) => handleInputChange('address', 'country', e.target.value)}
                      placeholder="India"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Order Items</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {formData.items.length > 1 && (
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Product Name *</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          placeholder="Product name"
                          required
                        />
                      </div>
                      <div>
                        <Label>SKU *</Label>
                        <Input
                          value={item.sku}
                          onChange={(e) => handleItemChange(index, 'sku', e.target.value)}
                          placeholder="PROD-001"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          required
                        />
                      </div>
                      <div>
                        <Label>Price (₹) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                      <div>
                        <Label>Weight (kg)</Label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={item.weight || 0.1}
                          onChange={(e) => handleItemChange(index, 'weight', parseFloat(e.target.value) || 0.1)}
                        />
                      </div>
                      <div className="flex items-end">
                        <Badge variant="secondary">
                          Total: ₹{(item.price * item.quantity).toFixed(2)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="text-right">
                  <Badge variant="default" className="text-lg p-2">
                    Order Total: ₹{calculateTotalValue().toFixed(2)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Package Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Package Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={formData.weight || 0.5}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0.5 }))}
                    />
                  </div>
                  <div>
                    <Label>Length (cm)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.dimensions?.length || 10}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        dimensions: { 
                          ...prev.dimensions!, 
                          length: parseInt(e.target.value) || 10 
                        } 
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Breadth (cm)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.dimensions?.breadth || 10}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        dimensions: { 
                          ...prev.dimensions!, 
                          breadth: parseInt(e.target.value) || 10 
                        } 
                      }))}
                    />
                  </div>
                  <div>
                    <Label>Height (cm)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.dimensions?.height || 10}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        dimensions: { 
                          ...prev.dimensions!, 
                          height: parseInt(e.target.value) || 10 
                        } 
                      }))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Shipping Charges (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.shipping_charges || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, shipping_charges: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label>Total Discount (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.total_discount || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, total_discount: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Comments</Label>
                  <Textarea
                    value={formData.comment || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder="Special instructions or comments"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="min-w-32">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Order'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Order Response */}
      {orderResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Order Created Successfully!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-medium">Order ID:</Label>
                <p className="text-sm">{orderResponse.order_id}</p>
              </div>
              <div>
                <Label className="font-medium">Shipment ID:</Label>
                <p className="text-sm">{orderResponse.shipment_id}</p>
              </div>
              <div>
                <Label className="font-medium">AWB Code:</Label>
                <p className="text-sm font-mono">{orderResponse.awb_code}</p>
              </div>
              <div>
                <Label className="font-medium">Status:</Label>
                <Badge>{orderResponse.status}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            {recommendations && recommendations.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold text-sm">Recommendations:</p>
                <ul className="list-disc list-inside text-sm mt-1">
                  {recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            {success}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default CreateOrderForm;

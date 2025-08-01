import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, XCircle, BarChart3 } from 'lucide-react';
import CreateOrderForm from '@/components/CreateOrderForm';
import TrackOrderForm from '@/components/TrackOrderForm';
import CancelOrderForm from '@/components/CancelOrderForm';

const ShiprocketManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Shiprocket Logistics Management
        </h1>
        <p className="text-gray-600">
          Manage your shipping orders, track packages, and handle cancellations all in one place.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Create Order
          </TabsTrigger>
          <TabsTrigger value="track" className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Track Order
          </TabsTrigger>
          <TabsTrigger value="cancel" className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Cancel Order
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <CreateOrderForm />
        </TabsContent>

        <TabsContent value="track" className="space-y-6">
          <TrackOrderForm />
        </TabsContent>

        <TabsContent value="cancel" className="space-y-6">
          <CancelOrderForm />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Shipping Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  We're working on comprehensive shipping analytics including delivery performance, 
                  cost analysis, and customer satisfaction metrics.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Orders Today</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
              <Truck className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShiprocketManagement;

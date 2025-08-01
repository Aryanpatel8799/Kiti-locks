import React from 'react';
import UserOrderTracking from '../components/UserOrderTracking';

const TrackOrder: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
        <p className="text-gray-600">
          Enter your order number to track your shipment and view order details.
        </p>
      </div>
      <UserOrderTracking />
    </div>
  );
};

export default TrackOrder;

# 🚚 Shiprocket Order Creation - Updated

## ✅ Enhanced Order Creation

The Shiprocket order creation function has been updated to include additional fields for better integration with your business requirements.

## 🔧 New Fields Added

### Required Fields (from your example):
- `pickup_location`: "Primary"
- `reseller_name`: "KHUNTIA ENTERPRISES PRIVATE LIMITED"
- `company_name`: "Kiti locks"
- `billing_isd_code`: "91"
- `order_type`: "ESSENTIALS"

### Optional Fields:
- `comment`: Custom order comment
- `billing_address_2`: Additional billing address line
- `shipping_address_2`: Additional shipping address line

## 📝 Usage Examples

### 1. Basic Order Creation (with defaults)
```typescript
import { createShiprocketOrderWithDefaults } from '../utils/shiprocketAuth';

const orderData = {
  order_id: "ORD123456",
  customer_name: "John Doe",
  customer_email: "john@example.com",
  customer_phone: "9876543210",
  shipping_address: {
    address: "F-43B First Floor",
    city: "Delhi",
    state: "Delhi",
    pincode: "110062",
    country: "India"
  },
  items: [
    {
      name: "Door Lock",
      sku: "LOCK001",
      units: 2,
      selling_price: 1500,
      weight: 0.5
    }
  ],
  payment_method: "Prepaid",
  sub_total: 3000,
  comment: "swsws"
};

const result = await createShiprocketOrderWithDefaults(orderData);
```

### 2. Advanced Order Creation (with custom fields)
```typescript
import { createShiprocketOrder } from '../utils/shiprocketAuth';

const orderData = {
  order_id: "ORD123456",
  customer_name: "John Doe",
  customer_email: "john@example.com",
  customer_phone: "9876543210",
  shipping_address: {
    address: "F-43B First Floor",
    city: "Delhi",
    state: "Delhi",
    pincode: "110062",
    country: "India"
  },
  items: [
    {
      name: "Door Lock",
      sku: "LOCK001",
      units: 2,
      selling_price: 1500,
      weight: 0.5
    }
  ],
  payment_method: "Prepaid",
  sub_total: 3000,
  // Custom fields
  pickup_location: "Primary",
  comment: "swsws",
  reseller_name: "KHUNTIA ENTERPRISES PRIVATE LIMITED",
  company_name: "Kiti locks",
  billing_isd_code: "91",
  order_type: "ESSENTIALS",
  billing_address_2: "F-43B First Floor",
  shipping_address_2: "F-43B First Floor"
};

const result = await createShiprocketOrder(orderData);
```

## 🏢 Default Company Settings

The system now includes default company settings:

```typescript
const defaultSettings = {
  pickup_location: "Primary",
  reseller_name: "KHUNTIA ENTERPRISES PRIVATE LIMITED",
  company_name: "Kiti locks",
  billing_isd_code: "91",
  order_type: "ESSENTIALS"
};
```

## 📊 Order Payload Structure

The complete order payload sent to Shiprocket API:

```json
{
  "order_id": "ORD123456",
  "order_date": "2024-01-15",
  "pickup_location": "Primary",
  "channel_id": "",
  "comment": "swsws",
  "reseller_name": "KHUNTIA ENTERPRISES PRIVATE LIMITED",
  "company_name": "Kiti locks",
  "billing_customer_name": "John Doe",
  "billing_last_name": "",
  "billing_address": "F-43B First Floor",
  "billing_address_2": "F-43B First Floor",
  "billing_isd_code": "91",
  "billing_city": "Delhi",
  "billing_pincode": "110062",
  "billing_state": "Delhi",
  "billing_country": "India",
  "billing_email": "john@example.com",
  "billing_phone": "9876543210",
  "shipping_is_billing": true,
  "shipping_customer_name": "John Doe",
  "shipping_last_name": "",
  "shipping_address": "F-43B First Floor",
  "shipping_address_2": "F-43B First Floor",
  "shipping_city": "Delhi",
  "shipping_pincode": "110062",
  "shipping_country": "India",
  "shipping_state": "Delhi",
  "shipping_email": "john@example.com",
  "shipping_phone": "9876543210",
  "order_items": [
    {
      "name": "Door Lock",
      "sku": "LOCK001",
      "units": 2,
      "selling_price": 1500,
      "discount": "",
      "tax": "",
      "hsn": 441122,
      "weight": 0.5,
      "dimensions": "10,10,10"
    }
  ],
  "payment_method": "Prepaid",
  "shipping_charges": 0,
  "giftwrap_charges": 0,
  "transaction_charges": 0,
  "total_discount": 0,
  "sub_total": 3000,
  "length": 10,
  "breadth": 10,
  "height": 10,
  "weight": 0.5,
  "order_type": "ESSENTIALS"
}
```

## 🚀 Integration in Routes

### In your order creation route:
```typescript
// server/routes/orders.ts or checkout.ts
import { createShiprocketOrderWithDefaults } from '../utils/shiprocketAuth';

// After successful payment
if (paymentStatus === 'paid') {
  try {
    const shiprocketOrder = await createShiprocketOrderWithDefaults({
      order_id: order._id.toString(),
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      customer_phone: order.customerPhone,
      shipping_address: order.shippingAddress,
      items: order.items.map(item => ({
        name: item.name,
        sku: item.sku,
        units: item.quantity,
        selling_price: item.price,
        weight: item.weight
      })),
      payment_method: order.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
      sub_total: order.totalAmount,
      comment: `Order ${order._id} - ${order.customerName}`
    });

    // Update order with Shiprocket data
    order.shipment_id = shiprocketOrder.shipment_id;
    order.shiprocket_tracking_url = shiprocketOrder.tracking_url;
    order.order_created_on_shiprocket = true;
    await order.save();

    console.log('✅ Shiprocket order created:', shiprocketOrder);
  } catch (error) {
    console.error('❌ Shiprocket order creation failed:', error);
    // Order is still saved locally even if Shiprocket fails
  }
}
```

## ✅ Benefits

1. **Consistent Company Details**: All orders include your company information
2. **Flexible Configuration**: Can override defaults when needed
3. **Better Error Handling**: Enhanced error messages and retry logic
4. **Type Safety**: Full TypeScript support with proper interfaces
5. **Easy Integration**: Simple function calls with sensible defaults

## 📞 Support

If you encounter any issues with the Shiprocket integration:
- Check the logs for detailed error messages
- Verify your Shiprocket credentials
- Contact Shiprocket support if needed 
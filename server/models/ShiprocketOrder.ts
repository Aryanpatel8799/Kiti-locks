import mongoose, { Document, Schema } from "mongoose";

export interface IShiprocketCustomer {
  name: string;
  email: string;
  phone: string;
}

export interface IShiprocketAddress {
  full: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface IShiprocketItem {
  name: string;
  sku: string;
  quantity: number;
  price: number;
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
}

export interface IShiprocketOrder extends Document {
  order_id: string;
  shipment_id?: string;
  awb_code?: string;
  status: string;
  customer: IShiprocketCustomer;
  address: IShiprocketAddress;
  items: IShiprocketItem[];
  // Shipping details
  weight?: number;
  dimensions?: {
    length: number;
    breadth: number;
    height: number;
  };
  payment_method: string;
  shipping_charges?: number;
  total_discount?: number;
  cod_amount?: number;
  // Shiprocket specific fields
  courier_company_id?: string;
  courier_name?: string;
  tracking_url?: string;
  expected_delivery_date?: Date;
  // Status tracking
  pickup_scheduled_date?: Date;
  shipped_date?: Date;
  delivered_date?: Date;
  cancelled_date?: Date;
  returned_date?: Date;
  // Additional info
  comment?: string;
  channel_id?: string;
  reseller_name?: string;
  company_name?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const shiprocketCustomerSchema = new Schema<IShiprocketCustomer>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true }
});

const shiprocketAddressSchema = new Schema<IShiprocketAddress>({
  full: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, default: 'India' },
  pincode: { type: String, required: true, trim: true }
});

const shiprocketItemSchema = new Schema<IShiprocketItem>({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  weight: { type: Number, min: 0 }, // in kg
  length: { type: Number, min: 0 }, // in cm
  breadth: { type: Number, min: 0 }, // in cm
  height: { type: Number, min: 0 } // in cm
});

const shiprocketOrderSchema = new Schema<IShiprocketOrder>(
  {
    order_id: {
    type: String,
    required: true,
  },
  shipment_id: {
    type: String,
    required: true,
  },
  awb_code: {
    type: String,
    required: true,
  },
    status: { 
      type: String, 
      required: true,
      enum: [
        'NEW',
        'PICKUP_SCHEDULED',
        'PICKED_UP',
        'IN_TRANSIT',
        'OUT_FOR_DELIVERY',
        'DELIVERED',
        'CANCELLED',
        'RTO_INITIATED',
        'RTO_DELIVERED',
        'LOST',
        'DAMAGED',
        'PENDING'
      ],
      default: 'NEW'
    },
    customer: {
      type: shiprocketCustomerSchema,
      required: true
    },
    address: {
      type: shiprocketAddressSchema,
      required: true
    },
    items: {
      type: [shiprocketItemSchema],
      required: true,
      validate: {
        validator: function(items: IShiprocketItem[]) {
          return items && items.length > 0;
        },
        message: 'At least one item is required'
      }
    },
    // Shipping details
    weight: { 
      type: Number, 
      min: 0,
      default: 0.5 // Default 500g
    },
    dimensions: {
      length: { type: Number, min: 0, default: 10 },
      breadth: { type: Number, min: 0, default: 10 },
      height: { type: Number, min: 0, default: 10 }
    },
    payment_method: {
      type: String,
      required: true,
      enum: ['COD', 'Prepaid'],
      default: 'Prepaid'
    },
    shipping_charges: { type: Number, min: 0, default: 0 },
    total_discount: { type: Number, min: 0, default: 0 },
    cod_amount: { type: Number, min: 0, default: 0 },
    // Shiprocket specific fields
    courier_company_id: { type: String, trim: true },
    courier_name: { type: String, trim: true },
    tracking_url: { type: String, trim: true },
    expected_delivery_date: { type: Date },
    // Status tracking dates
    pickup_scheduled_date: { type: Date },
    shipped_date: { type: Date },
    delivered_date: { type: Date },
    cancelled_date: { type: Date },
    returned_date: { type: Date },
    // Additional info
    comment: { type: String, trim: true },
    channel_id: { type: String, trim: true },
    reseller_name: { type: String, trim: true },
    company_name: { type: String, trim: true }
  },
  {
    timestamps: true,
    collection: 'shiprocket_orders'
  }
);

// Indexes for better query performance
shiprocketOrderSchema.index({ order_id: 1 });
shiprocketOrderSchema.index({ shipment_id: 1 });
shiprocketOrderSchema.index({ awb_code: 1 });
shiprocketOrderSchema.index({ status: 1 });
shiprocketOrderSchema.index({ 'customer.email': 1 });
shiprocketOrderSchema.index({ createdAt: -1 });

// Virtual for total order value
shiprocketOrderSchema.virtual('total_value').get(function() {
  return this.items.reduce((total: number, item: IShiprocketItem) => {
    return total + (item.price * item.quantity);
  }, 0);
});

// Virtual for total weight
shiprocketOrderSchema.virtual('total_weight').get(function() {
  const itemsWeight = this.items.reduce((total: number, item: IShiprocketItem) => {
    return total + ((item.weight || 0.1) * item.quantity);
  }, 0);
  return Math.max(itemsWeight, this.weight || 0.5);
});

// Pre-save middleware to calculate totals
shiprocketOrderSchema.pre('save', function(next) {
  // Calculate total value
  const totalValue = this.items.reduce((total: number, item: IShiprocketItem) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // Set COD amount based on payment method
  if (this.payment_method === 'COD') {
    this.cod_amount = totalValue;
  } else {
    this.cod_amount = 0;
  }
  
  // Calculate total weight if not provided
  if (!this.weight) {
    const itemsWeight = this.items.reduce((total: number, item: IShiprocketItem) => {
      return total + ((item.weight || 0.1) * item.quantity);
    }, 0);
    this.weight = Math.max(itemsWeight, 0.5);
  }
  
  next();
});

// Method to update status with timestamp
shiprocketOrderSchema.methods.updateStatus = function(newStatus: string) {
  this.status = newStatus;
  
  const now = new Date();
  switch (newStatus) {
    case 'PICKUP_SCHEDULED':
      this.pickup_scheduled_date = now;
      break;
    case 'PICKED_UP':
    case 'IN_TRANSIT':
      this.shipped_date = now;
      break;
    case 'DELIVERED':
      this.delivered_date = now;
      break;
    case 'CANCELLED':
      this.cancelled_date = now;
      break;
    case 'RTO_DELIVERED':
      this.returned_date = now;
      break;
  }
  
  return this.save();
};

// Static method to find by AWB
shiprocketOrderSchema.statics.findByAwb = function(awb: string) {
  return this.findOne({ awb_code: awb });
};

// Static method to find by shipment ID
shiprocketOrderSchema.statics.findByShipmentId = function(shipmentId: string) {
  return this.findOne({ shipment_id: shipmentId });
};

// Fix for Mongoose/TypeScript linter errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ShiprocketOrderModel: any = mongoose.models.ShiprocketOrder || 
  mongoose.model<IShiprocketOrder>("ShiprocketOrder", shiprocketOrderSchema);

export default ShiprocketOrderModel;

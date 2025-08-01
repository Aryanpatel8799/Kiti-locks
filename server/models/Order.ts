import mongoose, { Document, Schema } from "mongoose";
import { IAddress } from "./User";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  variant?: {
    name: string;
    value: string;
  };
  image: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered";
  paymentStatus: "pending" | "paid" | "failed";
  paymentMethod: string;
  paymentIntentId: string;
  // Razorpay specific fields
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  // Legacy Stripe fields
  stripeSessionId?: string;
  shippingAddress: IAddress;
  billingAddress: IAddress;
  notes?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  // Shiprocket integration fields
  shipment_id?: string;
  awb_code?: string;
  courier_company_id?: string;
  shiprocket_tracking_url?: string;
  order_created_on_shiprocket?: boolean;
  // Removed cancellation and refund fields per user request
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  variant: {
    name: { type: String },
    value: { type: String },
  },
  image: { type: String, required: true },
});

const addressSchema = new Schema<IAddress>({
  type: { type: String, enum: ["billing", "shipping"], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  address1: { type: String, required: true },
  address2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: "US" },
  isDefault: { type: Boolean, default: false },
});

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    shipping: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentMethod: { type: String, required: true },
    paymentIntentId: { type: String, required: true },
    // Razorpay specific fields
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    // Legacy Stripe fields
    stripeSessionId: { type: String },
    shippingAddress: { type: addressSchema, required: true },
    billingAddress: { type: addressSchema, required: true },
    notes: { type: String, trim: true },
    trackingNumber: { type: String, trim: true },
    trackingUrl: { type: String, trim: true },
    estimatedDelivery: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
    // Shiprocket integration fields
    shipment_id: { type: String, trim: true },
    awb_code: { type: String, trim: true },
    courier_company_id: { type: String, trim: true },
    shiprocket_tracking_url: { type: String, trim: true },
    order_created_on_shiprocket: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });

// Fix for Mongoose/TypeScript linter errors in routes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OrderModel: any = mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);
export default OrderModel;

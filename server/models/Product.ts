import mongoose, { Document, Schema } from "mongoose";

export interface IProductVariant {
  name: string;
  value: string;
  price?: number;
  stock?: number;
  sku?: string;
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  category: mongoose.Types.ObjectId;
  tags: string[];
  variants: IProductVariant[];
  images: string[];
  stock: number;
  status: "active" | "draft" | "archived";
  featured: boolean;
  averageRating: number;
  reviewCount: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  seo: {
    title?: string;
    description?: string;
  };
  // New Kiti Locks specific fields
  operationType?: "Soft Close" | "Non-Soft Close";
  productCode?: string;
  usageArea?: "Kitchen" | "Wardrobe" | "Drawer" | "Overhead";
  finish?: "Chrome" | "SS" | "Matte" | "Premium" | "Aluminium" | "PVC";
  trackType?: "2 Track" | "3 Track" | "Premium";
  size?: string;
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IProductVariant>({
  name: { type: String, required: true },
  value: { type: String, required: true },
  price: { type: Number },
  stock: { type: Number },
  sku: { type: String },
});

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    tags: [{ type: String, trim: true }],
    variants: [variantSchema],
    images: [{ type: String }],
    stock: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
    },
    featured: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    ratingDistribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
    weight: { type: Number, min: 0 },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true },
    },
    // New Kiti Locks specific fields
    operationType: {
      type: String,
      enum: ["Soft Close", "Non-Soft Close"],
    },
    productCode: { type: String, trim: true },
    usageArea: {
      type: String,
      enum: ["Kitchen", "Wardrobe", "Drawer", "Overhead"],
    },
    finish: {
      type: String,
      enum: ["Chrome", "SS", "Matte", "Premium", "Aluminium", "PVC"],
    },
    trackType: {
      type: String,
      enum: ["2 Track", "3 Track", "Premium"],
    },
    size: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ status: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ operationType: 1 });
productSchema.index({ usageArea: 1 });
productSchema.index({ finish: 1 });
productSchema.index({ trackType: 1 });
productSchema.index({ productCode: 1 });
productSchema.index({ name: "text", description: "text", tags: "text" });

export default mongoose.models.Product ||
  mongoose.model<IProduct>("Product", productSchema);

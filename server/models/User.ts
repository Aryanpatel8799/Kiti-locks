import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  variant?: {
    name: string;
    value: string;
  };
  addedAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "user" | "admin";
  wishlist: mongoose.Types.ObjectId[];
  cart: ICartItem[];
  addresses: IAddress[];
  phone?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  googleId?: string;
  isVerified?: boolean;
  isActive?: boolean;
  preferences?: {
    newsletter: boolean;
    notifications: boolean;
    marketing: boolean;
  };
  // 2FA fields
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  backupCodes?: string[];
  lastLoginAt?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isAccountLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

export interface IAddress {
  _id?: mongoose.Types.ObjectId;
  type: "billing" | "shipping";
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

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

const cartItemSchema = new Schema<ICartItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: {
    name: { type: String },
    value: { type: String },
  },
  addedAt: { type: Date, default: Date.now },
});

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 8, // Increased minimum length
      validate: {
        validator: function (v: string) {
          // Strong password validation
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
            v,
          );
        },
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character",
      },
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    cart: [cartItemSchema],
    addresses: [addressSchema],
    phone: { type: String, trim: true },
    avatar: { type: String },
    bio: { type: String, trim: true, maxlength: 500 },
    location: { type: String, trim: true },
    googleId: { type: String, unique: true, sparse: true },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    preferences: {
      newsletter: { type: Boolean, default: true },
      notifications: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
    },
    // 2FA and security fields
    twoFactorSecret: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },
    backupCodes: [{ type: String }],
    lastLoginAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    passwordChangedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Account locking methods
userSchema.methods.isAccountLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  // If this is the first attempt and account is locked, start over
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates: any = { $inc: { loginAttempts: 1 } };

  // Lock account after max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isAccountLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLoginAt: new Date() },
  });
};

userSchema.index({ email: 1 });

// Fix for Mongoose/TypeScript linter errors in routes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const UserModel: any = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default UserModel;

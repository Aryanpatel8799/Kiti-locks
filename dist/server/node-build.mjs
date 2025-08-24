import path from "path";
import * as express from "express";
import express__default, { Router } from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import { Strategy as Strategy$1, ExtractJwt } from "passport-jwt";
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { z } from "zod";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import multer from "multer";
import { v2 } from "cloudinary";
import nodemailer from "nodemailer";
import Razorpay from "razorpay";
import axios from "axios";
import fs from "fs";
const addressSchema$2 = new Schema({
  type: { type: String, enum: ["billing", "shipping"], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  address1: { type: String, required: true },
  address2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: "US" },
  isDefault: { type: Boolean, default: false }
});
const cartItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: {
    name: { type: String },
    value: { type: String }
  },
  addedAt: { type: Date, default: Date.now }
});
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      minlength: 8,
      // Increased minimum length
      validate: {
        validator: function(v) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(
            v
          );
        },
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
      }
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    cart: [cartItemSchema],
    addresses: [addressSchema$2],
    phone: { type: String, trim: true },
    avatar: { type: String },
    bio: { type: String, trim: true, maxlength: 500 },
    location: { type: String, trim: true },
    googleId: { type: String, unique: true, sparse: true },
    isVerified: { type: Boolean, default: false },
    preferences: {
      newsletter: { type: Boolean, default: true },
      notifications: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    // 2FA and security fields
    twoFactorSecret: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },
    backupCodes: [{ type: String }],
    lastLoginAt: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    passwordChangedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);
userSchema.pre("save", async function(next) {
  if (!this.isModified("password") || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};
userSchema.methods.isAccountLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};
userSchema.methods.incrementLoginAttempts = async function() {
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1e3;
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= maxAttempts && !this.isAccountLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  return this.updateOne(updates);
};
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLoginAt: /* @__PURE__ */ new Date() }
  });
};
userSchema.index({ email: 1 });
const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
const User = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: UserModel
}, Symbol.toStringTag, { value: "Module" }));
const JWT_SECRET$1 = process.env.JWT_SECRET || "your-secret-key";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
process.env.CLIENT_URL || "http://localhost:8080";
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new Strategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await UserModel.findOne({ email: profile.emails?.[0]?.value });
          if (user) {
            return done(null, user);
          }
          user = new UserModel({
            name: profile.displayName,
            email: profile.emails?.[0]?.value,
            password: "google-oauth-user",
            // Placeholder password for Google users
            avatar: profile.photos?.[0]?.value,
            role: "user"
          });
          await user.save();
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}
passport.use(
  new Strategy$1(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET$1
    },
    async (payload, done) => {
      try {
        const user = await UserModel.findById(payload.userId).select("-password");
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);
passport.serializeUser((user, done) => {
  done(null, user._id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id).select("-password");
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
dotenv.config();
let isConnected = false;
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce";
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5e3,
      // Timeout after 5s instead of 30s
      connectTimeoutMS: 1e4
    });
    isConnected = true;
    console.log("✅ MongoDB connected successfully");
    return true;
  } catch (error) {
    console.warn("⚠️  MongoDB connection failed:", error.message);
    console.log(
      "⚠️  Database connection required. For full functionality, please:"
    );
    console.log("   1. Install MongoDB locally, or");
    console.log("   2. Set MONGO_URI to a MongoDB Atlas connection string");
    console.log("   3. Restart the application after fixing");
    isConnected = false;
    return false;
  }
};
const getConnectionStatus = () => isConnected;
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret";
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" });
};
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
};
const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};
const generateTokens = (payload) => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  return {
    accessToken,
    refreshToken
  };
};
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }
    const decoded = verifyAccessToken(token);
    const user = await UserModel.findById(decoded.userId).select("-password");
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    req.user = {
      userId: decoded.userId,
      id: decoded.userId,
      // Backward compatibility
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
};
const requireAdmin = (req, res, next) => {
  const authReq = req;
  if (!authReq.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (authReq.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
};
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await UserModel.findById(decoded.userId).select("-password");
      if (user) {
        req.user = {
          userId: decoded.userId,
          id: decoded.userId,
          // Backward compatibility
          email: decoded.email,
          role: decoded.role
        };
      }
    }
    next();
  } catch (error) {
    next();
  }
};
class TwoFactorService {
  // Generate a new secret for 2FA
  static generateSecret(userEmail) {
    const secret = speakeasy.generateSecret({
      name: `Kiti Locks (${userEmail})`,
      issuer: "Kiti Locks Admin",
      length: 32
    });
    const backupCodes = this.generateBackupCodes();
    return {
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url || "",
      backupCodes
    };
  }
  // Generate backup codes for 2FA
  static generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
    }
    return codes;
  }
  // Generate QR code data URL
  static async generateQRCode(otpauthUrl) {
    try {
      return await QRCode.toDataURL(otpauthUrl);
    } catch (error) {
      throw new Error("Failed to generate QR code");
    }
  }
  // Verify a token against a secret
  static verifyToken(token, secret) {
    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2
      // Allow 2 steps of time skew
    });
  }
  // Verify backup code
  static verifyBackupCode(code, backupCodes) {
    const normalizedCode = code.toUpperCase().replace(/\s/g, "");
    const codeIndex = backupCodes.indexOf(normalizedCode);
    if (codeIndex === -1) {
      return { valid: false, remainingCodes: backupCodes };
    }
    const remainingCodes = backupCodes.filter(
      (_, index) => index !== codeIndex
    );
    return { valid: true, remainingCodes };
  }
  // Hash backup codes for secure storage
  static hashBackupCodes(codes) {
    return codes.map((code) => {
      return crypto.createHash("sha256").update(code).digest("hex");
    });
  }
  // Verify hashed backup code
  static verifyHashedBackupCode(code, hashedCodes) {
    const hashedCode = crypto.createHash("sha256").update(code.toUpperCase().replace(/\s/g, "")).digest("hex");
    const codeIndex = hashedCodes.indexOf(hashedCode);
    if (codeIndex === -1) {
      return { valid: false, remainingCodes: hashedCodes };
    }
    const remainingCodes = hashedCodes.filter(
      (_, index) => index !== codeIndex
    );
    return { valid: true, remainingCodes };
  }
  // Rate limiting for 2FA attempts
  static attemptCounts = /* @__PURE__ */ new Map();
  static checkRateLimit(identifier) {
    const maxAttempts = 5;
    const windowMs = 15 * 60 * 1e3;
    const now = Date.now();
    const attempts = this.attemptCounts.get(identifier);
    if (!attempts || now > attempts.resetTime) {
      this.attemptCounts.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
      return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }
    if (attempts.count >= maxAttempts) {
      return { allowed: false, remainingAttempts: 0 };
    }
    attempts.count++;
    return { allowed: true, remainingAttempts: maxAttempts - attempts.count };
  }
  static resetRateLimit(identifier) {
    this.attemptCounts.delete(identifier);
  }
}
const router$f = Router();
z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  googleId: z.string().optional()
});
z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required")
});
const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required")
});
router$f.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    const user = new UserModel({
      name,
      email,
      password
    });
    await user.save();
    const { accessToken, refreshToken } = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors
      });
      return;
    }
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});
router$f.post("/login", async (req, res) => {
  try {
    console.log("Login attempt for email:", req.body.email);
    const { email, password, twoFactorToken } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (user.isAccountLocked()) {
      res.status(423).json({
        error: "Account is temporarily locked due to too many failed attempts"
      });
      return;
    }
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      await user.incrementLoginAttempts();
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    if (user.role === "admin" && user.twoFactorEnabled) {
      if (!twoFactorToken) {
        res.status(200).json({
          requiresTwoFactor: true,
          message: "Two-factor authentication required"
        });
        return;
      }
      const rateLimit = TwoFactorService.checkRateLimit(`2fa_${user._id}`);
      if (!rateLimit.allowed) {
        res.status(429).json({ error: "Too many 2FA attempts. Please try again later." });
        return;
      }
      const isValidToken = TwoFactorService.verifyToken(
        twoFactorToken,
        user.twoFactorSecret
      );
      if (!isValidToken) {
        if (user.backupCodes && user.backupCodes.length > 0) {
          const backupResult = TwoFactorService.verifyHashedBackupCode(
            twoFactorToken,
            user.backupCodes
          );
          if (backupResult.valid) {
            user.backupCodes = backupResult.remainingCodes;
            await user.save();
          } else {
            res.status(401).json({ error: "Invalid two-factor authentication code" });
            return;
          }
        } else {
          res.status(401).json({ error: "Invalid two-factor authentication code" });
          return;
        }
      }
      TwoFactorService.resetRateLimit(`2fa_${user._id}`);
    }
    await user.resetLoginAttempts();
    const { accessToken, refreshToken } = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors
      });
      return;
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});
router$f.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const decoded = verifyRefreshToken(refreshToken);
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
    res.json({
      tokens: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors
      });
      return;
    }
    res.status(401).json({ error: "Invalid refresh token" });
  }
});
router$f.get(
  "/me",
  authenticateToken,
  async (req, res) => {
    try {
      const authReq = req;
      const user = await UserModel.findById(authReq.user?.userId).select("-password").populate("wishlist");
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          wishlist: user.wishlist,
          addresses: user.addresses,
          phone: user.phone,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user data" });
    }
  }
);
router$f.put(
  "/profile",
  authenticateToken,
  async (req, res) => {
    try {
      const authReq = req;
      const updateData = req.body;
      delete updateData.password;
      delete updateData.email;
      delete updateData.role;
      const user = await UserModel.findByIdAndUpdate(authReq.user?.userId, updateData, {
        new: true,
        runValidators: true
      }).select("-password");
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({
        message: "Profile updated successfully",
        user
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);
router$f.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router$f.post("/google", async (req, res) => {
  try {
    console.log("Google OAuth login attempt");
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ error: "Google credential is required" });
      return;
    }
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`
    );
    if (!response.ok) {
      res.status(401).json({ error: "Invalid Google credential" });
      return;
    }
    const googleUser = await response.json();
    let user = await UserModel.findOne({ email: googleUser.email });
    if (!user) {
      user = new UserModel({
        name: googleUser.name,
        email: googleUser.email,
        avatar: googleUser.picture,
        googleId: googleUser.sub,
        isVerified: true
      });
      await user.save();
    }
    const { accessToken, refreshToken } = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
    res.json({
      message: "Google login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(500).json({ error: "Google authentication failed" });
  }
});
router$f.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
        return;
      }
      const { accessToken, refreshToken } = generateTokens({
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      });
      res.redirect(
        `${process.env.CLIENT_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`
      );
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
    }
  }
);
router$f.get(
  "/profile",
  authenticateToken,
  async (req, res) => {
    try {
      const authReq = req;
      const userId = authReq.user.userId;
      if (!getConnectionStatus()) {
        res.json({
          profile: {
            name: authReq.user.email,
            // Use email as fallback for name
            email: authReq.user.email,
            phone: "",
            bio: "",
            preferences: {
              newsletter: true,
              notifications: true,
              marketing: false
            }
          }
        });
        return;
      }
      const user = await UserModel.findById(userId).select("-password -__v");
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({
        profile: {
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          bio: user.bio || "",
          avatar: user.avatar || "",
          preferences: user.preferences || {
            newsletter: true,
            notifications: true,
            marketing: false
          }
        }
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  }
);
router$f.get(
  "/me",
  authenticateToken,
  async (req, res) => {
    try {
      const authReq = req;
      const user = authReq.user;
      const fullUser = await UserModel.findById(user.userId).select("-password");
      res.json({
        user: {
          id: user.userId,
          name: fullUser?.name || user.email,
          email: user.email,
          role: user.role,
          avatar: fullUser?.avatar
        }
      });
    } catch (error) {
      console.error("Error fetching user info:", error);
      res.status(500).json({ error: "Failed to fetch user info" });
    }
  }
);
router$f.put(
  "/profile",
  authenticateToken,
  async (req, res) => {
    try {
      const authReq = req;
      const userId = authReq.user.userId;
      const { name, phone, bio, preferences } = req.body;
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const user = await UserModel.findByIdAndUpdate(
        userId,
        {
          ...name && { name },
          ...phone && { phone },
          ...bio && { bio },
          ...preferences && { preferences }
        },
        { new: true }
      ).select("-password -__v");
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({
        message: "Profile updated successfully",
        profile: {
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          bio: user.bio || "",
          preferences: user.preferences
        }
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);
router$f.post(
  "/2fa/setup",
  authenticateToken,
  async (req, res) => {
    try {
      const authReq = req;
      const user = await UserModel.findById(authReq.user?.userId);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      if (user.twoFactorEnabled) {
        res.status(400).json({ error: "Two-factor authentication is already enabled" });
        return;
      }
      const { secret, qrCodeUrl, backupCodes } = TwoFactorService.generateSecret(user.email);
      const qrCodeDataUrl = await TwoFactorService.generateQRCode(qrCodeUrl);
      user.twoFactorSecret = secret;
      await user.save();
      res.json({
        qrCode: qrCodeDataUrl,
        secret,
        backupCodes
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ error: "Failed to setup two-factor authentication" });
    }
  }
);
router$f.post(
  "/2fa/verify",
  authenticateToken,
  async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        res.status(400).json({ error: "Token is required" });
        return;
      }
      const authReq = req;
      const user = await UserModel.findById(authReq.user?.userId);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      if (!user.twoFactorSecret) {
        res.status(400).json({ error: "Two-factor authentication setup not initiated" });
        return;
      }
      const isValidToken = TwoFactorService.verifyToken(
        token,
        user.twoFactorSecret
      );
      if (!isValidToken) {
        res.status(401).json({ error: "Invalid token" });
        return;
      }
      const backupCodes = TwoFactorService.generateBackupCodes();
      user.twoFactorEnabled = true;
      user.backupCodes = TwoFactorService.hashBackupCodes(backupCodes);
      await user.save();
      res.json({
        message: "Two-factor authentication enabled successfully",
        backupCodes
      });
    } catch (error) {
      console.error("2FA verification error:", error);
      res.status(500).json({ error: "Failed to verify two-factor authentication" });
    }
  }
);
router$f.post(
  "/2fa/disable",
  authenticateToken,
  async (req, res) => {
    try {
      const { password, token } = req.body;
      if (!password || !token) {
        res.status(400).json({ error: "Password and token are required" });
        return;
      }
      const authReq = req;
      const user = await UserModel.findById(authReq.user?.userId);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        res.status(401).json({ error: "Invalid password" });
        return;
      }
      if (!user.twoFactorSecret) {
        res.status(400).json({ error: "Two-factor authentication is not enabled" });
        return;
      }
      const isValidToken = TwoFactorService.verifyToken(
        token,
        user.twoFactorSecret
      );
      if (!isValidToken) {
        res.status(401).json({ error: "Invalid token" });
        return;
      }
      user.twoFactorEnabled = false;
      user.twoFactorSecret = void 0;
      user.backupCodes = void 0;
      await user.save();
      res.json({
        message: "Two-factor authentication disabled successfully"
      });
    } catch (error) {
      console.error("2FA disable error:", error);
      res.status(500).json({ error: "Failed to disable two-factor authentication" });
    }
  }
);
router$f.get("/users/count", authenticateToken, async (req, res) => {
  try {
    const count = await UserModel.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user count" });
  }
});
router$f.put(
  "/change-password",
  authenticateToken,
  async (req, res) => {
    try {
      const authReq = req;
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: "Current password and new password are required" });
        return;
      }
      if (newPassword.length < 6) {
        res.status(400).json({ error: "New password must be at least 6 characters" });
        return;
      }
      const user = await UserModel.findById(authReq.user?.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        res.status(400).json({ error: "Current password is incorrect" });
        return;
      }
      user.password = newPassword;
      await user.save();
      res.json({
        message: "Password updated successfully"
      });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  }
);
const variantSchema = new Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
  price: { type: Number },
  stock: { type: Number },
  sku: { type: String }
});
const productSchema$1 = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    comparePrice: { type: Number, min: 0 },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    tags: [{ type: String, trim: true }],
    variants: [variantSchema],
    images: [{ type: String }],
    stock: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active"
    },
    featured: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    ratingDistribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 }
    },
    weight: { type: Number, min: 0 },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 }
    },
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true }
    },
    // New Kiti Locks specific fields
    operationType: {
      type: String,
      enum: ["Soft Close", "Non-Soft Close"]
    },
    productCode: { type: String, trim: true },
    usageArea: {
      type: String,
      enum: ["Kitchen", "Wardrobe", "Drawer", "Overhead"]
    },
    finish: {
      type: String,
      enum: ["Chrome", "SS", "Matte", "Premium", "Aluminium", "PVC"]
    },
    trackType: {
      type: String,
      enum: ["2 Track", "3 Track", "Premium"]
    },
    size: { type: String, trim: true }
  },
  {
    timestamps: true
  }
);
productSchema$1.index({ slug: 1 });
productSchema$1.index({ category: 1 });
productSchema$1.index({ status: 1 });
productSchema$1.index({ featured: 1 });
productSchema$1.index({ operationType: 1 });
productSchema$1.index({ usageArea: 1 });
productSchema$1.index({ finish: 1 });
productSchema$1.index({ trackType: 1 });
productSchema$1.index({ productCode: 1 });
productSchema$1.index({ name: "text", description: "text", tags: "text" });
const Product = mongoose.models.Product || mongoose.model("Product", productSchema$1);
const categorySchema$1 = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    description: { type: String, trim: true },
    image: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: "Category" },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    seo: {
      title: { type: String, trim: true },
      description: { type: String, trim: true }
    }
  },
  {
    timestamps: true
  }
);
categorySchema$1.index({ slug: 1 });
categorySchema$1.index({ parent: 1 });
categorySchema$1.index({ featured: 1 });
const Category = mongoose.models.Category || mongoose.model("Category", categorySchema$1);
const router$e = Router();
const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Product description is required"),
  price: z.number().min(0, "Price must be positive"),
  comparePrice: z.number().min(0).optional(),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()).default([]),
  variants: z.array(
    z.object({
      name: z.string(),
      value: z.string(),
      price: z.number().optional(),
      stock: z.number().optional(),
      sku: z.string().optional()
    })
  ).default([]),
  images: z.array(z.string()).default([]),
  stock: z.number().min(0, "Stock must be non-negative").default(0),
  status: z.enum(["active", "draft", "archived"]).default("active"),
  featured: z.boolean().default(false),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0)
  }).optional(),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional()
  }).default({}),
  // New Kiti Locks specific fields
  operationType: z.enum(["Soft Close", "Non-Soft Close"]).optional(),
  productCode: z.string().optional(),
  usageArea: z.enum(["Kitchen", "Wardrobe", "Drawer", "Overhead"]).optional(),
  finish: z.enum(["Chrome", "SS", "Matte", "Premium", "Aluminium", "PVC"]).optional(),
  trackType: z.enum(["2 Track", "3 Track", "Premium"]).optional(),
  size: z.string().optional()
});
const createSlug$1 = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim("-");
};
router$e.get(
  "/",
  optionalAuth,
  async (req, res) => {
    try {
      const {
        page = "1",
        limit = "12",
        category,
        search,
        minPrice,
        maxPrice,
        tags,
        status = "active",
        sort = "createdAt",
        order = "desc",
        featured,
        inStock,
        minRating,
        operationType,
        usageArea,
        finish,
        trackType,
        productCode,
        size
      } = req.query;
      if (!getConnectionStatus()) {
        return res.status(503).json({
          error: "Database connection required. Please ensure MongoDB is connected."
        });
      }
      const filter = {};
      if (req.user?.role === "admin") {
        if (status && status !== "all") {
          filter.status = status;
        }
      } else {
        filter.status = "active";
      }
      if (category) {
        if (mongoose.Types.ObjectId.isValid(category)) {
          filter.category = category;
        } else {
          const categoryDoc = await Category.findOne({ slug: category });
          if (categoryDoc) {
            filter.category = categoryDoc._id;
          }
        }
      }
      if (search) {
        filter.$text = { $search: search };
      }
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }
      if (tags) {
        const tagArray = Array.isArray(tags) ? tags : [tags];
        filter.tags = { $in: tagArray };
      }
      if (featured === "true") {
        filter.featured = true;
      }
      if (inStock === "true") {
        filter.stock = { $gt: 0 };
      }
      if (minRating && Number(minRating) > 0) {
        filter.averageRating = { $gte: Number(minRating) };
      }
      if (operationType) {
        filter.operationType = operationType;
      }
      if (usageArea) {
        filter.usageArea = usageArea;
      }
      if (finish) {
        filter.finish = finish;
      }
      if (trackType) {
        filter.trackType = trackType;
      }
      if (productCode) {
        filter.productCode = { $regex: productCode, $options: "i" };
      }
      if (size) {
        filter.size = { $regex: size, $options: "i" };
      }
      const sortOrder = order === "asc" ? 1 : -1;
      const sortObj = { [sort]: sortOrder };
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      const products = await Product.find(filter).populate("category", "name slug").sort(sortObj).skip(skip).limit(limitNum).select("-__v");
      const total = await Product.countDocuments(filter);
      const totalPages = Math.ceil(total / limitNum);
      res.json({
        products,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalProducts: total,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        }
      });
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  }
);
router$e.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug }).populate("category", "name slug").select("-__v");
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    if (product.status !== "active") {
      res.status(404).json({ error: "Product not available" });
      return;
    }
    res.json({ product });
  } catch (error) {
    console.error("Get product error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});
router$e.get("/id/:id", async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
    }
    const { id } = req.params;
    const product = await Product.findById(id).populate("category", "name slug").select("-__v");
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    if (product.status !== "active") {
      res.status(404).json({ error: "Product not available" });
      return;
    }
    res.json(product);
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});
router$e.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const validatedData = productSchema.parse(req.body);
      const category = await Category.findById(validatedData.category);
      if (!category) {
        res.status(400).json({ error: "Invalid category" });
        return;
      }
      const slug = createSlug$1(validatedData.name);
      const existingProduct = await Product.findOne({ slug });
      if (existingProduct) {
        res.status(400).json({ error: "Product with this name already exists" });
        return;
      }
      const product = new Product({
        ...validatedData,
        slug
      });
      await product.save();
      await product.populate("category", "name slug");
      res.status(201).json({
        message: "Product created successfully",
        product
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
        return;
      }
      console.error("Create product error:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  }
);
router$e.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = productSchema.parse(req.body);
      if (validatedData.category) {
        const category = await Category.findById(validatedData.category);
        if (!category) {
          res.status(400).json({ error: "Invalid category" });
          return;
        }
      }
      let updateData = { ...validatedData };
      if (validatedData.name) {
        const newSlug = createSlug$1(validatedData.name);
        const existingProduct = await Product.findOne({
          slug: newSlug,
          _id: { $ne: id }
        });
        if (existingProduct) {
          res.status(400).json({ error: "Product with this name already exists" });
          return;
        }
        updateData.slug = newSlug;
      }
      const product = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      }).populate("category", "name slug");
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      res.json({
        message: "Product updated successfully",
        product
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
        return;
      }
      console.error("Update product error:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  }
);
router$e.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findByIdAndDelete(id);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      res.json({
        message: "Product deleted successfully"
      });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  }
);
router$e.get(
  "/filters/options",
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        return res.status(503).json({
          error: "Database connection required. Please ensure MongoDB is connected."
        });
      }
      const [operationTypes, usageAreas, finishes, trackTypes, categories] = await Promise.all([
        Product.distinct("operationType", { status: "active" }),
        Product.distinct("usageArea", { status: "active" }),
        Product.distinct("finish", { status: "active" }),
        Product.distinct("trackType", { status: "active" }),
        Category.find({ featured: true }).select("name slug")
      ]);
      res.json({
        operationTypes: operationTypes.filter(Boolean),
        usageAreas: usageAreas.filter(Boolean),
        finishes: finishes.filter(Boolean),
        trackTypes: trackTypes.filter(Boolean),
        categories
      });
    } catch (error) {
      console.error("Get filter options error:", error);
      res.status(500).json({ error: "Failed to fetch filter options" });
    }
  }
);
const router$d = Router();
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  image: z.string().optional(),
  parent: z.string().optional(),
  featured: z.boolean().default(false),
  sortOrder: z.number().default(0),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional()
  }).default({})
});
const createSlug = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
};
router$d.get("/", async (req, res) => {
  try {
    const { featured, parent, includeStats } = req.query;
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
      return;
    }
    let categories;
    if (includeStats) {
      const pipeline = [
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "category",
            as: "products"
          }
        },
        {
          $lookup: {
            from: "categories",
            localField: "parent",
            foreignField: "_id",
            as: "parentInfo"
          }
        },
        {
          $addFields: {
            productCount: { $size: "$products" },
            parent: { $arrayElemAt: ["$parentInfo", 0] }
          }
        },
        {
          $project: {
            name: 1,
            slug: 1,
            description: 1,
            image: 1,
            featured: 1,
            sortOrder: 1,
            seo: 1,
            productCount: 1,
            parent: {
              _id: 1,
              name: 1,
              slug: 1
            }
          }
        }
      ];
      const matchStage = {};
      if (featured === "true") {
        matchStage.featured = true;
      }
      if (parent) {
        matchStage.parent = parent;
      } else if (parent === "null") {
        matchStage.parent = null;
      }
      if (Object.keys(matchStage).length > 0) {
        pipeline.unshift({ $match: matchStage });
      }
      pipeline.push({ $sort: { sortOrder: 1, name: 1 } });
      categories = await Category.aggregate(pipeline);
    } else {
      const filter = {};
      if (featured === "true") {
        filter.featured = true;
      }
      if (parent) {
        filter.parent = parent;
      } else if (parent === "null") {
        filter.parent = null;
      }
      categories = await Category.find(filter).populate("parent", "name slug").sort({ sortOrder: 1, name: 1 }).select("-__v");
    }
    res.json({ categories });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});
router$d.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug }).populate("parent", "name slug").select("-__v");
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    const children = await Category.find({ parent: category._id }).sort({ sortOrder: 1, name: 1 }).select("name slug image");
    res.json({
      category,
      children
    });
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
});
router$d.post(
  "/",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const authReq = req;
      const validatedData = categorySchema.parse(req.body);
      if (validatedData.parent) {
        const parentCategory = await Category.findById(validatedData.parent);
        if (!parentCategory) {
          res.status(400).json({ error: "Invalid parent category" });
          return;
        }
      }
      const slug = createSlug(validatedData.name);
      const existingCategory = await Category.findOne({ slug });
      if (existingCategory) {
        res.status(400).json({ error: "Category with this name already exists" });
        return;
      }
      const category = new Category({
        ...validatedData,
        slug
      });
      await category.save();
      await category.populate("parent", "name slug");
      res.status(201).json({
        message: "Category created successfully",
        category
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
        return;
      }
      console.error("Create category error:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  }
);
router$d.put(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const authReq = req;
      const { id } = req.params;
      const validatedData = categorySchema.parse(req.body);
      if (validatedData.parent) {
        if (validatedData.parent === id) {
          res.status(400).json({ error: "Category cannot be its own parent" });
          return;
        }
        const parentCategory = await Category.findById(validatedData.parent);
        if (!parentCategory) {
          res.status(400).json({ error: "Invalid parent category" });
          return;
        }
      }
      let updateData = { ...validatedData };
      if (validatedData.name) {
        const newSlug = createSlug(validatedData.name);
        const existingCategory = await Category.findOne({
          slug: newSlug,
          _id: { $ne: id }
        });
        if (existingCategory) {
          res.status(400).json({ error: "Category with this name already exists" });
          return;
        }
        updateData.slug = newSlug;
      }
      const category = await Category.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      }).populate("parent", "name slug");
      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.json({
        message: "Category updated successfully",
        category
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
        return;
      }
      console.error("Update category error:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  }
);
router$d.delete(
  "/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const authReq = req;
      const { id } = req.params;
      const hasChildren = await Category.findOne({ parent: id });
      if (hasChildren) {
        res.status(400).json({
          error: "Cannot delete category with subcategories"
        });
        return;
      }
      const category = await Category.findByIdAndDelete(id);
      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.json({
        message: "Category deleted successfully"
      });
    } catch (error) {
      console.error("Delete category error:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  }
);
const router$c = express__default.Router();
const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  variant: z.object({
    name: z.string(),
    value: z.string()
  }).optional()
});
const updateCartItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().min(0, "Quantity must be at least 0"),
  variant: z.object({
    name: z.string(),
    value: z.string()
  }).optional()
});
router$c.get(
  "/",
  authenticateToken,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const authReq = req;
      const user = await UserModel.findById(authReq.user?.userId).populate({
        path: "cart.product",
        model: "Product",
        populate: {
          path: "category",
          model: "Category"
        }
      });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const filteredCart = (user.cart || []).filter((item) => item.product);
      res.json({ cart: filteredCart });
    } catch (error) {
      console.error("Get cart error:", error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  }
);
router$c.post(
  "/add",
  authenticateToken,
  async (req, res) => {
    try {
      const { productId, quantity, variant } = addToCartSchema.parse(req.body);
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const authReq = req;
      const user = await UserModel.findById(authReq.user?.userId);
      const product = await Product.findById(productId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      if (product.stock < quantity) {
        res.status(400).json({ error: "Insufficient stock" });
        return;
      }
      if (!user.cart) {
        user.cart = [];
      }
      const existingItemIndex = user.cart.findIndex(
        (item) => item.product.toString() === productId && JSON.stringify(item.variant) === JSON.stringify(variant)
      );
      if (existingItemIndex > -1) {
        user.cart[existingItemIndex].quantity += quantity;
      } else {
        user.cart.push({
          product: productId,
          quantity,
          variant,
          addedAt: /* @__PURE__ */ new Date()
        });
      }
      await user.save();
      res.json({ message: "Item added to cart successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
        return;
      }
      console.error("Add to cart error:", error);
      res.status(500).json({ error: "Failed to add item to cart" });
    }
  }
);
router$c.put(
  "/update",
  authenticateToken,
  async (req, res) => {
    try {
      const { productId, quantity, variant } = updateCartItemSchema.parse(req.body);
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const authReq = req;
      const user = await UserModel.findById(authReq.user?.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      if (!user.cart) {
        res.status(404).json({ error: "Cart is empty" });
        return;
      }
      const itemIndex = user.cart.findIndex(
        (item) => item.product.toString() === productId && JSON.stringify(item.variant) === JSON.stringify(variant)
      );
      if (itemIndex === -1) {
        res.status(404).json({ error: "Item not found in cart" });
        return;
      }
      if (quantity === 0) {
        user.cart.splice(itemIndex, 1);
      } else {
        user.cart[itemIndex].quantity = quantity;
      }
      await user.save();
      res.json({ message: "Cart updated successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
        return;
      }
      console.error("Update cart error:", error);
      res.status(500).json({ error: "Failed to update cart" });
    }
  }
);
router$c.delete(
  "/remove/:productId",
  authenticateToken,
  async (req, res) => {
    try {
      const { productId } = req.params;
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const authReq = req;
      const user = await UserModel.findById(authReq.user?.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      if (!user.cart) {
        res.status(404).json({ error: "Cart is empty" });
        return;
      }
      user.cart = user.cart.filter((item) => item.product.toString() !== productId);
      await user.save();
      res.json({ message: "Item removed from cart successfully" });
    } catch (error) {
      console.error("Remove from cart error:", error);
      res.status(500).json({ error: "Failed to remove item from cart" });
    }
  }
);
router$c.delete(
  "/clear",
  authenticateToken,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const authReq = req;
      const user = await UserModel.findById(authReq.user?.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      user.cart = [];
      await user.save();
      res.json({ message: "Cart cleared successfully" });
    } catch (error) {
      console.error("Clear cart error:", error);
      res.status(500).json({ error: "Failed to clear cart" });
    }
  }
);
const router$b = Router();
const addToWishlistSchema = z.object({
  productId: z.string().min(1, "Product ID is required")
});
router$b.get(
  "/",
  authenticateToken,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const user = await UserModel.findById(req.user?.userId).populate({
        path: "wishlist",
        model: "Product",
        populate: {
          path: "category",
          model: "Category"
        }
      });
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const wishlistItems = (user.wishlist || []).map((product) => ({
        _id: product._id,
        product,
        dateAdded: (/* @__PURE__ */ new Date()).toISOString()
        // We don't have actual date added, so use current
      }));
      res.json({ wishlist: wishlistItems });
    } catch (error) {
      console.error("Get wishlist error:", error);
      res.status(500).json({ error: "Failed to fetch wishlist" });
    }
  }
);
router$b.post(
  "/add",
  authenticateToken,
  async (req, res) => {
    try {
      const { productId } = addToWishlistSchema.parse(req.body);
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const user = await UserModel.findById(req.user?.userId);
      const product = await Product.findById(productId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      if (user.wishlist.includes(productId)) {
        res.status(400).json({ error: "Product already in wishlist" });
        return;
      }
      user.wishlist.push(productId);
      await user.save();
      res.json({ message: "Item added to wishlist successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
        return;
      }
      console.error("Add to wishlist error:", error);
      res.status(500).json({ error: "Failed to add item to wishlist" });
    }
  }
);
router$b.delete(
  "/:productId",
  authenticateToken,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const { productId } = req.params;
      const user = await UserModel.findById(req.user?.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      user.wishlist = user.wishlist.filter(
        (id) => id.toString() !== productId
      );
      await user.save();
      res.json({ message: "Item removed from wishlist successfully" });
    } catch (error) {
      console.error("Remove from wishlist error:", error);
      res.status(500).json({ error: "Failed to remove item from wishlist" });
    }
  }
);
router$b.post(
  "/toggle",
  authenticateToken,
  async (req, res) => {
    try {
      const { productId } = addToWishlistSchema.parse(req.body);
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const user = await UserModel.findById(req.user?.userId);
      const product = await Product.findById(productId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      const isInWishlist = user.wishlist.includes(productId);
      if (isInWishlist) {
        user.wishlist = user.wishlist.filter(
          (id) => id.toString() !== productId
        );
        await user.save();
        res.json({
          message: "Item removed from wishlist",
          inWishlist: false
        });
      } else {
        user.wishlist.push(productId);
        await user.save();
        res.json({
          message: "Item added to wishlist",
          inWishlist: true
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
        return;
      }
      console.error("Toggle wishlist error:", error);
      res.status(500).json({ error: "Failed to toggle wishlist item" });
    }
  }
);
router$b.delete(
  "/",
  authenticateToken,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const user = await UserModel.findById(req.user?.userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      user.wishlist = [];
      await user.save();
      res.json({ message: "Wishlist cleared successfully" });
    } catch (error) {
      console.error("Clear wishlist error:", error);
      res.status(500).json({ error: "Failed to clear wishlist" });
    }
  }
);
dotenv.config();
v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
const router$a = Router();
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const isValidImage = (file) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return false;
  }
  const ext = file.originalname.toLowerCase().match(/\.[^/.]+$/);
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext[0])) {
    return false;
  }
  if (file.originalname.includes("..") || file.originalname.includes("/") || file.originalname.includes("\\")) {
    return false;
  }
  return true;
};
const storage$1 = multer.memoryStorage();
const upload$1 = multer({
  storage: storage$1,
  limits: {
    fileSize: 2 * 1024 * 1024,
    // 2MB limit (reduced for security)
    files: 5,
    // Maximum 5 files
    fieldNameSize: 100,
    // Limit field name size
    fieldSize: 1024 * 1024
    // Limit field size to 1MB
  },
  fileFilter: (req, file, cb) => {
    try {
      if (!isValidImage(file)) {
        cb(
          new Error(
            "Invalid file type. Only JPG, PNG, and WebP images are allowed."
          )
        );
        return;
      }
      if (file.size && file.size > 2 * 1024 * 1024) {
        cb(new Error("File too large. Maximum size is 2MB."));
        return;
      }
      cb(null, true);
    } catch (error) {
      cb(new Error("File validation failed"));
    }
  }
});
router$a.post(
  "/image",
  authenticateToken,
  requireAdmin,
  upload$1.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }
      const result = await new Promise((resolve, reject) => {
        v2.uploader.upload_stream(
          {
            folder: "kiti-locks",
            resource_type: "image",
            transformation: [
              { width: 800, height: 800, crop: "limit" },
              { quality: "auto:best" },
              { format: "auto" },
              { flags: "sanitize" }
              // Sanitize uploaded images
            ],
            // Security options
            upload_preset: void 0,
            // Don't allow unsigned uploads
            public_id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          },
          (error, result2) => {
            if (error) reject(error);
            else resolve(result2);
          }
        ).end(req.file.buffer);
      });
      const uploadResult = result;
      res.json({
        message: "Image uploaded successfully",
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id
      });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  }
);
router$a.post(
  "/images",
  authenticateToken,
  requireAdmin,
  upload$1.array("images", 5),
  async (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        res.status(400).json({ error: "No image files provided" });
        return;
      }
      const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
          v2.uploader.upload_stream(
            {
              folder: "kiti-locks",
              resource_type: "image",
              transformation: [
                { width: 800, height: 800, crop: "limit" },
                { quality: "auto:best" },
                { format: "auto" },
                { flags: "sanitize" }
              ],
              public_id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(file.buffer);
        });
      });
      const results = await Promise.all(uploadPromises);
      const urls = results.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id
      }));
      res.json({
        message: "Images uploaded successfully",
        images: urls
      });
    } catch (error) {
      console.error("Images upload error:", error);
      res.status(500).json({ error: "Failed to upload images" });
    }
  }
);
router$a.post(
  "/avatar",
  authenticateToken,
  upload$1.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No avatar file provided" });
        return;
      }
      if (!isValidImage(req.file)) {
        res.status(400).json({ error: "Invalid image file type" });
        return;
      }
      if (req.file.size > 5 * 1024 * 1024) {
        res.status(400).json({ error: "File size too large (max 5MB)" });
        return;
      }
      const result = await v2.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "avatars",
          transformation: [
            { width: 400, height: 400, crop: "fill" },
            // Square avatar
            { quality: "auto" },
            // Auto quality
            { flags: "sanitize" }
            // Sanitize uploaded images
          ]
        }
      );
      const User$1 = (await Promise.resolve().then(() => User)).default;
      await User$1.findByIdAndUpdate(req.user?.userId, {
        avatar: result.secure_url
      });
      res.json({
        message: "Avatar uploaded successfully",
        avatarUrl: result.secure_url
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  }
);
router$a.delete(
  "/image/:publicId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { publicId } = req.params;
      await v2.uploader.destroy(publicId);
      res.json({
        message: "Image deleted successfully"
      });
    } catch (error) {
      console.error("Image delete error:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  }
);
const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  variant: {
    name: { type: String },
    value: { type: String }
  },
  image: { type: String, required: true }
});
const addressSchema$1 = new Schema({
  type: { type: String, enum: ["billing", "shipping"], required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  address1: { type: String, required: true },
  address2: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true, default: "US" },
  isDefault: { type: Boolean, default: false }
});
const orderSchema = new Schema(
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
        "delivered"
      ],
      default: "pending"
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending"
    },
    paymentMethod: { type: String, required: true },
    paymentIntentId: { type: String, required: true },
    // Razorpay specific fields
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    // Legacy Stripe fields
    stripeSessionId: { type: String },
    shippingAddress: { type: addressSchema$1, required: true },
    billingAddress: { type: addressSchema$1, required: true },
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
    order_created_on_shiprocket: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);
orderSchema.index({ user: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);
class NodemailerEmailService {
  transporter;
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      // You can change this to your preferred email service
      auth: {
        user: process.env.NODE_MAILER_EMAIL || "noreply@bathroomhardware.com",
        pass: process.env.NODE_MAILER_PASS || "your-app-password"
      }
    });
  }
  formatPrice(price) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(price);
  }
  generateOrderEmailTemplate(orderData, type, trackingNumber) {
    const { orderId, customerName, items, totalAmount, shippingAddress } = orderData;
    let subject = "";
    let statusMessage = "";
    let additionalInfo = "";
    switch (type) {
      case "confirmation":
        subject = `Order Confirmation - #${orderId}`;
        statusMessage = "Thank you for your order! We've received your payment and will begin processing your order shortly.";
        additionalInfo = `
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">What happens next?</h3>
            <ul style="color: #6c757d; line-height: 1.6;">
              <li>We'll process your order within 1-2 business days</li>
              <li>You'll receive a shipping notification with tracking information</li>
              <li>Your order will arrive within 3-5 business days</li>
            </ul>
          </div>
        `;
        break;
      case "shipped":
        subject = `Order Shipped - #${orderId}`;
        statusMessage = "Great news! Your order has been shipped and is on its way to you.";
        additionalInfo = trackingNumber ? `
          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #0056b3; margin-top: 0;">Tracking Information</h3>
            <p style="color: #495057; font-size: 16px; margin: 0;">
              <strong>Tracking Number:</strong> ${trackingNumber}
            </p>
            <p style="color: #6c757d; margin: 10px 0 0 0;">
              You can track your package using this number on our shipping partner's website.
            </p>
          </div>
          ` : "";
        break;
      case "delivered":
        subject = `Order Delivered - #${orderId}`;
        statusMessage = "Your order has been successfully delivered! We hope you love your new bathroom hardware.";
        additionalInfo = `
          <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #155724; margin-top: 0;">How was your experience?</h3>
            <p style="color: #495057; margin: 0;">
              We'd love to hear about your experience! Please consider leaving a review for the products you purchased.
            </p>
          </div>
        `;
        break;
    }
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
          <!-- Header -->
          <div style="text-align: center; border-bottom: 2px solid #e9ecef; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #495057; margin: 0; font-size: 28px;">Kiti Locks</h1>
            <p style="color: #6c757d; margin: 5px 0 0 0;">Premium Bathroom Hardware & Accessories</p>
          </div>

          <!-- Greeting -->
          <h2 style="color: #495057; margin-bottom: 20px;">Hello ${customerName},</h2>
          
          <!-- Status Message -->
          <p style="font-size: 16px; color: #495057; margin-bottom: 25px;">${statusMessage}</p>

          <!-- Order Details -->
          <div style="background-color: white; padding: 20px; border-radius: 5px; border: 1px solid #dee2e6;">
            <h3 style="color: #495057; margin-top: 0; border-bottom: 1px solid #e9ecef; padding-bottom: 10px;">
              Order Details - #${orderId}
            </h3>
            
            <!-- Items -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f8f9fa;">
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #dee2e6;">Item</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 1px solid #dee2e6;">Qty</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #dee2e6;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(
      (item) => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #f1f3f4;">${item.name}</td>
                    <td style="padding: 10px; text-align: center; border-bottom: 1px solid #f1f3f4;">${item.quantity}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #f1f3f4;">${this.formatPrice(item.price * item.quantity)}</td>
                  </tr>
                `
    ).join("")}
              </tbody>
              <tfoot>
                <tr style="background-color: #f8f9fa;">
                  <td colspan="2" style="padding: 15px; font-weight: bold; border-top: 2px solid #dee2e6;">Total:</td>
                  <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #28a745; border-top: 2px solid #dee2e6;">
                    ${this.formatPrice(totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <!-- Shipping Address -->
            ${shippingAddress ? `
            <div style="margin-top: 20px;">
              <h4 style="color: #495057; margin-bottom: 10px;">Shipping Address:</h4>
              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
                <p style="margin: 0; line-height: 1.4;">
                  ${shippingAddress.firstName} ${shippingAddress.lastName}<br>
                  ${shippingAddress.address}<br>
                  ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}<br>
                  ${shippingAddress.country}
                </p>
              </div>
            </div>
            ` : ""}
          </div>

          ${additionalInfo}

          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <p style="color: #6c757d; margin: 0; font-size: 14px;">
              Questions about your order? Contact us at 
              <a href="mailto:support@bathroomhardware.com" style="color: #007bff;">support@bathroomhardware.com</a>
            </p>
            <p style="color: #6c757d; margin: 10px 0 0 0; font-size: 12px;">
              Kiti Locks | Premium Bathroom Hardware & Accessories<br>
              © 2024 Kiti Locks. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
    return { subject, html };
  }
  async sendOrderConfirmation(orderData) {
    try {
      const { subject, html } = this.generateOrderEmailTemplate(
        orderData,
        "confirmation"
      );
      await this.transporter.sendMail({
        from: `"Kiti Locks" <${process.env.NODE_MAILER_EMAIL || "noreply@bathroomhardware.com"}>`,
        to: orderData.customerEmail,
        subject,
        html
      });
      console.log(
        `Order confirmation email sent to ${orderData.customerEmail} for order ${orderData.orderId}`
      );
    } catch (error) {
      console.error("Failed to send order confirmation email:", error);
    }
  }
  async sendOrderShipped(orderData, trackingNumber) {
    try {
      const { subject, html } = this.generateOrderEmailTemplate(
        orderData,
        "shipped",
        trackingNumber
      );
      await this.transporter.sendMail({
        from: `"Kiti Locks" <${process.env.NODE_MAILER_EMAIL || "noreply@bathroomhardware.com"}>`,
        to: orderData.customerEmail,
        subject,
        html
      });
      console.log(
        `Order shipped email sent to ${orderData.customerEmail} for order ${orderData.orderId}`
      );
    } catch (error) {
      console.error("Failed to send order shipped email:", error);
    }
  }
  async sendOrderDelivered(orderData) {
    try {
      const { subject, html } = this.generateOrderEmailTemplate(
        orderData,
        "delivered"
      );
      await this.transporter.sendMail({
        from: `"Kiti Locks" <${process.env.NODE_MAILER_EMAIL || "noreply@bathroomhardware.com"}>`,
        to: orderData.customerEmail,
        subject,
        html
      });
      console.log(
        `Order delivered email sent to ${orderData.customerEmail} for order ${orderData.orderId}`
      );
    } catch (error) {
      console.error("Failed to send order delivered email:", error);
    }
  }
}
class MockEmailService {
  async sendOrderConfirmation(orderData) {
    console.log(
      `[MOCK EMAIL] Order confirmation sent to ${orderData.customerEmail} for order ${orderData.orderId}`
    );
    console.log("Order data:", JSON.stringify(orderData, null, 2));
  }
  async sendOrderShipped(orderData, trackingNumber) {
    console.log(
      `[MOCK EMAIL] Order shipped notification sent to ${orderData.customerEmail} for order ${orderData.orderId}`
    );
    if (trackingNumber) {
      console.log(`Tracking number: ${trackingNumber}`);
    }
  }
  async sendOrderDelivered(orderData) {
    console.log(
      `[MOCK EMAIL] Order delivered notification sent to ${orderData.customerEmail} for order ${orderData.orderId}`
    );
  }
}
const emailService = process.env.NODE_ENV === "production" && process.env.NODE_MAILER_EMAIL && process.env.NODE_MAILER_PASS ? new NodemailerEmailService() : new MockEmailService();
const router$9 = Router();
router$9.post(
  "/create",
  authenticateToken,
  async (req, res) => {
    try {
      const {
        paymentStatus = "pending",
        paymentIntentId,
        status = "pending",
        items = [],
        shippingAddress,
        subtotal,
        tax = 0,
        shipping = 0,
        total
      } = req.body;
      const userId = req.user?.userId;
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      if (!paymentIntentId || !items || !shippingAddress) {
        res.status(400).json({ error: "Missing required order information" });
        return;
      }
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const order = new OrderModel({
        orderNumber,
        user: req.user?.userId,
        items: items.map((item) => ({
          product: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image || "/placeholder.svg"
        })),
        subtotal: subtotal || 0,
        tax: tax || 0,
        shipping: shipping || 0,
        total: total || subtotal || 0,
        status,
        paymentStatus,
        paymentMethod: "stripe",
        paymentIntentId,
        shippingAddress: {
          type: "shipping",
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          address1: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country || "US",
          isDefault: false
        },
        billingAddress: {
          type: "billing",
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          address1: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country || "US",
          isDefault: false
        }
      });
      await order.save();
      try {
        await emailService.sendOrderConfirmation({
          orderId: order.orderNumber,
          customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
          customerEmail: shippingAddress.email,
          items: items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          totalAmount: total,
          shippingAddress: {
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            address: shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zipCode: shippingAddress.zipCode,
            country: shippingAddress.country || "US"
          }
        });
      } catch (emailError) {
        console.warn("Failed to send confirmation email:", emailError);
      }
      res.status(201).json({
        message: "Order created successfully",
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt
        }
      });
    } catch (error) {
      console.error("Create order error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  }
);
router$9.get(
  "/",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const orders = await OrderModel.find().populate("user", "name email").populate("items.product", "name price").sort({ createdAt: -1 }).select("-__v");
      res.json({ orders });
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  }
);
router$9.get(
  "/track/:orderNumber",
  authenticateToken,
  async (req, res) => {
    try {
      const { orderNumber } = req.params;
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }
      const order = await OrderModel.findOne({
        orderNumber,
        userId
      }).populate("userId", "name email");
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      res.json({
        message: "Order tracking information retrieved successfully",
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          paymentStatus: order.paymentStatus,
          total: order.total,
          items: order.items,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          // Include Shiprocket fields if available
          shipment_id: order.shipment_id,
          awb_code: order.awb_code,
          courier_company_id: order.courier_company_id,
          shiprocket_tracking_url: order.shiprocket_tracking_url,
          order_created_on_shiprocket: order.order_created_on_shiprocket
        }
      });
    } catch (error) {
      console.error("Track order error:", error);
      res.status(500).json({ error: "Failed to retrieve order tracking information" });
    }
  }
);
router$9.get(
  "/my",
  authenticateToken,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const orders = await OrderModel.find({ user: req.user?.userId }).populate("items.product", "name price images").sort({ createdAt: -1 }).select("-__v");
      res.json({ orders });
    } catch (error) {
      console.error("Get user orders error:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  }
);
router$9.get(
  "/my-orders",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.id;
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const orders = await OrderModel.find({ user: userId }).populate("items.product", "name price").sort({ createdAt: -1 }).select("-__v");
      res.json({ orders });
    } catch (error) {
      console.error("Error fetching user orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  }
);
router$9.get(
  "/:orderId",
  authenticateToken,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const order = await OrderModel.findById(orderId).populate("user", "name email").populate("items.product", "name price images").select("-__v");
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      if (req.user?.role !== "admin" && order.user._id.toString() !== req.user?.userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      res.json({ order });
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  }
);
router$9.put(
  "/:orderId/status",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { status, trackingNumber, trackingUrl, estimatedDelivery, notes } = req.body;
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const validStatuses = [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered"
      ];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }
      const updateData = {
        status,
        ...status === "shipped" && { shippedAt: /* @__PURE__ */ new Date() },
        ...status === "delivered" && { deliveredAt: /* @__PURE__ */ new Date() },
        ...trackingNumber && { trackingNumber },
        ...trackingUrl && { trackingUrl },
        ...estimatedDelivery && { estimatedDelivery: new Date(estimatedDelivery) },
        ...notes && { notes }
      };
      const order = await OrderModel.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true }
      ).populate("user", "name email");
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      try {
        if (order.user && (status === "shipped" || status === "delivered")) {
          const emailData = {
            orderId: order.orderNumber,
            customerName: order.user.name || "Customer",
            customerEmail: order.user.email,
            items: order.items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            totalAmount: order.total,
            shippingAddress: order.shippingAddress,
            ...trackingNumber && { trackingNumber },
            ...trackingUrl && { trackingUrl }
          };
          if (status === "shipped") {
            await emailService.sendOrderShipped(emailData);
          } else if (status === "delivered") {
            await emailService.sendOrderDelivered(emailData);
          }
        }
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
      }
      res.json({
        message: "Order status updated successfully",
        order
      });
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(500).json({ error: "Failed to update order status" });
    }
  }
);
router$9.put(
  "/:orderId/tracking",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const { trackingNumber, trackingUrl, estimatedDelivery, notes } = req.body;
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const updateData = {};
      if (trackingNumber) updateData.trackingNumber = trackingNumber;
      if (trackingUrl) updateData.trackingUrl = trackingUrl;
      if (estimatedDelivery) updateData.estimatedDelivery = new Date(estimatedDelivery);
      if (notes !== void 0) updateData.notes = notes;
      const order = await OrderModel.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true }
      ).populate("user", "name email");
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      res.json({
        message: "Order tracking information updated successfully",
        order
      });
    } catch (error) {
      console.error("Update order tracking error:", error);
      res.status(500).json({ error: "Failed to update order tracking" });
    }
  }
);
router$9.get(
  "/:orderId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const order = await OrderModel.findById(orderId).populate("user", "name email phone").populate("items.product", "name price images slug").select("-__v");
      if (!order) {
        res.status(404).json({ error: "Order not found" });
        return;
      }
      res.json({ order });
    } catch (error) {
      console.error("Get order details error:", error);
      res.status(500).json({ error: "Failed to fetch order details" });
    }
  }
);
router$9.get(
  "/analytics",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const totalOrders = await OrderModel.countDocuments();
      const totalRevenue = await OrderModel.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$total" } } }
      ]);
      const ordersByStatus = await OrderModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);
      const recentOrders = await OrderModel.find().populate("user", "name email").sort({ createdAt: -1 }).limit(10).select("orderNumber total status createdAt user");
      const sixMonthsAgo = /* @__PURE__ */ new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const ordersByMonth = await OrderModel.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 },
            revenue: { $sum: "$total" }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
      ]);
      res.json({
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        ordersByStatus,
        recentOrders,
        ordersByMonth
      });
    } catch (error) {
      console.error("Get order analytics error:", error);
      res.status(500).json({ error: "Failed to fetch order analytics" });
    }
  }
);
let cachedToken = null;
let tokenExpiry = null;
let lastLoginAttempt = null;
let loginAttemptCount = 0;
let isRateLimited = false;
let rateLimitResetTime = null;
let consecutiveFailures = 0;
const getShiprocketToken = async () => {
  try {
    if (isRateLimited && rateLimitResetTime && /* @__PURE__ */ new Date() < rateLimitResetTime) {
      const minutesLeft = Math.ceil((rateLimitResetTime.getTime() - Date.now()) / (1e3 * 60));
      throw new Error(`Shiprocket API is rate limited. Please try again in ${minutesLeft} minutes.`);
    }
    if (cachedToken && tokenExpiry && /* @__PURE__ */ new Date() < tokenExpiry) {
      console.log("✅ Using cached Shiprocket token");
      return cachedToken;
    }
    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    const nodeEnv = process.env.NODE_ENV;
    if (!email || !password) {
      console.warn("⚠️ Shiprocket credentials not found in environment variables");
      console.warn("Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in your .env file");
      if (nodeEnv === "development") {
        console.warn("⚠️ Development mode: Using mock Shiprocket token due to missing credentials");
        cachedToken = "mock_token_for_development";
        tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1e3);
        return cachedToken;
      }
      throw new Error("Shiprocket credentials not found in environment variables");
    }
    if (lastLoginAttempt) {
      const timeSinceLastAttempt = Date.now() - lastLoginAttempt.getTime();
      const minInterval = Math.min(6e4 * Math.pow(2, consecutiveFailures), 3e5);
      if (timeSinceLastAttempt < minInterval) {
        const secondsLeft = Math.ceil((minInterval - timeSinceLastAttempt) / 1e3);
        throw new Error(`Rate limited: Please wait ${secondsLeft} seconds before making another Shiprocket login attempt`);
      }
    }
    if (nodeEnv === "development" && (loginAttemptCount > 3 || consecutiveFailures > 2)) {
      console.warn("⚠️ Development mode: Using mock Shiprocket token due to rate limiting or consecutive failures");
      cachedToken = "mock_token_for_development";
      tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1e3);
      return cachedToken;
    }
    console.log("🔑 Attempting Shiprocket authentication...");
    lastLoginAttempt = /* @__PURE__ */ new Date();
    loginAttemptCount++;
    const loginData = {
      email,
      password
    };
    const response = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      loginData,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "BuilderCurry/1.0"
        },
        timeout: 15e3
        // Increased timeout to 15 seconds
      }
    );
    if (response.data && response.data.token) {
      cachedToken = response.data.token;
      tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1e3);
      isRateLimited = false;
      rateLimitResetTime = null;
      loginAttemptCount = 0;
      consecutiveFailures = 0;
      console.log("✅ Shiprocket token obtained successfully");
      return cachedToken;
    } else {
      throw new Error("Invalid response from Shiprocket login API");
    }
  } catch (error) {
    console.error("❌ Shiprocket authentication failed:", error.message);
    consecutiveFailures++;
    cachedToken = null;
    tokenExpiry = null;
    if (error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data?.message || error.response.statusText;
      if (status === 403) {
        if (errorMessage.includes("permission") || errorMessage.includes("Unauthorized")) {
          throw new Error(`Shiprocket API Permission Error: ${errorMessage}. Please contact Shiprocket support to enable API permissions for your account.`);
        } else {
          throw new Error(`Shiprocket login failed: Invalid credentials or account not activated. Please verify your Shiprocket account credentials.`);
        }
      } else if (status === 429) {
        isRateLimited = true;
        rateLimitResetTime = new Date(Date.now() + 5 * 60 * 1e3);
        throw new Error(`Shiprocket API rate limited. Please try again in 5 minutes.`);
      } else if (status === 401) {
        throw new Error(`Shiprocket login failed: Invalid credentials. Please check your email and password.`);
      } else {
        throw new Error(`Shiprocket login failed: ${errorMessage} (Status: ${status})`);
      }
    } else if (error.request) {
      throw new Error("Unable to connect to Shiprocket API. Please check your internet connection.");
    } else {
      throw new Error(`Shiprocket authentication error: ${error.message}`);
    }
  }
};
const clearShiprocketToken = () => {
  cachedToken = null;
  tokenExpiry = null;
  consecutiveFailures = 0;
  isRateLimited = false;
  rateLimitResetTime = null;
};
const makeShiprocketRequest = async (method, url, data = null) => {
  try {
    const token = await getShiprocketToken();
    const config = {
      method,
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "User-Agent": "BuilderCurry/1.0"
      },
      timeout: 15e3
    };
    if (data) {
      config.data = data;
    }
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      const errorMessage = error.response.data?.message || "Permission denied";
      if (errorMessage.includes("permission") || errorMessage.includes("Unauthorized")) {
        throw new Error(`Shiprocket API Permission Error: ${errorMessage}. Please contact Shiprocket support to enable API permissions for your account.`);
      }
    }
    if (error.response && error.response.status === 401) {
      clearShiprocketToken();
      const token = await getShiprocketToken();
      const config = {
        method,
        url,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "User-Agent": "BuilderCurry/1.0"
        },
        timeout: 15e3
      };
      if (data) {
        config.data = data;
      }
      const response = await axios(config);
      return response.data;
    }
    throw error;
  }
};
const createShiprocketOrder = async (orderData) => {
  try {
    const payload = {
      order_id: orderData.order_id,
      order_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      // YYYY-MM-DD format
      pickup_location: orderData.pickup_location || "Primary",
      // Default pickup location
      channel_id: "",
      // Can be left empty for marketplace integration
      comment: orderData.comment || "Order created via website",
      reseller_name: orderData.reseller_name || "KHUNTIA ENTERPRISES PRIVATE LIMITED",
      company_name: orderData.company_name || "Kiti locks",
      billing_customer_name: orderData.customer_name,
      billing_last_name: "",
      billing_address: orderData.shipping_address.address,
      billing_address_2: orderData.billing_address_2 || "",
      billing_isd_code: orderData.billing_isd_code || "91",
      billing_city: orderData.shipping_address.city,
      billing_pincode: orderData.shipping_address.pincode,
      billing_state: orderData.shipping_address.state,
      billing_country: orderData.shipping_address.country,
      billing_email: orderData.customer_email,
      billing_phone: orderData.customer_phone,
      shipping_is_billing: true,
      shipping_customer_name: orderData.customer_name,
      shipping_last_name: "",
      shipping_address: orderData.shipping_address.address,
      shipping_address_2: orderData.shipping_address_2 || "",
      shipping_city: orderData.shipping_address.city,
      shipping_pincode: orderData.shipping_address.pincode,
      shipping_country: orderData.shipping_address.country,
      shipping_state: orderData.shipping_address.state,
      shipping_email: orderData.customer_email,
      shipping_phone: orderData.customer_phone,
      order_items: orderData.items.map((item) => ({
        name: item.name,
        sku: item.sku,
        units: item.units,
        selling_price: item.selling_price,
        discount: "",
        tax: "",
        hsn: 441122,
        // Default HSN code for hardware items
        weight: item.weight || 0.1,
        // Default weight if not provided
        dimensions: "10,10,10"
        // Default dimensions
      })),
      payment_method: orderData.payment_method,
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: orderData.sub_total,
      length: orderData.length || 10,
      breadth: orderData.breadth || 10,
      height: orderData.height || 10,
      weight: orderData.weight || 0.5,
      order_type: orderData.order_type || "ESSENTIALS"
    };
    const response = await makeShiprocketRequest(
      "POST",
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      payload
    );
    console.log("✅ Shiprocket order created successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Failed to create Shiprocket order:", error);
    if (error.message.includes("Permission Error")) {
      throw new Error(`Shiprocket API Permission Issue: ${error.message}. Please contact Shiprocket support to enable order creation permissions.`);
    }
    throw error;
  }
};
const createShiprocketOrderWithDefaults = async (orderData) => {
  return createShiprocketOrder({
    ...orderData,
    pickup_location: "Primary",
    reseller_name: "KHUNTIA ENTERPRISES PRIVATE LIMITED",
    company_name: "Kiti locks",
    billing_isd_code: "91",
    order_type: "ESSENTIALS",
    comment: orderData.comment || "Order created via website"
  });
};
const checkShiprocketPermissions = async () => {
  try {
    const token = await getShiprocketToken();
    const testResponse = await axios.get(
      "https://apiv2.shiprocket.in/v1/external/courier/serviceability/",
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        params: {
          pickup_postcode: "110001",
          delivery_postcode: "400001",
          weight: 0.5,
          cod: 0
        }
      }
    );
    return {
      canCreateOrders: true,
      canTrackOrders: true,
      canCancelOrders: true
    };
  } catch (error) {
    if (error.response && error.response.status === 403) {
      return {
        canCreateOrders: false,
        canTrackOrders: false,
        canCancelOrders: false,
        error: "Shiprocket account does not have API permissions. Please contact Shiprocket support."
      };
    }
    return {
      canCreateOrders: false,
      canTrackOrders: false,
      canCancelOrders: false,
      error: error.message
    };
  }
};
const router$8 = express__default.Router();
let razorpay = null;
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
console.log("Razorpay initialization:", {
  keyIdProvided: !!razorpayKeyId,
  keySecretProvided: !!razorpayKeySecret,
  keyIdPrefix: razorpayKeyId?.substring(0, 8)
});
try {
  if (razorpayKeyId && razorpayKeySecret) {
    razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret
    });
    console.log("✅ Razorpay initialized successfully");
  } else {
    console.warn("⚠️ Razorpay keys not provided, running in demo mode");
    console.log("Missing keys:", {
      RAZORPAY_KEY_ID: !razorpayKeyId,
      RAZORPAY_KEY_SECRET: !razorpayKeySecret
    });
  }
} catch (error) {
  console.error("❌ Razorpay initialization failed:", error);
  razorpay = null;
}
router$8.post("/create-razorpay-order", authenticateToken, async (req, res) => {
  try {
    const { items, currency = "INR" } = req.body;
    const userId = req.user?.userId;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart items are required" });
    }
    if (!razorpay) {
      return res.status(503).json({ error: "Payment service not available" });
    }
    let totalAmount = 0;
    const validatedItems = [];
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: "Each item must have a valid productId and quantity" });
      }
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }
    const finalAmount = Math.round(totalAmount * 100);
    const options = {
      amount: finalAmount,
      currency: currency.toUpperCase(),
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };
    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
      validatedItems,
      totalAmount
      // Amount in rupees (without tax)
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});
router$8.post("/create-session", authenticateToken, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const userId = req.user?.userId;
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: "Cart items are required" });
      return;
    }
    if (!razorpay) {
      res.status(503).json({ error: "Payment service not available" });
      return;
    }
    let totalAmount = 0;
    const validatedItems = [];
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: "Each item must have a valid productId and quantity" });
      }
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      validatedItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }
    const finalAmount = Math.round(totalAmount * 100);
    const options = {
      amount: finalAmount,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };
    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
      validatedItems,
      totalAmount,
      // Amount in rupees (without tax)
      isDemoMode: false
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});
router$8.post("/verify-razorpay-payment", authenticateToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user?.userId;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment verification data" });
    }
    if (!razorpayKeySecret) {
      return res.status(500).json({ error: "Payment verification not available" });
    }
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", razorpayKeySecret).update(body.toString()).digest("hex");
    const isAuthentic = expectedSignature === razorpay_signature;
    if (isAuthentic) {
      res.json({
        success: true,
        message: "Payment verified successfully",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      });
    } else {
      res.status(400).json({ error: "Invalid payment signature" });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
});
router$8.post("/razorpay-success", authenticateToken, async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderId,
      items,
      orderItems,
      shippingAddress
    } = req.body;
    const userId = req.user?.userId;
    console.log("🔍 Razorpay success payload received:", {
      razorpay_payment_id: !!razorpay_payment_id,
      razorpay_order_id: !!razorpay_order_id,
      razorpay_signature: !!razorpay_signature,
      orderId: !!orderId,
      itemsCount: items?.length || 0,
      orderItemsCount: orderItems?.length || 0,
      shippingAddress: shippingAddress ? Object.keys(shippingAddress) : "undefined",
      userId: userId || "guest"
    });
    const finalItems = orderItems || items || [];
    console.log("📦 Final items for processing:", {
      finalItemsCount: finalItems.length,
      sampleItem: finalItems[0] || "none",
      allItemKeys: finalItems.length > 0 ? Object.keys(finalItems[0] || {}) : []
    });
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment details" });
    }
    if (!razorpayKeySecret) {
      return res.status(500).json({ error: "Payment verification not available" });
    }
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac("sha256", razorpayKeySecret).update(body.toString()).digest("hex");
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }
    let paymentDetails;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (error) {
      console.error("Error fetching payment details:", error);
      return res.status(500).json({ error: "Failed to verify payment" });
    }
    const orderItemsArray = finalItems || [];
    const ensureAddressDefaults = (address, type) => ({
      type,
      firstName: address?.firstName || "Guest",
      lastName: address?.lastName || "User",
      email: address?.email || "guest@example.com",
      phone: address?.phone || "9876543210",
      address1: address?.address1 || address?.address || "Default Address",
      city: address?.city || "Default City",
      state: address?.state || "Default State",
      zipCode: address?.zipCode || "000000",
      country: address?.country || "India",
      isDefault: false
    });
    const orderShippingAddress = ensureAddressDefaults(shippingAddress, "shipping");
    const orderBillingAddress = ensureAddressDefaults(shippingAddress, "billing");
    let calculatedAmount = 0;
    if (orderItemsArray.length > 0) {
      for (const item of orderItemsArray) {
        if (item.productId || item.product) {
          const productId = item.productId || item.product;
          const product = await Product.findById(productId);
          if (product) {
            calculatedAmount += product.price * (item.quantity || 1);
          }
        }
      }
    }
    const paymentAmount = Number(paymentDetails.amount) / 100;
    const finalAmount = calculatedAmount > 0 ? calculatedAmount : paymentAmount;
    const order = new OrderModel({
      orderNumber: `ORD-${Date.now()}`,
      user: userId || new mongoose.Types.ObjectId(),
      // Use dummy ObjectId for guest users
      items: orderItemsArray.map((item) => ({
        product: item.productId || item.product || new mongoose.Types.ObjectId(),
        name: item.name || "Product",
        price: item.price || 0,
        quantity: item.quantity || 1,
        image: item.image || "/placeholder.svg"
      })),
      subtotal: finalAmount,
      // No tax included
      tax: 0,
      // Explicitly no tax
      shipping: 0,
      // Explicitly no shipping cost
      total: finalAmount,
      // Same as subtotal since no tax/shipping
      paymentStatus: "paid",
      paymentMethod: "razorpay",
      paymentIntentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      shippingAddress: orderShippingAddress,
      billingAddress: orderBillingAddress,
      status: "confirmed"
    });
    try {
      console.log("💾 Attempting to save order:", {
        orderNumber: `ORD-${Date.now()}`,
        userId: userId || "guest",
        itemsCount: orderItemsArray.length,
        finalAmount,
        shippingAddress: orderShippingAddress
      });
      await order.save();
      console.log("✅ Order saved successfully:", order._id);
      try {
        console.log("🔗 Creating Shiprocket order for:", order._id);
        if (orderItemsArray.length === 0) {
          console.warn("⚠️ No items found in order - skipping Shiprocket order creation");
          console.warn("Available data:", { orderItemsArray, finalItems, items, orderItems });
        } else {
          const shiprocketOrderData = {
            order_id: order._id.toString(),
            customer_name: `${orderShippingAddress.firstName} ${orderShippingAddress.lastName}`.trim() || "Guest User",
            customer_email: userId ? (await UserModel.findById(userId))?.email || "guest@example.com" : "guest@example.com",
            customer_phone: orderShippingAddress.phone || "9876543210",
            // Use phone from shipping address
            shipping_address: {
              address: orderShippingAddress.address1,
              city: orderShippingAddress.city,
              state: orderShippingAddress.state,
              pincode: orderShippingAddress.zipCode,
              country: orderShippingAddress.country
            },
            items: orderItemsArray.map((item) => ({
              name: item.name || "Product",
              sku: (item.productId || item.product)?.toString() || "SKU001",
              units: item.quantity || 1,
              selling_price: item.price || 0,
              weight: 0.5
              // Default weight - you can add weight to products
            })),
            payment_method: "Prepaid",
            // Since payment is already completed
            sub_total: finalAmount,
            comment: `Order ${order.orderNumber} - ${orderShippingAddress.firstName} ${orderShippingAddress.lastName}`
          };
          console.log("📦 Shiprocket order data prepared:", {
            order_id: shiprocketOrderData.order_id,
            itemsCount: shiprocketOrderData.items.length,
            items: shiprocketOrderData.items,
            customer_name: shiprocketOrderData.customer_name,
            sub_total: shiprocketOrderData.sub_total
          });
          const shiprocketOrder = await createShiprocketOrderWithDefaults(shiprocketOrderData);
          order.shipment_id = shiprocketOrder.shipment_id;
          order.shiprocket_tracking_url = shiprocketOrder.tracking_url;
          order.order_created_on_shiprocket = true;
          await order.save();
          console.log("✅ Shiprocket order created successfully:", {
            orderId: order._id,
            shipmentId: shiprocketOrder.shipment_id,
            trackingUrl: shiprocketOrder.tracking_url
          });
        }
      } catch (shiprocketError) {
        console.error("❌ Shiprocket order creation failed:", shiprocketError);
      }
    } catch (saveError) {
      console.error("❌ Order save failed:", saveError);
      return res.status(500).json({
        error: "Failed to create order",
        details: saveError instanceof Error ? saveError.message : "Unknown error"
      });
    }
    if (userId) {
      await UserModel.findByIdAndUpdate(userId, { cart: [] });
    }
    res.json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      order,
      paymentId: razorpay_payment_id
    });
  } catch (error) {
    console.error("Razorpay payment success error:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
});
const reviewSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1e3
    },
    verified: {
      type: Boolean,
      default: false
    },
    helpful: {
      type: Number,
      default: 0
    },
    helpfulUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    reports: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        reason: {
          type: String,
          required: true,
          trim: true
        },
        reportedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    images: [
      {
        type: String
      }
    ]
  },
  {
    timestamps: true
  }
);
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ rating: 1 });
reviewSchema.statics.calculateAverageRating = async function(productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: "$product",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: "$rating"
        }
      }
    }
  ]);
  if (stats.length > 0) {
    const { averageRating, totalReviews, ratingDistribution } = stats[0];
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingDistribution.forEach((rating) => {
      distribution[rating]++;
    });
    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      distribution
    };
  }
  return {
    averageRating: 0,
    totalReviews: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
};
reviewSchema.post("save", async function() {
  const Review2 = this.constructor;
  const Product2 = mongoose.model("Product");
  const stats = await Review2.calculateAverageRating(this.product);
  await Product2.findByIdAndUpdate(this.product, {
    averageRating: stats.averageRating,
    reviewCount: stats.totalReviews,
    ratingDistribution: stats.distribution
  });
});
reviewSchema.post("findOneAndDelete", async function(doc) {
  if (doc) {
    const Review2 = mongoose.model("Review");
    const Product2 = mongoose.model("Product");
    const stats = await Review2.calculateAverageRating(doc.product);
    await Product2.findByIdAndUpdate(doc.product, {
      averageRating: stats.averageRating,
      reviewCount: stats.totalReviews,
      ratingDistribution: stats.distribution
    });
  }
});
const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
const router$7 = express__default.Router();
router$7.get("/product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = "newest" } = req.query;
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    const query = { product: productId };
    let sortOptions = {};
    switch (sort) {
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "oldest":
        sortOptions = { createdAt: 1 };
        break;
      case "highest":
        sortOptions = { rating: -1 };
        break;
      case "lowest":
        sortOptions = { rating: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const reviews = await Review.find(query).populate("user", "name avatar").sort(sortOptions).skip(skip).limit(limitNum);
    const total = await Review.countDocuments(query);
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          ratingDistribution: {
            $push: "$rating"
          }
        }
      }
    ]);
    const ratingStats = stats[0] || {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: []
    };
    const distribution = {};
    [1, 2, 3, 4, 5].forEach((rating) => {
      distribution[rating] = ratingStats.ratingDistribution.filter((r) => r === rating).length;
    });
    res.json({
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalReviews: total,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1
      },
      stats: {
        averageRating: Math.round(ratingStats.averageRating * 10) / 10,
        totalReviews: ratingStats.totalReviews,
        distribution
      }
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});
router$7.post("/", authenticateToken, async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;
    const authReq = req;
    const userId = authReq.user.userId;
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
    }
    if (!productId || !rating || !title || !comment) {
      return res.status(400).json({
        error: "Product ID, rating, title, and comment are required"
      });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    const existingReview = await Review.findOne({
      product: productId,
      user: userId
    });
    if (existingReview) {
      return res.status(400).json({ error: "You have already reviewed this product" });
    }
    const hasPurchased = await OrderModel.exists({
      user: userId,
      "items.product": productId,
      status: { $in: ["completed", "delivered"] }
    });
    const review = new Review({
      product: productId,
      user: userId,
      rating,
      title: title.trim(),
      comment: comment.trim(),
      verified: !!hasPurchased
    });
    await review.save();
    await review.populate("user", "name avatar");
    res.status(201).json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});
router$7.put("/:reviewId", authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment } = req.body;
    const authReq = req;
    const userId = authReq.user.userId;
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
    }
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    if (review.user.toString() !== userId) {
      return res.status(403).json({ error: "You can only edit your own reviews" });
    }
    if (rating !== void 0) review.rating = rating;
    if (title !== void 0) review.title = title.trim();
    if (comment !== void 0) review.comment = comment.trim();
    await review.save();
    await review.populate("user", "name avatar");
    res.json(review);
  } catch (error) {
    console.error("Error updating review:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
});
router$7.delete("/:reviewId", authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const authReq = req;
    const userId = authReq.user.userId;
    const userRole = authReq.user.role;
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
    }
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    if (review.user.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({ error: "You can only delete your own reviews" });
    }
    await Review.findByIdAndDelete(reviewId);
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
});
router$7.get("/user", authenticateToken, async (req, res) => {
  try {
    const authReq = req;
    const userId = authReq.user.userId;
    const { page = 1, limit = 10 } = req.query;
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const reviews = await Review.find({ user: userId }).populate("product", "name images").sort({ createdAt: -1 }).skip(skip).limit(limitNum);
    const total = await Review.countDocuments({ user: userId });
    res.json({
      reviews,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalReviews: total,
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    res.status(500).json({ error: "Failed to fetch user reviews" });
  }
});
router$7.post("/:reviewId/like", authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const authReq = req;
    const userId = authReq.user.userId;
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
    }
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const hasLiked = review.likes?.includes(userObjectId) || false;
    if (hasLiked) {
      review.likes = review.likes?.filter((id) => id.toString() !== userId) || [];
    } else {
      if (!review.likes) review.likes = [];
      review.likes.push(userObjectId);
    }
    await review.save();
    res.json({
      liked: !hasLiked,
      likesCount: review.likes?.length || 0
    });
  } catch (error) {
    console.error("Error toggling review like:", error);
    res.status(500).json({ error: "Failed to toggle review like" });
  }
});
router$7.post("/:reviewId/helpful", authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const authReq = req;
    const userId = authReq.user.userId;
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
    }
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const hasMarkedHelpful = review.helpfulUsers.includes(userObjectId);
    if (hasMarkedHelpful) {
      review.helpfulUsers = review.helpfulUsers.filter(
        (id) => id.toString() !== userId
      );
      review.helpful = Math.max(0, review.helpful - 1);
    } else {
      review.helpfulUsers.push(userObjectId);
      review.helpful += 1;
    }
    await review.save();
    res.json({
      helpful: review.helpful,
      userMarkedHelpful: !hasMarkedHelpful
    });
  } catch (error) {
    console.error("Error toggling helpful status:", error);
    res.status(500).json({ error: "Failed to toggle helpful status" });
  }
});
router$7.post("/:reviewId/report", authenticateToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const authReq = req;
    const userId = authReq.user.userId;
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
    }
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ error: "Invalid review ID" });
    }
    if (!reason) {
      return res.status(400).json({ error: "Report reason is required" });
    }
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }
    const hasReported = review.reports?.some(
      (report) => report.user.toString() === userId
    ) || false;
    if (hasReported) {
      return res.status(400).json({ error: "You have already reported this review" });
    }
    if (!review.reports) review.reports = [];
    review.reports.push({
      user: new mongoose.Types.ObjectId(userId),
      reason: reason.trim(),
      reportedAt: /* @__PURE__ */ new Date()
    });
    await review.save();
    res.json({ message: "Review reported successfully" });
  } catch (error) {
    console.error("Error reporting review:", error);
    res.status(500).json({ error: "Failed to report review" });
  }
});
const router$6 = Router();
const performanceMetrics = [];
const errorLogs = [];
const slowResources = [];
router$6.post(
  "/performance",
  async (req, res) => {
    try {
      const { metrics, url, userAgent, timestamp } = req.body;
      const entry = {
        metrics,
        url,
        userAgent: userAgent?.substring(0, 200),
        // Limit user agent length
        timestamp,
        ip: req.ip
      };
      performanceMetrics.push(entry);
      if (performanceMetrics.length > 1e3) {
        performanceMetrics.splice(0, performanceMetrics.length - 1e3);
      }
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Performance analytics error:", error);
      res.status(500).json({ error: "Failed to log performance metrics" });
    }
  }
);
router$6.post("/errors", async (req, res) => {
  try {
    const { message, filename, lineno, colno, stack, reason, url, timestamp } = req.body;
    const entry = {
      message: message?.substring(0, 500),
      filename: filename?.substring(0, 200),
      lineno,
      colno,
      stack: stack?.substring(0, 1e3),
      reason: reason?.substring(0, 500),
      url,
      timestamp,
      ip: req.ip
    };
    errorLogs.push(entry);
    if (errorLogs.length > 1e3) {
      errorLogs.splice(0, errorLogs.length - 1e3);
    }
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error analytics error:", error);
    res.status(500).json({ error: "Failed to log error" });
  }
});
router$6.post(
  "/slow-resources",
  async (req, res) => {
    try {
      const { resources, url, timestamp } = req.body;
      const entry = {
        resources: resources?.slice(0, 10),
        // Limit to 10 resources
        url,
        timestamp,
        ip: req.ip
      };
      slowResources.push(entry);
      if (slowResources.length > 500) {
        slowResources.splice(0, slowResources.length - 500);
      }
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Slow resources analytics error:", error);
      res.status(500).json({ error: "Failed to log slow resources" });
    }
  }
);
router$6.get("/dashboard", async (req, res) => {
  try {
    const summary = {
      performanceMetrics: {
        count: performanceMetrics.length,
        recent: performanceMetrics.slice(-10),
        averages: calculateAverages()
      },
      errorLogs: {
        count: errorLogs.length,
        recent: errorLogs.slice(-10)
      },
      slowResources: {
        count: slowResources.length,
        recent: slowResources.slice(-10)
      }
    };
    res.json(summary);
  } catch (error) {
    console.error("Analytics dashboard error:", error);
    res.status(500).json({ error: "Failed to generate analytics dashboard" });
  }
});
function calculateAverages() {
  if (performanceMetrics.length === 0) return {};
  const totals = {
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
    count: 0
  };
  performanceMetrics.forEach((entry) => {
    if (entry.metrics) {
      if (entry.metrics.fcp) {
        totals.fcp += entry.metrics.fcp;
        totals.count++;
      }
      if (entry.metrics.lcp) totals.lcp += entry.metrics.lcp;
      if (entry.metrics.fid) totals.fid += entry.metrics.fid;
      if (entry.metrics.cls) totals.cls += entry.metrics.cls;
      if (entry.metrics.ttfb) totals.ttfb += entry.metrics.ttfb;
    }
  });
  return {
    fcp: totals.count > 0 ? totals.fcp / totals.count : 0,
    lcp: totals.count > 0 ? totals.lcp / totals.count : 0,
    fid: totals.count > 0 ? totals.fid / totals.count : 0,
    cls: totals.count > 0 ? totals.cls / totals.count : 0,
    ttfb: totals.count > 0 ? totals.ttfb / totals.count : 0
  };
}
const shiprocketCustomerSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true }
});
const shiprocketAddressSchema = new Schema({
  full: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true, default: "India" },
  pincode: { type: String, required: true, trim: true }
});
const shiprocketItemSchema = new Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  weight: { type: Number, min: 0 },
  // in kg
  length: { type: Number, min: 0 },
  // in cm
  breadth: { type: Number, min: 0 },
  // in cm
  height: { type: Number, min: 0 }
  // in cm
});
const shiprocketOrderSchema = new Schema(
  {
    order_id: {
      type: String,
      required: true
    },
    shipment_id: {
      type: String,
      required: true
    },
    awb_code: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: [
        "NEW",
        "PICKUP_SCHEDULED",
        "PICKED_UP",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "RTO_INITIATED",
        "RTO_DELIVERED",
        "LOST",
        "DAMAGED",
        "PENDING"
      ],
      default: "NEW"
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
        validator: function(items) {
          return items && items.length > 0;
        },
        message: "At least one item is required"
      }
    },
    // Shipping details
    weight: {
      type: Number,
      min: 0,
      default: 0.5
      // Default 500g
    },
    dimensions: {
      length: { type: Number, min: 0, default: 10 },
      breadth: { type: Number, min: 0, default: 10 },
      height: { type: Number, min: 0, default: 10 }
    },
    payment_method: {
      type: String,
      required: true,
      enum: ["COD", "Prepaid"],
      default: "Prepaid"
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
    collection: "shiprocket_orders"
  }
);
shiprocketOrderSchema.index({ order_id: 1 });
shiprocketOrderSchema.index({ shipment_id: 1 });
shiprocketOrderSchema.index({ awb_code: 1 });
shiprocketOrderSchema.index({ status: 1 });
shiprocketOrderSchema.index({ "customer.email": 1 });
shiprocketOrderSchema.index({ createdAt: -1 });
shiprocketOrderSchema.virtual("total_value").get(function() {
  return this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
});
shiprocketOrderSchema.virtual("total_weight").get(function() {
  const itemsWeight = this.items.reduce((total, item) => {
    return total + (item.weight || 0.1) * item.quantity;
  }, 0);
  return Math.max(itemsWeight, this.weight || 0.5);
});
shiprocketOrderSchema.pre("save", function(next) {
  const totalValue = this.items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
  if (this.payment_method === "COD") {
    this.cod_amount = totalValue;
  } else {
    this.cod_amount = 0;
  }
  if (!this.weight) {
    const itemsWeight = this.items.reduce((total, item) => {
      return total + (item.weight || 0.1) * item.quantity;
    }, 0);
    this.weight = Math.max(itemsWeight, 0.5);
  }
  next();
});
shiprocketOrderSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  const now = /* @__PURE__ */ new Date();
  switch (newStatus) {
    case "PICKUP_SCHEDULED":
      this.pickup_scheduled_date = now;
      break;
    case "PICKED_UP":
    case "IN_TRANSIT":
      this.shipped_date = now;
      break;
    case "DELIVERED":
      this.delivered_date = now;
      break;
    case "CANCELLED":
      this.cancelled_date = now;
      break;
    case "RTO_DELIVERED":
      this.returned_date = now;
      break;
  }
  return this.save();
};
shiprocketOrderSchema.statics.findByAwb = function(awb) {
  return this.findOne({ awb_code: awb });
};
shiprocketOrderSchema.statics.findByShipmentId = function(shipmentId) {
  return this.findOne({ shipment_id: shipmentId });
};
const ShiprocketOrderModel = mongoose.models.ShiprocketOrder || mongoose.model("ShiprocketOrder", shiprocketOrderSchema);
const checkApiStatus = async (req, res) => {
  try {
    const permissions = await checkShiprocketPermissions();
    res.status(200).json({
      success: true,
      message: "Shiprocket API status checked",
      data: {
        api_accessible: !permissions.error,
        permissions,
        recommendations: permissions.error ? [
          "Contact Shiprocket support to enable API permissions",
          "Verify your Shiprocket account is fully activated",
          "Check if your account has the required API access level"
        ] : []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to check API status",
      details: error.message
    });
  }
};
const createOrder = async (req, res) => {
  try {
    const {
      order_id,
      customer,
      address,
      items,
      payment_method = "Prepaid",
      weight,
      dimensions,
      shipping_charges = 0,
      total_discount = 0,
      comment
    } = req.body;
    if (!order_id || !customer || !address || !items || items.length === 0) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: order_id, customer, address, and items are required"
      });
      return;
    }
    const existingOrder = await ShiprocketOrderModel.findOne({ order_id });
    if (existingOrder) {
      res.status(409).json({
        success: false,
        error: "Order with this ID already exists",
        data: existingOrder
      });
      return;
    }
    const permissions = await checkShiprocketPermissions();
    if (!permissions.canCreateOrders) {
      res.status(403).json({
        success: false,
        error: "Shiprocket API Permission Error",
        details: permissions.error,
        recommendations: [
          "Contact Shiprocket support to enable order creation permissions",
          "Verify your Shiprocket account is fully activated",
          "Check if your account has the required API access level"
        ]
      });
      return;
    }
    const orderValue = items.reduce((total, item) => total + item.price * item.quantity, 0);
    const shiprocketPayload = {
      order_id,
      order_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      // YYYY-MM-DD format
      pickup_location: "Primary",
      // This should be configured in Shiprocket dashboard
      channel_id: "",
      // Optional
      comment: comment || "",
      billing_customer_name: customer.name,
      billing_last_name: "",
      billing_address: address.full,
      billing_address_2: "",
      billing_city: address.city,
      billing_pincode: address.pincode,
      billing_state: address.state,
      billing_country: address.country || "India",
      billing_email: customer.email,
      billing_phone: customer.phone,
      shipping_is_billing: true,
      shipping_customer_name: customer.name,
      shipping_last_name: "",
      shipping_address: address.full,
      shipping_address_2: "",
      shipping_city: address.city,
      shipping_pincode: address.pincode,
      shipping_state: address.state,
      shipping_country: address.country || "India",
      shipping_email: customer.email,
      shipping_phone: customer.phone,
      order_items: items.map((item) => ({
        name: item.name,
        sku: item.sku,
        units: item.quantity,
        selling_price: item.price,
        discount: "",
        tax: "",
        hsn: 441122
        // Default HSN code, should be product-specific
      })),
      payment_method,
      shipping_charges,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount,
      sub_total: orderValue,
      length: dimensions?.length || 10,
      breadth: dimensions?.breadth || 10,
      height: dimensions?.height || 10,
      weight: weight || 0.5
    };
    const shiprocketResponse = await makeShiprocketRequest(
      "POST",
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      shiprocketPayload
    );
    if (!shiprocketResponse.order_id) {
      res.status(400).json({
        success: false,
        error: "Failed to create order in Shiprocket",
        details: shiprocketResponse
      });
      return;
    }
    const newOrder = new ShiprocketOrderModel({
      order_id,
      shipment_id: shiprocketResponse.shipment_id?.toString(),
      awb_code: shiprocketResponse.awb_code,
      status: "NEW",
      customer,
      address,
      items,
      weight: weight || 0.5,
      dimensions: dimensions || { length: 10, breadth: 10, height: 10 },
      payment_method,
      shipping_charges,
      total_discount,
      cod_amount: payment_method === "COD" ? orderValue : 0,
      comment
    });
    const savedOrder = await newOrder.save();
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        order_id: savedOrder.order_id,
        shipment_id: savedOrder.shipment_id,
        awb_code: savedOrder.awb_code,
        status: savedOrder.status,
        shiprocket_response: shiprocketResponse
      }
    });
  } catch (error) {
    console.error("Create order error:", error);
    if (error.message.includes("Permission Error") || error.message.includes("403")) {
      res.status(403).json({
        success: false,
        error: "Shiprocket API Permission Error",
        details: error.message,
        recommendations: [
          "Contact Shiprocket support to enable order creation permissions",
          "Verify your Shiprocket account is fully activated",
          "Check if your account has the required API access level"
        ]
      });
      return;
    }
    if (error.response && error.response.data) {
      res.status(error.response.status || 500).json({
        success: false,
        error: "Shiprocket API error",
        details: error.response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message
      });
    }
  }
};
const trackOrder = async (req, res) => {
  try {
    const { awb } = req.params;
    if (!awb) {
      res.status(400).json({
        success: false,
        error: "AWB code is required"
      });
      return;
    }
    const order = await ShiprocketOrderModel.findByAwb(awb);
    if (!order) {
      res.status(404).json({
        success: false,
        error: "Order not found with provided AWB code"
      });
      return;
    }
    const trackingResponse = await makeShiprocketRequest(
      "GET",
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`
    );
    if (trackingResponse.tracking_data && trackingResponse.tracking_data.track_status) {
      const latestStatus = trackingResponse.tracking_data.track_status;
      if (order.status !== latestStatus) {
        await order.updateStatus(latestStatus);
      }
    }
    const trackingInfo = {
      awb_code: awb,
      order_id: order.order_id,
      shipment_id: order.shipment_id,
      current_status: order.status,
      courier_name: order.courier_name,
      tracking_url: order.tracking_url,
      expected_delivery: order.expected_delivery_date,
      pickup_scheduled_date: order.pickup_scheduled_date,
      shipped_date: order.shipped_date,
      delivered_date: order.delivered_date,
      customer: order.customer,
      address: order.address,
      shiprocket_tracking: trackingResponse.tracking_data || null,
      scan_details: trackingResponse.tracking_data?.shipment_track || []
    };
    res.status(200).json({
      success: true,
      message: "Tracking information retrieved successfully",
      data: trackingInfo
    });
  } catch (error) {
    console.error("Track order error:", error);
    if (error.response && error.response.status === 404) {
      res.status(404).json({
        success: false,
        error: "Tracking information not available for this AWB code"
      });
    } else if (error.response && error.response.data) {
      res.status(error.response.status || 500).json({
        success: false,
        error: "Shiprocket tracking API error",
        details: error.response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message
      });
    }
  }
};
const cancelOrder = async (req, res) => {
  try {
    const { shipment_id, comment } = req.body;
    if (!shipment_id) {
      res.status(400).json({
        success: false,
        error: "Shipment ID is required"
      });
      return;
    }
    const order = await ShiprocketOrderModel.findByShipmentId(shipment_id);
    if (!order) {
      res.status(404).json({
        success: false,
        error: "Order not found with provided shipment ID"
      });
      return;
    }
    const nonCancellableStatuses = ["DELIVERED", "CANCELLED", "RTO_DELIVERED"];
    if (nonCancellableStatuses.includes(order.status)) {
      res.status(400).json({
        success: false,
        error: `Cannot cancel order with status: ${order.status}`
      });
      return;
    }
    const cancelPayload = {
      awbs: [order.awb_code]
    };
    const cancelResponse = await makeShiprocketRequest(
      "POST",
      "https://apiv2.shiprocket.in/v1/external/orders/cancel",
      cancelPayload
    );
    await order.updateStatus("CANCELLED");
    if (comment) {
      order.comment = comment;
      await order.save();
    }
    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        order_id: order.order_id,
        shipment_id: order.shipment_id,
        awb_code: order.awb_code,
        status: order.status,
        cancelled_date: order.cancelled_date,
        shiprocket_response: cancelResponse
      }
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    if (error.response && error.response.data) {
      res.status(error.response.status || 500).json({
        success: false,
        error: "Shiprocket cancellation API error",
        details: error.response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message
      });
    }
  }
};
const getOrders = async (req, res) => {
  try {
    const {
      status,
      customer_email,
      awb_code,
      order_id,
      page = 1,
      limit = 10
    } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (customer_email) filter["customer.email"] = customer_email;
    if (awb_code) filter.awb_code = awb_code;
    if (order_id) filter.order_id = order_id;
    const skip = (Number(page) - 1) * Number(limit);
    const orders = await ShiprocketOrderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).select("-__v");
    const totalOrders = await ShiprocketOrderModel.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / Number(limit));
    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      data: {
        orders,
        pagination: {
          current_page: Number(page),
          total_pages: totalPages,
          total_orders: totalOrders,
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
};
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await ShiprocketOrderModel.findOne({ order_id: orderId });
    if (!order) {
      res.status(404).json({
        success: false,
        error: "Order not found"
      });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Order details retrieved successfully",
      data: order
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      details: error.message
    });
  }
};
const router$5 = Router();
router$5.get("/status", authenticateToken, requireAdmin, checkApiStatus);
router$5.post("/create", authenticateToken, createOrder);
router$5.get("/track/:awb", trackOrder);
router$5.post("/cancel", authenticateToken, requireAdmin, cancelOrder);
router$5.get("/orders", authenticateToken, requireAdmin, getOrders);
router$5.get("/orders/:orderId", authenticateToken, getOrderById);
const router$4 = express__default.Router();
router$4.get("/autocomplete", async (req, res) => {
  try {
    const { q } = req.query;
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
    }
    if (!q || typeof q !== "string" || q.trim().length < 2) {
      return res.json({ suggestions: [] });
    }
    const searchTerm = q.trim();
    const productSuggestions = await Product.aggregate([
      {
        $match: {
          status: "active",
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
            { tags: { $regex: searchTerm, $options: "i" } }
          ]
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          price: 1,
          images: { $slice: ["$images", 1] },
          type: { $literal: "product" }
        }
      },
      { $limit: 5 }
    ]);
    const categorySuggestions = await Category.aggregate([
      {
        $match: {
          name: { $regex: searchTerm, $options: "i" }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          type: { $literal: "category" }
        }
      },
      { $limit: 3 }
    ]);
    const popularSearches = [
      "bathroom fittings",
      "kitchen hardware",
      "door locks",
      "cabinet handles",
      "shower accessories"
    ].filter(
      (term) => term.toLowerCase().includes(searchTerm.toLowerCase())
    );
    res.json({
      suggestions: [
        ...productSuggestions,
        ...categorySuggestions,
        ...popularSearches.slice(0, 2).map((term) => ({
          name: term,
          type: "suggestion"
        }))
      ]
    });
  } catch (error) {
    console.error("Autocomplete search error:", error);
    res.status(500).json({ error: "Search autocomplete failed" });
  }
});
router$4.get("/advanced", async (req, res) => {
  try {
    const {
      q,
      category,
      minPrice,
      maxPrice,
      rating,
      inStock,
      sortBy = "relevance",
      page = 1,
      limit = 12,
      operationType,
      usageArea,
      finish,
      trackType
    } = req.query;
    if (!getConnectionStatus()) {
      return res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
    }
    const searchQuery = { status: "active" };
    if (q && typeof q === "string" && q.trim()) {
      searchQuery.$text = { $search: q.trim() };
    }
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        searchQuery.category = category;
      } else {
        const categoryDoc = await Category.findOne({ slug: category });
        if (categoryDoc) {
          searchQuery.category = categoryDoc._id;
        }
      }
    }
    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = Number(minPrice);
      if (maxPrice) searchQuery.price.$lte = Number(maxPrice);
    }
    if (rating) {
      searchQuery.averageRating = { $gte: Number(rating) };
    }
    if (inStock === "true") {
      searchQuery.stock = { $gt: 0 };
    }
    if (operationType) {
      searchQuery.operationType = operationType;
    }
    if (usageArea) {
      searchQuery.usageArea = usageArea;
    }
    if (finish) {
      searchQuery.finish = finish;
    }
    if (trackType) {
      searchQuery.trackType = trackType;
    }
    let sortOptions = {};
    switch (sortBy) {
      case "relevance":
        if (q) {
          sortOptions = { score: { $meta: "textScore" } };
        } else {
          sortOptions = { featured: -1, createdAt: -1 };
        }
        break;
      case "price_low":
        sortOptions = { price: 1 };
        break;
      case "price_high":
        sortOptions = { price: -1 };
        break;
      case "rating":
        sortOptions = { averageRating: -1, reviewCount: -1 };
        break;
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      case "popular":
        sortOptions = { reviewCount: -1, averageRating: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const skip = (pageNum - 1) * limitNum;
    const products = await Product.find(searchQuery).populate("category", "name slug").sort(sortOptions).skip(skip).limit(limitNum).select("-__v");
    const total = await Product.countDocuments(searchQuery);
    const availableFilters = await getAvailableFilters(searchQuery);
    res.json({
      products,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalProducts: total,
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      },
      filters: availableFilters,
      searchTerm: q || ""
    });
  } catch (error) {
    console.error("Advanced search error:", error);
    res.status(500).json({ error: "Advanced search failed" });
  }
});
async function getAvailableFilters(baseQuery) {
  try {
    const [
      categories,
      priceRange,
      operationTypes,
      usageAreas,
      finishes,
      trackTypes
    ] = await Promise.all([
      // Categories
      Product.aggregate([
        { $match: baseQuery },
        { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "categoryInfo" } },
        { $unwind: "$categoryInfo" },
        { $group: { _id: "$categoryInfo._id", name: { $first: "$categoryInfo.name" }, slug: { $first: "$categoryInfo.slug" }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Price range
      Product.aggregate([
        { $match: baseQuery },
        { $group: { _id: null, minPrice: { $min: "$price" }, maxPrice: { $max: "$price" } } }
      ]),
      // Operation types
      Product.aggregate([
        { $match: { ...baseQuery, operationType: { $exists: true, $ne: null } } },
        { $group: { _id: "$operationType", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Usage areas
      Product.aggregate([
        { $match: { ...baseQuery, usageArea: { $exists: true, $ne: null } } },
        { $group: { _id: "$usageArea", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Finishes
      Product.aggregate([
        { $match: { ...baseQuery, finish: { $exists: true, $ne: null } } },
        { $group: { _id: "$finish", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Track types
      Product.aggregate([
        { $match: { ...baseQuery, trackType: { $exists: true, $ne: null } } },
        { $group: { _id: "$trackType", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);
    return {
      categories: categories.map((cat) => ({
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        count: cat.count
      })),
      priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 },
      operationTypes: operationTypes.map((op) => ({
        value: op._id,
        count: op.count
      })),
      usageAreas: usageAreas.map((area) => ({
        value: area._id,
        count: area.count
      })),
      finishes: finishes.map((finish) => ({
        value: finish._id,
        count: finish.count
      })),
      trackTypes: trackTypes.map((track) => ({
        value: track._id,
        count: track.count
      }))
    };
  } catch (error) {
    console.error("Error getting available filters:", error);
    return {
      categories: [],
      priceRange: { minPrice: 0, maxPrice: 0 },
      operationTypes: [],
      usageAreas: [],
      finishes: [],
      trackTypes: []
    };
  }
}
router$4.get("/history", async (req, res) => {
  try {
    const popularSearches = [
      { term: "bathroom fittings", count: 150 },
      { term: "kitchen hardware", count: 120 },
      { term: "door locks", count: 95 },
      { term: "cabinet handles", count: 80 },
      { term: "shower accessories", count: 70 }
    ];
    res.json({ searches: popularSearches });
  } catch (error) {
    console.error("Search history error:", error);
    res.status(500).json({ error: "Failed to get search history" });
  }
});
const router$3 = express__default.Router();
const addressSchema = z.object({
  type: z.enum(["billing", "shipping"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  address1: z.string().min(1, "Address line 1 is required"),
  address2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  country: z.string().min(1, "Country is required").default("IN"),
  isDefault: z.boolean().default(false)
});
router$3.get("/", authenticateToken, async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
      return;
    }
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    const user = await UserModel.findById(userId).select("addresses");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ addresses: user.addresses || [] });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ error: "Failed to fetch addresses" });
  }
});
router$3.post("/", authenticateToken, async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
      return;
    }
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    const validatedData = addressSchema.parse(req.body);
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (validatedData.isDefault) {
      user.addresses = user.addresses.map(
        (addr) => addr.type === validatedData.type ? { ...addr, isDefault: false } : addr
      );
    }
    const hasAddressOfType = user.addresses.some(
      (addr) => addr.type === validatedData.type
    );
    if (!hasAddressOfType) {
      validatedData.isDefault = true;
    }
    user.addresses.push(validatedData);
    await user.save();
    const newAddress = user.addresses[user.addresses.length - 1];
    res.status(201).json({
      message: "Address added successfully",
      address: newAddress
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors
      });
      return;
    }
    console.error("Error adding address:", error);
    res.status(500).json({ error: "Failed to add address" });
  }
});
router$3.put("/:addressId", authenticateToken, async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
      return;
    }
    const userId = req.user?.userId;
    const { addressId } = req.params;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    const validatedData = addressSchema.parse(req.body);
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id?.toString() === addressId
    );
    if (addressIndex === -1) {
      res.status(404).json({ error: "Address not found" });
      return;
    }
    if (validatedData.isDefault) {
      user.addresses = user.addresses.map(
        (addr, index) => addr.type === validatedData.type && index !== addressIndex ? { ...addr, isDefault: false } : addr
      );
    }
    user.addresses[addressIndex] = { ...user.addresses[addressIndex], ...validatedData };
    await user.save();
    res.json({
      message: "Address updated successfully",
      address: user.addresses[addressIndex]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors
      });
      return;
    }
    console.error("Error updating address:", error);
    res.status(500).json({ error: "Failed to update address" });
  }
});
router$3.delete("/:addressId", authenticateToken, async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
      return;
    }
    const userId = req.user?.userId;
    const { addressId } = req.params;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id?.toString() === addressId
    );
    if (addressIndex === -1) {
      res.status(404).json({ error: "Address not found" });
      return;
    }
    const deletedAddress = user.addresses[addressIndex];
    user.addresses.splice(addressIndex, 1);
    if (deletedAddress.isDefault) {
      const sameTypeAddress = user.addresses.find(
        (addr) => addr.type === deletedAddress.type
      );
      if (sameTypeAddress) {
        sameTypeAddress.isDefault = true;
      }
    }
    await user.save();
    res.json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ error: "Failed to delete address" });
  }
});
router$3.put("/:addressId/default", authenticateToken, async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
      return;
    }
    const userId = req.user?.userId;
    const { addressId } = req.params;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const targetAddress = user.addresses.find(
      (addr) => addr._id?.toString() === addressId
    );
    if (!targetAddress) {
      res.status(404).json({ error: "Address not found" });
      return;
    }
    user.addresses = user.addresses.map(
      (addr) => addr.type === targetAddress.type ? { ...addr, isDefault: addr._id?.toString() === addressId } : addr
    );
    await user.save();
    res.json({ message: "Default address updated successfully" });
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({ error: "Failed to set default address" });
  }
});
const router$2 = express__default.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "avatars");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.userId;
    const fileExtension = path.extname(file.originalname);
    cb(null, `avatar-${userId}-${Date.now()}${fileExtension}`);
  }
});
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPG, PNG, and WebP are allowed."));
    }
  }
});
const preferencesSchema = z.object({
  newsletter: z.boolean().default(true),
  notifications: z.boolean().default(true),
  marketing: z.boolean().default(false),
  language: z.string().default("en"),
  currency: z.string().default("INR"),
  timezone: z.string().default("Asia/Kolkata")
});
const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  avatar: z.string().url().optional()
});
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Password confirmation is required")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});
router$2.get("/", authenticateToken, async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
      return;
    }
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    const user = await UserModel.findById(userId).select("-password -__v");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
        isVerified: user.isVerified,
        twoFactorEnabled: user.twoFactorEnabled
      },
      preferences: user.preferences || {
        newsletter: true,
        notifications: true,
        marketing: false,
        language: "en",
        currency: "INR",
        timezone: "Asia/Kolkata"
      },
      security: {
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
        passwordChangedAt: user.passwordChangedAt
      }
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});
router$2.put("/preferences", authenticateToken, async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
      return;
    }
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    const validatedData = preferencesSchema.parse(req.body);
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { preferences: validatedData },
      { new: true, runValidators: true }
    ).select("preferences");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      message: "Preferences updated successfully",
      preferences: user.preferences
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors
      });
      return;
    }
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});
router$2.put("/profile", authenticateToken, async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
      return;
    }
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    const validatedData = profileUpdateSchema.parse(req.body);
    const user = await UserModel.findByIdAndUpdate(
      userId,
      validatedData,
      { new: true, runValidators: true }
    ).select("-password -__v");
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      message: "Profile updated successfully",
      profile: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors
      });
      return;
    }
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});
router$2.put("/password", authenticateToken, async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
      return;
    }
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    const validatedData = passwordChangeSchema.parse(req.body);
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const isCurrentPasswordValid = await user.comparePassword(validatedData.currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }
    const salt = await bcrypt.genSalt(12);
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, salt);
    user.password = hashedNewPassword;
    user.passwordChangedAt = /* @__PURE__ */ new Date();
    await user.save();
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors
      });
      return;
    }
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});
router$2.put("/2fa", authenticateToken, async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
      return;
    }
    const userId = req.user?.userId;
    const { enabled, secret, backupCodes } = req.body;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (enabled) {
      if (!secret) {
        res.status(400).json({ error: "2FA secret is required" });
        return;
      }
      user.twoFactorEnabled = true;
      user.twoFactorSecret = secret;
      user.backupCodes = backupCodes || [];
    } else {
      user.twoFactorEnabled = false;
      user.twoFactorSecret = void 0;
      user.backupCodes = void 0;
    }
    await user.save();
    res.json({
      message: `Two-factor authentication ${enabled ? "enabled" : "disabled"} successfully`,
      twoFactorEnabled: user.twoFactorEnabled
    });
  } catch (error) {
    console.error("Error updating 2FA:", error);
    res.status(500).json({ error: "Failed to update two-factor authentication" });
  }
});
router$2.post("/export", authenticateToken, async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
      return;
    }
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    res.json({
      message: "Data export request received. You will receive an email when your data is ready for download.",
      estimatedTime: "24-48 hours"
    });
  } catch (error) {
    console.error("Error requesting data export:", error);
    res.status(500).json({ error: "Failed to request data export" });
  }
});
router$2.post("/delete-account", authenticateToken, async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
      return;
    }
    const userId = req.user?.userId;
    const { password, reason } = req.body;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    if (!password) {
      res.status(400).json({ error: "Password is required to delete account" });
      return;
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(400).json({ error: "Password is incorrect" });
      return;
    }
    res.json({
      message: "Account deletion request received. You will receive a confirmation email.",
      deletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
      // 7 days from now
    });
  } catch (error) {
    console.error("Error requesting account deletion:", error);
    res.status(500).json({ error: "Failed to request account deletion" });
  }
});
router$2.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    const notificationSettings = {
      email: {
        orderUpdates: true,
        promotions: false,
        newsletter: true,
        security: true
      },
      sms: {
        orderUpdates: true,
        promotions: false,
        security: true
      },
      push: {
        orderUpdates: true,
        promotions: false,
        newProducts: false
      }
    };
    res.json({ notifications: notificationSettings });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({ error: "Failed to fetch notification settings" });
  }
});
router$2.put("/notifications", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    const { email, sms, push } = req.body;
    res.json({
      message: "Notification settings updated successfully",
      notifications: { email, sms, push }
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ error: "Failed to update notification settings" });
  }
});
router$2.post("/avatar", authenticateToken, upload.single("avatar"), async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
      return;
    }
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }
    try {
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        const result = await v2.uploader.upload(req.file.path, {
          folder: "kiti-locks/avatars",
          public_id: `avatar-${userId}`,
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" }
          ]
        });
        fs.unlinkSync(req.file.path);
        await UserModel.findByIdAndUpdate(userId, { avatar: result.secure_url });
        res.json({
          message: "Avatar uploaded successfully",
          avatar: result.secure_url
        });
      } else {
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        await UserModel.findByIdAndUpdate(userId, { avatar: avatarUrl });
        res.json({
          message: "Avatar uploaded successfully",
          avatar: avatarUrl
        });
      }
    } catch (uploadError) {
      console.error("Avatar upload error:", uploadError);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
});
router$2.delete("/avatar", authenticateToken, async (req, res) => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected."
      });
      return;
    }
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (user.avatar) {
      try {
        if (user.avatar.includes("cloudinary.com")) {
          const publicId = user.avatar.split("/").pop()?.split(".")[0];
          if (publicId) {
            await v2.uploader.destroy(`kiti-locks/avatars/${publicId}`);
          }
        } else if (user.avatar.startsWith("/uploads/")) {
          const filePath = path.join(process.cwd(), user.avatar);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch (deleteError) {
        console.error("Error deleting avatar file:", deleteError);
      }
    }
    await UserModel.findByIdAndUpdate(userId, { $unset: { avatar: 1 } });
    res.json({ message: "Avatar removed successfully" });
  } catch (error) {
    console.error("Error removing avatar:", error);
    res.status(500).json({ error: "Failed to remove avatar" });
  }
});
const router$1 = Router();
const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email format").optional(),
  role: z.enum(["user", "admin"]).optional(),
  isActive: z.boolean().optional()
});
router$1.get(
  "/",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const { page = 1, limit = 10, search, role, isActive } = req.query;
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ];
      }
      if (role && role !== "all") {
        filter.role = role;
      }
      if (isActive !== void 0 && isActive !== "all") {
        filter.isActive = isActive === "true";
      }
      const [users, totalUsers] = await Promise.all([
        UserModel.find(filter).select("-password -twoFactorSecret").sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        UserModel.countDocuments(filter)
      ]);
      const userStats = await UserModel.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 }
          }
        }
      ]);
      const activeUsers = await UserModel.countDocuments({ isActive: { $ne: false } });
      const inactiveUsers = await UserModel.countDocuments({ isActive: false });
      res.json({
        users,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalUsers / limitNum),
          totalUsers,
          hasNext: pageNum * limitNum < totalUsers,
          hasPrev: pageNum > 1
        },
        stats: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          byRole: userStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count;
            return acc;
          }, {})
        }
      });
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);
router$1.get(
  "/:userId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const { userId } = req.params;
      const user = await UserModel.findById(userId).select("-password -twoFactorSecret").populate("wishlist", "name price images slug");
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const orders = await OrderModel.find({ user: userId }).populate("items.product", "name price").sort({ createdAt: -1 }).limit(10);
      const orderStats = await OrderModel.aggregate([
        { $match: { user: user._id } },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: "$total" },
            averageOrderValue: { $avg: "$total" }
          }
        }
      ]);
      const stats = orderStats[0] || {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0
      };
      res.json({
        user,
        orders,
        stats
      });
    } catch (error) {
      console.error("Get user details error:", error);
      res.status(500).json({ error: "Failed to fetch user details" });
    }
  }
);
router$1.put(
  "/:userId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const { userId } = req.params;
      const validatedData = updateUserSchema.parse(req.body);
      const currentUser = req.user;
      if (currentUser?.userId === userId && validatedData.role) {
        res.status(400).json({ error: "Cannot change your own role" });
        return;
      }
      if (validatedData.email) {
        const existingUser = await UserModel.findOne({
          email: validatedData.email,
          _id: { $ne: userId }
        });
        if (existingUser) {
          res.status(400).json({ error: "Email already exists" });
          return;
        }
      }
      const user = await UserModel.findByIdAndUpdate(
        userId,
        validatedData,
        { new: true, runValidators: true }
      ).select("-password -twoFactorSecret");
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({
        message: "User updated successfully",
        user
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
        return;
      }
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);
router$1.delete(
  "/:userId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const { userId } = req.params;
      const currentUser = req.user;
      if (currentUser?.userId === userId) {
        res.status(400).json({ error: "Cannot delete your own account" });
        return;
      }
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const hasOrders = await OrderModel.countDocuments({ user: userId });
      if (hasOrders > 0) {
        user.isActive = false;
        await user.save();
        res.json({
          message: "User deactivated successfully (has order history)",
          user: { ...user.toObject(), password: void 0, twoFactorSecret: void 0 }
        });
      } else {
        await UserModel.findByIdAndDelete(userId);
        res.json({ message: "User deleted successfully" });
      }
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
);
router$1.get(
  "/analytics/overview",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const { period = "30" } = req.query;
      const days = parseInt(period);
      const startDate = /* @__PURE__ */ new Date();
      startDate.setDate(startDate.getDate() - days);
      const registrationTrends = await UserModel.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
            "_id.day": 1
          }
        }
      ]);
      const totalUsers = await UserModel.countDocuments();
      const activeUsers = await UserModel.countDocuments({ isActive: { $ne: false } });
      const newUsersThisMonth = await UserModel.countDocuments({
        createdAt: {
          $gte: new Date((/* @__PURE__ */ new Date()).getFullYear(), (/* @__PURE__ */ new Date()).getMonth(), 1)
        }
      });
      const topCustomers = await OrderModel.aggregate([
        {
          $group: {
            _id: "$user",
            totalSpent: { $sum: "$total" },
            orderCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
          }
        },
        {
          $unwind: "$user"
        },
        {
          $project: {
            name: "$user.name",
            email: "$user.email",
            totalSpent: 1,
            orderCount: 1
          }
        },
        {
          $sort: { totalSpent: -1 }
        },
        {
          $limit: 10
        }
      ]);
      res.json({
        totalUsers,
        activeUsers,
        newUsersThisMonth,
        registrationTrends,
        topCustomers
      });
    } catch (error) {
      console.error("Get user analytics error:", error);
      res.status(500).json({ error: "Failed to fetch user analytics" });
    }
  }
);
const router = Router();
const inventoryUpdateSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional()
});
const bulkInventoryUpdateSchema = z.object({
  updates: z.array(z.object({
    productId: z.string().min(1, "Product ID is required"),
    quantity: z.number().min(0, "Quantity must be non-negative"),
    reason: z.string().min(1, "Reason is required")
  }))
});
router.get(
  "/overview",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const { category, status = "active", lowStock = "10" } = req.query;
      const lowStockThreshold = parseInt(lowStock);
      const filter = {};
      if (status !== "all") {
        filter.status = status;
      }
      if (category && category !== "all") {
        filter.category = category;
      }
      const products = await Product.find(filter).populate("category", "name").select("name slug price stock status category images").sort({ stock: 1 });
      const totalProducts = products.length;
      const lowStockProducts = products.filter((p) => p.stock <= lowStockThreshold);
      const outOfStockProducts = products.filter((p) => p.stock === 0);
      const totalInventoryValue = products.reduce((sum, product) => sum + product.price * product.stock, 0);
      const thirtyDaysAgo = /* @__PURE__ */ new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const stockMovements = await OrderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            status: { $ne: "cancelled" }
          }
        },
        {
          $unwind: "$items"
        },
        {
          $group: {
            _id: "$items.product",
            totalSold: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
          }
        },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product"
          }
        },
        {
          $unwind: "$product"
        },
        {
          $project: {
            name: "$product.name",
            slug: "$product.slug",
            currentStock: "$product.stock",
            totalSold: 1,
            revenue: 1,
            turnoverRate: {
              $cond: {
                if: { $gt: ["$product.stock", 0] },
                then: { $divide: ["$totalSold", "$product.stock"] },
                else: 0
              }
            }
          }
        },
        {
          $sort: { totalSold: -1 }
        },
        {
          $limit: 20
        }
      ]);
      res.json({
        products,
        statistics: {
          totalProducts,
          lowStockCount: lowStockProducts.length,
          outOfStockCount: outOfStockProducts.length,
          totalInventoryValue,
          lowStockThreshold
        },
        lowStockProducts: lowStockProducts.slice(0, 10),
        outOfStockProducts: outOfStockProducts.slice(0, 10),
        topMovingProducts: stockMovements
      });
    } catch (error) {
      console.error("Get inventory overview error:", error);
      res.status(500).json({ error: "Failed to fetch inventory overview" });
    }
  }
);
router.put(
  "/stock/update",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const validatedData = inventoryUpdateSchema.parse(req.body);
      const { productId, quantity, reason, notes } = validatedData;
      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      const oldStock = product.stock;
      product.stock = quantity;
      await product.save();
      console.log(`Inventory Update: ${product.name} stock changed from ${oldStock} to ${quantity}. Reason: ${reason}. Notes: ${notes || "None"}`);
      res.json({
        message: "Stock updated successfully",
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          oldStock,
          newStock: quantity,
          difference: quantity - oldStock
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
        return;
      }
      console.error("Update stock error:", error);
      res.status(500).json({ error: "Failed to update stock" });
    }
  }
);
router.put(
  "/stock/bulk-update",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const validatedData = bulkInventoryUpdateSchema.parse(req.body);
      const { updates } = validatedData;
      const results = [];
      for (const update of updates) {
        try {
          const product = await Product.findById(update.productId);
          if (!product) {
            results.push({
              productId: update.productId,
              success: false,
              error: "Product not found"
            });
            continue;
          }
          const oldStock = product.stock;
          product.stock = update.quantity;
          await product.save();
          results.push({
            productId: update.productId,
            name: product.name,
            success: true,
            oldStock,
            newStock: update.quantity,
            difference: update.quantity - oldStock
          });
          console.log(`Bulk Inventory Update: ${product.name} stock changed from ${oldStock} to ${update.quantity}. Reason: ${update.reason}`);
        } catch (error) {
          results.push({
            productId: update.productId,
            success: false,
            error: "Failed to update"
          });
        }
      }
      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.filter((r) => !r.success).length;
      res.json({
        message: `Bulk update completed: ${successCount} successful, ${failedCount} failed`,
        results,
        summary: {
          total: updates.length,
          successful: successCount,
          failed: failedCount
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.errors
        });
        return;
      }
      console.error("Bulk update stock error:", error);
      res.status(500).json({ error: "Failed to perform bulk update" });
    }
  }
);
router.get(
  "/alerts/low-stock",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const { threshold = "10" } = req.query;
      const lowStockThreshold = parseInt(threshold);
      const lowStockProducts = await Product.find({
        stock: { $lte: lowStockThreshold },
        status: "active"
      }).populate("category", "name").select("name slug stock price category images").sort({ stock: 1 });
      const thirtyDaysAgo = /* @__PURE__ */ new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const salesData = await OrderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            status: { $ne: "cancelled" }
          }
        },
        {
          $unwind: "$items"
        },
        {
          $group: {
            _id: "$items.product",
            totalSold: { $sum: "$items.quantity" },
            averageDailySales: { $avg: "$items.quantity" }
          }
        }
      ]);
      const salesMap = new Map(salesData.map((item) => [item._id.toString(), item]));
      const alertsWithRecommendations = lowStockProducts.map((product) => {
        const sales = salesMap.get(product._id.toString());
        const dailyVelocity = sales ? sales.totalSold / 30 : 0;
        const recommendedReorder = Math.max(Math.ceil(dailyVelocity * 30), 10);
        return {
          ...product.toObject(),
          dailyVelocity: Math.round(dailyVelocity * 100) / 100,
          recommendedReorder,
          daysUntilOutOfStock: dailyVelocity > 0 ? Math.floor(product.stock / dailyVelocity) : null
        };
      });
      res.json({
        alerts: alertsWithRecommendations,
        summary: {
          total: lowStockProducts.length,
          critical: lowStockProducts.filter((p) => p.stock === 0).length,
          warning: lowStockProducts.filter((p) => p.stock > 0 && p.stock <= 5).length,
          low: lowStockProducts.filter((p) => p.stock > 5).length
        },
        threshold: lowStockThreshold
      });
    } catch (error) {
      console.error("Get low stock alerts error:", error);
      res.status(500).json({ error: "Failed to fetch low stock alerts" });
    }
  }
);
router.get(
  "/analytics",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }
      const { period = "30" } = req.query;
      const days = parseInt(period);
      const startDate = /* @__PURE__ */ new Date();
      startDate.setDate(startDate.getDate() - days);
      const inventoryAnalysis = await Product.aggregate([
        {
          $lookup: {
            from: "orders",
            let: { productId: "$_id" },
            pipeline: [
              {
                $match: {
                  createdAt: { $gte: startDate },
                  status: { $ne: "cancelled" }
                }
              },
              {
                $unwind: "$items"
              },
              {
                $match: {
                  $expr: { $eq: ["$items.product", "$$productId"] }
                }
              },
              {
                $group: {
                  _id: null,
                  totalSold: { $sum: "$items.quantity" },
                  revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } }
                }
              }
            ],
            as: "sales"
          }
        },
        {
          $addFields: {
            totalSold: { $ifNull: [{ $arrayElemAt: ["$sales.totalSold", 0] }, 0] },
            revenue: { $ifNull: [{ $arrayElemAt: ["$sales.revenue", 0] }, 0] },
            turnoverRate: {
              $cond: {
                if: { $gt: ["$stock", 0] },
                then: { $divide: [{ $ifNull: [{ $arrayElemAt: ["$sales.totalSold", 0] }, 0] }, "$stock"] },
                else: 0
              }
            },
            inventoryValue: { $multiply: ["$stock", "$price"] }
          }
        },
        {
          $project: {
            name: 1,
            slug: 1,
            stock: 1,
            price: 1,
            totalSold: 1,
            revenue: 1,
            turnoverRate: 1,
            inventoryValue: 1,
            category: 1
          }
        },
        {
          $sort: { turnoverRate: -1 }
        }
      ]);
      const categoryAnalysis = await Product.aggregate([
        {
          $lookup: {
            from: "categories",
            localField: "category",
            foreignField: "_id",
            as: "categoryInfo"
          }
        },
        {
          $unwind: "$categoryInfo"
        },
        {
          $group: {
            _id: "$categoryInfo.name",
            totalProducts: { $sum: 1 },
            totalStock: { $sum: "$stock" },
            totalValue: { $sum: { $multiply: ["$stock", "$price"] } },
            averagePrice: { $avg: "$price" },
            lowStockCount: {
              $sum: {
                $cond: [{ $lte: ["$stock", 10] }, 1, 0]
              }
            }
          }
        },
        {
          $sort: { totalValue: -1 }
        }
      ]);
      const totalInventoryValue = inventoryAnalysis.reduce((sum, product) => sum + product.inventoryValue, 0);
      const totalProductsSold = inventoryAnalysis.reduce((sum, product) => sum + product.totalSold, 0);
      const totalRevenue = inventoryAnalysis.reduce((sum, product) => sum + product.revenue, 0);
      res.json({
        summary: {
          totalInventoryValue,
          totalProductsSold,
          totalRevenue,
          averageTurnoverRate: inventoryAnalysis.length > 0 ? inventoryAnalysis.reduce((sum, p) => sum + p.turnoverRate, 0) / inventoryAnalysis.length : 0
        },
        products: inventoryAnalysis,
        categoryBreakdown: categoryAnalysis,
        topPerformers: inventoryAnalysis.slice(0, 10),
        slowMovers: inventoryAnalysis.filter((p) => p.turnoverRate < 0.1).slice(0, 10)
      });
    } catch (error) {
      console.error("Get inventory analytics error:", error);
      res.status(500).json({ error: "Failed to fetch inventory analytics" });
    }
  }
);
function createServer() {
  const app2 = express__default();
  connectDB().catch(console.warn);
  if (process.env.NODE_ENV === "production") {
    app2.use((req, res, next) => {
      if (req.header("x-forwarded-proto") !== "https") {
        res.redirect(`https://${req.header("host")}${req.url}`);
        return;
      }
      next();
    });
  }
  app2.use((req, res, next) => {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://edge.fullstory.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; img-src 'self' data: blob: https: http:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://accounts.google.com https://oauth2.googleapis.com; frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://accounts.google.com; object-src 'none'; base-uri 'self'; form-action 'self';"
    );
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    );
    next();
  });
  if (process.env.NODE_ENV === "production") {
    const rateLimit = /* @__PURE__ */ new Map();
    app2.use((req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowMs = 15 * 60 * 1e3;
      const maxRequests = 100;
      if (!rateLimit.has(ip)) {
        rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
      }
      const userLimit = rateLimit.get(ip);
      if (now > userLimit.resetTime) {
        rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
      }
      if (userLimit.count >= maxRequests) {
        return res.status(429).json({
          error: "Too many requests, please try again later."
        });
      }
      userLimit.count++;
      next();
    });
  }
  app2.use(
    cors({
      origin: process.env.NODE_ENV === "production" ? ["http://localhost:8081", "http://127.0.0.1:8081"] : ["http://localhost:8080", "http://127.0.0.1:8080"],
      credentials: true,
      optionsSuccessStatus: 200
    })
  );
  app2.use(express__default.json({ limit: "2mb" }));
  app2.use(express__default.urlencoded({ extended: true, limit: "2mb" }));
  app2.use("/assets", (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Expires", new Date(Date.now() + 31536e6).toUTCString());
    next();
  });
  app2.use("/fonts", (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });
  app2.use((req, res, next) => {
    if (req.url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader(
        "Expires",
        new Date(Date.now() + 31536e6).toUTCString()
      );
    }
    next();
  });
  app2.use("/uploads", express__default.static("uploads", {
    maxAge: "1d",
    // Cache uploaded images for 1 day
    setHeaders: (res, path2) => {
      if (path2.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        res.setHeader("Cache-Control", "public, max-age=86400");
      }
    }
  }));
  app2.use(
    session({
      secret: process.env.JWT_SECRET || "session-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1e3
        // 24 hours
      }
    })
  );
  app2.use(passport.initialize());
  app2.use(passport.session());
  app2.get("/api/ping", (_req, res) => {
    res.json({ message: "E-commerce API is running!" });
  });
  app2.use("/api/auth", router$f);
  app2.use("/api/products", router$e);
  app2.use("/api/categories", router$d);
  app2.use("/api/cart", router$c);
  app2.use("/api/wishlist", router$b);
  app2.use("/api/upload", router$a);
  app2.use("/api/orders", router$9);
  app2.use("/api/checkout", router$8);
  app2.use("/api/reviews", router$7);
  app2.use("/api/search", router$4);
  app2.use("/api/addresses", router$3);
  app2.use("/api/settings", router$2);
  app2.use("/api/analytics", router$6);
  app2.use("/api/users", router$1);
  app2.use("/api/inventory", router);
  app2.use("/api/shiprocket", router$5);
  app2.use(
    (err, req, res, next) => {
      console.error("Error:", err);
      res.status(500).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong"
      });
    }
  );
  return app2;
}
const app = createServer();
const port = process.env.PORT || 3e3;
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map

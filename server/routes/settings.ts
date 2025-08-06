import express, { Request, Response } from "express";
import { z } from "zod";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import User from "../models/User";
import { getConnectionStatus } from "../config/database";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthRequest).user?.userId;
    const fileExtension = path.extname(file.originalname);
    cb(null, `avatar-${userId}-${Date.now()}${fileExtension}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'));
    }
  },
});

// User preferences schema
const preferencesSchema = z.object({
  newsletter: z.boolean().default(true),
  notifications: z.boolean().default(true),
  marketing: z.boolean().default(false),
  language: z.string().default("en"),
  currency: z.string().default("INR"),
  timezone: z.string().default("Asia/Kolkata"),
});

// Profile update schema
const profileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  avatar: z.string().url().optional(),
});

// Password change schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Password confirmation is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Get user settings
router.get("/", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected.",
      });
      return;
    }

    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const user = await User.findById(userId).select("-password -__v");
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
        twoFactorEnabled: user.twoFactorEnabled,
      },
      preferences: user.preferences || {
        newsletter: true,
        notifications: true,
        marketing: false,
        language: "en",
        currency: "INR",
        timezone: "Asia/Kolkata",
      },
      security: {
        twoFactorEnabled: user.twoFactorEnabled,
        lastLoginAt: user.lastLoginAt,
        passwordChangedAt: user.passwordChangedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// Update user preferences
router.put("/preferences", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected.",
      });
      return;
    }

    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const validatedData = preferencesSchema.parse(req.body);

    const user = await User.findByIdAndUpdate(
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
      preferences: user.preferences,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
      return;
    }

    console.error("Error updating preferences:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

// Update user profile
router.put("/profile", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected.",
      });
      return;
    }

    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const validatedData = profileUpdateSchema.parse(req.body);

    const user = await User.findByIdAndUpdate(
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
        avatar: user.avatar,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
      return;
    }

    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Change password
router.put("/password", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected.",
      });
      return;
    }

    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const validatedData = passwordChangeSchema.parse(req.body);

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(validatedData.currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedNewPassword = await bcrypt.hash(validatedData.newPassword, salt);

    // Update password
    user.password = hashedNewPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
      return;
    }

    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// Enable/Disable two-factor authentication
router.put("/2fa", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected.",
      });
      return;
    }

    const userId = (req as AuthRequest).user?.userId;
    const { enabled, secret, backupCodes } = req.body;

    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (enabled) {
      // Enable 2FA
      if (!secret) {
        res.status(400).json({ error: "2FA secret is required" });
        return;
      }

      user.twoFactorEnabled = true;
      user.twoFactorSecret = secret;
      user.backupCodes = backupCodes || [];
    } else {
      // Disable 2FA
      user.twoFactorEnabled = false;
      user.twoFactorSecret = undefined;
      user.backupCodes = undefined;
    }

    await user.save();

    res.json({
      message: `Two-factor authentication ${enabled ? 'enabled' : 'disabled'} successfully`,
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (error) {
    console.error("Error updating 2FA:", error);
    res.status(500).json({ error: "Failed to update two-factor authentication" });
  }
});

// Request account data export
router.post("/export", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected.",
      });
      return;
    }

    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    // In a real implementation, this would:
    // 1. Queue a background job to prepare the data export
    // 2. Send an email when ready
    // 3. Provide a secure download link

    res.json({
      message: "Data export request received. You will receive an email when your data is ready for download.",
      estimatedTime: "24-48 hours",
    });
  } catch (error) {
    console.error("Error requesting data export:", error);
    res.status(500).json({ error: "Failed to request data export" });
  }
});

// Request account deletion
router.post("/delete-account", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected.",
      });
      return;
    }

    const userId = (req as AuthRequest).user?.userId;
    const { password, reason } = req.body;

    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    if (!password) {
      res.status(400).json({ error: "Password is required to delete account" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(400).json({ error: "Password is incorrect" });
      return;
    }

    // In a real implementation, this would:
    // 1. Queue a background job to handle account deletion
    // 2. Send confirmation email
    // 3. Allow a grace period before actual deletion
    // 4. Anonymize or delete user data according to GDPR

    res.json({
      message: "Account deletion request received. You will receive a confirmation email.",
      deletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });
  } catch (error) {
    console.error("Error requesting account deletion:", error);
    res.status(500).json({ error: "Failed to request account deletion" });
  }
});

// Get notification settings
router.get("/notifications", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    // This would typically come from a separate notifications settings table
    // For now, return default settings
    const notificationSettings = {
      email: {
        orderUpdates: true,
        promotions: false,
        newsletter: true,
        security: true,
      },
      sms: {
        orderUpdates: true,
        promotions: false,
        security: true,
      },
      push: {
        orderUpdates: true,
        promotions: false,
        newProducts: false,
      },
    };

    res.json({ notifications: notificationSettings });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({ error: "Failed to fetch notification settings" });
  }
});

// Update notification settings
router.put("/notifications", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    // In a real implementation, you'd validate and save these settings
    const { email, sms, push } = req.body;

    res.json({
      message: "Notification settings updated successfully",
      notifications: { email, sms, push },
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ error: "Failed to update notification settings" });
  }
});

// Upload avatar
router.post("/avatar", authenticateToken, upload.single('avatar'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected.",
      });
      return;
    }

    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    try {
      // Upload to Cloudinary if configured
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'kiti-locks/avatars',
          public_id: `avatar-${userId}`,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        });

        // Delete local file after upload
        fs.unlinkSync(req.file.path);

        // Update user avatar URL in database
        await User.findByIdAndUpdate(userId, { avatar: result.secure_url });

        res.json({
          message: "Avatar uploaded successfully",
          avatar: result.secure_url,
        });
      } else {
        // Fallback to local storage
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        await User.findByIdAndUpdate(userId, { avatar: avatarUrl });

        res.json({
          message: "Avatar uploaded successfully",
          avatar: avatarUrl,
        });
      }
    } catch (uploadError) {
      console.error("Avatar upload error:", uploadError);
      // Clean up local file if it exists
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

// Delete avatar
router.delete("/avatar", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected.",
      });
      return;
    }

    const userId = (req as AuthRequest).user?.userId;
    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // If user has an avatar, try to delete it from Cloudinary or local storage
    if (user.avatar) {
      try {
        if (user.avatar.includes('cloudinary.com')) {
          // Extract public_id from Cloudinary URL and delete
          const publicId = user.avatar.split('/').pop()?.split('.')[0];
          if (publicId) {
            await cloudinary.uploader.destroy(`kiti-locks/avatars/${publicId}`);
          }
        } else if (user.avatar.startsWith('/uploads/')) {
          // Delete local file
          const filePath = path.join(process.cwd(), user.avatar);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      } catch (deleteError) {
        console.error("Error deleting avatar file:", deleteError);
        // Continue with database update even if file deletion fails
      }
    }

    // Remove avatar from database
    await User.findByIdAndUpdate(userId, { $unset: { avatar: 1 } });

    res.json({ message: "Avatar removed successfully" });
  } catch (error) {
    console.error("Error removing avatar:", error);
    res.status(500).json({ error: "Failed to remove avatar" });
  }
});

export default router;

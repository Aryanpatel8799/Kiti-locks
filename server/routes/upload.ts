import { Router, Request, Response } from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary";
import {
  authenticateToken,
  requireAdmin,
  AuthRequest,
} from "../middleware/auth";

const router = Router();

// Secure file validation
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

const isValidImage = (file: Express.Multer.File): boolean => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return false;
  }

  // Check file extension
  const ext = file.originalname.toLowerCase().match(/\.[^/.]+$/);
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext[0])) {
    return false;
  }

  // Check for malicious file names
  if (
    file.originalname.includes("..") ||
    file.originalname.includes("/") ||
    file.originalname.includes("\\")
  ) {
    return false;
  }

  return true;
};

// Configure multer for memory storage with enhanced security
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit (reduced for security)
    files: 5, // Maximum 5 files
    fieldNameSize: 100, // Limit field name size
    fieldSize: 1024 * 1024, // Limit field size to 1MB
  },
  fileFilter: (req, file, cb) => {
    try {
      // Enhanced security validation
      if (!isValidImage(file)) {
        cb(
          new Error(
            "Invalid file type. Only JPG, PNG, and WebP images are allowed.",
          ),
        );
        return;
      }

      // Check file size (additional check)
      if (file.size && file.size > 2 * 1024 * 1024) {
        cb(new Error("File too large. Maximum size is 2MB."));
        return;
      }

      cb(null, true);
    } catch (error) {
      cb(new Error("File validation failed"));
    }
  },
});

// Upload single image
router.post(
  "/image",
  authenticateToken,
  requireAdmin,
  upload.single("image"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No image file provided" });
        return;
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "kiti-locks",
              resource_type: "image",
              transformation: [
                { width: 800, height: 800, crop: "limit" },
                { quality: "auto:best" },
                { format: "auto" },
                { flags: "sanitize" }, // Sanitize uploaded images
              ],
              // Security options
              upload_preset: undefined, // Don't allow unsigned uploads
              public_id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          )
          .end(req.file!.buffer);
      });

      const uploadResult = result as any;

      res.json({
        message: "Image uploaded successfully",
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      });
    } catch (error) {
      console.error("Image upload error:", error);
      res.status(500).json({ error: "Failed to upload image" });
    }
  },
);

// Upload multiple images
router.post(
  "/images",
  authenticateToken,
  requireAdmin,
  upload.array("images", 5),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.status(400).json({ error: "No image files provided" });
        return;
      }

      // Upload all images to Cloudinary
      const uploadPromises = files.map((file) => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "kiti-locks",
                resource_type: "image",
                transformation: [
                  { width: 800, height: 800, crop: "limit" },
                  { quality: "auto:best" },
                  { format: "auto" },
                  { flags: "sanitize" },
                ],
                public_id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              },
            )
            .end(file.buffer);
        });
      });

      const results = await Promise.all(uploadPromises);

      const urls = results.map((result: any) => ({
        url: result.secure_url,
        publicId: result.public_id,
      }));

      res.json({
        message: "Images uploaded successfully",
        images: urls,
      });
    } catch (error) {
      console.error("Images upload error:", error);
      res.status(500).json({ error: "Failed to upload images" });
    }
  },
);

// Upload avatar for user profile
router.post(
  "/avatar",
  authenticateToken,
  upload.single("avatar"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No avatar file provided" });
        return;
      }

      // Validate file type and size
      if (!isValidImage(req.file)) {
        res.status(400).json({ error: "Invalid image file type" });
        return;
      }

      if (req.file.size > 5 * 1024 * 1024) {
        // 5MB limit
        res.status(400).json({ error: "File size too large (max 5MB)" });
        return;
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "avatars",
          transformation: [
            { width: 400, height: 400, crop: "fill" }, // Square avatar
            { quality: "auto" }, // Auto quality
            { flags: "sanitize" }, // Sanitize uploaded images
          ],
        },
      );

      // Update user's avatar URL in database
      const User = (await import("../models/User")).default;
      await User.findByIdAndUpdate(req.user?.userId, {
        avatar: result.secure_url,
      });

      res.json({
        message: "Avatar uploaded successfully",
        avatarUrl: result.secure_url,
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  },
);

// Delete image from Cloudinary
router.delete(
  "/image/:publicId",
  authenticateToken,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { publicId } = req.params;

      await cloudinary.uploader.destroy(publicId);

      res.json({
        message: "Image deleted successfully",
      });
    } catch (error) {
      console.error("Image delete error:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  },
);

export default router;

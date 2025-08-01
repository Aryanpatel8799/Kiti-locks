import { Router, Request, Response } from "express";
import { z } from "zod";
import passport from "passport";
import User from "../models/User";
import { generateTokens, verifyRefreshToken } from "../utils/jwt";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { getConnectionStatus } from "../config/database";
import TwoFactorService from "../services/twoFactorService";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  googleId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields for normal registration
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const user = new User({
      name,
      email,
      password,
    });

    await user.save();

    const { accessToken, refreshToken } = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
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

    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Login attempt for email:", req.body.email);
    const { email, password, twoFactorToken } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      res
        .status(423)
        .json({
          error:
            "Account is temporarily locked due to too many failed attempts",
        });
      return;
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      await user.incrementLoginAttempts();
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Check 2FA for admin users
    if (user.role === "admin" && user.twoFactorEnabled) {
      if (!twoFactorToken) {
        res.status(200).json({
          requiresTwoFactor: true,
          message: "Two-factor authentication required",
        });
        return;
      }

      // Rate limit 2FA attempts
      const rateLimit = TwoFactorService.checkRateLimit(`2fa_${user._id}`);
      if (!rateLimit.allowed) {
        res
          .status(429)
          .json({ error: "Too many 2FA attempts. Please try again later." });
        return;
      }

      // Verify 2FA token
      const isValidToken = TwoFactorService.verifyToken(
        twoFactorToken,
        user.twoFactorSecret!,
      );

      if (!isValidToken) {
        // Check if it's a backup code
        if (user.backupCodes && user.backupCodes.length > 0) {
          const backupResult = TwoFactorService.verifyHashedBackupCode(
            twoFactorToken,
            user.backupCodes,
          );

          if (backupResult.valid) {
            // Update remaining backup codes
            user.backupCodes = backupResult.remainingCodes;
            await user.save();
          } else {
            res
              .status(401)
              .json({ error: "Invalid two-factor authentication code" });
            return;
          }
        } else {
          res
            .status(401)
            .json({ error: "Invalid two-factor authentication code" });
          return;
        }
      }

      // Reset 2FA rate limit on successful verification
      TwoFactorService.resetRateLimit(`2fa_${user._id}`);
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    const { accessToken, refreshToken } = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      tokens: {
        accessToken,
        refreshToken,
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

    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.json({
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
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

    res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.get(
  "/me",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const user = await User.findById(authReq.user?.userId)
        .select("-password")
        .populate("wishlist");

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
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user data" });
    }
  },
);

router.put(
  "/profile",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const updateData = req.body;
      delete updateData.password;
      delete updateData.email;
      delete updateData.role;

      const user = await User.findByIdAndUpdate(authReq.user?.userId, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  },
);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.post("/google", async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("Google OAuth login attempt");
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({ error: "Google credential is required" });
      return;
    }

    // Verify the Google credential token
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`,
    );

    if (!response.ok) {
      res.status(401).json({ error: "Invalid Google credential" });
      return;
    }

    const googleUser = await response.json() as {
      email: string;
      name: string;
      picture: string;
      sub: string;
    };

    // Check if user exists
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      // Create new user
      user = new User({
        name: googleUser.name,
        email: googleUser.email,
        avatar: googleUser.picture,
        googleId: googleUser.sub,
        isVerified: true,
      });
      await user.save();
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    res.json({
      message: "Google login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Google OAuth error:", error);
    res.status(500).json({ error: "Google authentication failed" });
  }
});

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user as any;

      if (!user) {
        res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
        return;
      }

      // Generate JWT tokens
      const { accessToken, refreshToken } = generateTokens({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Redirect to frontend with tokens
      res.redirect(
        `${process.env.CLIENT_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`,
      );
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
    }
  },
);

// Get user profile
router.get(
  "/profile",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.userId;

      if (!getConnectionStatus()) {
        res.json({
          profile: {
            name: authReq.user!.email, // Use email as fallback for name
            email: authReq.user!.email,
            phone: "",
            bio: "",
            preferences: {
              newsletter: true,
              notifications: true,
              marketing: false,
            },
          },
        });
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
          phone: user.phone || "",
          bio: user.bio || "",
          avatar: user.avatar || "",
          preferences: user.preferences || {
            newsletter: true,
            notifications: true,
            marketing: false,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  },
);

// Get current user info
router.get(
  "/me",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const user = authReq.user!;
      
      // Get full user data from database
      const fullUser = await User.findById(user.userId).select("-password");
      
      res.json({
        user: {
          id: user.userId,
          name: fullUser?.name || user.email,
          email: user.email,
          role: user.role,
          avatar: fullUser?.avatar,
        },
      });
    } catch (error) {
      console.error("Error fetching user info:", error);
      res.status(500).json({ error: "Failed to fetch user info" });
    }
  },
);

// Update user profile
router.put(
  "/profile",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const userId = authReq.user!.userId;
      const { name, phone, bio, preferences } = req.body;

      if (!getConnectionStatus()) {
        res.status(503).json({ error: "Database connection required" });
        return;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(bio && { bio }),
          ...(preferences && { preferences }),
        },
        { new: true },
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
          preferences: user.preferences,
        },
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  },
);

// 2FA setup routes for admin users
router.post(
  "/2fa/setup",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const user = await User.findById(authReq.user?.userId);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      if (user.twoFactorEnabled) {
        res
          .status(400)
          .json({ error: "Two-factor authentication is already enabled" });
        return;
      }

      const { secret, qrCodeUrl, backupCodes } =
        TwoFactorService.generateSecret(user.email);
      const qrCodeDataUrl = await TwoFactorService.generateQRCode(qrCodeUrl);

      // Store the secret temporarily (not enabled yet)
      user.twoFactorSecret = secret;
      await user.save();

      res.json({
        qrCode: qrCodeDataUrl,
        secret,
        backupCodes,
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      res
        .status(500)
        .json({ error: "Failed to setup two-factor authentication" });
    }
  },
);

router.post(
  "/2fa/verify",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ error: "Token is required" });
        return;
      }

      const authReq = req as AuthRequest;
      const user = await User.findById(authReq.user?.userId);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      if (!user.twoFactorSecret) {
        res
          .status(400)
          .json({ error: "Two-factor authentication setup not initiated" });
        return;
      }

      const isValidToken = TwoFactorService.verifyToken(
        token,
        user.twoFactorSecret,
      );

      if (!isValidToken) {
        res.status(401).json({ error: "Invalid token" });
        return;
      }

      // Enable 2FA and generate backup codes
      const backupCodes = TwoFactorService.generateBackupCodes();
      user.twoFactorEnabled = true;
      user.backupCodes = TwoFactorService.hashBackupCodes(backupCodes);
      await user.save();

      res.json({
        message: "Two-factor authentication enabled successfully",
        backupCodes,
      });
    } catch (error) {
      console.error("2FA verification error:", error);
      res
        .status(500)
        .json({ error: "Failed to verify two-factor authentication" });
    }
  },
);

router.post(
  "/2fa/disable",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { password, token } = req.body;

      if (!password || !token) {
        res.status(400).json({ error: "Password and token are required" });
        return;
      }

      const authReq = req as AuthRequest;
      const user = await User.findById(authReq.user?.userId);
      if (!user || user.role !== "admin") {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      // Verify password
      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        res.status(401).json({ error: "Invalid password" });
        return;
      }

      // Verify 2FA token
      if (!user.twoFactorSecret) {
        res
          .status(400)
          .json({ error: "Two-factor authentication is not enabled" });
        return;
      }

      const isValidToken = TwoFactorService.verifyToken(
        token,
        user.twoFactorSecret,
      );
      if (!isValidToken) {
        res.status(401).json({ error: "Invalid token" });
        return;
      }

      // Disable 2FA
      user.twoFactorEnabled = false;
      user.twoFactorSecret = undefined;
      user.backupCodes = undefined;
      await user.save();

      res.json({
        message: "Two-factor authentication disabled successfully",
      });
    } catch (error) {
      console.error("2FA disable error:", error);
      res
        .status(500)
        .json({ error: "Failed to disable two-factor authentication" });
    }
  },
);

// Get total user count (admin only)
router.get("/users/count", authenticateToken, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user count" });
  }
});

export default router;

import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "./config/passport";
import connectDB from "./config/database";
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import categoryRoutes from "./routes/categories";
import cartRoutes from "./routes/cart";
import wishlistRoutes from "./routes/wishlist";
import uploadRoutes from "./routes/upload";
import orderRoutes from "./routes/orders";
import checkoutRoutes from "./routes/checkout";
import reviewRoutes from "./routes/reviews";
import analyticsRoutes from "./routes/analytics";
import shiprocketRoutes from "./routes/shiprocketRoutes";
import searchRoutes from "./routes/search";
import addressRoutes from "./routes/addresses";
import settingsRoutes from "./routes/settings";
import usersRoutes from "./routes/users";
import inventoryRoutes from "./routes/inventory";

export function createServer() {
  const app = express();

  // Try to connect to MongoDB (non-blocking)
  connectDB().catch(console.warn);

  // Security middleware
  // Force HTTPS in production
  if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
      if (req.header("x-forwarded-proto") !== "https") {
        res.redirect(`https://${req.header("host")}${req.url}`);
        return;
      }
      next();
    });
  }

  // Security headers
  app.use((req, res, next) => {
    // HTTPS-only and security headers
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );

    // Content Security Policy
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://edge.fullstory.com https://accounts.google.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com; " +
        "img-src 'self' data: blob: https: http:; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://accounts.google.com https://oauth2.googleapis.com; " +
        "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://accounts.google.com; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self';",
    );

    // Other security headers
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );

    next();
  });

  // Rate limiting middleware (disabled in development)
  if (process.env.NODE_ENV === "production") {
    const rateLimit = new Map();
    app.use((req, res, next) => {
      const ip = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      const windowMs = 15 * 60 * 1000; // 15 minutes
      const maxRequests = 100; // Max requests per window

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
          error: "Too many requests, please try again later.",
        });
      }

      userLimit.count++;
      next();
    });
  }

  // CORS with security considerations
  app.use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? ["http://localhost:8081","http://127.0.0.1:8081"]
          : ["http://localhost:8080", "http://127.0.0.1:8080"],
      credentials: true,
      optionsSuccessStatus: 200,
    }),
  );

  // Body parsing with security limits
  app.use(express.json({ limit: "2mb" })); // Reduced from 10mb for security
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));

  // Static asset caching headers
  app.use("/assets", (req, res, next) => {
    // Cache static assets for 1 year
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Expires", new Date(Date.now() + 31536000000).toUTCString());
    next();
  });

  // Font caching
  app.use("/fonts", (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  });

  // Image caching
  app.use((req, res, next) => {
    if (req.url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader(
        "Expires",
        new Date(Date.now() + 31536000000).toUTCString(),
      );
    }
    next();
  });

  // Serve uploaded files (avatars, etc.)
  app.use('/uploads', express.static('uploads', {
    maxAge: '1d', // Cache uploaded images for 1 day
    setHeaders: (res, path) => {
      if (path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
      }
    }
  }));

  // Session middleware
  app.use(
    session({
      secret: process.env.JWT_SECRET || "session-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );

  // Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "E-commerce API is running!" });
  });

  // Authentication routes
  app.use("/api/auth", authRoutes);

  // Product routes
  app.use("/api/products", productRoutes);

  // Category routes
  app.use("/api/categories", categoryRoutes);

  // Cart routes
  app.use("/api/cart", cartRoutes);

  // Wishlist routes
  app.use("/api/wishlist", wishlistRoutes);

  // Upload routes
  app.use("/api/upload", uploadRoutes);

  // Orders routes
  app.use("/api/orders", orderRoutes);

  // Checkout routes
  app.use("/api/checkout", checkoutRoutes);

  // Review routes
  app.use("/api/reviews", reviewRoutes);

  // Search routes
  app.use("/api/search", searchRoutes);

  // Address routes
  app.use("/api/addresses", addressRoutes);

  // User settings routes
  app.use("/api/settings", settingsRoutes);

  // Analytics routes
  app.use("/api/analytics", analyticsRoutes);

  // Users management routes (admin only)
  app.use("/api/users", usersRoutes);

  // Inventory management routes (admin only)
  app.use("/api/inventory", inventoryRoutes);

  // Shiprocket routes
  app.use("/api/shiprocket", shiprocketRoutes);

  // Error handling middleware
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      console.error("Error:", err);
      res.status(500).json({
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Something went wrong",
      });
    },
  );

  return app;
}

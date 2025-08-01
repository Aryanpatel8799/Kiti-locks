import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, TokenPayload } from "../utils/jwt";
import User from "../models/User";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    id: string; // Backward compatibility
    email: string;
    role: string;
  };
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    // Cast request to AuthRequest and assign user data
    (req as AuthRequest).user = {
      userId: decoded.userId,
      id: decoded.userId, // Backward compatibility
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authReq = req as AuthRequest;
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

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select("-password");

      if (user) {
        (req as AuthRequest).user = {
          userId: decoded.userId,
          id: decoded.userId, // Backward compatibility
          email: decoded.email,
          role: decoded.role,
        };
      }
    }

    next();
  } catch (error) {
    next();
  }
};

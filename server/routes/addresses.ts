import express, { Request, Response } from "express";
import { z } from "zod";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import User, { IAddress } from "../models/User";
import { getConnectionStatus } from "../config/database";

const router = express.Router();

// Address validation schema
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
  isDefault: z.boolean().default(false),
});

// Get all user addresses
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

    const user = await User.findById(userId).select("addresses");
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

// Add new address
router.post("/", authenticateToken, async (req: Request, res: Response): Promise<void> => {
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

    const validatedData = addressSchema.parse(req.body);

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // If this is set as default, unset other defaults of the same type
    if (validatedData.isDefault) {
      user.addresses = user.addresses.map((addr: IAddress) =>
        addr.type === validatedData.type ? { ...addr, isDefault: false } : addr
      );
    }

    // If this is the first address of this type, make it default
    const hasAddressOfType = user.addresses.some(
      (addr: IAddress) => addr.type === validatedData.type
    );
    if (!hasAddressOfType) {
      validatedData.isDefault = true;
    }

    // Add new address
    user.addresses.push(validatedData as IAddress);
    await user.save();

    const newAddress = user.addresses[user.addresses.length - 1];
    res.status(201).json({
      message: "Address added successfully",
      address: newAddress,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
      return;
    }

    console.error("Error adding address:", error);
    res.status(500).json({ error: "Failed to add address" });
  }
});

// Update address
router.put("/:addressId", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected.",
      });
      return;
    }

    const userId = (req as AuthRequest).user?.userId;
    const { addressId } = req.params;

    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const validatedData = addressSchema.parse(req.body);

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const addressIndex = user.addresses.findIndex(
      (addr: IAddress) => addr._id?.toString() === addressId
    );

    if (addressIndex === -1) {
      res.status(404).json({ error: "Address not found" });
      return;
    }

    // If this is set as default, unset other defaults of the same type
    if (validatedData.isDefault) {
      user.addresses = user.addresses.map((addr: IAddress, index: number) =>
        addr.type === validatedData.type && index !== addressIndex
          ? { ...addr, isDefault: false }
          : addr
      );
    }

    // Update the address
    user.addresses[addressIndex] = { ...user.addresses[addressIndex], ...validatedData };
    await user.save();

    res.json({
      message: "Address updated successfully",
      address: user.addresses[addressIndex],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "Validation failed",
        details: error.errors,
      });
      return;
    }

    console.error("Error updating address:", error);
    res.status(500).json({ error: "Failed to update address" });
  }
});

// Delete address
router.delete("/:addressId", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected.",
      });
      return;
    }

    const userId = (req as AuthRequest).user?.userId;
    const { addressId } = req.params;

    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const addressIndex = user.addresses.findIndex(
      (addr: IAddress) => addr._id?.toString() === addressId
    );

    if (addressIndex === -1) {
      res.status(404).json({ error: "Address not found" });
      return;
    }

    const deletedAddress = user.addresses[addressIndex];
    user.addresses.splice(addressIndex, 1);

    // If deleted address was default, make another address of same type default
    if (deletedAddress.isDefault) {
      const sameTypeAddress = user.addresses.find(
        (addr: IAddress) => addr.type === deletedAddress.type
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

// Set default address
router.put("/:addressId/default", authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!getConnectionStatus()) {
      res.status(503).json({
        error: "Database connection required. Please ensure MongoDB is connected.",
      });
      return;
    }

    const userId = (req as AuthRequest).user?.userId;
    const { addressId } = req.params;

    if (!userId) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const targetAddress = user.addresses.find(
      (addr: IAddress) => addr._id?.toString() === addressId
    );

    if (!targetAddress) {
      res.status(404).json({ error: "Address not found" });
      return;
    }

    // Unset other defaults of the same type
    user.addresses = user.addresses.map((addr: IAddress) =>
      addr.type === targetAddress.type
        ? { ...addr, isDefault: addr._id?.toString() === addressId }
        : addr
    );

    await user.save();

    res.json({ message: "Default address updated successfully" });
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({ error: "Failed to set default address" });
  }
});

export default router;

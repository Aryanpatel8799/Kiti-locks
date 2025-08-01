import { Router } from "express";
import {
  createOrder,
  trackOrder,
  cancelOrder,
  getOrders,
  getOrderById,
  checkApiStatus
} from "../controllers/shiprocketController";
import { authenticateToken, requireAdmin } from "../middleware/auth";

const router = Router();

/**
 * @route   GET /api/shiprocket/status
 * @desc    Check Shiprocket API status and permissions
 * @access  Private (Admin only)
 */
router.get("/status", authenticateToken, requireAdmin, checkApiStatus);

/**
 * @route   POST /api/shiprocket/create
 * @desc    Create a new order in Shiprocket
 * @access  Private (Admin or User)
 */
router.post("/create", authenticateToken, createOrder);

/**
 * @route   GET /api/shiprocket/track/:awb
 * @desc    Track an order using AWB code
 * @access  Public (Can be accessed by anyone with AWB)
 */
router.get("/track/:awb", trackOrder);

/**
 * @route   POST /api/shiprocket/cancel
 * @desc    Cancel an order/shipment
 * @access  Private (Admin only)
 */
router.post("/cancel", authenticateToken, requireAdmin, cancelOrder);

/**
 * @route   GET /api/shiprocket/orders
 * @desc    Get all orders with optional filtering
 * @access  Private (Admin only)
 */
router.get("/orders", authenticateToken, requireAdmin, getOrders);

/**
 * @route   GET /api/shiprocket/orders/:orderId
 * @desc    Get order details by order ID
 * @access  Private (Admin or User who created the order)
 */
router.get("/orders/:orderId", authenticateToken, getOrderById);

export default router;

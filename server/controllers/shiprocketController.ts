import { Request, Response } from "express";
import ShiprocketOrder from "../models/ShiprocketOrder";
import { makeShiprocketRequest, checkShiprocketPermissions } from "../utils/shiprocketAuth";

interface CreateOrderRequest extends Request {
  body: {
    order_id: string;
    customer: {
      name: string;
      email: string;
      phone: string;
    };
    address: {
      full: string;
      city: string;
      state: string;
      country?: string;
      pincode: string;
    };
    items: Array<{
      name: string;
      sku: string;
      quantity: number;
      price: number;
      weight?: number;
      length?: number;
      breadth?: number;
      height?: number;
    }>;
    payment_method?: 'COD' | 'Prepaid';
    weight?: number;
    dimensions?: {
      length: number;
      breadth: number;
      height: number;
    };
    shipping_charges?: number;
    total_discount?: number;
    comment?: string;
  };
}

interface CancelOrderRequest extends Request {
  body: {
    shipment_id: string;
    comment?: string;
  };
}

/**
 * Check Shiprocket API permissions and status
 */
export const checkApiStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const permissions = await checkShiprocketPermissions();
    
    res.status(200).json({
      success: true,
      message: 'Shiprocket API status checked',
      data: {
        api_accessible: !permissions.error,
        permissions: permissions,
        recommendations: permissions.error ? [
          'Contact Shiprocket support to enable API permissions',
          'Verify your Shiprocket account is fully activated',
          'Check if your account has the required API access level'
        ] : []
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to check API status',
      details: error.message
    });
  }
};

/**
 * Create a new order in Shiprocket with enhanced error handling
 */
export const createOrder = async (req: CreateOrderRequest, res: Response): Promise<void> => {
  try {
    const {
      order_id,
      customer,
      address,
      items,
      payment_method = 'Prepaid',
      weight,
      dimensions,
      shipping_charges = 0,
      total_discount = 0,
      comment
    } = req.body;

    // Validate required fields
    if (!order_id || !customer || !address || !items || items.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: order_id, customer, address, and items are required'
      });
      return;
    }

    // Check if order already exists
    const existingOrder = await ShiprocketOrder.findOne({ order_id });
    if (existingOrder) {
      res.status(409).json({
        success: false,
        error: 'Order with this ID already exists',
        data: existingOrder
      });
      return;
    }

    // Check API permissions first
    const permissions = await checkShiprocketPermissions();
    if (!permissions.canCreateOrders) {
      res.status(403).json({
        success: false,
        error: 'Shiprocket API Permission Error',
        details: permissions.error,
        recommendations: [
          'Contact Shiprocket support to enable order creation permissions',
          'Verify your Shiprocket account is fully activated',
          'Check if your account has the required API access level'
        ]
      });
      return;
    }

    // Calculate total order value
    const orderValue = items.reduce((total, item) => total + (item.price * item.quantity), 0);

    // Prepare Shiprocket API payload
    const shiprocketPayload = {
      order_id: order_id,
      order_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      pickup_location: "Primary", // This should be configured in Shiprocket dashboard
      channel_id: "", // Optional
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
      order_items: items.map(item => ({
        name: item.name,
        sku: item.sku,
        units: item.quantity,
        selling_price: item.price,
        discount: "",
        tax: "",
        hsn: 441122 // Default HSN code, should be product-specific
      })),
      payment_method: payment_method,
      shipping_charges: shipping_charges,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: total_discount,
      sub_total: orderValue,
      length: dimensions?.length || 10,
      breadth: dimensions?.breadth || 10,
      height: dimensions?.height || 10,
      weight: weight || 0.5
    };

    // Call Shiprocket API to create order
    const shiprocketResponse = await makeShiprocketRequest(
      'POST',
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      shiprocketPayload
    );

    if (!shiprocketResponse.order_id) {
      res.status(400).json({
        success: false,
        error: 'Failed to create order in Shiprocket',
        details: shiprocketResponse
      });
      return;
    }

    // Save order to MongoDB
    const newOrder = new ShiprocketOrder({
      order_id: order_id,
      shipment_id: shiprocketResponse.shipment_id?.toString(),
      awb_code: shiprocketResponse.awb_code,
      status: 'NEW',
      customer: customer,
      address: address,
      items: items,
      weight: weight || 0.5,
      dimensions: dimensions || { length: 10, breadth: 10, height: 10 },
      payment_method: payment_method,
      shipping_charges: shipping_charges,
      total_discount: total_discount,
      cod_amount: payment_method === 'COD' ? orderValue : 0,
      comment: comment
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order_id: savedOrder.order_id,
        shipment_id: savedOrder.shipment_id,
        awb_code: savedOrder.awb_code,
        status: savedOrder.status,
        shiprocket_response: shiprocketResponse
      }
    });

  } catch (error: any) {
    console.error('Create order error:', error);
    
    // Handle specific permission errors
    if (error.message.includes('Permission Error') || error.message.includes('403')) {
      res.status(403).json({
        success: false,
        error: 'Shiprocket API Permission Error',
        details: error.message,
        recommendations: [
          'Contact Shiprocket support to enable order creation permissions',
          'Verify your Shiprocket account is fully activated',
          'Check if your account has the required API access level'
        ]
      });
      return;
    }
    
    if (error.response && error.response.data) {
      res.status(error.response.status || 500).json({
        success: false,
        error: 'Shiprocket API error',
        details: error.response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};

/**
 * Track an order using AWB code
 */
export const trackOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { awb } = req.params;

    if (!awb) {
      res.status(400).json({
        success: false,
        error: 'AWB code is required'
      });
      return;
    }

    // Find order in database
    const order = await ShiprocketOrder.findByAwb(awb);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found with provided AWB code'
      });
      return;
    }

    // Get tracking information from Shiprocket
    const trackingResponse = await makeShiprocketRequest(
      'GET',
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`
    );

    // Update order status if different
    if (trackingResponse.tracking_data && trackingResponse.tracking_data.track_status) {
      const latestStatus = trackingResponse.tracking_data.track_status;
      if (order.status !== latestStatus) {
        await order.updateStatus(latestStatus);
      }
    }

    // Format tracking data for frontend
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
      message: 'Tracking information retrieved successfully',
      data: trackingInfo
    });

  } catch (error: any) {
    console.error('Track order error:', error);
    
    if (error.response && error.response.status === 404) {
      res.status(404).json({
        success: false,
        error: 'Tracking information not available for this AWB code'
      });
    } else if (error.response && error.response.data) {
      res.status(error.response.status || 500).json({
        success: false,
        error: 'Shiprocket tracking API error',
        details: error.response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};

/**
 * Cancel an order/shipment
 */
export const cancelOrder = async (req: CancelOrderRequest, res: Response): Promise<void> => {
  try {
    const { shipment_id, comment } = req.body;

    if (!shipment_id) {
      res.status(400).json({
        success: false,
        error: 'Shipment ID is required'
      });
      return;
    }

    // Find order in database
    const order = await ShiprocketOrder.findByShipmentId(shipment_id);
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found with provided shipment ID'
      });
      return;
    }

    // Check if order can be cancelled
    const nonCancellableStatuses = ['DELIVERED', 'CANCELLED', 'RTO_DELIVERED'];
    if (nonCancellableStatuses.includes(order.status)) {
      res.status(400).json({
        success: false,
        error: `Cannot cancel order with status: ${order.status}`
      });
      return;
    }

    // Cancel order in Shiprocket
    const cancelPayload = {
      awbs: [order.awb_code]
    };

    const cancelResponse = await makeShiprocketRequest(
      'POST',
      'https://apiv2.shiprocket.in/v1/external/orders/cancel',
      cancelPayload
    );

    // Update order status in database
    await order.updateStatus('CANCELLED');
    if (comment) {
      order.comment = comment;
      await order.save();
    }

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        order_id: order.order_id,
        shipment_id: order.shipment_id,
        awb_code: order.awb_code,
        status: order.status,
        cancelled_date: order.cancelled_date,
        shiprocket_response: cancelResponse
      }
    });

  } catch (error: any) {
    console.error('Cancel order error:', error);
    
    if (error.response && error.response.data) {
      res.status(error.response.status || 500).json({
        success: false,
        error: 'Shiprocket cancellation API error',
        details: error.response.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
};

/**
 * Get all orders with optional filtering
 */
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      status, 
      customer_email, 
      awb_code, 
      order_id,
      page = 1, 
      limit = 10 
    } = req.query;

    // Build filter object
    const filter: any = {};
    if (status) filter.status = status;
    if (customer_email) filter['customer.email'] = customer_email;
    if (awb_code) filter.awb_code = awb_code;
    if (order_id) filter.order_id = order_id;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Get orders with pagination
    const orders = await ShiprocketOrder.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-__v');

    const totalOrders = await ShiprocketOrder.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / Number(limit));

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
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

  } catch (error: any) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

/**
 * Get order details by order ID
 */
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    const order = await ShiprocketOrder.findOne({ order_id: orderId });
    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Order details retrieved successfully',
      data: order
    });

  } catch (error: any) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};

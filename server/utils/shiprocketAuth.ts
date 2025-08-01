import axios from 'axios';

interface ShiprocketLoginResponse {
  token: string;
  [key: string]: any;
}

let cachedToken: string | null = null;
let tokenExpiry: Date | null = null;
let lastLoginAttempt: Date | null = null;
let loginAttemptCount = 0;
let isRateLimited = false;
let rateLimitResetTime: Date | null = null;
let consecutiveFailures = 0;

/**
 * Get Shiprocket authentication token with improved error handling
 * Caches token to avoid repeated login calls
 */
export const getShiprocketToken = async (): Promise<string> => {
  try {
    // Check if we're currently rate limited
    if (isRateLimited && rateLimitResetTime && new Date() < rateLimitResetTime) {
      const minutesLeft = Math.ceil((rateLimitResetTime.getTime() - Date.now()) / (1000 * 60));
      throw new Error(`Shiprocket API is rate limited. Please try again in ${minutesLeft} minutes.`);
    }

    // Check if we have a valid cached token
    if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
      console.log('✅ Using cached Shiprocket token');
      return cachedToken;
    }

    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    const nodeEnv = process.env.NODE_ENV;

    if (!email || !password) {
      console.warn('⚠️ Shiprocket credentials not found in environment variables');
      console.warn('Please set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in your .env file');
      
      // In development, use mock token if credentials are missing
      if (nodeEnv === 'development') {
        console.warn('⚠️ Development mode: Using mock Shiprocket token due to missing credentials');
        cachedToken = 'mock_token_for_development';
        tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
        return cachedToken;
      }
      
      throw new Error('Shiprocket credentials not found in environment variables');
    }

    // Enhanced rate limiting with exponential backoff
    if (lastLoginAttempt) {
      const timeSinceLastAttempt = Date.now() - lastLoginAttempt.getTime();
      const minInterval = Math.min(60000 * Math.pow(2, consecutiveFailures), 300000); // Max 5 minutes
      
      if (timeSinceLastAttempt < minInterval) {
        const secondsLeft = Math.ceil((minInterval - timeSinceLastAttempt) / 1000);
        throw new Error(`Rate limited: Please wait ${secondsLeft} seconds before making another Shiprocket login attempt`);
      }
    }

    // Development bypass - use mock data if too many attempts or consecutive failures
    if (nodeEnv === 'development' && (loginAttemptCount > 3 || consecutiveFailures > 2)) {
      console.warn('⚠️ Development mode: Using mock Shiprocket token due to rate limiting or consecutive failures');
      cachedToken = 'mock_token_for_development';
      tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
      return cachedToken;
    }

    console.log('🔑 Attempting Shiprocket authentication...');
    lastLoginAttempt = new Date();
    loginAttemptCount++;

    const loginData = {
      email: email,
      password: password
    };

    const response = await axios.post<ShiprocketLoginResponse>(
      'https://apiv2.shiprocket.in/v1/external/auth/login',
      loginData,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BuilderCurry/1.0'
        },
        timeout: 15000 // Increased timeout to 15 seconds
      }
    );

    if (response.data && response.data.token) {
      cachedToken = response.data.token;
      // Set token expiry to 23 hours from now (tokens typically expire in 24 hours)
      tokenExpiry = new Date(Date.now() + 23 * 60 * 60 * 1000);
      
      // Reset all failure counters on successful login
      isRateLimited = false;
      rateLimitResetTime = null;
      loginAttemptCount = 0;
      consecutiveFailures = 0;
      
      console.log('✅ Shiprocket token obtained successfully');
      return cachedToken;
    } else {
      throw new Error('Invalid response from Shiprocket login API');
    }
  } catch (error: any) {
    console.error('❌ Shiprocket authentication failed:', error.message);
    
    // Increment failure counters
    consecutiveFailures++;
    
    // Clear cached token on error
    cachedToken = null;
    tokenExpiry = null;
    
    if (error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data?.message || error.response.statusText;
      
      if (status === 403) {
        // Handle 403 errors specifically
        if (errorMessage.includes('permission') || errorMessage.includes('Unauthorized')) {
          throw new Error(`Shiprocket API Permission Error: ${errorMessage}. Please contact Shiprocket support to enable API permissions for your account.`);
        } else {
          throw new Error(`Shiprocket login failed: Invalid credentials or account not activated. Please verify your Shiprocket account credentials.`);
        }
      } else if (status === 429) {
        // Handle rate limiting
        isRateLimited = true;
        rateLimitResetTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        throw new Error(`Shiprocket API rate limited. Please try again in 5 minutes.`);
      } else if (status === 401) {
        throw new Error(`Shiprocket login failed: Invalid credentials. Please check your email and password.`);
      } else {
        throw new Error(`Shiprocket login failed: ${errorMessage} (Status: ${status})`);
      }
    } else if (error.request) {
      throw new Error('Unable to connect to Shiprocket API. Please check your internet connection.');
    } else {
      throw new Error(`Shiprocket authentication error: ${error.message}`);
    }
  }
};

/**
 * Clear cached token (useful for forced re-authentication)
 */
export const clearShiprocketToken = (): void => {
  cachedToken = null;
  tokenExpiry = null;
  consecutiveFailures = 0;
  isRateLimited = false;
  rateLimitResetTime = null;
};

/**
 * Make authenticated request to Shiprocket API with enhanced error handling
 */
export const makeShiprocketRequest = async (method: string, url: string, data: any = null): Promise<any> => {
  try {
    const token = await getShiprocketToken();
    
    const config: any = {
      method: method,
      url: url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'BuilderCurry/1.0'
      },
      timeout: 15000
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error: any) {
    // Handle specific permission errors
    if (error.response && error.response.status === 403) {
      const errorMessage = error.response.data?.message || 'Permission denied';
      
      // Check if it's a permission issue and provide helpful guidance
      if (errorMessage.includes('permission') || errorMessage.includes('Unauthorized')) {
        throw new Error(`Shiprocket API Permission Error: ${errorMessage}. Please contact Shiprocket support to enable API permissions for your account.`);
      }
    }
    
    // If token expired, try once more with fresh token
    if (error.response && error.response.status === 401) {
      clearShiprocketToken();
      const token = await getShiprocketToken();
      
      const config: any = {
        method: method,
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'BuilderCurry/1.0'
        },
        timeout: 15000
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

/**
 * Create Shiprocket order from local order data with enhanced error handling
 */
export const createShiprocketOrder = async (orderData: {
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    weight?: number;
  }>;
  payment_method: 'COD' | 'Prepaid';
  sub_total: number;
  length?: number;
  breadth?: number;
  height?: number;
  weight?: number;
  // Additional optional fields
  pickup_location?: string;
  comment?: string;
  reseller_name?: string;
  company_name?: string;
  billing_isd_code?: string;
  order_type?: string;
  billing_address_2?: string;
  shipping_address_2?: string;
}): Promise<any> => {
  try {
    const payload = {
      order_id: orderData.order_id,
      order_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      pickup_location: orderData.pickup_location || "Primary", // Default pickup location
      channel_id: "", // Can be left empty for marketplace integration
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
      order_items: orderData.items.map(item => ({
        name: item.name,
        sku: item.sku,
        units: item.units,
        selling_price: item.selling_price,
        discount: "",
        tax: "",
        hsn: 441122, // Default HSN code for hardware items
        weight: item.weight || 0.1, // Default weight if not provided
        dimensions: "10,10,10" // Default dimensions
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
      'POST',
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      payload
    );

    console.log('✅ Shiprocket order created successfully:', response);
    return response;
  } catch (error: any) {
    console.error('❌ Failed to create Shiprocket order:', error);
    
    // Provide specific guidance for common errors
    if (error.message.includes('Permission Error')) {
      throw new Error(`Shiprocket API Permission Issue: ${error.message}. Please contact Shiprocket support to enable order creation permissions.`);
    }
    
    throw error;
  }
};

/**
 * Create Shiprocket order with default company settings
 */
export const createShiprocketOrderWithDefaults = async (orderData: {
  order_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    weight?: number;
  }>;
  payment_method: 'COD' | 'Prepaid';
  sub_total: number;
  length?: number;
  breadth?: number;
  height?: number;
  weight?: number;
  comment?: string;
}): Promise<any> => {
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

/**
 * Check if Shiprocket API is accessible and has required permissions
 */
export const checkShiprocketPermissions = async (): Promise<{
  canCreateOrders: boolean;
  canTrackOrders: boolean;
  canCancelOrders: boolean;
  error?: string;
}> => {
  try {
    const token = await getShiprocketToken();
    
    // Test basic API access
    const testResponse = await axios.get(
      'https://apiv2.shiprocket.in/v1/external/courier/serviceability/',
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          pickup_postcode: '110001',
          delivery_postcode: '400001',
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
  } catch (error: any) {
    if (error.response && error.response.status === 403) {
      return {
        canCreateOrders: false,
        canTrackOrders: false,
        canCancelOrders: false,
        error: 'Shiprocket account does not have API permissions. Please contact Shiprocket support.'
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

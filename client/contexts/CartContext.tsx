import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice?: number;
    images: string[];
    category: {
      name: string;
      slug: string;
    };
    stock: number;
  };
  quantity: number;
  variant?: {
    name: string;
    value: string;
  };
}

interface CartContextType {
  items: CartItem[];
  itemsCount: number;
  totalAmount: number;
  loading: boolean;
  addToCart: (
    productId: string,
    quantity?: number,
    variant?: { name: string; value: string },
    existingProduct?: any,
  ) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Helper function to make authenticated API calls
  const apiCall = (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  };

  // Fetch cart from server when user is authenticated
  const fetchCart = async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      const response = await apiCall("/api/cart");
      if (response.ok) {
        const data = await response.json();
        setItems(data.cart || []);
      } else {
        // Silently fail for demo mode - just set empty cart
        setItems([]);
      }
    } catch (error) {
      // Silently handle fetch errors for better UX
      // This prevents console errors when the API is not available
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart when authentication state changes (with delay for better UX)
  useEffect(() => {
    if (isAuthenticated) {
      // Add small delay to prevent immediate fetch errors on page load
      const timeoutId = setTimeout(() => {
        fetchCart();
      }, 100);
      return () => clearTimeout(timeoutId);
    } else {
      setItems([]);
    }
  }, [isAuthenticated]);

  // Add item to cart - requires authentication with optimistic updates
  const addToCart = async (
    productId: string,
    quantity = 1,
    variant?: { name: string; value: string },
    existingProduct?: any,
  ) => {
    // Require authentication for purchasing
    if (!isAuthenticated) {
      throw new Error("Please sign in to add items to your cart");
    }

    const tempId = Math.random().toString();

    try {
      // Optimistic update - add immediately to UI
      const existingItemIndex = items.findIndex(
        (item) => item.product._id === productId,
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        setItems((prevItems) =>
          prevItems.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          ),
        );
      } else {
        let productData;

        if (existingProduct) {
          // Use existing product data if provided
          productData = existingProduct;
        } else {
          // For new items, we need to fetch product details first
          setLoading(true);
          const productResponse = await fetch(`/api/products/id/${productId}`);
          if (!productResponse.ok) throw new Error("Product not found");
          productData = await productResponse.json();
          setLoading(false);
        }

        const newItem: CartItem = {
          _id: tempId,
          product: productData,
          quantity,
          variant,
        };
        setItems((prevItems) => [...prevItems, newItem]);
      }

      // Make API call in background
      const response = await apiCall("/api/cart/add", {
        method: "POST",
        body: JSON.stringify({ productId, quantity, variant }),
      });

      if (!response.ok) {
        // Revert optimistic update on failure
        try {
          await fetchCart();
        } catch (fetchError) {
          // If fetch also fails, silently handle it
        }
        let errorMessage = "Failed to add item to cart";
        try {
          if (!response.bodyUsed) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          }
        } catch (parseError) {
          // Silently handle parse errors
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      // Revert optimistic update on error
      try {
        await fetchCart();
      } catch (fetchError) {
        // If fetch also fails, silently handle it
      }

      // For network errors, provide a user-friendly message
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        throw new Error(
          "Network error. Please check your connection and try again.",
        );
      }
      throw error;
    }
  };

  // Update item quantity - requires authentication with optimistic updates
  const updateQuantity = async (productId: string, quantity: number) => {
    if (!isAuthenticated) {
      throw new Error("Please sign in to update your cart");
    }

    // Store previous state for potential rollback
    const previousItems = [...items];

    try {
      // Optimistic update - update UI immediately
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.product._id === productId ? { ...item, quantity } : item,
        ),
      );

      // Make API call in background
      const response = await apiCall(`/api/cart/${productId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        // Revert on failure
        setItems(previousItems);
        let errorMessage = "Failed to update cart";
        try {
          if (!response.bodyUsed) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          }
        } catch (parseError) {
          console.warn(
            "Could not parse cart update error response:",
            parseError,
          );
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      // Revert optimistic update on error
      setItems(previousItems);
      throw error;
    }
  };

  // Remove item from cart - requires authentication with optimistic updates
  const removeFromCart = async (productId: string) => {
    if (!isAuthenticated) {
      throw new Error("Please sign in to modify your cart");
    }

    // Store previous state for potential rollback
    const previousItems = [...items];

    try {
      // Optimistic update - remove immediately from UI
      setItems((prevItems) =>
        prevItems.filter((item) => item.product._id !== productId),
      );

      // Make API call in background
      const response = await apiCall(`/api/cart/remove/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // Revert on failure
        setItems(previousItems);
        let errorMessage = "Failed to remove item from cart";
        try {
          if (!response.bodyUsed) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          }
        } catch (parseError) {
          console.warn(
            "Could not parse cart remove error response:",
            parseError,
          );
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      // Revert optimistic update on error
      setItems(previousItems);
      throw error;
    }
  };

  // Clear entire cart - requires authentication
  const clearCart = async () => {
    if (!isAuthenticated) {
      throw new Error("Please sign in to clear your cart");
    }

    try {
      setLoading(true);

      const response = await apiCall("/api/cart/clear", {
        method: "DELETE",
      });

      if (response.ok) {
        setItems([]);
      } else {
        let errorMessage = "Failed to clear cart";
        try {
          if (!response.bodyUsed) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          }
        } catch (parseError) {
          console.warn(
            "Could not parse cart clear error response:",
            parseError,
          );
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Calculate derived values
  const itemsCount = items.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = items.reduce(
    (total, item) =>
      total +
      (item.product && typeof item.product.price === "number" && typeof item.quantity === "number"
        ? item.product.price * item.quantity
        : 0),
    0,
  );

  const value: CartContextType = {
    items,
    itemsCount,
    totalAmount,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

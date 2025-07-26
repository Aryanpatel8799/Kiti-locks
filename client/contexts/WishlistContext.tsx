import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";

interface WishlistItem {
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
  };
  dateAdded: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  itemsCount: number;
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  toggleWishlist: (productId: string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const lastToggleRef = useRef<{ [productId: string]: number }>({});

  useEffect(() => {
    if (isAuthenticated) {
      // Add small delay to prevent immediate fetch errors on page load
      const timeoutId = setTimeout(() => {
        fetchWishlist();
      }, 150);
      return () => clearTimeout(timeoutId);
    } else {
      // Clear wishlist for non-authenticated users
      setItems([]);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await fetch("/api/wishlist", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.wishlist || []);
      } else {
        // Silently fail for demo mode - just set empty wishlist
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

  const addToWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      throw new Error("Please log in to add items to wishlist");
    }

    // Optimistic update - add immediately to prevent double clicks
    const tempItem = {
      _id: `temp_${productId}`,
      product: { _id: productId },
      user: "",
      createdAt: new Date().toISOString(),
    };

    // Check if already in wishlist
    if (isInWishlist(productId)) {
      return;
    }

    setItems((prev) => [...prev, tempItem as any]);

    try {
      const response = await fetch("/api/wishlist/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        try {
          await fetchWishlist(); // Refresh to get real data
        } catch (fetchError) {
          // If fetch fails, silently handle it
        }
      } else {
        // Revert optimistic update
        setItems((prev) =>
          prev.filter((item) => item.product._id !== productId),
        );

        // Safe response body reading
        let errorMessage = "Failed to add to wishlist";
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
      setItems((prev) => prev.filter((item) => item.product._id !== productId));

      // For network errors, provide a user-friendly message
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        throw new Error(
          "Network error. Please check your connection and try again.",
        );
      }
      throw error;
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      throw new Error("Please log in to manage wishlist");
    }

    // Store item for potential rollback
    const itemToRemove = items.find((item) => item.product._id === productId);

    // Optimistic update - remove immediately
    setItems((prev) => prev.filter((item) => item.product._id !== productId));

    try {
      const response = await fetch(`/api/wishlist/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        // Success - optimistic update was correct
      } else {
        // Revert optimistic update
        if (itemToRemove) {
          setItems((prev) => [...prev, itemToRemove]);
        }

        // Safe response body reading
        let errorMessage = "Failed to remove from wishlist";
        try {
          if (!response.bodyUsed) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          }
        } catch (parseError) {
          console.warn("Could not parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      // Revert optimistic update on error
      if (itemToRemove) {
        setItems((prev) => [...prev, itemToRemove]);
      }
      console.error("Error removing from wishlist:", error);
      throw error;
    }
  };

  const toggleWishlist = async (productId: string) => {
    // Prevent rapid successive calls
    const now = Date.now();
    const lastCall = lastToggleRef.current[productId] || 0;
    if (now - lastCall < 500) {
      // 500ms debounce
      return;
    }
    lastToggleRef.current[productId] = now;

    if (isInWishlist(productId)) {
      await removeFromWishlist(productId);
    } else {
      await addToWishlist(productId);
    }
  };

  const clearWishlist = async () => {
    if (!isAuthenticated) {
      throw new Error("Please log in to manage wishlist");
    }

    try {
      const response = await fetch("/api/wishlist", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setItems([]);
      } else {
        // Safe response body reading
        let errorMessage = "Failed to clear wishlist";
        try {
          if (!response.bodyUsed) {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
          }
        } catch (parseError) {
          console.warn("Could not parse error response:", parseError);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error clearing wishlist:", error);
      throw error;
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.product._id === productId);
  };

  const refreshWishlist = async () => {
    await fetchWishlist();
  };

  const value: WishlistContextType = {
    items,
    itemsCount: items.length,
    loading,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    clearWishlist,
    refreshWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

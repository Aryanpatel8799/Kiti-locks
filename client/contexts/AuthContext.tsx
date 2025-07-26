import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loginWithGoogle: (credential?: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Get tokens from localStorage
  const getAccessToken = () => localStorage.getItem("accessToken");
  const getRefreshToken = () => localStorage.getItem("refreshToken");
  const setTokens = (accessToken: string, refreshToken: string) => {
    console.log("💾 Storing tokens in localStorage");
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    // Also set 'token' for backward compatibility
    localStorage.setItem("token", accessToken);
  };
  const clearTokens = () => {
    console.log("🗑️ Clearing tokens from localStorage");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
  };

  // Check if token is valid format (basic JWT structure check)
  const isValidTokenFormat = (token: string | null): boolean => {
    if (!token) return false;
    const parts = token.split(".");
    return parts.length === 3;
  };

  // API call helper with auth headers
  const apiCall = async (url: string, options: RequestInit = {}) => {
    const token = getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return fetch(url, {
      ...options,
      headers,
    });
  };

  // Check if user is authenticated on app load
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const initAuth = async () => {
      console.log("🔍 Starting auth initialization...");
      const token = getAccessToken();
      console.log("🔑 Token from localStorage:", token ? `Present (${token.substring(0, 20)}...)` : "Missing");
      
      if (token && isValidTokenFormat(token)) {
        try {
          const response = await fetch("/api/auth/me", {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: abortController.signal,
          });

          console.log("/api/auth/me response status:", response.status); // <-- log status

          if (!isMounted) return;

          if (response.ok) {
            const data = await response.json();
            console.log("/api/auth/me user data:", data); // <-- log user data
            if (isMounted) {
              setUser(data.user);
            }
          } else if (response.status === 401) {
            // Token might be expired, try to refresh
            const refreshTokenValue = getRefreshToken();
            if (refreshTokenValue && isValidTokenFormat(refreshTokenValue)) {
              try {
                const refreshResponse = await fetch("/api/auth/refresh", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ refreshToken: refreshTokenValue }),
                  signal: abortController.signal,
                });

                console.log("/api/auth/refresh response status:", refreshResponse.status); // <-- log status

                if (!isMounted) return;

                if (refreshResponse.ok) {
                  const refreshData = await refreshResponse.json();
                  console.log("/api/auth/refresh data:", refreshData); // <-- log refresh data
                  if (isMounted) {
                    setTokens(
                      refreshData.tokens.accessToken,
                      refreshData.tokens.refreshToken,
                    );

                    // Get updated user info
                    const userResponse = await fetch("/api/auth/me", {
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${refreshData.tokens.accessToken}`,
                      },
                      signal: abortController.signal,
                    });

                    console.log("/api/auth/me after refresh status:", userResponse.status); // <-- log status

                    if (userResponse.ok && isMounted) {
                      const userData = await userResponse.json();
                      console.log("/api/auth/me after refresh user data:", userData); // <-- log user data
                      setUser(userData.user);
                    }
                  }
                } else {
                  if (isMounted) {
                    console.warn("Token refresh failed during init");
                    clearTokens();
                  }
                }
              } catch (refreshError: any) {
                if (refreshError.name !== "AbortError" && isMounted) {
                  console.warn(
                    "Token refresh failed during init:",
                    refreshError,
                  );
                  clearTokens();
                }
              }
            } else {
              // No valid refresh token available
              if (isMounted) {
                console.warn("No valid refresh token found, clearing tokens");
                clearTokens();
              }
            }
          } else {
            // Other server errors, don't clear tokens yet
            console.warn("Failed to validate token, but keeping it for retry");
          }
        } catch (error: any) {
          if (error.name === "AbortError") {
            return; // Request was cancelled, ignore
          }

          if (!isMounted) return;

          // Silently handle network errors during auth initialization
          // Only clear tokens if it's an authentication error, not a network error
          if (
            error instanceof Error &&
            !error.message.includes("Failed to fetch") &&
            !error.message.includes("fetch") &&
            !error.message.includes("NetworkError")
          ) {
            clearTokens();
          }
          // For network errors, keep existing tokens and try again later
          console.warn("Auth initialization error:", error);
          console.log("Auth initialization error details:", error); // <-- log error details
        }
      }

      if (isMounted) {
        console.log("✅ Auth initialization complete, setting loading to false");
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []); // Empty dependency array to run only once

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        let errorMessage = "Login failed";
        try {
          if (!response.bodyUsed) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          }
        } catch (parseError) {
          console.warn("Could not parse login error response:", parseError);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      setUser(data.user);
    } catch (error) {
      throw error;
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        let errorMessage = "Registration failed";
        try {
          if (!response.bodyUsed) {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          }
        } catch (parseError) {
          console.warn(
            "Could not parse registration error response:",
            parseError,
          );
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);
      setUser(data.user);
    } catch (error) {
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    clearTokens();
    setUser(null);
  };

  // Google OAuth login - handle credential response
  const loginWithGoogle = async (credential?: string) => {
    try {
      // If credential is provided, use it directly from GoogleLogin component
      if (credential) {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            credential: credential,
          }),
        });

        if (!res.ok) {
          throw new Error("Google authentication failed");
        }

        const data = await res.json();
        setTokens(data.tokens.accessToken, data.tokens.refreshToken);
        setUser(data.user);
      } else {
        // Fallback to redirect method
        window.location.href = "/api/auth/google";
      }
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const token = getRefreshToken();
      if (!token) {
        throw new Error("No refresh token available");
      }

      if (!isValidTokenFormat(token)) {
        throw new Error("Invalid refresh token format");
      }

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: token }),
      });

      if (!response.ok) {
        let errorMessage = "Token refresh failed";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If we can't parse the error, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setTokens(data.tokens.accessToken, data.tokens.refreshToken);

      // Get updated user info
      const userResponse = await apiCall("/api/auth/me");
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData.user);
      }
    } catch (error) {
      // Only clear tokens if it's a legitimate auth error, not a network error
      if (
        error instanceof Error &&
        !error.message.includes("Failed to fetch")
      ) {
        clearTokens();
        setUser(null);
      }
      throw error;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({
        ...user,
        ...userData
      });
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loginWithGoogle,
    refreshToken,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

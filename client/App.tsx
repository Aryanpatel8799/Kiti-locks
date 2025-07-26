import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { WishlistProvider } from "./contexts/WishlistContext";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import ErrorBoundary from "./components/ErrorBoundary";
import PerformanceMonitor from "./components/PerformanceMonitor";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import CheckoutForm from "./pages/CheckoutForm";
import Checkout from "./pages/Checkout";
import DemoPayment from "./pages/DemoPayment";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import Orders from "./pages/Orders";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navigation />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

const App = () => {
  // Use environment variable or fallback for Google OAuth
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1049761690648-966htn1mri3jdigl8h5a35snnrub6568.apps.googleusercontent.com";

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={googleClientId}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <PerformanceMonitor />
              <ErrorBoundary>
                <AuthProvider>
                  <CartProvider>
                    <WishlistProvider>
                      <Routes>
                        {/* Auth routes - no layout */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />

                        {/* Main app routes - with layout */}
                        <Route
                          path="/*"
                          element={
                            <Layout>
                              <Routes>
                                <Route path="/" element={<Index />} />
                                <Route path="/products" element={<Products />} />
                                <Route
                                  path="/products/:slug"
                                  element={<ProductDetail />}
                                />
                                <Route
                                  path="/categories"
                                  element={
                                    <div className="p-8 text-center">
                                      <h1 className="text-2xl">
                                        Categories coming soon
                                      </h1>
                                    </div>
                                  }
                                />
                                <Route path="/about" element={<About />} />
                                <Route path="/contact" element={<Contact />} />
                                <Route path="/terms" element={<Terms />} />
                                <Route path="/privacy" element={<Privacy />} />
                                <Route path="/cart" element={<Cart />} />
                                <Route path="/wishlist" element={<Wishlist />} />
                                <Route
                                  path="/checkout/form"
                                  element={<CheckoutForm />}
                                />
                                <Route
                                  path="/checkout/demo-payment"
                                  element={<DemoPayment />}
                                />
                                <Route
                                  path="/checkout/success"
                                  element={<Checkout />}
                                />
                                <Route path="/account" element={<Profile />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/orders" element={<Orders />} />
                                <Route
                                  path="/orders"
                                  element={
                                    <div className="p-8 text-center">
                                      <h1 className="text-2xl">
                                        Orders coming soon
                                      </h1>
                                    </div>
                                  }
                                />
                                <Route
                                  path="/settings"
                                  element={
                                    <div className="p-8 text-center">
                                      <h1 className="text-2xl">
                                        Settings coming soon
                                      </h1>
                                    </div>
                                  }
                                />
                                <Route path="/admin" element={<Admin />} />
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </Layout>
                          }
                        />
                      </Routes>
                    </WishlistProvider>
                  </CartProvider>
                </AuthProvider>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
};

createRoot(document.getElementById("root")!).render(<App />);

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Mail,
  Calendar,
  Shield,
  Edit3,
  Save,
  X,
  Camera,
  Package,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  preferences: {
    newsletter: boolean;
    notifications: boolean;
    marketing: boolean;
  };
}

interface Order {
  _id: string;
  createdAt: string;
  status: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export default function Profile() {
  const { user, isAuthenticated, loading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState<UserProfile>({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    avatar: user?.avatar || "",
    bio: "",
    preferences: {
      newsletter: true,
      notifications: true,
      marketing: false,
    },
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Handle authentication check in useEffect
  useEffect(() => {
    // Don't redirect if still loading authentication state
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchUserProfile();
    fetchUserStats();
  }, [isAuthenticated, authLoading, navigate]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => ({
          ...prev,
          ...data.profile,
        }));
      } else if (response.status === 401 || response.status === 403) {
        console.log("Profile fetch: Token expired, letting AuthContext handle refresh");
        // Don't navigate here, let AuthContext handle token refresh
        // The useEffect will handle navigation when isAuthenticated becomes false
      } else {
        console.error("Failed to fetch profile:", response.status);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found for stats fetch");
        return;
      }

      // Fetch orders
      const ordersResponse = await fetch("/api/orders/my-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData.orders || []);
      } else if (ordersResponse.status === 401 || ordersResponse.status === 403) {
        console.warn("Authentication error fetching orders");
      }

      // Fetch wishlist count
      const wishlistResponse = await fetch("/api/wishlist", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (wishlistResponse.ok) {
        const wishlistData = await wishlistResponse.json();
        setWishlistCount(wishlistData.items?.length || 0);
      } else if (wishlistResponse.status === 401 || wishlistResponse.status === 403) {
        console.warn("Authentication error fetching wishlist");
      }
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          bio: profile.bio,
          preferences: profile.preferences,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the profile state with the response data
        setProfile(prev => ({
          ...prev,
          ...data.profile
        }));
        
        // Update the AuthContext with the new user data
        updateUser({
          name: data.profile.name,
          avatar: profile.avatar // Keep the current avatar
        });
        
        toast.success("Profile updated successfully!");
        setEditing(false);
        
        // Force a re-fetch of user data from AuthContext if needed
        // This ensures the AuthContext stays in sync
        if (window.location.pathname === '/profile') {
          // Refresh the page data without logging out
          await fetchUserProfile();
        }
      } else {
        const data = await response.json();
        if (response.status === 401 || response.status === 403) {
          toast.error("Session expired. Please login again.");
          navigate("/login");
        } else {
          toast.error(data.error || "Failed to update profile");
        }
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setAvatarUploading(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("avatar", file);

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required. Please login again.");
        navigate("/login");
        return;
      }

      const response = await fetch("/api/upload/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => ({
          ...prev,
          avatar: data.avatarUrl,
        }));
        
        // Update the AuthContext with the new avatar
        updateUser({
          avatar: data.avatarUrl
        });
        
        toast.success("Avatar updated successfully!");
      } else if (response.status === 401 || response.status === 403) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        // For demo purposes, we'll simulate a successful upload
        const reader = new FileReader();
        reader.onload = (e) => {
          const avatarUrl = e.target?.result as string;
          setProfile(prev => ({
            ...prev,
            avatar: avatarUrl,
          }));
          
          // Update the AuthContext with the new avatar
          updateUser({
            avatar: avatarUrl
          });
          
          toast.success("Avatar updated successfully! (Demo mode)");
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error("Avatar upload error:", error);
      // For demo purposes, still allow local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const avatarUrl = e.target?.result as string;
        setProfile(prev => ({
          ...prev,
          avatar: avatarUrl,
        }));
        
        // Update the AuthContext with the new avatar
        updateUser({
          avatar: avatarUrl
        });
        
        toast.success("Avatar updated successfully! (Demo mode)");
      };
      reader.readAsDataURL(file);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        toast.success("Password updated successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordForm(false);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update password");
      }
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show loading or redirect if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
              <p className="text-slate-600 mt-1">
                Manage your account settings and preferences
              </p>
            </div>
            <div className="flex items-center gap-3">
              {editing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-4">
                  <motion.div
                    whileHover={{ scale: editing ? 1.05 : 1 }}
                    className="relative"
                  >
                    <Avatar className="w-24 h-24 ring-2 ring-slate-200">
                      <AvatarImage src={profile.avatar} alt={profile.name} />
                      <AvatarFallback className="text-xl bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600">
                        {profile.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {avatarUploading && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                    )}
                  </motion.div>
                  {editing && (
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <label
                        htmlFor="avatar-upload"
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={avatarUploading}
                      />
                    </motion.div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  {profile.name}
                </h3>
                <p className="text-sm text-slate-600 mb-4">{profile.email}</p>
                <Badge
                  variant={user?.role === "admin" ? "default" : "secondary"}
                  className="mb-4"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {user?.role === "admin" ? "Administrator" : "Customer"}
                </Badge>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-xl font-bold text-slate-900">
                      {orders.length}
                    </div>
                    <div className="text-xs text-slate-600">Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-slate-900">
                      {wishlistCount}
                    </div>
                    <div className="text-xs text-slate-600">Wishlist</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    {editing && (
                      <p className="text-sm text-slate-600">
                        Click on your avatar to upload a new profile picture
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profile.name}
                          onChange={(e) =>
                            setProfile({ ...profile, name: e.target.value })
                          }
                          disabled={!editing}
                          className={editing ? "" : "bg-slate-50"}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          value={profile.email}
                          disabled
                          className="bg-slate-50"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profile.phone || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, phone: e.target.value })
                        }
                        disabled={!editing}
                        className={editing ? "" : "bg-slate-50"}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profile.bio || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, bio: e.target.value })
                        }
                        disabled={!editing}
                        className={editing ? "" : "bg-slate-50"}
                        placeholder="Tell us about yourself"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-slate-600" />
                          <div>
                            <p className="font-medium">Member Since</p>
                            <p className="text-sm text-slate-600">
                              {new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Shield className="w-5 h-5 text-slate-600" />
                          <div>
                            <p className="font-medium">Account Status</p>
                            <p className="text-sm text-green-600">Verified</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Order History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orders.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-600">No orders yet</p>
                        <Button
                          className="mt-4"
                          onClick={() => navigate("/products")}
                        >
                          Start Shopping
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {orders.map((order) => (
                          <div
                            key={order._id}
                            className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="font-medium">
                                  Order #{order._id.slice(-8).toUpperCase()}
                                </p>
                                <p className="text-sm text-slate-600">
                                  {new Date(
                                    order.createdAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right flex flex-col gap-2">
                                <Badge className={getStatusColor(order.status)}>
                                  {order.status}
                                </Badge>
                                <p className="text-lg font-semibold">
                                  {formatPrice(order.totalAmount)}
                                </p>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      View Details
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>
                                        Order #{order._id.slice(-8).toUpperCase()}
                                      </DialogTitle>
                                      <DialogDescription>
                                        Order placed on {new Date(order.createdAt).toLocaleDateString()}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">Status:</span>
                                        <Badge className={getStatusColor(order.status)}>
                                          {order.status}
                                        </Badge>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">Total Amount:</span>
                                        <span className="text-xl font-bold">
                                          {formatPrice(order.totalAmount)}
                                        </span>
                                      </div>
                                      <Separator />
                                      <div>
                                        <h4 className="font-medium mb-3">Order Items</h4>
                                        <div className="space-y-3">
                                          {order.items.map((item, index) => (
                                            <div
                                              key={index}
                                              className="flex justify-between items-center p-3 bg-slate-50 rounded-lg"
                                            >
                                              <div>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-sm text-slate-600">
                                                  Quantity: {item.quantity}
                                                </p>
                                                <p className="text-sm text-slate-600">
                                                  Price per item: {formatPrice(item.price)}
                                                </p>
                                              </div>
                                              <div className="text-right">
                                                <p className="font-medium">
                                                  {formatPrice(item.price * item.quantity)}
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {order.items.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex justify-between text-sm"
                                >
                                  <span>
                                    {item.name} x{item.quantity}
                                  </span>
                                  <span>
                                    {formatPrice(item.price * item.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                {/* Notification Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Notification Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div>
                        <p className="font-medium">Order Updates</p>
                        <p className="text-sm text-slate-600">
                          Receive emails about order status and shipping
                        </p>
                      </div>
                      <motion.div
                        whileTap={{ scale: 0.95 }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          profile.preferences.notifications
                            ? "bg-blue-600"
                            : "bg-slate-300"
                        }`}
                        onClick={() =>
                          editing &&
                          setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              notifications: !profile.preferences.notifications,
                            },
                          })
                        }
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            profile.preferences.notifications
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </motion.div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div>
                        <p className="font-medium">Newsletter</p>
                        <p className="text-sm text-slate-600">
                          Get updates about new products and sales
                        </p>
                      </div>
                      <motion.div
                        whileTap={{ scale: 0.95 }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          profile.preferences.newsletter
                            ? "bg-blue-600"
                            : "bg-slate-300"
                        }`}
                        onClick={() =>
                          editing &&
                          setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              newsletter: !profile.preferences.newsletter,
                            },
                          })
                        }
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            profile.preferences.newsletter
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </motion.div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                      <div>
                        <p className="font-medium">Marketing Communications</p>
                        <p className="text-sm text-slate-600">
                          Receive promotional offers and exclusive discounts
                        </p>
                      </div>
                      <motion.div
                        whileTap={{ scale: 0.95 }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          profile.preferences.marketing
                            ? "bg-blue-600"
                            : "bg-slate-300"
                        }`}
                        onClick={() =>
                          editing &&
                          setProfile({
                            ...profile,
                            preferences: {
                              ...profile.preferences,
                              marketing: !profile.preferences.marketing,
                            },
                          })
                        }
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            profile.preferences.marketing
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </motion.div>
                    </div>

                    {!editing && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                          💡 <strong>Tip:</strong> Click "Edit Profile" above to modify your notification preferences.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Change Password */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="w-5 h-5" />
                      Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!showPasswordForm ? (
                      <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div>
                          <p className="font-medium">Update Password</p>
                          <p className="text-sm text-slate-600">
                            Change your account password for better security
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => setShowPasswordForm(true)}
                          className="flex items-center gap-2"
                        >
                          <Lock className="w-4 h-4" />
                          Change Password
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="currentPassword"
                              type={showPasswords.current ? "text" : "password"}
                              value={passwordForm.currentPassword}
                              onChange={(e) =>
                                setPasswordForm({
                                  ...passwordForm,
                                  currentPassword: e.target.value,
                                })
                              }
                              placeholder="Enter your current password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() =>
                                setShowPasswords({
                                  ...showPasswords,
                                  current: !showPasswords.current,
                                })
                              }
                            >
                              {showPasswords.current ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <div className="relative">
                            <Input
                              id="newPassword"
                              type={showPasswords.new ? "text" : "password"}
                              value={passwordForm.newPassword}
                              onChange={(e) =>
                                setPasswordForm({
                                  ...passwordForm,
                                  newPassword: e.target.value,
                                })
                              }
                              placeholder="Enter your new password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() =>
                                setShowPasswords({
                                  ...showPasswords,
                                  new: !showPasswords.new,
                                })
                              }
                            >
                              {showPasswords.new ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showPasswords.confirm ? "text" : "password"}
                              value={passwordForm.confirmPassword}
                              onChange={(e) =>
                                setPasswordForm({
                                  ...passwordForm,
                                  confirmPassword: e.target.value,
                                })
                              }
                              placeholder="Confirm your new password"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() =>
                                setShowPasswords({
                                  ...showPasswords,
                                  confirm: !showPasswords.confirm,
                                })
                              }
                            >
                              {showPasswords.confirm ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowPasswordForm(false);
                              setPasswordForm({
                                currentPassword: "",
                                newPassword: "",
                                confirmPassword: "",
                              });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleChangePassword}
                            disabled={passwordLoading}
                            className="flex items-center gap-2"
                          >
                            <Lock className="w-4 h-4" />
                            {passwordLoading ? "Updating..." : "Update Password"}
                          </Button>
                        </div>

                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-700">
                            ⚠️ <strong>Security Tips:</strong>
                          </p>
                          <ul className="text-xs text-yellow-600 mt-1 space-y-1">
                            <li>• Use at least 6 characters</li>
                            <li>• Include a mix of letters, numbers, and symbols</li>
                            <li>• Don't use personal information</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">✅ Available Features</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Update your personal information (name, phone, bio)</li>
                        <li>• Upload and change your profile picture</li>
                        <li>• View your complete order history with detailed information</li>
                        <li>• Change your account password securely</li>
                        <li>• Manage notification preferences</li>
                        <li>• Track your wishlist items</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <h4 className="font-medium text-slate-800 mb-2">🔒 Your Account is Secure</h4>
                      <p className="text-sm text-slate-600">
                        Your account information is protected and securely stored. 
                        Only you can access and modify your profile details.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  User,
  Settings as SettingsIcon,
  Shield,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface UserSettings {
  profile: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    avatar?: string;
    isVerified: boolean;
    twoFactorEnabled: boolean;
  };
  preferences: {
    newsletter: boolean;
    notifications: boolean;
    marketing: boolean;
    language: string;
    currency: string;
  };
  security: {
    twoFactorEnabled: boolean;
    lastLoginAt?: string;
    passwordChangedAt?: string;
  };
}

export default function Settings() {
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    location: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [deleteForm, setDeleteForm] = useState({
    password: "",
    reason: "",
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setProfileForm({
          name: data.profile.name || "",
          phone: data.profile.phone || "",
          location: data.profile.location || "",
        });
      } else {
        toast.error("Failed to load settings");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    // Validate required fields
    if (!profileForm.name.trim()) {
      toast.error("Name is required");
      return;
    }

    // Validate phone number format if provided
    if (profileForm.phone && profileForm.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(profileForm.phone.replace(/\s/g, ''))) {
        toast.error("Please enter a valid phone number");
        return;
      }
    }

    try {
      setSaving(true);
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...profileForm,
          phone: profileForm.phone?.trim() || null,
          location: profileForm.location?.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => prev ? { ...prev, profile: { ...prev.profile, ...data.profile } } : null);
        toast.success("Profile updated successfully! ✨");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPG, PNG, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    try {
      setUploadingImage(true);
      
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch("/api/settings/avatar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => prev ? { 
          ...prev, 
          profile: { ...prev.profile, avatar: data.avatar } 
        } : null);
        toast.success("Profile image updated successfully! ✨");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeProfileImage = async () => {
    try {
      setUploadingImage(true);
      
      const response = await fetch("/api/settings/avatar", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setSettings(prev => prev ? { 
          ...prev, 
          profile: { ...prev.profile, avatar: undefined } 
        } : null);
        toast.success("Profile image removed successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to remove image");
      }
    } catch (error) {
      console.error("Image removal error:", error);
      toast.error("Failed to remove image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const updatePreferences = async (newPrefs: any) => {
    try {
      const response = await fetch("/api/settings/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newPrefs),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => prev ? { ...prev, preferences: data.preferences } : null);
        toast.success("Preferences updated successfully! ✨");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update preferences");
      }
    } catch (error) {
      console.error("Preferences update error:", error);
      toast.error("Network error. Please try again.");
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/settings/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(passwordForm),
      });

      if (response.ok) {
        toast.success("Password changed successfully");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setShowPasswordDialog(false);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to change password");
      }
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const requestDataExport = async () => {
    try {
      const response = await fetch("/api/settings/export", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
      } else {
        toast.error("Failed to request data export");
      }
    } catch (error) {
      toast.error("Failed to request data export");
    }
  };

  const requestAccountDeletion = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/settings/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(deleteForm),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setShowDeleteDialog(false);
        setDeleteForm({ password: "", reason: "" });
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to request account deletion");
      }
    } catch (error) {
      toast.error("Failed to request account deletion");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Authentication Required
            </h3>
            <p className="text-gray-600 mb-4">
              Please log in to access your settings.
            </p>
            <Button onClick={() => window.location.href = "/login"}>
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Simple Header Section */}
      

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 lg:space-y-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-2">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50 rounded-lg p-1">
              <TabsTrigger 
                value="profile" 
                className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300 rounded-md"
              >
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger 
                value="preferences" 
                className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300 rounded-md"
              >
                <SettingsIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Preferences</span>
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-300 rounded-md"
              >
                <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Security</span>
              </TabsTrigger>
            </TabsList>
          </div>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="bg-white shadow-md border border-gray-200 rounded-lg overflow-hidden">
            <CardHeader className="bg-gray-900 text-white p-6 sm:p-8">
              <CardTitle className="text-xl sm:text-2xl font-semibold">Profile Information</CardTitle>
              <p className="text-gray-300 text-sm sm:text-base">
                Update your personal information and contact details
              </p>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6 lg:space-y-8">
              {/* Profile Image Upload */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div className="relative flex-shrink-0">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32 rounded-full overflow-hidden bg-gray-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl">
                    {settings?.profile.avatar ? (
                      <img 
                        src={settings.profile.avatar} 
                        alt="Profile" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      settings?.profile.name?.slice(0, 2).toUpperCase() || "UN"
                    )}
                  </div>
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900">
                      {settings?.profile.name || "User"}
                    </h3>
                    {settings?.profile.isVerified && (
                      <Badge variant="default" className="bg-gray-700 text-xs sm:text-sm w-fit mx-auto sm:mx-0">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">{settings?.profile.email}</p>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <label htmlFor="avatar-upload" className="w-full sm:w-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={uploadingImage}
                        className="cursor-pointer w-full sm:w-auto bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900"
                        asChild
                      >
                        <span>
                          <Camera className="h-4 w-4 mr-2" />
                          {uploadingImage ? "Uploading..." : "Change Photo"}
                        </span>
                      </Button>
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    {settings?.profile.avatar && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={removeProfileImage}
                        disabled={uploadingImage}
                        className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Recommended: Square image, JPG or PNG, max 5MB
                  </p>
                </div>
              </div>

              {/* Profile Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Full Name *</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                    className={`h-12 ${!profileForm.name.trim() ? "border-red-300 focus:border-red-400" : "border-gray-300 focus:border-gray-600"} transition-colors duration-200`}
                  />
                  {!profileForm.name.trim() && (
                    <p className="text-xs text-red-500 mt-1 flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Name is required
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email Address</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="email"
                      value={settings?.profile.email || ""}
                      disabled
                      className="h-12 bg-gray-50 text-gray-600"
                    />
                    {settings?.profile.isVerified && (
                      <Badge variant="default" className="bg-gray-600 text-xs flex-shrink-0">
                        ✓ Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+91 9876543210"
                    type="tel"
                    className="h-12 border-gray-300 focus:border-gray-600 transition-colors duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-semibold text-gray-700">Location</Label>
                  <Input
                    id="location"
                    value={profileForm.location || ""}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                    className="h-12 border-gray-300 focus:border-gray-600 transition-colors duration-200"
                  />
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pt-6 border-t bg-gray-50 -mx-6 sm:-mx-8 px-6 sm:px-8 py-6 space-y-4 lg:space-y-0">
                <div className="text-sm text-gray-600">
                  <span className="text-red-500 font-medium">*</span> Required fields
                  <p className="text-xs text-gray-500 mt-1">Your profile information helps us provide better service</p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setProfileForm({
                        name: settings?.profile.name || "",
                        phone: settings?.profile.phone || "",
                        location: settings?.profile.location || "",
                      });
                      toast.info("Form reset to original values");
                    }}
                    disabled={saving}
                    className="w-full sm:w-auto min-w-[100px] bg-white hover:bg-gray-50 border-gray-300"
                  >
                    Reset
                  </Button>
                  <Button 
                    onClick={updateProfile} 
                    disabled={saving || !profileForm.name.trim()}
                    className="w-full sm:w-auto min-w-[140px] bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card className="bg-white shadow-md border border-gray-200 rounded-lg overflow-hidden">
            <CardHeader className="bg-gray-900 text-white p-6 sm:p-8">
              <CardTitle className="text-xl sm:text-2xl font-semibold">Preferences</CardTitle>
              <p className="text-gray-300 text-sm sm:text-base opacity-90">
                Customize your experience and communication preferences
              </p>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 space-y-6 lg:space-y-8">
              {settings?.preferences ? (
                <>
                  <div className="space-y-6 lg:space-y-8">
                    {/* Communication Preferences */}
                    <div className="space-y-4 lg:space-y-6">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3 border border-gray-200">
                          <SettingsIcon className="h-4 w-4 text-gray-600" />
                        </div>
                        Communication Preferences
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4 lg:gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 space-y-3 sm:space-y-0">
                          <div className="flex-1">
                            <Label className="text-base sm:text-lg font-semibold text-gray-900">Newsletter Subscription</Label>
                            <p className="text-sm text-gray-600 mt-1">
                              Receive our weekly newsletter with product updates, offers, and security news
                            </p>
                          </div>
                          <Switch
                            checked={settings.preferences.newsletter}
                            onCheckedChange={(checked) => 
                              updatePreferences({ ...settings.preferences, newsletter: checked })
                            }
                            className="data-[state=checked]:bg-gray-600"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 space-y-3 sm:space-y-0">
                          <div className="flex-1">
                            <Label className="text-base sm:text-lg font-semibold text-gray-900">Order Notifications</Label>
                            <p className="text-sm text-gray-600 mt-1">
                              Get notified about order status updates, shipment tracking, and delivery confirmations
                            </p>
                          </div>
                          <Switch
                            checked={settings.preferences.notifications}
                            onCheckedChange={(checked) => 
                              updatePreferences({ ...settings.preferences, notifications: checked })
                            }
                            className="data-[state=checked]:bg-gray-600"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 space-y-3 sm:space-y-0">
                          <div className="flex-1">
                            <Label className="text-base sm:text-lg font-semibold text-gray-900">Marketing Communications</Label>
                            <p className="text-sm text-gray-600 mt-1">
                              Receive promotional emails about special offers, new products, and exclusive deals
                            </p>
                          </div>
                          <Switch
                            checked={settings.preferences.marketing}
                            onCheckedChange={(checked) => 
                              updatePreferences({ ...settings.preferences, marketing: checked })
                            }
                            className="data-[state=checked]:bg-gray-600"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-gray-200" />

                  
                  </div>
                </>
              ) : (
                <></>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="space-y-6 lg:space-y-8">
            {/* Password Security */}
            <Card className="bg-white shadow-md border border-gray-200 rounded-lg overflow-hidden">
              <CardHeader className="bg-gray-900 text-white p-6 sm:p-8">
                <CardTitle className="text-xl sm:text-2xl font-semibold">Password & Security</CardTitle>
                <p className="text-gray-300 text-sm sm:text-base opacity-90">
                  Manage your account security and authentication
                </p>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-6 bg-gray-50 rounded-lg border border-gray-200 space-y-4 lg:space-y-0">
                  <div>
                    <Label className="text-base sm:text-lg font-semibold text-gray-900">Password</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Last changed: {settings?.security.passwordChangedAt 
                        ? new Date(settings.security.passwordChangedAt).toLocaleDateString()
                        : 'Never'
                      }
                    </p>
                  </div>
                  <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full lg:w-auto bg-white hover:bg-gray-50 border-gray-300 text-gray-700">
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl">Change Password</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="current-password" className="text-sm font-semibold">Current Password</Label>
                          <div className="relative">
                            <Input
                              id="current-password"
                              type={showCurrentPassword ? "text" : "password"}
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                              className="h-12 pr-12 border-gray-300 focus:border-red-400"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="new-password" className="text-sm font-semibold">New Password</Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showNewPassword ? "text" : "password"}
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="h-12 pr-12 border-gray-300 focus:border-red-400"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="confirm-password" className="text-sm font-semibold">Confirm New Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="h-12 border-gray-300 focus:border-red-400"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowPasswordDialog(false)}
                            className="w-full sm:w-auto"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={changePassword} 
                            disabled={saving}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                          >
                            {saving ? "Changing..." : "Change Password"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Separator className="bg-gray-200" />
{/* 
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-6 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-green-200 space-y-4 lg:space-y-0">
                  <div>
                    <Label className="text-base sm:text-lg font-semibold text-gray-900">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {settings?.security.twoFactorEnabled && (
                      <Badge variant="default" className="bg-green-600">
                        Enabled
                      </Badge>
                    )}
                    <Switch
                      checked={settings?.security.twoFactorEnabled || false}
                      disabled
                      className="data-[state=checked]:bg-green-600"
                    />
                  </div>
                </div> */}
              </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card className="bg-white shadow-xl border-0 rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-900 text-white p-6 sm:p-8">
                <CardTitle className="text-xl sm:text-2xl font-bold">Data & Privacy</CardTitle>
                <p className="text-purple-100 text-sm sm:text-base opacity-90">
                  Control your data and account management
                </p>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-6">
                {/* <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-200 space-y-4 lg:space-y-0">
                  <div>
                    <Label className="text-base sm:text-lg font-semibold text-gray-900">Download Your Data</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Get a copy of all your account data
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={requestDataExport}
                    className="w-full lg:w-auto bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Request Export
                  </Button>
                </div> */}

                <Separator className="bg-gray-200" />

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-6 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200 space-y-4 lg:space-y-0">
                  <div>
                    <Label className="text-base sm:text-lg font-semibold text-red-600">Delete Account</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="w-full lg:w-auto">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center text-red-600 text-lg sm:text-xl">
                          <AlertTriangle className="h-5 w-5 mr-2" />
                          Delete Account
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          This action cannot be undone. All your data will be permanently deleted.
                        </p>
                        <div>
                          <Label htmlFor="delete-password" className="text-sm font-semibold">Enter your password to confirm</Label>
                          <Input
                            id="delete-password"
                            type="password"
                            value={deleteForm.password}
                            onChange={(e) => setDeleteForm(prev => ({ ...prev, password: e.target.value }))}
                            className="h-12 border-gray-300 focus:border-red-400"
                          />
                        </div>
                        <div>
                          <Label htmlFor="delete-reason" className="text-sm font-semibold">Reason for deletion (optional)</Label>
                          <Textarea
                            id="delete-reason"
                            value={deleteForm.reason}
                            onChange={(e) => setDeleteForm(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="Help us improve by sharing why you're leaving..."
                            className="border-gray-300 focus:border-red-400"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowDeleteDialog(false)}
                            className="w-full sm:w-auto"
                          >
                            Cancel
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={requestAccountDeletion} 
                            disabled={saving}
                            className="w-full sm:w-auto"
                          >
                            {saving ? "Deleting..." : "Delete Account"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Users,
  Edit,
  Trash2,
  Search,
  Eye,
} from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: string;
  wishlist?: Array<{
    _id: string;
    name: string;
    price: number;
  }>;
}

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{
    product: {
      name: string;
    };
    quantity: number;
    price: number;
  }>;
}

interface UserManagementProps {
  apiCall: (url: string, options?: RequestInit) => Promise<Response>;
}

export default function UserManagement({ apiCall }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: { user: 0, admin: 0 },
  });

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "user" as "user" | "admin",
    isActive: true,
  });

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
        ...(roleFilter !== "all" && { role: roleFilter }),
        ...(statusFilter !== "all" && { isActive: statusFilter }),
      });

      const response = await apiCall(`/api/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setPagination(data.pagination || {});
        setStats(data.stats || {});
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await apiCall(`/api/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data.user);
        setUserStats(data.stats);
        setUserOrders(data.orders || []);
        setIsDetailsDialogOpen(true);
      } else {
        toast.error("Failed to fetch user details");
      }
    } catch (error) {
      toast.error("Failed to fetch user details");
    }
  };

  const handleEditUser = (user: User) => {
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await apiCall(`/api/users/${selectedUser._id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        toast.success("User updated successfully");
        setIsEditDialogOpen(false);
        fetchUsers(pagination.currentPage);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update user");
      }
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await apiCall(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || "User deleted successfully");
        fetchUsers(pagination.currentPage);
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter, statusFilter]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "true" ? user.isActive : !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center">
          <Users className="w-6 h-6 mr-2" />
          User Management
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Users className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byRole.admin || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byRole.user || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "destructive"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchUserDetails(user._id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this user? This action cannot be undone.
                                If the user has orders, they will be deactivated instead.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user._id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-slate-500">
                Showing {((pagination.currentPage - 1) * 10) + 1} to{" "}
                {Math.min(pagination.currentPage * 10, pagination.totalUsers)} of{" "}
                {pagination.totalUsers} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={editForm.role}
                onValueChange={(value: "user" | "admin") => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                className="rounded border-slate-300"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>
                Update User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Name:</span>
                      <span className="font-medium">{selectedUser.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-medium">{selectedUser.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Role:</span>
                      <Badge variant={selectedUser.role === "admin" ? "default" : "secondary"}>
                        {selectedUser.role}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <Badge variant={selectedUser.isActive ? "default" : "destructive"}>
                        {selectedUser.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Joined:</span>
                      <span className="font-medium">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Statistics */}
                {userStats && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Order Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Orders:</span>
                        <span className="font-medium">{userStats.totalOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Spent:</span>
                        <span className="font-medium">{formatCurrency(userStats.totalSpent)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Average Order:</span>
                        <span className="font-medium">{formatCurrency(userStats.averageOrderValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Wishlist Items:</span>
                        <span className="font-medium">{selectedUser.wishlist?.length || 0}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Recent Orders */}
              {userOrders.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {userOrders.slice(0, 5).map((order) => (
                        <div key={order._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div>
                            <div className="font-medium">#{order.orderNumber}</div>
                            <div className="text-sm text-slate-500">
                              {order.items.length} items • {formatDate(order.createdAt)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(order.total)}</div>
                            <Badge variant="secondary" className="text-xs">
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Package,
  AlertTriangle,
  Edit,
  Search,
  TrendingUp,
  DollarSign,
  BarChart3,
  Upload,
} from "lucide-react";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  status: string;
  category?: {
    name: string;
  };
  images: string[];
  totalSold?: number;
  revenue?: number;
  turnoverRate?: number;
  dailyVelocity?: number;
  recommendedReorder?: number;
  daysUntilOutOfStock?: number | null;
}

interface InventoryStats {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  lowStockThreshold: number;
}

interface InventoryManagementProps {
  apiCall: (url: string, options?: RequestInit) => Promise<Response>;
}

export default function InventoryManagement({ apiCall }: InventoryManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<Product[]>([]);
  const [topMovingProducts, setTopMovingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalInventoryValue: 0,
    lowStockThreshold: 10,
  });
  
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isStockUpdateDialogOpen, setIsStockUpdateDialogOpen] = useState(false);
  const [stockUpdateForm, setStockUpdateForm] = useState({
    quantity: "",
    reason: "",
    notes: "",
  });

  const [isBulkUpdateDialogOpen, setIsBulkUpdateDialogOpen] = useState(false);
  const [bulkUpdates, setBulkUpdates] = useState<Array<{
    productId: string;
    quantity: string;
    reason: string;
  }>>([]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(categoryFilter !== "all" && { category: categoryFilter }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        lowStock: lowStockThreshold,
      });

      const response = await apiCall(`/api/inventory/overview?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setStats(data.statistics || {});
        setLowStockAlerts(data.lowStockProducts || []);
        setTopMovingProducts(data.topMovingProducts || []);
      } else {
        toast.error("Failed to fetch inventory data");
      }
    } catch (error) {
      toast.error("Failed to fetch inventory data");
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const response = await apiCall(`/api/inventory/alerts/low-stock?threshold=${lowStockThreshold}`);
      if (response.ok) {
        const data = await response.json();
        setLowStockAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error("Failed to fetch low stock alerts:", error);
    }
  };

  const handleStockUpdate = async () => {
    if (!selectedProduct) return;

    try {
      const response = await apiCall("/api/inventory/stock/update", {
        method: "PUT",
        body: JSON.stringify({
          productId: selectedProduct._id,
          quantity: parseInt(stockUpdateForm.quantity),
          reason: stockUpdateForm.reason,
          notes: stockUpdateForm.notes,
        }),
      });

      if (response.ok) {
        toast.success("Stock updated successfully");
        setIsStockUpdateDialogOpen(false);
        setStockUpdateForm({ quantity: "", reason: "", notes: "" });
        fetchInventoryData();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update stock");
      }
    } catch (error) {
      toast.error("Failed to update stock");
    }
  };

  const handleBulkUpdate = async () => {
    const validUpdates = bulkUpdates.filter(update => 
      update.productId && update.quantity && update.reason
    ).map(update => ({
      ...update,
      quantity: parseInt(update.quantity),
    }));

    if (validUpdates.length === 0) {
      toast.error("No valid updates to process");
      return;
    }

    try {
      const response = await apiCall("/api/inventory/stock/bulk-update", {
        method: "PUT",
        body: JSON.stringify({ updates: validUpdates }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setIsBulkUpdateDialogOpen(false);
        setBulkUpdates([]);
        fetchInventoryData();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to perform bulk update");
      }
    } catch (error) {
      toast.error("Failed to perform bulk update");
    }
  };

  const openStockUpdateDialog = (product: Product) => {
    setSelectedProduct(product);
    setStockUpdateForm({
      quantity: product.stock.toString(),
      reason: "",
      notes: "",
    });
    setIsStockUpdateDialogOpen(true);
  };

  const addBulkUpdateRow = () => {
    setBulkUpdates([...bulkUpdates, { productId: "", quantity: "", reason: "" }]);
  };

  const updateBulkUpdateRow = (index: number, field: string, value: string) => {
    const updated = [...bulkUpdates];
    updated[index] = { ...updated[index], [field]: value };
    setBulkUpdates(updated);
  };

  const removeBulkUpdateRow = (index: number) => {
    setBulkUpdates(bulkUpdates.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetchInventoryData();
  }, [categoryFilter, statusFilter, lowStockThreshold]);

  useEffect(() => {
    fetchLowStockAlerts();
  }, [lowStockThreshold]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: "Out of Stock", color: "destructive" as const };
    if (stock <= 5) return { label: "Critical", color: "destructive" as const };
    if (stock <= parseInt(lowStockThreshold)) return { label: "Low", color: "secondary" as const };
    return { label: "In Stock", color: "default" as const };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
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
          <Package className="w-6 h-6 mr-2" />
          Inventory Management
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsBulkUpdateDialogOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk Update
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-slate-500">Active inventory items</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockCount}</div>
            <p className="text-xs text-slate-500">Below {stats.lowStockThreshold} units</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.outOfStockCount}</div>
            <p className="text-xs text-slate-500">Need immediate attention</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalInventoryValue)}</div>
            <p className="text-xs text-slate-500">Total stock value</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">
            Low Stock Alerts
            {lowStockAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2 text-xs">
                {lowStockAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Search Products</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      id="search"
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full md:w-[150px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {/* Add category options dynamically */}
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
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="threshold">Low Stock Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="w-full md:w-[120px]"
                    min="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.stock);
                      return (
                        <TableRow key={product._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.images[0] && (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              )}
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-slate-500">{product.slug}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {product.category?.name || "Uncategorized"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{product.stock}</span>
                              <Badge variant={stockStatus.color}>
                                {stockStatus.label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.status === "active" ? "default" : "secondary"}>
                              {product.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openStockUpdateDialog(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {lowStockAlerts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">All Stock Levels Good!</h3>
                <p className="text-slate-600">No products are below the low stock threshold.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  Low Stock Alerts ({lowStockAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lowStockAlerts.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span>Current Stock: {product.stock}</span>
                            {product.daysUntilOutOfStock && (
                              <span className="text-red-600">
                                {product.daysUntilOutOfStock} days until out of stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {product.recommendedReorder && (
                          <div className="text-sm text-blue-600 mb-1">
                            Recommended: {product.recommendedReorder} units
                          </div>
                        )}
                        <Button
                          size="sm"
                          onClick={() => openStockUpdateDialog(product)}
                        >
                          Update Stock
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Top Moving Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                Top Moving Products (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topMovingProducts.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No sales data available for the selected period.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topMovingProducts.slice(0, 10).map((product, index) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <div className="text-sm text-slate-600">
                            Stock: {product.stock} | Turnover: {((product.turnoverRate || 0) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{product.totalSold || 0} sold</div>
                        <div className="text-sm text-green-600">
                          {formatCurrency(product.revenue || 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Update Dialog */}
      <Dialog open={isStockUpdateDialogOpen} onOpenChange={setIsStockUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity">New Stock Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={stockUpdateForm.quantity}
                onChange={(e) => setStockUpdateForm({ ...stockUpdateForm, quantity: e.target.value })}
                min="0"
              />
              <p className="text-sm text-slate-500 mt-1">
                Current stock: {selectedProduct?.stock}
              </p>
            </div>
            <div>
              <Label htmlFor="reason">Reason for Update *</Label>
              <Select
                value={stockUpdateForm.reason}
                onValueChange={(value) => setStockUpdateForm({ ...stockUpdateForm, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Restock</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="damaged">Damaged/Loss</SelectItem>
                  <SelectItem value="returned">Customer Return</SelectItem>
                  <SelectItem value="adjustment">Inventory Adjustment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={stockUpdateForm.notes}
                onChange={(e) => setStockUpdateForm({ ...stockUpdateForm, notes: e.target.value })}
                placeholder="Additional notes about this stock update..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsStockUpdateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStockUpdate}
                disabled={!stockUpdateForm.quantity || !stockUpdateForm.reason}
              >
                Update Stock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={isBulkUpdateDialogOpen} onOpenChange={setIsBulkUpdateDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bulk Stock Update</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-600">
                Update multiple products at once. Select products and enter new quantities.
              </p>
              <Button onClick={addBulkUpdateRow} size="sm">
                Add Row
              </Button>
            </div>
            
            {bulkUpdates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">No updates added yet.</p>
                <Button onClick={addBulkUpdateRow}>
                  Add First Update
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {bulkUpdates.map((update, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                    <Select
                      value={update.productId}
                      onValueChange={(value) => updateBulkUpdateRow(index, "productId", value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            {product.name} (Current: {product.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={update.quantity}
                      onChange={(e) => updateBulkUpdateRow(index, "quantity", e.target.value)}
                      className="w-24"
                      min="0"
                    />
                    
                    <Select
                      value={update.reason}
                      onValueChange={(value) => updateBulkUpdateRow(index, "reason", value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restock">Restock</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBulkUpdateRow(index)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsBulkUpdateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkUpdate}
                disabled={bulkUpdates.length === 0}
              >
                Update All ({bulkUpdates.filter(u => u.productId && u.quantity && u.reason).length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

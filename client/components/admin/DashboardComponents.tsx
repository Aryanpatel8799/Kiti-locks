import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  color?: "default" | "blue" | "green" | "yellow" | "red";
}

interface DashboardStatsProps {
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    totalRevenue: number;
  };
  loading?: boolean;
}

const StatCard = ({ title, value, description, icon, trend, color = "default" }: StatCardProps) => {
  const colorClasses = {
    default: "bg-slate-50 border-slate-200",
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    yellow: "bg-yellow-50 border-yellow-200",
    red: "bg-red-50 border-red-200",
  };

  const iconColors = {
    default: "text-slate-600",
    blue: "text-blue-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
  };

  return (
    <Card className={`${colorClasses[color]} border`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <div className={`w-4 h-4 ${iconColors[color]}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
            )}
            <span
              className={`text-xs font-medium ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {trend.value > 0 ? "+" : ""}{trend.value}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardStats = ({ stats, loading = false }: DashboardStatsProps) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Products"
        value={formatNumber(stats.totalProducts)}
        icon={<Package className="w-4 h-4" />}
        color="blue"
        description="Active product listings"
      />
      <StatCard
        title="Total Orders"
        value={formatNumber(stats.totalOrders)}
        icon={<ShoppingCart className="w-4 h-4" />}
        color="green"
        description="All time orders"
      />
      <StatCard
        title="Total Users"
        value={formatNumber(stats.totalUsers)}
        icon={<Users className="w-4 h-4" />}
        color="yellow"
        description="Registered customers"
      />
      <StatCard
        title="Total Revenue"
        value={formatCurrency(stats.totalRevenue)}
        icon={<DollarSign className="w-4 h-4" />}
        color="green"
        description="All time revenue"
      />
    </div>
  );
};

interface InventoryAlert {
  _id: string;
  name: string;
  slug: string;
  stock: number;
  price: number;
  dailyVelocity?: number;
  recommendedReorder?: number;
  daysUntilOutOfStock?: number | null;
  category?: {
    name: string;
  };
}

interface InventoryAlertsProps {
  alerts: InventoryAlert[];
  loading?: boolean;
}

export const InventoryAlerts = ({ alerts, loading = false }: InventoryAlertsProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            Inventory Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg animate-pulse">
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-slate-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center">
            <AlertTriangle className="w-5 h-5 text-green-600 mr-2" />
            Inventory Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-slate-600">All products are well stocked!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAlertLevel = (stock: number) => {
    if (stock === 0) return { color: "red", label: "Out of Stock" };
    if (stock <= 5) return { color: "red", label: "Critical" };
    if (stock <= 10) return { color: "yellow", label: "Low" };
    return { color: "blue", label: "Warning" };
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg font-semibold flex items-center">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mr-2 flex-shrink-0" />
          <span className="truncate">Inventory Alerts</span>
          <Badge variant="secondary" className="ml-2 text-xs flex-shrink-0">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <div className="space-y-2 max-h-72 sm:max-h-96 overflow-y-auto">
          {alerts.slice(0, 10).map((alert) => {
            const alertLevel = getAlertLevel(alert.stock);
            return (
              <div
                key={alert._id}
                className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <h4 className="font-medium text-sm sm:text-base text-slate-900 truncate">
                      {alert.name}
                    </h4>
                    <Badge
                      variant={alertLevel.color === "red" ? "destructive" : "secondary"}
                      className="ml-2 text-xs flex-shrink-0"
                    >
                      {alertLevel.label}
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-slate-500 mt-1">
                    <span>Stock: {alert.stock}</span>
                    {alert.category && (
                      <>
                        <span className="mx-1 sm:mx-2">•</span>
                        <span className="truncate">{alert.category.name}</span>
                      </>
                    )}
                    {alert.daysUntilOutOfStock && (
                      <>
                        <span className="mx-1 sm:mx-2">•</span>
                        <span className="text-red-600 flex-shrink-0">
                          {alert.daysUntilOutOfStock} days left
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right ml-2 sm:ml-4 flex-shrink-0">
                  <div className="text-xs sm:text-sm font-medium text-slate-900">
                    ₹{alert.price.toLocaleString()}
                  </div>
                  {alert.recommendedReorder && (
                    <div className="text-xs text-blue-600">
                      Reorder: {alert.recommendedReorder}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {alerts.length > 10 && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-sm text-slate-500 text-center">
              Showing top 10 alerts. {alerts.length - 10} more items need attention.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  color: "blue" | "green" | "yellow" | "red";
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export const QuickActions = ({ actions }: QuickActionsProps) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 hover:bg-blue-100",
    green: "bg-green-50 border-green-200 hover:bg-green-100",
    yellow: "bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
    red: "bg-red-50 border-red-200 hover:bg-red-100",
  };

  const iconColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        <div className="grid gap-2 sm:gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`${colorClasses[action.color]} border rounded-lg p-3 sm:p-4 text-left transition-colors cursor-pointer group w-full`}
            >
              <div className="flex items-start">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${colorClasses[action.color]} border flex items-center justify-center mr-2 sm:mr-3 group-hover:scale-110 transition-transform flex-shrink-0`}>
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 ${iconColors[action.color]}`}>
                    {action.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm sm:text-base text-slate-900 group-hover:text-slate-700 truncate">
                    {action.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5 sm:mt-1 line-clamp-2">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default {
  DashboardStats,
  InventoryAlerts,
  QuickActions,
};

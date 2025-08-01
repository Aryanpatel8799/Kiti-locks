import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ShoppingCart,
  User,
  Heart,
  Search,
  Menu,
  LogOut,
  Settings,
  Package,
  Home,
  ShoppingBag,
  Truck,
  Info,
  Phone,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { itemsCount: cartItemsCount } = useCart();
  const { itemsCount: wishlistCount } = useWishlist();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/products", label: "Products", icon: ShoppingBag },
    { href: "/about", label: "About", icon: Info },
    { href: "/contact", label: "Contact", icon: Phone },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 xs:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-1.5 xs:space-x-2">
            <div className="w-6 h-6 xs:w-8 xs:h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs xs:text-sm">K</span>
            </div>
            <span className="text-base xs:text-lg sm:text-xl font-bold text-slate-900">Kiti Locks</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8 ml-6 lg:ml-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-slate-700 hover:text-blue-600 font-medium transition-colors text-sm lg:text-base"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:flex flex-1 max-w-xs xl:max-w-md mx-6 xl:mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="search"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1 xs:space-x-2">
            {/* Wishlist - Desktop Only */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex relative w-8 h-8 xs:w-9 xs:h-9 p-0"
              asChild
            >
              <Link to="/wishlist">
                <Heart className="w-4 h-4 xs:w-5 xs:h-5" />
                {wishlistCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 w-4 h-4 xs:w-5 xs:h-5 text-xs p-0 flex items-center justify-center"
                  >
                    {wishlistCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Cart - Desktop Only */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex relative w-8 h-8 xs:w-9 xs:h-9 p-0"
              asChild
            >
              <Link to={user ? "/cart" : "/login"}>
                <ShoppingCart className="w-4 h-4 xs:w-5 xs:h-5" />
                {cartItemsCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 w-4 h-4 xs:w-5 xs:h-5 text-xs p-0 flex items-center justify-center"
                  >
                    {cartItemsCount}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* User Account */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-8 h-8 xs:w-9 xs:h-9 p-0">
                    <Avatar className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wishlist" className="cursor-pointer">
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Wishlist</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Orders</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/track-order" className="cursor-pointer">
                      <Truck className="mr-2 h-4 w-4" />
                      <span>Track Order</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-1 xs:space-x-2">
                <Button variant="ghost" size="sm" asChild className="text-xs xs:text-sm px-2 xs:px-3">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button size="sm" asChild className="text-xs xs:text-sm px-2 xs:px-3">
                  <Link to="/register">Sign up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden w-8 h-8 xs:w-9 xs:h-9 p-0 ml-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu className="w-4 h-4 xs:w-5 xs:h-5" />
            </Button>

            {/* Mobile Sidebar */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <div className="hidden"></div>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-full xs:w-80 sm:w-96 p-0 flex flex-col bg-white"
              >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between p-4 xs:p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">K</span>
                    </div>
                    <span className="text-lg xs:text-xl font-bold text-slate-900">Kiti Locks</span>
                  </div>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Search Bar */}
                  <div className="p-4 xs:p-6 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="search"
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="p-4 xs:p-6 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to="/wishlist"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-gradient-to-br from-pink-50 to-red-50 hover:from-pink-100 hover:to-red-100 transition-all duration-200 group border border-pink-100"
                      >
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                          <Heart className="w-5 h-5 text-pink-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Wishlist</span>
                        {wishlistCount > 0 && (
                          <span className="text-xs bg-pink-600 text-white px-2 py-1 rounded-full">{wishlistCount}</span>
                        )}
                      </Link>
                      <Link
                        to={user ? "/cart" : "/login"}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 group border border-blue-100"
                      >
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                          <ShoppingCart className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Cart</span>
                        {cartItemsCount > 0 && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">{cartItemsCount}</span>
                        )}
                      </Link>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="p-4 xs:p-6">
                    <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Navigation</h3>
                    <div className="space-y-2">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          to={link.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-3 p-3 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 group"
                        >
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                            <link.icon className="w-4 h-4 text-slate-500 group-hover:text-blue-600" />
                          </div>
                          <span className="font-medium">{link.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar Footer */}
                <div className="border-t border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
                  {user ? (
                    <div className="p-4 xs:p-6">
                      <div className="flex items-center space-x-3 mb-4 p-4 bg-white rounded-xl shadow-sm border border-slate-200">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-blue-700">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Link
                          to="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-3 p-3 rounded-lg text-slate-700 hover:bg-white hover:text-blue-700 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">Profile</span>
                        </Link>
                        <Link
                          to="/orders"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-3 p-3 rounded-lg text-slate-700 hover:bg-white hover:text-blue-700 transition-colors"
                        >
                          <Package className="w-4 h-4" />
                          <span className="text-sm font-medium">Orders</span>
                        </Link>
                        <Link
                          to="/track-order"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center space-x-3 p-3 rounded-lg text-slate-700 hover:bg-white hover:text-blue-700 transition-colors"
                        >
                          <Truck className="w-4 h-4" />
                          <span className="text-sm font-medium">Track Order</span>
                        </Link>
                        {user.role === "admin" && (
                          <Link
                            to="/admin"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center space-x-3 p-3 rounded-lg text-slate-700 hover:bg-white hover:text-blue-700 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            <span className="text-sm font-medium">Admin Dashboard</span>
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-3 p-3 rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 xs:p-6 space-y-3">
                      <Button
                        asChild
                        variant="outline"
                        className="w-full justify-start bg-white hover:bg-blue-50 hover:border-blue-200 border-slate-200"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link to="/login">
                          <User className="w-4 h-4 mr-2" />
                          Sign In
                        </Link>
                      </Button>
                      <Button
                        asChild
                        className="w-full justify-start bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Link to="/register">
                          <User className="w-4 h-4 mr-2" />
                          Create Account
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}

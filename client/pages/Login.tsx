import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Mail, Lock, LogIn } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import SEO from "@/components/SEO";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      const redirect = searchParams.get("redirect") || "/";
      navigate(redirect);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Sign In to Your Account"
        description="Sign in to your Kiti Store account to access premium kitchen hardware, track orders, and manage your wishlist. Secure login with Google authentication available."
        keywords="login, sign in, kitchen hardware account, Kiti Store login, user account"
        noIndex={true}
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-4 sm:py-6 md:py-8 lg:py-12 px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
          <div className="text-center">
            <Link to="/" className="inline-flex items-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3 md:mb-4 lg:mb-6 hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg">
              <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">K</span>
              </div>
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-900">
                Kiti Store
              </span>
            </Link>
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-slate-600 px-1 sm:px-2 md:px-4">
              Sign in to your account to continue shopping
            </p>
          </div>

          <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300 backdrop-blur-sm bg-white/95 mx-auto">
            <CardHeader className="space-y-1 pb-2 sm:pb-3 md:pb-4 px-3 sm:px-4 md:px-6 lg:px-8 pt-3 sm:pt-4 md:pt-6">
              <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl text-center font-semibold text-slate-800">
                Sign in
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 sm:space-y-3 md:space-y-4 lg:space-y-6 p-3 sm:p-4 md:p-6 lg:p-8">
            {/* Google OAuth Button */}
            <div className="w-full flex justify-center">
              <div className="w-full max-w-full">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      setLoading(true);
                      setError("");
                      await loginWithGoogle(credentialResponse.credential);
                      const redirect = searchParams.get("redirect") || "/";
                      navigate(redirect);
                    } catch (error) {
                      setError("Google login failed");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onError={() => {
                    setError("Google login failed");
                  }}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  width="100%"
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full bg-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 sm:px-4 text-slate-500 font-medium">
                  Or continue with email
                </span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700 text-xs sm:text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3 md:space-y-4 lg:space-y-5">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-slate-700">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-6 sm:pl-7 md:pl-9 lg:pl-10 h-8 sm:h-9 md:h-10 lg:h-12 text-xs sm:text-sm md:text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm font-medium text-slate-700">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-6 sm:pl-7 md:pl-9 lg:pl-10 h-8 sm:h-9 md:h-10 lg:h-12 text-xs sm:text-sm md:text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg transition-all duration-200"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 sm:pt-2">
                <div className="text-xs sm:text-sm">
                  <Link
                    to="/forgot-password"
                    className="text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-sm"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-8 sm:h-9 md:h-10 lg:h-12 text-xs sm:text-sm md:text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:from-blue-700 focus:to-purple-700 transition-all duration-200 rounded-lg shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 border-b-2 border-white mr-1.5 sm:mr-2"></div>
                    <span className="text-xs sm:text-sm md:text-base">Signing in...</span>
                  </div>
                ) : (
                  <>
                    <LogIn className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1.5 sm:mr-2" />
                    <span className="text-xs sm:text-sm md:text-base">Sign in</span>
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-xs sm:text-sm">
              <span className="text-slate-600">Don't have an account? </span>
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-sm"
              >
                Create one here
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs sm:text-sm text-slate-500 px-2 sm:px-4 space-y-2 sm:space-y-3">
          <p className="leading-relaxed">
            By signing in, you agree to our{" "}
            <Link to="/terms" className="text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-sm">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded-sm">
              Privacy Policy
            </Link>
          </p>
          <p className="text-slate-400 text-xs">
            Secure login • Protected by industry-standard encryption
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

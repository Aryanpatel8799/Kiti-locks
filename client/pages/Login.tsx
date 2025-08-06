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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base sm:text-lg">K</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900">
              Kiti Locks
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Welcome back
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Sign in to your account to continue shopping
          </p>
        </div>

        <Card className="border-0 shadow-xl mx-auto">
          <CardHeader className="space-y-1 pb-4 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl text-center font-semibold">
              Sign in
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
            {/* Google OAuth Button */}
            <div className="w-full">
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">
                  Or continue with email
                </span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm sm:text-base">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 sm:pl-11 h-11 sm:h-12 text-sm sm:text-base"
                    placeholder="Enter your email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 sm:pl-11 h-11 sm:h-12 text-sm sm:text-base"
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs sm:text-sm">
                  <Link
                    to="/forgot-password"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 sm:h-12 text-sm sm:text-base"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Sign in
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-xs sm:text-sm">
              <span className="text-slate-600">Don't have an account? </span>
              <Link
                to="/register"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Create one here
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-slate-500 px-4">
          <p>
            By signing in, you agree to our{" "}
            <Link to="/terms" className="text-blue-600 hover:text-blue-500">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

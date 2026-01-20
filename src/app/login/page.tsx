"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Replace with your actual Google OAuth Client ID
// You can get this from: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", { email, password });
      console.log("Login Response:", response.data); // Debug log

      // Interceptor unwraps response.data.data to response.data
      const { accessToken, user } = response.data;
      console.log("Access Token:", accessToken); // Debug log
      console.log("User:", user); // Debug log

      if (!accessToken) {
        throw new Error("No access token received from server");
      }

      if (!user) {
        throw new Error("No user data received from server");
      }
      
      // Allow both ADMIN and BUSINESS_OWNER roles
      if (user.role !== 'ADMIN' && user.role !== 'BUSINESS_OWNER') {
          setError("Akses ditolak. Hanya Admin dan Business Owner yang dapat mengakses portal ini.");
          setIsLoading(false);
          return;
      }

      login(accessToken, user);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Kredensial tidak valid");
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth login handler
  const handleGoogleOAuth = async (idToken: string) => {
    setIsLoading(true);
    setError("");
    
    try {
      const response = await api.post("/auth/google", { idToken });
      
      const { accessToken, user } = response.data;
      
      if (!accessToken || !user) {
        throw new Error("Invalid response from server");
      }
      
      // Allow both ADMIN and BUSINESS_OWNER roles
      if (user.role !== 'ADMIN' && user.role !== 'BUSINESS_OWNER') {
        setError("Akses ditolak. Hanya Admin dan Business Owner yang dapat mengakses portal ini.");
        setIsLoading(false);
        return;
      }
      
      login(accessToken, user);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Google Sign-In gagal");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.1),transparent_50%)]" />
      
      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800/50" />
      
      <Card className="w-full max-w-md relative z-10 border-border shadow-2xl animate-fade-in bg-card">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-6">
             <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
                <Store className="w-12 h-12" />
             </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Portal Admin</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Masukkan kredensial Anda untuk mengakses dasbor
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 py-6">
             {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
             )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@pos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background border-border focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="password" className="text-sm font-semibold">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background border-border focus:ring-2 focus:ring-primary/20"
              />
              <div className="text-right">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Lupa Kata Sandi?
                </Link>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-8">
            <Button className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Masuk
            </Button>

            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Atau</span>
              </div>
            </div>

            <div className="w-full flex justify-center">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  if (credentialResponse.credential) {
                    handleGoogleOAuth(credentialResponse.credential);
                  }
                }}
                onError={() => {
                  setError("Google Sign-In gagal. Silakan coba lagi.");
                }}
                theme="outline"
                size="large"
                text="continue_with"
              />
            </div>
          </CardFooter>
        </form>
      </Card>
      
      <div className="absolute bottom-6 text-center text-xs text-muted-foreground font-medium">
        &copy; 2026 Sistem POS. Hak cipta dilindungi undang-undang.
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <LoginForm />
    </GoogleOAuthProvider>
  );
}

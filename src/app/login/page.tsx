"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Loader2 } from "lucide-react";

export default function LoginPage() {
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
      
      if (user.role !== 'ADMIN') {
          setError("Access denied. Only Admins can access this portal.");
          setIsLoading(false);
          return;
      }

      login(accessToken, user);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-900 p-4">
      <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800/50" />
      
      <Card className="w-full max-w-md relative z-10 glass border-slate-200/50 dark:border-slate-700/50 shadow-2xl animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
             <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                <Store className="w-10 h-10" />
             </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Portal</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
             {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                  {error}
                </div>
             )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@pos.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/50 dark:bg-slate-950/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/50 dark:bg-slate-950/50"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full shadow-lg shadow-primary/20" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="absolute bottom-4 text-center text-xs text-muted-foreground">
        &copy; 2026 POS System. All rights reserved.
      </div>
    </div>
  );
}

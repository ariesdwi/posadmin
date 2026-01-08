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
          setError("Akses ditolak. Hanya Admin yang dapat mengakses portal ini.");
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
            </div>
          </CardContent>
          <CardFooter className="pb-8">
            <Button className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Masuk
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="absolute bottom-6 text-center text-xs text-muted-foreground font-medium">
        &copy; 2026 Sistem POS. Hak cipta dilindungi undang-undang.
      </div>
    </div>
  );
}

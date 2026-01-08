"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getCookie, setCookie, deleteCookie } from "cookies-next";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";

interface User {
  id: string | number;
  email: string;
  role: "ADMIN" | "KASIR";
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getCookie("token");
    if (token) {
      try {
        const decoded: any = jwtDecode(token as string);
        // Assuming the payload has user info or we just check validity
        // For now, let's verify if we have user data in cookies or just trust the token
        // In a real app we might fetch /auth/profile
        const userCookie = getCookie("user");
        if (userCookie) {
             setUser(JSON.parse(userCookie as string));
        } else {
             // If we have token but no user object, maybe try to decode the token for role/id
             // or fetch from API. For now, we'll try to use the token payload if it has structure
             if (decoded.sub && decoded.email && decoded.role) {
                setUser({
                    id: decoded.sub,
                    email: decoded.email,
                    role: decoded.role
                });
             }
        }
      } catch (error) {
        console.error("Invalid token", error);
        deleteCookie("token");
        deleteCookie("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (token: string, userData: User) => {
    setCookie("token", token, { maxAge: 60 * 60 * 24 * 7 }); // 7 days
    setCookie("user", JSON.stringify(userData), { maxAge: 60 * 60 * 24 * 7 });
    setUser(userData);
    router.push("/");
  };

  const logout = () => {
    deleteCookie("token");
    deleteCookie("user");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

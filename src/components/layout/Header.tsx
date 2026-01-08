"use client";

import { useAuth } from "@/context/AuthContext";
import { UserCircle } from "lucide-react";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="h-16 flex items-center justify-between md:justify-end px-4 md:px-8 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-20 ml-0 md:ml-64 transition-[margin]">
      {/* Mobile: Show title, Desktop: Show user info */}
      <div className="md:hidden">
        <h2 className="text-lg font-bold text-primary ml-12">
          Admin POS
        </h2>
      </div>
      
      <div className="flex items-center gap-3 md:gap-4">
        <span className="text-xs md:text-sm font-medium text-muted-foreground hidden sm:block">
          Selamat datang, {user?.name || user?.email || "Admin"}
        </span>
        
        <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <UserCircle className="text-primary w-5 h-5 md:w-6 h-6"/>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useAuth } from "@/context/AuthContext";
import { UserCircle } from "lucide-react";

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="h-16 flex items-center justify-between md:justify-end px-4 md:px-8 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-20 ml-0 md:ml-64 transition-[margin]">
      {/* Mobile: Show title, Desktop: Show user info */}
      <div className="md:hidden">
        <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent ml-12">
          POS Admin
        </h2>
      </div>
      
      <div className="flex items-center gap-3 md:gap-4">
        <span className="text-xs md:text-sm font-medium text-muted-foreground hidden sm:block">
          Welcome, {user?.name || user?.email || "Admin"}
        </span>
        
        <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-gradient-to-tr from-primary to-accent p-[2px]">
          <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
            <UserCircle className="text-primary w-4 h-4 md:w-5 md:h-5"/>
          </div>
        </div>
      </div>
    </header>
  );
}

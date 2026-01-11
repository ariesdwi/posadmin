"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  Package, 
  FolderOpen, 
  Users, 
  FileText, 
  LogOut,
  X,
  Menu
} from "lucide-react";
import { useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dasbor", icon: LayoutDashboard },
    { href: "/products", label: "Produk", icon: Package },
    { href: "/categories", label: "Kategori", icon: FolderOpen },
    { href: "/users", label: "Pengguna", icon: Users },
    { href: "/reports", label: "Laporan", icon: FileText },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Menu Button - Aligned with Header */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-3 left-4 z-50 p-2 rounded-md hover:bg-accent/50 text-foreground transition-colors"
        aria-label="Toggle Menu"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-background border-r border-border z-50
          transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="flex flex-col h-full bg-card">
          {/* Logo/Brand */}
          <div className="h-16 flex items-center px-6 border-b border-border">
            <h1 className="text-xl font-bold text-primary tracking-tight">
              Admin POS
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-md transition-all text-sm font-medium
                    ${
                      active
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-border">
            <button
              onClick={() => {
                closeMobileMenu();
                logout();
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

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
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar border border-sidebar-accent shadow-lg text-sidebar-foreground"
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
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-sidebar border-r border-sidebar-accent z-40
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-sidebar-accent">
            <h1 className="text-2xl font-bold text-white">
              Admin POS
            </h1>
            <p className="text-xs text-sidebar-foreground/60 mt-1">Manajemen Point of Sale</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${
                      active
                        ? "bg-sidebar-primary text-white shadow-lg shadow-sidebar-primary/20"
                        : "text-sidebar-foreground/70 hover:bg-white/5 hover:text-white"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-sidebar-accent">
            <button
              onClick={() => {
                closeMobileMenu();
                logout();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Keluar</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

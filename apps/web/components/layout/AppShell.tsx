"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Clock,
  FileCheck,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  ShieldCheck,
  Users,
  Building,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  userRole?: "STUDENT_CLUB" | "AUTHORITY" | "VERIFIER" | "ADMIN";
  userEmail?: string;
  userName?: string;
}

export function AppShell({
  children,
  userRole = "STUDENT_CLUB",
  userEmail = "user@college.edu",
  userName = "Campus User",
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const getNavLinks = () => {
    switch (userRole) {
      case "AUTHORITY":
        return [
          { name: "Pending Approvals", href: "/authority/dashboard", icon: Clock },
          { name: "Resource Calendar", href: "/authority/resources", icon: Calendar },
          { name: "Decision History", href: "/authority/history", icon: History },
          { name: "Verify Letters", href: "/verify", icon: ShieldCheck },
        ];
      case "ADMIN":
        return [
          { name: "Audit Trail", href: "/admin/audit", icon: History },
          { name: "Departments", href: "/admin/departments", icon: Building },
          { name: "Resources", href: "/admin/resources", icon: Calendar },
          { name: "Users & Roles", href: "/admin/users", icon: Users },
          { name: "Verify Letters", href: "/verify", icon: ShieldCheck },
        ];
      case "VERIFIER":
        return [
          { name: "Document Verification", href: "/verify", icon: ShieldCheck },
          { name: "Public Guidelines", href: "/", icon: FileCheck },
        ];
      case "STUDENT_CLUB":
      default:
        return [
          { name: "My Events", href: "/club/dashboard", icon: LayoutDashboard },
          { name: "Create Event", href: "/club/events/new", icon: PlusCircle },
          { name: "Resource Catalogue", href: "/club/resources", icon: Building },
          { name: "Verify Documents", href: "/verify", icon: ShieldCheck },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Desktop Sidebar (232px) */}
      <aside className="hidden md:flex flex-col w-[232px] bg-graphite text-white border-r border-[#2A2A2A] shrink-0">
        <div className="h-16 flex items-center px-5 border-b border-[#2A2A2A] justify-between">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-7 h-7 bg-signal-orange flex items-center justify-center font-mono font-bold text-xs text-white">
              TK
            </div>
            <span className="font-mono text-xs font-semibold tracking-widest uppercase">
              THEKEDAR
            </span>
          </Link>
          <span className="text-[10px] font-mono text-muted uppercase tracking-wider">v1.0</span>
        </div>

        {/* User Context */}
        <div className="p-4 border-b border-[#2A2A2A] bg-[#1E1E1E]">
          <div className="text-xs font-medium text-white truncate">{userName}</div>
          <div className="text-[10px] font-mono text-muted truncate mt-0.5">{userEmail}</div>
          <div className="mt-2">
            <span className="inline-block px-1.5 py-0.5 bg-[#2E2E2E] text-signal-orange font-mono text-[9px] uppercase tracking-wider">
              {userRole.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-xs font-medium rounded-[2px] transition-colors",
                  isActive
                    ? "bg-signal-orange text-white font-semibold"
                    : "text-[#B0B0A8] hover:bg-[#242424] hover:text-white"
                )}
              >
                <Icon className={cn("w-4 h-4 mr-2.5 shrink-0", isActive ? "text-white" : "text-[#70706B]")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[#2A2A2A]">
          <Link
            href="/auth/login"
            className="flex items-center px-3 py-2 text-xs text-muted hover:text-white hover:bg-[#242424] rounded-[2px] transition"
          >
            <LogOut className="w-4 h-4 mr-2.5" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header (64px) */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 text-ink hover:bg-neutral-100"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-sm md:text-base font-semibold text-ink tracking-tight uppercase font-mono">
              Institutional Operations System
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/verify"
              className="hidden sm:inline-flex items-center px-3 py-1.5 border border-border bg-paper text-ink font-mono text-xs hover:bg-neutral-100 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-signal-orange" />
              Verify Document
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-graphite text-white border-b border-[#2A2A2A] px-4 py-3 space-y-1">
            {navLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3 py-2 text-xs text-[#B0B0A8] hover:text-white"
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.name}
              </Link>
            ))}
          </div>
        )}

        {/* Working Canvas */}
        <main className="flex-1 p-4 md:p-8 max-w-[1440px] w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

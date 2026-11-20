"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Plus, Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth";
import { SearchDialog } from "@/components/search-dialog";
import { Logo } from "@/components/logo";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-9 w-9" />;
  }

  const cycle = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const label = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";

  return (
    <button
      onClick={cycle}
      className="h-9 w-9 inline-flex items-center justify-center rounded-md border hover:bg-muted transition-colors cursor-pointer"
      title={`Theme: ${label} (click to change)`}
      aria-label={`Theme: ${label}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function SiteHeader() {
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md"
      >
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/" className="hover:opacity-90 transition-opacity">
              <Logo />
            </Link>
          </div>

          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="h-9 w-9 sm:w-auto sm:flex-1 sm:max-w-md flex items-center justify-center sm:justify-start gap-2 sm:px-3 rounded-md border bg-muted/40 text-sm text-muted-foreground hover:bg-muted/60 transition-colors text-left shrink-0 sm:shrink cursor-pointer"
            aria-label="Search properties"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline truncate">Search properties, areas...</span>
          </button>

          <nav className="flex items-center gap-2 text-sm shrink-0">
            <ThemeToggle />
            {user ? (
              <>
                <Link href="/owner/dashboard" className="hover:text-foreground text-muted-foreground transition-colors hidden lg:inline">Dashboard</Link>
                <Link href="/profile" className="hover:text-foreground text-muted-foreground transition-colors hidden lg:inline">Profile</Link>
                <Link href="/owner/buildings/new" className="bg-primary text-primary-foreground rounded-md px-3 py-2 font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add property</span>
                  <span className="sm:hidden">Add</span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="border rounded-md px-3 py-1.5 hover:bg-muted transition-colors hidden md:inline-flex"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/sign-in" className="bg-primary text-primary-foreground rounded-md px-3 sm:px-4 py-2 font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add property</span>
                <span className="sm:hidden">Add</span>
              </Link>
            )}
          </nav>
        </div>
      </motion.header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}

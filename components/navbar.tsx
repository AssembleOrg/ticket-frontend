"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Ticket, Users, FolderOpen, UserCheck, ClipboardList, FileText, Search, Menu, X, LogOut, Wrench, Columns3, Shield, BookOpen, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { CommandPalette } from "@/components/command-palette";
import { NotificationsBell } from "@/components/notifications-bell";
import { logout } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tickets", label: "Tickets", icon: Ticket },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/proyectos", label: "Proyectos", icon: FolderOpen },
  { href: "/responsables", label: "Responsables", icon: UserCheck },
  { href: "/comprobantes", label: "Comprobantes", icon: FileText },
  { href: "/vault", label: "Vault", icon: Shield },
  { href: "/tablero", label: "Tablero", icon: Columns3 },
  { href: "/wiki", label: "Wiki", icon: BookOpen },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/auditoria", label: "Auditoría", icon: ClipboardList },
  { href: "/herramientas", label: "Herramientas", icon: Wrench },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Usuario");
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("@/lib/auth").then(({ getMe }) => {
      getMe().then((user) => {
        if (user.name) setUserName(user.name);
        else if (user.email) setUserName(user.email.split("@")[0]);
      }).catch(() => {});
    });
  }, []);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await logout();
      router.push("/login");
    } catch {
      toast.error("Error al cerrar sesión");
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/6 bg-background/80 backdrop-blur-xl">
      {/* Top bar */}
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="h-2.5 w-2.5 rounded-sm bg-neon" />
          <span className="text-sm font-bold tracking-wider text-white uppercase">
            TicketOps
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              // Dispatch Cmd+K to open command palette
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
            }}
            className="flex items-center justify-center h-9 w-9 sm:w-auto sm:gap-2 sm:px-3 rounded-lg border border-white/8 bg-white/5 text-sm text-white/30 transition-colors hover:border-white/15 hover:bg-white/8 cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline flex-1 text-left">Buscar...</span>
            <kbd className="hidden lg:inline rounded border border-white/10 bg-white/5 px-1.5 text-[10px] font-mono">⌘K</kbd>
          </button>

          <NotificationsBell />

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="cursor-pointer"
            >
              <Avatar name={userName} size="sm" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-lg border border-white/8 bg-[#111117] py-1 shadow-xl z-50">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/8 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white md:hidden"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Desktop nav - scrollable horizontal bar below */}
      <nav className="hidden md:block border-t border-white/4">
        <div className="flex items-center gap-1 px-4 sm:px-6 overflow-x-auto scrollbar-none">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-xs font-medium transition-colors shrink-0 ${
                  isActive
                    ? "bg-neon/15 text-neon"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen ? (
        <nav className="grid gap-1 border-t border-white/6 px-4 py-3 md:hidden max-h-[70vh] overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-neon/15 text-neon"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </nav>
      ) : null}

      <CommandPalette />
    </header>
  );
}

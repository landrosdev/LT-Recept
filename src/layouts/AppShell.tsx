import { useEffect, useMemo, useState } from "react"
import { Link, Outlet, useLocation } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import { ModeToggle } from "@/components/mode-toggle"

import {
  BedDouble,
  CalendarCheck,
  ClipboardList,
  DoorOpen,
  FileText,
  Home,
  LogOut,
  Mail,
  Siren,
  Users,
  Wrench,
} from "lucide-react"

import { useAuth } from "@/hooks/useAuth"
import { cn } from "@/lib/utils"
import { LogoLtRecepCompact } from "@/components/Logo"

type NavItem = {
  key: string
  label: string
  to: string
  icon: React.ComponentType<{ className?: string }>
}

function getBreadcrumbLabel(pathname: string): string {
  const labels: Record<string, string> = {
    "/": "Accueil",
    "/arrivee-depart": "Arrivée / Départ",
    "/chambres": "Chambres",
    "/equipements": "Équipements",
    "/reservations": "Réservations",
    "/clients": "Clients",
    "/factures": "Factures",
    "/incidents": "Incidents",
    "/utilisateurs": "Utilisateurs",
    "/taches": "Tâches",
    "/parametres": "Paramètres",
    "/a-propos": "À propos",
  }
  return labels[pathname] || pathname.replace("/", "").replace(/-/g, " ")
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const handler = () => {
      setIsCollapsed((v) => !v)
    }

    window.addEventListener("ui:toggle-sidebar", handler)
    return () => window.removeEventListener("ui:toggle-sidebar", handler)
  }, [])

  const items: NavItem[] = useMemo(
    () => [
      { key: "home", label: "Accueil", to: "/", icon: Home },
      { key: "arrivee-depart", label: "Arrivée / Départ", to: "/arrivee-depart", icon: DoorOpen },
      { key: "reservations", label: "Réservations", to: "/reservations", icon: CalendarCheck },
      { key: "chambres", label: "Chambres", to: "/chambres", icon: BedDouble },
      { key: "clients", label: "Clients", to: "/clients", icon: Users },
      { key: "factures", label: "Factures", to: "/factures", icon: FileText },
      { key: "incidents", label: "Incidents", to: "/incidents", icon: Siren },
      { key: "taches", label: "Tâches", to: "/taches", icon: ClipboardList },
      { key: "equipements", label: "Équipements", to: "/equipements", icon: Wrench },
    ],
    []
  )

  function isActive(to: string) {
    if (to === "/") return pathname === "/"
    return pathname === to || pathname.startsWith(to + "/")
  }

  return (
    <div className="min-h-svh bg-background">
      <div className="flex h-svh">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out relative z-50",
            isCollapsed ? "w-14" : "w-14"
          )}
        >
          {/* Top logo section */}
          <div className="flex h-14 items-center justify-center bg-sidebar border-b border-sidebar-border">
            <LogoLtRecepCompact className="h-10 w-10 text-sidebar-primary" />
          </div>

          {/* Navigation icons */}
          <nav className="flex-1 py-2 overflow-visible">
            <ul className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.to)

                return (
                  <li key={item.key} className="relative">
                    <Link
                      to={item.to}
                      className={cn(
                        "group flex h-11 w-full items-center justify-center transition-all duration-200 ease-out",
                        active
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-5 shrink-0 transition-transform duration-200",
                          active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/80",
                          "group-hover:scale-110"
                        )}
                      />
                      {/* Label qui apparaît au hover avec animation slide from left */}
                      <span className={cn(
                        "absolute left-full top-1/2 -translate-y-1/2 ml-3 h-9 overflow-hidden rounded-md",
                        "bg-popover text-popover-foreground shadow-md border border-border",
                        "max-w-0 px-0 opacity-0",
                        "group-hover:max-w-[200px] group-hover:px-3 group-hover:opacity-100",
                        "transition-all duration-500 ease-out",
                        "z-[100] flex items-center whitespace-nowrap text-sm font-medium"
                      )}>
                        {item.label}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Bottom actions */}
          <div className="border-t border-sidebar-border py-2">
            <button
              type="button"
              onClick={logout}
              className="group relative flex h-11 w-full items-center justify-center text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="size-5 shrink-0" />
              {/* Label qui apparaît au hover */}
              <span className={cn(
                "absolute left-full top-1/2 -translate-y-1/2 ml-3 h-9 overflow-hidden rounded-md",
                "bg-destructive text-destructive-foreground shadow-xl",
                "max-w-0 px-0 opacity-0",
                "group-hover:max-w-[150px] group-hover:px-3 group-hover:opacity-100",
                "transition-all duration-500 ease-out",
                "z-[100] flex items-center whitespace-nowrap text-sm font-medium"
              )}>
                Déconnexion
              </span>
            </button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Topbar */}
          <header className="flex h-14 items-center justify-between bg-primary px-4 shadow-sm">
            {/* Left: Logo + Breadcrumb */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary-foreground">LT-Recep</span>
                <span className="text-xs text-primary-foreground/70">Gestion Réception</span>
              </div>
              
              <div className="h-6 w-px bg-primary-foreground/20" />
              
              <div className="flex items-center gap-2 text-sm text-primary-foreground/90">
                <span className="text-primary-foreground/60">Vous êtes ici :</span>
                <span className="font-medium text-primary-foreground">{getBreadcrumbLabel(pathname)}</span>
              </div>
            </div>

            {/* Right: Actions + User */}
            <div className="flex items-center gap-3">
              <ModeToggle />
              
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
                title="Messages"
              >
                <Mail className="size-5" />
              </button>
              
              <div className="h-6 w-px bg-primary-foreground/20" />
              
              <div className="flex items-center gap-3 rounded bg-primary-foreground/10 px-3 py-1.5">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-medium text-primary-foreground">{user?.nom_user ?? "Utilisateur"}</span>
                  <span className="text-[10px] text-primary-foreground/70">{user?.statut ?? "Compte"}</span>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary-foreground/20">
                  <Users className="size-4 text-primary-foreground" />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-background p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  )
}
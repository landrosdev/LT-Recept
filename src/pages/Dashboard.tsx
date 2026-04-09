// page dashboard style Isidoor - couleurs du projet (bleu/noir/blanc)
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Link } from "react-router-dom"

import {
  ArrowRight,
  BedDouble,
  CalendarCheck,
  ClipboardList,
  DoorOpen,
  FileText,
  Home,
  Users,
  Clock,
  CheckCircle2,
  Flag,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

import { invoke } from "@tauri-apps/api/core"

type DashboardItem = {
  key: string
  label: string
  icon: ReactNode
  to: string
  variant: "primary" | "secondary" | "accent"
  badge?: { text: string; variant: "new" | "updated" }
}

export default function Dashboard() {
  const { user } = useAuth()

  const [counts, setCounts] = useState({
    clients: 0,
    reservations: 0,
    sejours: 0,
    factures: 0,
    incidents: 0,
    utilisateurs: 0,
    taches: 0,
    chambres: 0,
  })

  const [recentSejours, setRecentSejours] = useState<any[]>([])
  const [recentReservations, setRecentReservations] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loadingExtras, setLoadingExtras] = useState(true)

  const now = useMemo(() => new Date(), [])
  const dayLabel = now.toLocaleDateString("fr-FR", { weekday: "long" })
  const dateLabel = now.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  useEffect(() => {
    let canceled = false

    async function load() {
      try {
        const [
          clients,
          chambres,
          reservations,
          sejours,
          factures,
          incidents,
          utilisateurs,
          taches,
        ] = await Promise.all([
          invoke<unknown[]>("list_clients_command"),
          invoke<unknown[]>("list_chambres_command"),
          invoke<unknown[]>("list_reservations_command"),
          invoke<unknown[]>("list_sejours_command"),
          invoke<unknown[]>("list_factures_command"),
          invoke<unknown[]>("list_incidents_command"),
          invoke<unknown[]>("list_utilisateurs_command"),
          invoke<unknown[]>("list_taches_command"),
        ])

        if (canceled) return
        setCounts({
          clients: clients.length,
          chambres: chambres.length,
          reservations: reservations.length,
          sejours: sejours.length,
          factures: factures.length,
          incidents: incidents.length,
          utilisateurs: utilisateurs.length,
          taches: taches.length,
        })

        // Sort and slice for "recent"
        setRecentSejours(sejours.slice(0, 5))
        setRecentReservations(reservations.slice(0, 5))
        setClients(clients)

      } catch (e) {
        console.error("Dashboard load error", e)
      } finally {
        if (!canceled) setLoadingExtras(false)
      }
    }

    load()
    return () => {
      canceled = true
    }
  }, [])

  const dashboardItems: DashboardItem[] = useMemo(
    () => [
      {
        key: "arrivee_depart",
        label: "Arrivée / Départ",
        icon: <DoorOpen className="size-7" />,
        to: "/arrivee-depart",
        variant: "primary",
      },
      {
        key: "chambres",
        label: "Gestion des chambres",
        icon: <BedDouble className="size-7" />,
        to: "/chambres",
        variant: "primary",
      },
      {
        key: "clients",
        label: "Gestion des clients",
        icon: <Users className="size-7" />,
        to: "/clients",
        variant: "primary",
      },
      {
        key: "reservations",
        label: "Réservations",
        icon: <CalendarCheck className="size-7" />,
        to: "/reservations",
        variant: "primary",
        badge: counts.reservations > 0 ? { text: `${counts.reservations} en cours`, variant: "updated" } : undefined,
      },
      {
        key: "factures",
        label: "Factures",
        icon: <FileText className="size-7" />,
        to: "/factures",
        variant: "secondary",
      },
      {
        key: "incidents",
        label: "Incidents",
        icon: <Flag className="size-7" />,
        to: "/incidents",
        variant: "accent",
        badge: counts.incidents > 0 ? { text: "nouveau", variant: "new" } : undefined,
      },
      {
        key: "taches",
        label: "Tâches",
        icon: <ClipboardList className="size-7" />,
        to: "/taches",
        variant: "secondary",
      },
    ],
    [counts.reservations, counts.incidents]
  )

  return (
    <div className="mx-auto max-w-7xl page-enter">
      {/* Breadcrumb title */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Home className="size-4" />
          <span>Accueil</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Accueil</h1>
      </div>

      {/* Welcome message */}
      <div className="mb-8 border-b border-border pb-4">
        <p className="text-sm text-muted-foreground">
          Bienvenue dans LT-Recep, veuillez choisir un module...
        </p>
      </div>

      {/* Dashboard tiles - style Isidoor avec couleurs du projet */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dashboardItems.map((item, index) => {
          return (
            <Link
              key={item.key}
              to={item.to}
              style={{ animationDelay: `${index * 50}ms` }}
              className={cn(
                "group relative flex h-20 items-center gap-4 overflow-hidden p-4 shadow-sm transition-all duration-200 hover:shadow-md animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards",
                item.variant === "primary" && "bg-primary text-primary-foreground hover:brightness-110",
                item.variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
                item.variant === "accent" && "bg-card text-foreground border border-border hover:bg-muted"
              )}
            >
              {/* Left icon area */}
              <div className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center",
                item.variant === "primary" && "bg-primary-foreground/20",
                item.variant === "secondary" && "bg-primary/10",
                item.variant === "accent" && "bg-primary/10"
              )}>
                <span className={cn(
                  item.variant === "primary" && "text-primary-foreground",
                  item.variant === "secondary" && "text-primary",
                  item.variant === "accent" && "text-primary"
                )}>
                  {item.icon}
                </span>
              </div>

              {/* Center content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-sm font-semibold leading-tight",
                    item.variant === "accent" && "text-foreground"
                  )}>{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      "px-1.5 py-0.5 text-[10px] font-medium",
                      item.badge.variant === "new" && "bg-destructive text-destructive-foreground",
                      item.badge.variant === "updated" && "bg-green-600 text-primary-foreground dark:bg-green-500"
                    )}>
                      {item.badge.text}
                    </span>
                  )}
                </div>
              </div>

              {/* Right arrow - Isidoor style */}
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center transition-transform duration-200 group-hover:translate-x-1",
                item.variant === "primary" && "bg-primary-foreground text-primary",
                item.variant === "secondary" && "bg-primary text-primary-foreground",
                item.variant === "accent" && "bg-primary text-primary-foreground"
              )}>
                <ArrowRight className="size-5" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent Summaries */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Stays */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Clock className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Séjours récents</h2>
          </div>
          <div className="overflow-hidden border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Client</th>
                  <th className="px-4 py-2 text-left font-medium">Chambre</th>
                  <th className="px-4 py-2 text-left font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentSejours.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Aucun séjour récent</td></tr>
                ) : (
                  recentSejours.map((s) => {
                    const client = clients.find(c => c.id_client === s.id_client)
                    return (
                      <tr key={s.id_sejour} className="hover:bg-muted/30">
                        <td className="px-4 py-2 font-medium">
                          {client ? `${client.prenom ?? ""} ${client.nom}` : "Client inconnu"}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">Chambre #{s.id_chambre}</td>
                        <td className="px-4 py-2">
                          <span className={cn(
                            "px-1.5 py-0.5 text-[10px] uppercase font-bold",
                            s.statut === "ARRIVE" && "bg-emerald-100 text-emerald-700",
                            s.statut === "EN_SEJOUR" && "bg-blue-100 text-blue-700",
                            s.statut === "PARTI" && "bg-muted text-muted-foreground"
                          )}>
                            {s.statut}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Reservations (Livraisons) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <CalendarCheck className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Réservations récentes</h2>
          </div>
          <div className="overflow-hidden border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Client</th>
                  <th className="px-4 py-2 text-left font-medium">Dates</th>
                  <th className="px-4 py-2 text-left font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentReservations.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Aucune réservation récente</td></tr>
                ) : (
                  recentReservations.map((r) => {
                    const client = clients.find(c => c.id_client === r.id_client)
                    return (
                      <tr key={r.id_reservation} className="hover:bg-muted/30">
                        <td className="px-4 py-2 font-medium">
                          {client ? `${client.prenom ?? ""} ${client.nom}` : "Client inconnu"}
                        </td>
                        <td className="px-4 py-2 text-xs text-muted-foreground">
                          {new Date(r.date_arrivee).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">
                           <span className={cn(
                            "px-1.5 py-0.5 text-[10px] uppercase font-bold",
                            r.statut === "CONFIRMEE" && "bg-blue-100 text-blue-700",
                            r.statut === "EN_ATTENTE" && "bg-amber-100 text-amber-700",
                            r.statut === "TERMINEE" && "bg-emerald-100 text-emerald-700"
                          )}>
                            {r.statut}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Date display */}
      <div className="mt-12 text-center text-[10px] text-muted-foreground uppercase tracking-widest border-t pt-4">
        {dayLabel} {dateLabel} • Connecté en tant que {user?.nom_user ?? "Utilisateur"}
      </div>
    </div>
  )
}

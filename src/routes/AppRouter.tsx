import { useEffect } from "react"
import { HashRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom"

import { listen } from "@tauri-apps/api/event"
import { toast } from "sonner"

import { logout as logoutService } from "@/services/Auth_service"
import { useAuth } from "@/hooks/useAuth"

import RequireAuth from "@/routes/RequireAuth"
import RequireAdmin from "@/routes/RequireAdmin"

import Dashboard from "@/pages/Dashboard"
import LoginPage from "@/pages/login_page"
import ChambresPage from "@/pages/chambres_page"
import EquipementsPage from "@/pages/equipements_page"
import ClientsPage from "@/pages/clients_page"
import ArriveeDepartPage from "@/pages/arrivee_depart_page"
import ReservationsPage from "@/pages/reservations_page"
import FacturesPage from "@/pages/factures_page"
import IncidentsPage from "@/pages/incidents_page"
import TachesPage from "@/pages/taches_page"
import AProposPage from "@/pages/a_propos_page"

// Admin specific pages
import AuditPage from "@/pages/admin/audit_page"
import UtilisateursPage from "@/pages/admin/utilisateurs_page"
import ParametresPage from "@/pages/admin/parametres_page"
import HistoriquePage from "@/pages/admin/historique_page"
import GrilleTarifairePage from "@/pages/admin/grille_tarifaire_page"

import AppShell from "@/layouts/AppShell"

function AppMenuBridge() {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    let unlisten: null | (() => void) = null

    async function run() {
      unlisten = await listen<{ id: string }>("app-menu", (event) => {
        const id = event.payload?.id
        if (!id) return

        // If trying to access protected routes via menu while logged out
        if (!user && id !== "app.toggle_sidebar" && id !== "app.logout" && id !== "app.login") {
          toast.error("Accès refusé", {
            description: "Il faut se connecter d'abord pour accéder à ce module.",
          })
          navigate("/login")
          return
        }

        switch (id) {
          case "app.home": {
            navigate("/")
            break
          }
          case "app.logout": {
            logoutService()
            navigate("/login")
            break
          }
          case "app.toggle_sidebar": {
            window.dispatchEvent(new Event("ui:toggle-sidebar"))
            break
          }
          case "app.utilisateurs": {
            navigate("/utilisateurs")
            break
          }
          case "app.parametres": {
            navigate("/parametres")
            break
          }
          case "app.audit": {
            navigate("/audit")
            break
          }
          case "app.a_propos": {
            navigate("/a-propos")
            break
          }
          case "app.historique.sejours":
          case "app.historique.reservations":
          case "app.historique.factures": {
            navigate("/historique")
            break
          }
          default:
            break
        }
      })
    }

    void run()
    return () => {
      if (unlisten) unlisten()
    }
  }, [navigate, user])

  return null
}

export default function AppRouter() {
  return (
    <HashRouter>
      <AppMenuBridge />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chambres" element={<ChambresPage />} />
            <Route path="/equipements" element={<EquipementsPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/arrivee-depart" element={<ArriveeDepartPage />} />
            <Route path="/reservations" element={<ReservationsPage />} />
            <Route path="/factures" element={<FacturesPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="/taches" element={<TachesPage />} />
            <Route path="/a-propos" element={<AProposPage />} />
            
            {/* Direct access to admin pages */}
            <Route element={<RequireAdmin />}>
              <Route path="/utilisateurs" element={<UtilisateursPage />} />
              <Route path="/audit" element={<AuditPage />} />
              <Route path="/parametres" element={<ParametresPage />} />
              <Route path="/historique" element={<HistoriquePage />} />
              <Route path="/grille-tarifaire" element={<GrilleTarifairePage />} />
            </Route>

          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

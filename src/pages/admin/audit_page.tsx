import { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import { getCurrencySymbol } from "@/utils/currency"
import { toast } from "sonner"
import { listAuditLogs, type AuditLog } from "@/services/Audit_service"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  History, 
  Search, 
  User,
  Clock,
  Activity,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { listReservations } from "@/services/Reservation_service"
import { listFactures } from "@/services/Facture_service"
import { listClients } from "@/services/Client_service"
import { listChambres } from "@/services/Chambre_service"
import * as XLSX from "xlsx"
import { FileSpreadsheet, Database } from "lucide-react"


export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [isExportingRapport, setIsExportingRapport] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(15)


  useEffect(() => {
    async function load() {
      try {
        const data = await listAuditLogs()
        setLogs(data)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.nom_user && log.nom_user.toLowerCase().includes(search.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase()))
    
    const logDate = new Date(log.date_action).toISOString().split('T')[0]
    const matchesDate = logDate >= startDate && logDate <= endDate
    
    return matchesSearch && matchesDate
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / pageSize)
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, startDate, endDate])

  function formatDetails(log: AuditLog) {
    if (!log.details) return "—"
    try {
      const d = JSON.parse(log.details)
      switch (log.action) {
        case "CREATION_RESERVATION":
        case "MISE_A_JOUR_RESERVATION":
          return `Réservation pour ${d.client} (Début: ${new Date(d.date_debut).toLocaleDateString()}, Total: ${d.total} ${getCurrencySymbol()})`
        case "SUPPRESSION_RESERVATION":
          return `Suppression rés. #${d.id_reservation} (${d.client})`
        case "PAIEMENT_FACTURE":
          return `Paiement reçu: ${d.montant} ${getCurrencySymbol()} (Facture #${d.id_facture}, Mode: ${d.mode})`
        case "CREATION_FACTURE":
          return `Facture #${d.id_facture} générée pour ${d.client} (${d.montant} ${getCurrencySymbol()})`
        case "ARRIVEE_CLIENT":
          return `Check-in: ${d.client} dans les chambres ${d.chambres}`
        case "CREATION_SEJOUR_DIRECT":
        case "MODIFICATION_SEJOUR":
          return `Séjour direct: ${d.client} (Total: ${d.total} ${getCurrencySymbol()})`
        case "DEPART_CLIENT":
          return `Check-out (Fin de séjour): ${d.client} (Séjour #${d.id_sejour})`
        case "CREATION_CHAMBRE":
        case "MODIFICATION_CHAMBRE":
          return `Chambre #${d.numero} (${d.categorie})`
        case "SUPPRESSION_CHAMBRE":
          return `Suppression de la chambre #${d.numero}`
        case "CREATION_CLIENT":
        case "MODIFICATION_CLIENT":
          return `Client: ${d.nom} (CIN: ${d.cin || '—'})`
        case "SUPPRESSION_CLIENT":
          return `Suppression du client: ${d.nom}`
        case "CREATION_UTILISATEUR":
        case "MODIFICATION_UTILISATEUR":
          return `Utilisateur: ${d.nom_user} (Rôle: ${d.role})`
        case "SUPPRESSION_UTILISATEUR":
          return `Suppression de l'utilisateur: ${d.nom_user}`
        case "LOGIN":
          return `Connexion réussie au système`
        default:
          return typeof d === 'object' ? JSON.stringify(d) : String(d)
      }
    } catch {
      return log.details
    }
  }

  function getActionColor(action: string) {
    if (action.includes("CREATION") || action.includes("ARRIVEE") || action.includes("MODIFICATION")) return "bg-emerald-50 text-emerald-700 border-emerald-200"
    if (action.includes("SUPPRESSION") || action.includes("DEPART")) return "bg-rose-50 text-rose-700 border-rose-200"
    if (action.includes("PAIEMENT")) return "bg-amber-50 text-amber-700 border-amber-200"
    if (action.includes("LOGIN")) return "bg-indigo-50 text-indigo-700 border-indigo-200"
    return "bg-slate-50 text-slate-700 border-slate-200"
  }

  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      const path = await invoke<string>("export_data_command")
      toast.success("Exportation réussie", {
        description: `Les fichiers CSV ont été enregistrés dans : ${path}`,
      })
    } catch (e) {
      toast.error("Échec de l'exportation")
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportRapport() {
    setIsExportingRapport(true)
    try {
      const [reservations, factures, clients, chambres] = await Promise.all([
        listReservations(),
        listFactures(),
        listClients(),
        listChambres()
      ])

      const getRoomNumbers = (chambresIds: string | null) => {
        if (!chambresIds) return "-"
        try {
          let ids: number[] = []
          const parsed = JSON.parse(chambresIds)
          if (Array.isArray(parsed)) {
            ids = parsed.map(item => typeof item === 'object' ? item.id : item)
          } else {
            ids = chambresIds.split(",").map(Number)
          }
          
          return ids.map(id => {
            const ch = chambres.find(c => c.id_chambre === id)
            return ch ? `Ch. ${ch.numero}` : `ID ${id}`
          }).join(", ")
        } catch (e) {
          return chambresIds
        }
      }

      const filterDate = new Date(startDate)

      const getClientName = (id: number) => {
        const c = clients.find(x => x.id_client === id)
        return c ? (c.prenom ? `${c.prenom} ${c.nom}` : c.nom) : "Inconnu"
      }

      // 2. Onglet Réservations
      const dataReservations = reservations
        .filter(r => new Date(r.date_debut) >= filterDate)
        .map(r => ({
          ID: r.id_reservation,
          Client: getClientName(r.id_client),
          Chambres: getRoomNumbers(r.chambres_ids),
          "Date Début": new Date(r.date_debut).toLocaleDateString(),
          "Date Fin": r.date_fin ? new Date(r.date_fin).toLocaleDateString() : "-",
          Nuitées: r.nombre_nuite,
          Statut: r.statut,
          Avance: r.avance || 0,
          "Date Création": r.created_at ? new Date(r.created_at).toLocaleDateString() : "-"
        }))

      // 3. Onglet Factures
      // On récupère tous les paiements pour trouver le mode de paiement si absent de la facture
      const allPaiements = await invoke<any[]>("list_all_paiements_command")

      const dataFactures = factures
        .filter(f => new Date(f.date_facture) >= filterDate)
        .map(f => {
          let mode = f.mode_paiement
          if (!mode) {
            const factP = allPaiements.filter(p => p.id_facture === f.id_facture)
            if (factP.length > 0) {
              mode = factP[factP.length - 1].mode_paiement // Dernier mode utilisé
            }
          }

          // Trouver les chambres liées à la facture
          let rooms = "-"
          if (f.id_reservation) {
            const r = reservations.find(x => x.id_reservation === f.id_reservation)
            if (r) rooms = getRoomNumbers(r.chambres_ids)
          }
          
          return {
            ID: "F_" + f.id_facture,
            Client: getClientName(f.id_client),
            Chambres: rooms,
            Date: new Date(f.date_facture).toLocaleDateString(),
            Montant: f.montant,
            Remise: f.remise,
            "Net à payer": f.montant - f.remise,
            Statut: f.statut,
            Mode: mode || "N/A",
            Observations: f.observations || ""
          }
        })

      const wb = XLSX.utils.book_new()
      

      const wsReservations = XLSX.utils.json_to_sheet(dataReservations)
      XLSX.utils.book_append_sheet(wb, wsReservations, "Réservations")

      const wsFactures = XLSX.utils.json_to_sheet(dataFactures)
      XLSX.utils.book_append_sheet(wb, wsFactures, "Factures")

      XLSX.writeFile(wb, `Rapport_Activite_${startDate}.xlsx`)
      toast.success("Rapport Excel généré avec succès")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de la génération du rapport")
    } finally {
      setIsExportingRapport(false)
    }
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center  bg-primary/10 text-primary">
            <History className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit & Supervision</h1>
            <p className="text-sm text-muted-foreground">Historique des actions et mouvements du système</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Du</label>
            <Input 
              type="date" 
              className="h-9 w-40" 
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Au</label>
            <Input 
              type="date" 
              className="h-9 w-40" 
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <Button 
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleExportRapport}
            disabled={isExportingRapport}
          >
            {isExportingRapport ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
            Exporter Rapport (Excel)
          </Button>
           <Button 
             variant="outline" 
             className="gap-2"
             onClick={handleExport}
             disabled={isExporting}
           >
             {isExporting ? <Loader2 className="size-4 animate-spin" /> : <Database className="size-4" />}
             Exporter base de données (CSV)
           </Button>
        </div>
      </div>

      <Card className=" shadow-sm border overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              <CardTitle className="text-base font-semibold">Journal d'activités</CardTitle>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher action, utilisateur..." 
                className="w-64 pl-9  h-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="bg-muted text-xs uppercase tracking-wider sticky top-0 z-10">
                <TableRow className="border-b-2 border-primary">
                  <TableHead className="w-40 px-4 py-3">Date & Heure</TableHead>
                  <TableHead className="px-4 py-3">Utilisateur</TableHead>
                  <TableHead className="px-4 py-3">Action</TableHead>
                  <TableHead className="px-4 py-3">Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">Chargement...</TableCell></TableRow>
                ) : paginatedLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">Aucune activité trouvée.</TableCell></TableRow>
                ) : (
                  paginatedLogs.map(log => (
                    <TableRow key={log.id_audit} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-xs px-4">
                        <div className="flex items-center gap-2 text-muted-foreground font-mono">
                          <Clock className="size-3" />
                          {new Date(log.date_action).toLocaleString("fr-FR")}
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <User className="size-4 text-primary" />
                          {log.nom_user || "Système"}
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <Badge variant="outline" className={cn("uppercase text-[9px] px-1.5 py-0 font-bold", getActionColor(log.action))}>
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 text-xs font-medium">
                        {formatDetails(log)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Footer */}
          {!isLoading && filteredLogs.length > 0 && (
            <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-3">
              <div className="text-xs text-muted-foreground">
                Affichage de <span className="font-bold">{(currentPage - 1) * pageSize + 1}</span> à <span className="font-bold">{Math.min(currentPage * pageSize, filteredLogs.length)}</span> sur <span className="font-bold">{filteredLogs.length}</span> actions
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 rounded-none"
                >
                  Précédent
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    
                    if (pageNum <= 0 || pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="h-8 w-8 rounded-none p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 rounded-none"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

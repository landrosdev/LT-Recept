import { Fragment, useMemo, useState } from "react"
import { toast } from "sonner"

import { useReservations } from "@/components/reservation/useReservations"
import { ClientSelector } from "@/components/reservation/ClientSelector"
import { StatusBadge } from "@/components/reservation/StatusBadge"
import { PaymentSelector } from "@/components/reservation/PaymentSelector"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CalendarCheck,
  ChevronDown,
  Loader2,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Calendar,
  User,
  BedDouble,
  Clock,
  Trash2,
  Edit,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { listClients, createClient, type Client } from "@/services/Client_service"
import { listChambres, type Chambre } from "@/services/Chambre_service"
import { listSejours, type Sejour } from "@/services/Sejours_service"
import { useEffect } from "react"

type ColKey = "client" | "type_chambre" | "dates" | "statut" | "paiement"

const typesChambre = [
  { value: "SIMPLE", label: "Standard" },
  { value: "DOUBLE", label: "Deluxe" },
  { value: "SUITE", label: "Suite" },
  { value: "FAMILIALE", label: "Familiale" },
]

const statuts = [
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "CONFIRMEE", label: "Confirmée" },
  { value: "ANNULEE", label: "Annulée" },
  { value: "TERMINEE", label: "Terminée" },
]

export default function ReservationsPage() {
  const {
    isLoading,
    error,
    reservations,
    stats,
    createOrUpdateReservation,
    removeReservation,
  } = useReservations()

  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(true)

  const [chambres, setChambres] = useState<Chambre[]>([])
  const [sejours, setSejours] = useState<Sejour[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [c, ch, s] = await Promise.all([
          listClients(),
          listChambres(),
          listSejours(),
        ])
        setClients(c)
        setChambres(ch)
        setSejours(s)
      } catch (e) {
        console.error("Failed to load data", e)
      } finally {
        setClientsLoading(false)
      }
    }
    loadData()
  }, [])

  // Calculate room availability
  const roomAvailability = useMemo(() => {
    const occupiedByType = new Map<string, number>()
    const totalByType = new Map<string, number>()

    // Count total rooms by type
    chambres.forEach(c => {
      totalByType.set(c.type_chambre, (totalByType.get(c.type_chambre) || 0) + 1)
    })

    // Count occupied rooms by type
    sejours.forEach(s => {
      if (s.statut === "ARRIVE" || s.statut === "EN_SEJOUR") {
        const chambre = chambres.find(c => c.id_chambre === s.id_chambre)
        if (chambre) {
          occupiedByType.set(chambre.type_chambre, (occupiedByType.get(chambre.type_chambre) || 0) + 1)
        }
      }
    })

    return { occupiedByType, totalByType }
  }, [chambres, sejours])

  function getAvailableRoomsByType(typeChambre: string): number {
    const total = roomAvailability.totalByType.get(typeChambre) || 0
    const occupied = roomAvailability.occupiedByType.get(typeChambre) || 0
    return Math.max(0, total - occupied)
  }

  const [filters, setFilters] = useState({
    client: "",
    type_chambre: "",
    statut: "",
  })
  const [sort, setSort] = useState<{ key: ColKey; dir: "asc" | "desc" } | null>(null)
  const [colMenuOpen, setColMenuOpen] = useState(false)
  const [colMenuKey, setColMenuKey] = useState<ColKey>("client")

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Form fields
  const [selectedClientId, setSelectedClientId] = useState<number>(0)
  const [typeChambre, setTypeChambre] = useState("SIMPLE")
  const [dateArrivee, setDateArrivee] = useState("")
  const [dateDepart, setDateDepart] = useState("")
  const [statut, setStatut] = useState("EN_ATTENTE")
  const [paiement, setPaiement] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteReservationId, setDeleteReservationId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      const client = clients.find(c => c.id_client === r.id_client)
      const qClient = filters.client.trim().toLowerCase()
      const qType = filters.type_chambre.trim().toLowerCase()
      const qStatut = filters.statut.trim().toLowerCase()

      if (qClient) {
        const clientName = client ? `${client.prenom ?? ""} ${client.nom}`.toLowerCase() : ""
        if (!clientName.includes(qClient)) return false
      }
      if (qType && !r.type_chambre.toLowerCase().includes(qType)) return false
      if (qStatut && !r.statut.toLowerCase().includes(qStatut)) return false
      return true
    })
  }, [reservations, clients, filters])

  const displayed = useMemo(() => {
    const arr = [...filtered]
    if (!sort) return arr
    const dir = sort.dir === "asc" ? 1 : -1

    return arr.sort((a, b) => {
      let va: string, vb: string

      switch (sort.key) {
        case "client":
          const ca = clients.find(c => c.id_client === a.id_client)
          const cb = clients.find(c => c.id_client === b.id_client)
          va = ca ? `${ca.prenom ?? ""} ${ca.nom}` : ""
          vb = cb ? `${cb.prenom ?? ""} ${cb.nom}` : ""
          break
        case "type_chambre":
          va = a.type_chambre
          vb = b.type_chambre
          break
        case "dates":
          va = a.date_arrivee
          vb = b.date_arrivee
          break
        case "statut":
          va = a.statut
          vb = b.statut
          break
        case "paiement":
          va = a.paiement ?? ""
          vb = b.paiement ?? ""
          break
        default:
          va = ""
          vb = ""
      }

      return va.localeCompare(vb) * dir
    })
  }, [filtered, sort, clients])

  function openColumnMenu(key: ColKey) {
    console.log("Opening column menu for:", key);
    setColMenuKey(key)
    setColMenuOpen(true)
  }

  const editing = useMemo(
    () => reservations.find((r) => r.id_reservation === editingId) ?? null,
    [reservations, editingId]
  )

  function openCreate() {
    setEditingId(null)
    setSelectedClientId(0)
    setTypeChambre("SIMPLE")
    setDateArrivee("")
    setDateDepart("")
    setStatut("EN_ATTENTE")
    setPaiement("")
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEdit(id: number) {
    const r = reservations.find((x) => x.id_reservation === id)
    if (!r) return
    setEditingId(id)
    setSelectedClientId(r.id_client)
    setTypeChambre(r.type_chambre)
    setDateArrivee(r.date_arrivee.split("T")[0])
    setDateDepart(r.date_depart.split("T")[0])
    setStatut(r.statut)
    setPaiement(r.paiement ?? "")
    setFormError(null)
    setIsFormOpen(true)
  }

  function openDeleteConfirm(id: number) {
    setDeleteReservationId(id)
    setDeleteConfirmOpen(true)
  }

  async function handleDelete() {
    if (!deleteReservationId) return
    setIsDeleting(true)
    try {
      await removeReservation(deleteReservationId)
      toast.success("Réservation supprimée avec succès")
      setDeleteConfirmOpen(false)
      setDeleteReservationId(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la suppression"
      toast.error(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleCreateClientAndGetId(clientData: { nom: string; prenom: string; telephone: string; email: string }): Promise<number> {
    const newClient = await createClient({
      nom: clientData.nom,
      prenom: clientData.prenom || null,
      telephone: clientData.telephone || null,
      email: clientData.email || null,
    })
    // Refresh clients list
    const updatedClients = await listClients()
    setClients(updatedClients)
    toast.success(`Client ${newClient.prenom ? newClient.prenom + " " : ""}${newClient.nom} créé`)
    return newClient.id_client
  }

  function getClientName(id_client: number): string {
    const c = clients.find(x => x.id_client === id_client)
    if (!c) return "Client inconnu"
    return c.prenom ? `${c.prenom} ${c.nom}` : c.nom
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return "—"
    const d = new Date(dateStr)
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-primary/10 text-primary">
            <CalendarCheck className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des réservations</h1>
            <p className="text-sm text-muted-foreground">
              {reservations.length} réservation{reservations.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <Plus className="size-4" />
          Nouvelle réservation
        </Button>
      </div>

      {/* Stats KPI */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total */}
        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-primary p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <CalendarCheck className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm font-medium text-white/90">Total réservations</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-white text-primary transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>

        {/* Confirmées */}
        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-emerald-600 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <BedDouble className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">{stats.confirmed}</div>
            <div className="text-sm font-medium text-white/90">Confirmées</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-white text-emerald-600 transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>

        {/* En attente */}
        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-amber-500 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <Clock className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">{stats.pending}</div>
            <div className="text-sm font-medium text-white/90">En attente</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-white text-amber-500 transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>

        {/* Annulées */}
        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-rose-500 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <Trash2 className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">{stats.cancelled}</div>
            <div className="text-sm font-medium text-white/90">Annulées</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-white text-rose-500 transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>
      </div>

      {/* Room Availability Summary */}
      <Card className="overflow-hidden border shadow-sm rounded-none">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <BedDouble className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Disponibilité des chambres</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {typesChambre.map(t => {
              const available = getAvailableRoomsByType(t.value)
              const total = roomAvailability.totalByType.get(t.value) || 0
              return (
                <div key={t.value} className="flex items-center justify-between p-3 border rounded-none">
                  <div>
                    <div className="font-medium">{t.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {available} / {total} disponibles
                    </div>
                  </div>
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    available > 0 ? "bg-emerald-500" : "bg-rose-500"
                  )} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main content - Table */}
      <Card className="overflow-hidden border shadow-sm transition-shadow hover:shadow-md rounded-none">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Liste des réservations</CardTitle>
            <Badge variant="secondary" className="ml-2 rounded-none">
              {filtered.length}/{reservations.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={filters.client}
                onChange={(e) => setFilters(p => ({ ...p, client: e.target.value }))}
                className="w-64 pl-9 rounded-none"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading || clientsLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                Chargement...
              </div>
            </div>
          ) : error ? (
            <div className="flex h-64 items-center justify-center">
              <Alert variant="destructive" className="max-w-md rounded-none">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full">
                <thead className="bg-muted text-xs uppercase tracking-wider">
                  <tr className="border-b-2 border-primary">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                        onClick={() => openColumnMenu("client")}
                      >
                        <User className="size-3" />
                        Client
                        <ChevronDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                        onClick={() => openColumnMenu("type_chambre")}
                      >
                        <BedDouble className="size-3" />
                        Type chambre
                        <ChevronDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                        onClick={() => openColumnMenu("dates")}
                      >
                        <Calendar className="size-3" />
                        Dates
                        <ChevronDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                        onClick={() => openColumnMenu("statut")}
                      >
                        Statut
                        <ChevronDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Paiement</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <CalendarCheck className="size-8 opacity-20" />
                          <p>Aucune réservation trouvée</p>
                          <p className="text-sm">Essayez de modifier vos filtres</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayed.map((r, index) => (
                      <Fragment key={r.id_reservation}>
                        <tr
                          className={cn(
                            "group transition-all duration-300 ease-out",
                            "hover:shadow-lg hover:shadow-foreground/10 hover:z-10 hover:relative hover:-translate-y-0.5 hover:bg-card",
                            index % 3 === 0 && "bg-card",
                            index % 3 === 1 && "bg-primary/5",
                            index % 3 === 2 && "bg-muted/20"
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-none bg-primary/10">
                                <User className="size-4 text-primary" />
                              </div>
                              <span className="font-medium">{getClientName(r.id_client)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="rounded-none capitalize">
                              {r.type_chambre}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <div>{formatDate(r.date_arrivee)}</div>
                              <div className="text-muted-foreground">→ {formatDate(r.date_depart)}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge statut={r.statut} />
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-muted-foreground">
                              {r.paiement || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(r.id_reservation)}
                                className="h-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-none"
                              >
                                <Edit className="size-3 mr-1" />
                                Modifier
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteConfirm(r.id_reservation)}
                                className="h-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-none"
                              >
                                <Trash2 className="size-3 mr-1" />
                                Supprimer
                              </Button>
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter/Sort Dialog */}
      <Dialog open={colMenuOpen} onOpenChange={(open) => {
          console.log("Dialog open change:", open);
          setColMenuOpen(open);
      }}>
        <DialogContent className="sm:max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle>Filtrer et trier</DialogTitle>
            <DialogDescription>
              Colonne : {colMenuKey}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 py-2">
            {colMenuKey === "client" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Rechercher client</label>
                <Input
                  value={filters.client}
                  onChange={(e) => setFilters(p => ({ ...p, client: e.target.value }))}
                  placeholder="Nom ou prénom..."
                  className="rounded-none"
                />
              </div>
            )}
            {colMenuKey === "type_chambre" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de chambre</label>
                <Select
                  value={filters.type_chambre || "ALL"}
                  onValueChange={(v: string) => setFilters(p => ({ ...p, type_chambre: v === "ALL" ? "" : v }))}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="ALL">Tous</SelectItem>
                    {typesChambre.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {colMenuKey === "statut" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut</label>
                <Select
                  value={filters.statut || "ALL"}
                  onValueChange={(v: string) => setFilters(p => ({ ...p, statut: v === "ALL" ? "" : v }))}
                >
                  <SelectTrigger className="rounded-none">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="ALL">Tous</SelectItem>
                    {statuts.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(colMenuKey === "dates" || colMenuKey === "paiement") && (
              <div className="text-sm text-muted-foreground">
                Utilisez le tri pour ordonner cette colonne
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSort({ key: colMenuKey, dir: "asc" })}
                className={cn(sort?.key === colMenuKey && sort?.dir === "asc" && "border-primary", "rounded-none")}
              >
                Trier A → Z
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSort({ key: colMenuKey, dir: "desc" })}
                className={cn(sort?.key === colMenuKey && sort?.dir === "desc" && "border-primary", "rounded-none")}
              >
                Trier Z → A
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFilters({ client: "", type_chambre: "", statut: "" })}
                className="rounded-none"
              >
                Effacer filtres
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSort(null)}
                className="rounded-none"
              >
                Effacer tri
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier la réservation" : "Nouvelle réservation"}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations de la réservation.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 py-2">
            {/* Client Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Client *</label>
              <ClientSelector
                clients={clients}
                selectedId={selectedClientId || null}
                onSelect={(id) => setSelectedClientId(id)}
                onCreateNew={handleCreateClientAndGetId}
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de chambre *</label>
                <Select value={typeChambre} onValueChange={setTypeChambre} disabled={isSaving}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {typesChambre.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label} ({getAvailableRoomsByType(t.value)} dispo)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  {getAvailableRoomsByType(typeChambre)} chambre{getAvailableRoomsByType(typeChambre) > 1 ? "s" : ""} {typeChambre.toLowerCase()} disponible{getAvailableRoomsByType(typeChambre) > 1 ? "s" : ""}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Statut *</label>
                <Select value={statut} onValueChange={setStatut} disabled={isSaving}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {statuts.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date d'arrivée *</label>
                <Input
                  type="date"
                  value={dateArrivee}
                  onChange={(e) => setDateArrivee(e.target.value)}
                  className="rounded-none"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date de départ *</label>
                <Input
                  type="date"
                  value={dateDepart}
                  onChange={(e) => setDateDepart(e.target.value)}
                  className="rounded-none"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Méthode de paiement</label>
              <PaymentSelector
                value={paiement}
                onChange={(v) => setPaiement(v)}
                disabled={isSaving}
              />
            </div>

            {formError && (
              <Alert variant="destructive" className="rounded-none">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-none"
                onClick={() => {
                  setIsFormOpen(false)
                  setEditingId(null)
                }}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-none"
                disabled={isSaving}
                onClick={async () => {
                  setFormError(null)
                  if (!selectedClientId) {
                    setFormError("Veuillez sélectionner un client")
                    return
                  }
                  if (!dateArrivee || !dateDepart) {
                    setFormError("Veuillez renseigner les dates d'arrivée et de départ")
                    return
                  }
                  if (new Date(dateDepart) <= new Date(dateArrivee)) {
                    setFormError("La date de départ doit être après la date d'arrivée")
                    return
                  }
                  setIsSaving(true)
                  try {
                    await createOrUpdateReservation({
                      id_reservation: editing?.id_reservation,
                      id_client: selectedClientId,
                      type_chambre: typeChambre,
                      date_arrivee: dateArrivee,
                      date_depart: dateDepart,
                      paiement: paiement.trim() || null,
                      statut: statut,
                    })
                    toast.success(editing ? "Réservation modifiée avec succès" : "Réservation créée avec succès")
                    setIsFormOpen(false)
                    setEditingId(null)
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "Erreur"
                    setFormError(msg)
                    toast.error(msg)
                  } finally {
                    setIsSaving(false)
                  }
                }}
              >
                {isSaving ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Enregistrement...
                  </span>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setDeleteReservationId(null)
              }}
              disabled={isDeleting}
              className="rounded-none"
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-none"
            >
              {isDeleting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Suppression...
                </span>
              ) : (
                "Supprimer"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

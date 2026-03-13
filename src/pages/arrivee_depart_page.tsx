import { Fragment, useMemo, useState, useEffect } from "react"
import { toast } from "sonner"

import { useSejours } from "@/components/sejour/useSejours"
import { SejourStatusBadge } from "@/components/sejour/SejourStatusBadge"
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
  LogIn,
  LogOut,
  Home,
  Edit,
  Trash2,
  DoorOpen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { listClients, createClient, type Client } from "@/services/Client_service"
import { listChambres, type Chambre } from "@/services/Chambre_service"
import { listReservations, type Reservation } from "@/services/Reservation_service"
import { ClientSelector } from "@/components/reservation/ClientSelector"

type ColKey = "client" | "chambre" | "dates" | "statut" | "heures"

const statuts = [
  { value: "ARRIVE", label: "Arrivé" },
  { value: "EN_SEJOUR", label: "En séjour" },
  { value: "PARTI", label: "Parti" },
]

export default function ArriveeDepartPage() {
  const {
    isLoading,
    error,
    sejours,
    stats,
    createOrUpdateSejour,
    removeSejour,
  } = useSejours()

  // Load related data
  const [clients, setClients] = useState<Client[]>([])
  const [chambres, setChambres] = useState<Chambre[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [c, ch, r] = await Promise.all([
          listClients(),
          listChambres(),
          listReservations(),
        ])
        setClients(c)
        setChambres(ch)
        setReservations(r)
      } catch (e) {
        console.error("Failed to load data", e)
      } finally {
        setDataLoading(false)
      }
    }
    loadData()
  }, [])

  const [filters, setFilters] = useState({
    client: "",
    chambre: "",
    statut: "",
  })
  const [sort, setSort] = useState<{ key: ColKey; dir: "asc" | "desc" } | null>(null)
  const [colMenuOpen, setColMenuOpen] = useState(false)
  const [colMenuKey, setColMenuKey] = useState<ColKey>("client")

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Form fields
  const [selectedClientId, setSelectedClientId] = useState<number>(0)
  const [selectedChambreId, setSelectedChambreId] = useState<number>(0)
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null)
  const [dateJour, setDateJour] = useState("")
  const [heureArrivee, setHeureArrivee] = useState("")
  const [heureDepartPrevue, setHeureDepartPrevue] = useState("")
  const [statut, setStatut] = useState("ARRIVE")
  const [remarques, setRemarques] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteSejourId, setDeleteSejourId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Calculate room occupancy
  const chambreOccupancy = useMemo(() => {
    const occupied = new Set<number>()
    sejours.forEach(s => {
      if (s.statut === "ARRIVE" || s.statut === "EN_SEJOUR") {
        occupied.add(s.id_chambre)
      }
    })
    return {
      total: chambres.length,
      occupied: occupied.size,
      available: chambres.length - occupied.size,
    }
  }, [sejours, chambres])

  const filtered = useMemo(() => {
    return sejours.filter((s) => {
      const client = clients.find(c => c.id_client === s.id_client)
      const chambre = chambres.find(c => c.id_chambre === s.id_chambre)
      const qClient = filters.client.trim().toLowerCase()
      const qChambre = filters.chambre.trim().toLowerCase()
      const qStatut = filters.statut.trim().toLowerCase()

      if (qClient) {
        const clientName = client ? `${client.prenom ?? ""} ${client.nom}`.toLowerCase() : ""
        if (!clientName.includes(qClient)) return false
      }
      if (qChambre) {
        const chambreNum = chambre?.numero?.toLowerCase() ?? ""
        if (!chambreNum.includes(qChambre)) return false
      }
      if (qStatut && !s.statut.toLowerCase().includes(qStatut)) return false
      return true
    })
  }, [sejours, clients, chambres, filters])

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
        case "chambre":
          const cha = chambres.find(c => c.id_chambre === a.id_chambre)
          const chb = chambres.find(c => c.id_chambre === b.id_chambre)
          va = cha?.numero ?? ""
          vb = chb?.numero ?? ""
          break
        case "dates":
          va = a.date_jour
          vb = b.date_jour
          break
        case "statut":
          va = a.statut
          vb = b.statut
          break
        case "heures":
          va = a.heure_arrivee ?? ""
          vb = b.heure_arrivee ?? ""
          break
        default:
          va = ""
          vb = ""
      }

      return va.localeCompare(vb) * dir
    })
  }, [filtered, sort, clients, chambres])

  function openColumnMenu(key: ColKey) {
    setColMenuKey(key)
    setColMenuOpen(true)
  }

  const editing = useMemo(
    () => sejours.find((s) => s.id_sejour === editingId) ?? null,
    [sejours, editingId]
  )

  function openCreate() {
    setEditingId(null)
    setSelectedClientId(0)
    setSelectedChambreId(0)
    setSelectedReservationId(null)
    setDateJour(new Date().toISOString().split("T")[0])
    setHeureArrivee("")
    setHeureDepartPrevue("")
    setStatut("ARRIVE")
    setRemarques("")
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEdit(id: number) {
    const s = sejours.find((x) => x.id_sejour === id)
    if (!s) return
    setEditingId(id)
    setSelectedClientId(s.id_client)
    setSelectedChambreId(s.id_chambre)
    setSelectedReservationId(s.id_reservation)
    setDateJour(s.date_jour.split("T")[0])
    setHeureArrivee(s.heure_arrivee ?? "")
    setHeureDepartPrevue(s.heure_depart_prevue ?? "")
    setStatut(s.statut)
    setRemarques(s.remarques ?? "")
    setFormError(null)
    setIsFormOpen(true)
  }

  function openDeleteConfirm(id: number) {
    setDeleteSejourId(id)
    setDeleteConfirmOpen(true)
  }

  async function handleDelete() {
    if (!deleteSejourId) return
    setIsDeleting(true)
    try {
      await removeSejour(deleteSejourId)
      toast.success("Séjour supprimé avec succès")
      setDeleteConfirmOpen(false)
      setDeleteSejourId(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la suppression"
      toast.error(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  function getClientName(id_client: number): string {
    const c = clients.find(x => x.id_client === id_client)
    if (!c) return "Client inconnu"
    return c.prenom ? `${c.prenom} ${c.nom}` : c.nom
  }

  function getChambreNumero(id_chambre: number): string {
    const c = chambres.find(x => x.id_chambre === id_chambre)
    return c?.numero ?? "—"
  }

  function isChambreOccupied(id_chambre: number): boolean {
    return sejours.some(s => 
      s.id_chambre === id_chambre && 
      (s.statut === "ARRIVE" || s.statut === "EN_SEJOUR") &&
      s.id_sejour !== editingId
    )
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

  const availableChambres = useMemo(() => {
    return chambres.filter(c => !isChambreOccupied(c.id_chambre) || c.id_chambre === selectedChambreId)
  }, [chambres, sejours, editingId, selectedChambreId])

  // Handle client selection with auto-fill
  function handleClientSelect(clientId: number) {
    if (clientId === 0) {
      setSelectedClientId(0)
      setSelectedReservationId(null)
      setSelectedChambreId(0)
      return
    }

    console.log("Client selected:", clientId)
    setSelectedClientId(clientId)
    setSelectedReservationId(null)
    setSelectedChambreId(0)
    
    // Find reservations for this client
    const clientResvs = reservations.filter(r => r.id_client === clientId && r.statut !== "ANNULEE" && r.statut !== "TERMINEE")
    console.log("Found active reservations for client:", clientResvs.length, clientResvs)
    
    if (clientResvs.length === 1) {
      // Auto-fill if exactly one reservation
      const resv = clientResvs[0]
      console.log("Auto-filling with reservation:", resv)
      setSelectedReservationId(resv.id_reservation)
      
      // Handle both "2026-02-04" and "2026-02-04T00:00:00" formats
      const dateStr = resv.date_arrivee ? resv.date_arrivee.split("T")[0] : new Date().toISOString().split("T")[0]
      console.log("Setting date to:", dateStr)
      setDateJour(dateStr)
      
      // Try to find an available room of the same type
      const suitableChambre = availableChambres.find(ch => ch.type_chambre === resv.type_chambre)
      if (suitableChambre) {
        setSelectedChambreId(suitableChambre.id_chambre)
        toast.success(`Réservation #${resv.id_reservation} trouvée. Chambre ${suitableChambre.numero} (${suitableChambre.type_chambre}) sélectionnée.`)
      } else {
        toast.warning(`Réservation #${resv.id_reservation} trouvée, mais aucune chambre ${resv.type_chambre} n'est libre.`)
      }
    } else if (clientResvs.length > 1) {
      toast.info(`${clientResvs.length} réservations trouvées pour ce client. Veuillez en sélectionner une si nécessaire.`)
    } else {
      toast.info("Aucune réservation active trouvée. Création d'un séjour direct.")
    }
  }

  // Filter reservations by selected client
  const clientReservations = useMemo(() => {
    if (!selectedClientId) return []
    return reservations.filter(r => r.id_client === selectedClientId)
  }, [reservations, selectedClientId])

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-primary/10 text-primary">
            <DoorOpen className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Arrivées / Départs</h1>
            <p className="text-sm text-muted-foreground">
              Gestion des séjours et occupations
            </p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <Plus className="size-4" />
          Nouveau séjour
        </Button>
      </div>

      {/* Stats KPI */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Total séjours */}
        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-primary p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <Calendar className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm font-medium text-white/90">Total séjours</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-white text-primary transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>

        {/* Chambres disponibles */}
        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-emerald-600 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <Home className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">{chambreOccupancy.available}</div>
            <div className="text-sm font-medium text-white/90">Chambres libres</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-white text-emerald-600 transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>

        {/* Chambres occupées */}
        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-amber-500 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <BedDouble className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">{chambreOccupancy.occupied}</div>
            <div className="text-sm font-medium text-white/90">Chambres occupées</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-white text-amber-500 transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>

        {/* Arrivés / En séjour */}
        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-blue-600 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <LogIn className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">{stats.arrive + stats.enSejour}</div>
            <div className="text-sm font-medium text-white/90">Clients présents</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-white text-blue-600 transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>

        {/* Départs effectués */}
        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-rose-500 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <LogOut className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">{stats.parti}</div>
            <div className="text-sm font-medium text-white/90">Départs effectués</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-white text-rose-500 transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>
      </div>

      {/* Room availability summary */}
      <Card className="overflow-hidden border shadow-sm rounded-none">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <BedDouble className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">État des chambres</CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-muted-foreground">{chambreOccupancy.available} Libres</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-muted-foreground">{chambreOccupancy.occupied} Occupées</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-sm text-muted-foreground">{chambreOccupancy.total} Total</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {chambres.map(ch => {
              const isOccupied = sejours.some(s => 
                s.id_chambre === ch.id_chambre && 
                (s.statut === "ARRIVE" || s.statut === "EN_SEJOUR")
              )
              const currentSejour = sejours.find(s => 
                s.id_chambre === ch.id_chambre && 
                (s.statut === "ARRIVE" || s.statut === "EN_SEJOUR")
              )
              return (
                <div
                  key={ch.id_chambre}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 border rounded-none text-sm",
                    isOccupied 
                      ? "bg-amber-50 border-amber-200 text-amber-700" 
                      : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  )}
                >
                  <BedDouble className="size-4" />
                  <span className="font-medium">{ch.numero}</span>
                  <span className="text-xs">({ch.type_chambre})</span>
                  {isOccupied && currentSejour && (
                    <span className="text-xs ml-1">
                      - {getClientName(currentSejour.id_client)}
                    </span>
                  )}
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
            <CardTitle className="text-base font-semibold">Liste des séjours</CardTitle>
            <Badge variant="secondary" className="ml-2 rounded-none">
              {filtered.length}/{sejours.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher client..."
                value={filters.client}
                onChange={(e) => setFilters(p => ({ ...p, client: e.target.value }))}
                className="w-64 pl-9 rounded-none"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading || dataLoading ? (
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
                        onClick={() => openColumnMenu("chambre")}
                      >
                        <BedDouble className="size-3" />
                        Chambre
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
                        Date
                        <ChevronDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                        onClick={() => openColumnMenu("heures")}
                      >
                        <Clock className="size-3" />
                        Heures
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
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <DoorOpen className="size-8 opacity-20" />
                          <p>Aucun séjour trouvé</p>
                          <p className="text-sm">Essayez de modifier vos filtres</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayed.map((s, index) => (
                      <Fragment key={s.id_sejour}>
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
                              <span className="font-medium">{getClientName(s.id_client)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="rounded-none">
                              <BedDouble className="size-3 mr-1" />
                              {getChambreNumero(s.id_chambre)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              {new Date(s.date_jour).toLocaleDateString("fr-FR")}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm space-y-1">
                              {s.heure_arrivee && (
                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                  <LogIn className="size-3" />
                                  {s.heure_arrivee}
                                </div>
                              )}
                              {s.heure_depart_prevue && (
                                <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                                  <LogOut className="size-3" />
                                  {s.heure_depart_prevue}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <SejourStatusBadge statut={s.statut} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(s.id_sejour)}
                                className="h-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-none"
                              >
                                <Edit className="size-3 mr-1" />
                                Modifier
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteConfirm(s.id_sejour)}
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
      <Dialog open={colMenuOpen} onOpenChange={setColMenuOpen}>
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
            {colMenuKey === "chambre" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Chambre</label>
                <Input
                  value={filters.chambre}
                  onChange={(e) => setFilters(p => ({ ...p, chambre: e.target.value }))}
                  placeholder="Numéro de chambre..."
                  className="rounded-none"
                />
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
            {(colMenuKey === "dates" || colMenuKey === "heures") && (
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
                onClick={() => setFilters({ client: "", chambre: "", statut: "" })}
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
        <DialogContent className="sm:max-w-4xl rounded-none max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Modifier le séjour" : "Nouveau séjour"}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations du séjour.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Client Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Client *</label>
              <ClientSelector
                clients={clients}
                selectedId={selectedClientId || null}
                onSelect={(id) => handleClientSelect(id)}
                onCreateNew={handleCreateClientAndGetId}
                disabled={isSaving}
              />
            </div>

            {/* Chambre Select */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Chambre *</label>
              <Select 
                value={selectedChambreId ? String(selectedChambreId) : ""} 
                onValueChange={(v) => setSelectedChambreId(Number(v))}
                disabled={isSaving}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Sélectionner une chambre" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {availableChambres.map(c => (
                    <SelectItem key={c.id_chambre} value={String(c.id_chambre)}>
                      {c.numero} ({c.type_chambre})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedChambreId && isChambreOccupied(selectedChambreId) && (
                <p className="text-xs text-amber-600">
                  ⚠️ Cette chambre est actuellement occupée
                </p>
              )}
            </div>

            {/* Reservation Select (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Réservation liée (optionnel)</label>
              <Select 
                value={selectedReservationId ? String(selectedReservationId) : "none"} 
                onValueChange={(v) => setSelectedReservationId(v === "none" ? null : Number(v))}
                disabled={isSaving}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Aucune réservation" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="none">Aucune réservation</SelectItem>
                  {clientReservations.map(r => (
                    <SelectItem key={r.id_reservation} value={String(r.id_reservation)}>
                      #{r.id_reservation} - {getClientName(r.id_client)} - {r.type_chambre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={dateJour}
                  onChange={(e) => setDateJour(e.target.value)}
                  className="rounded-none"
                  disabled={isSaving}
                />
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
                <label className="text-sm font-medium">Heure d'arrivée</label>
                <Input
                  type="time"
                  value={heureArrivee}
                  onChange={(e) => setHeureArrivee(e.target.value)}
                  className="rounded-none"
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Heure de départ prévue</label>
                <Input
                  type="time"
                  value={heureDepartPrevue}
                  onChange={(e) => setHeureDepartPrevue(e.target.value)}
                  className="rounded-none"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Remarques</label>
              <Input
                value={remarques}
                onChange={(e) => setRemarques(e.target.value)}
                placeholder="Notes éventuelles..."
                className="rounded-none"
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
                  if (!selectedChambreId) {
                    setFormError("Veuillez sélectionner une chambre")
                    return
                  }
                  if (!dateJour) {
                    setFormError("Veuillez sélectionner une date")
                    return
                  }
                  setIsSaving(true)
                  try {
                    await createOrUpdateSejour({
                      id_sejour: editing?.id_sejour,
                      id_client: selectedClientId,
                      id_reservation: selectedReservationId,
                      id_chambre: selectedChambreId,
                      date_jour: dateJour,
                      heure_arrivee: heureArrivee || null,
                      heure_depart_prevue: heureDepartPrevue || null,
                      statut: statut,
                      remarques: remarques.trim() || null,
                    })
                    toast.success(editing ? "Séjour modifié avec succès" : "Séjour créé avec succès")
                    setIsFormOpen(false)
                    setEditingId(null)
                  } catch (e) {
                    console.error("Error saving sejour:", e)
                    const msg = e instanceof Error ? e.message : String(e)
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
              Êtes-vous sûr de vouloir supprimer ce séjour ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setDeleteSejourId(null)
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

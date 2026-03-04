import { Fragment, useMemo, useState, useEffect } from "react"
import { toast } from "sonner"
import {
  listFactures,
  createFacture,
  updateFacture,
  deleteFacture,
  type Facture,
  type FactureInput
} from "@/services/Facture_service"
import { listClients, type Client } from "@/services/Client_service"
import { listChambres, type Chambre } from "@/services/Chambre_service"
import { listSejours, type Sejour } from "@/services/Sejours_service"
import { listReservations, type Reservation } from "@/services/Reservation_service"

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
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Loader2,
  Plus,
  Search,
  Filter,
  BedDouble,
  CreditCard,
  FileText,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Banknote,
  Receipt,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"

type ColKey = "client" | "montant" | "date" | "statut" | "paiement"

const modesPaiement = [
  { value: "ESPECES", label: "Espèces" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "CARTE", label: "Carte Bancaire" },
]

export default function FacturesPage() {
  // Data State
  const [factures, setFactures] = useState<Facture[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [chambres, setChambres] = useState<Chambre[]>([])
  const [sejours, setSejours] = useState<Sejour[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters & Sorting
  const [filters, setFilters] = useState({
    client: "",
    statut: "ALL", // ALL, OUI, NON
  })
  const [sort, setSort] = useState<{ key: ColKey; dir: "asc" | "desc" } | null>({ key: "date", dir: "desc" })
  const [colMenuOpen, setColMenuOpen] = useState(false)
  const [colMenuKey, setColMenuKey] = useState<ColKey>("client")

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Form Fields
  const [formData, setFormData] = useState<{
    id_client: number
    id_chambre: number | null
    id_reservation: number | null
    date_facture: string
    montant: string
    mode_paiement: string | null
    paye: "OUI" | "NON"
    observations: string
  }>({
    id_client: 0,
    id_chambre: null,
    id_reservation: null,
    date_facture: new Date().toISOString().split("T")[0],
    montant: "",
    mode_paiement: null,
    paye: "NON",
    observations: "",
  })

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load Data
  useEffect(() => {
    async function loadAll() {
      setIsLoading(true)
      try {
        const [f, c, ch, s, r] = await Promise.all([
          listFactures(),
          listClients(),
          listChambres(),
          listSejours(),
          listReservations(),
        ])
        setFactures(f)
        setClients(c)
        setChambres(ch)
        setSejours(s)
        setReservations(r)
      } catch (e) {
        console.error("Failed to load data", e)
        setError("Impossible de charger les données.")
      } finally {
        setIsLoading(false)
      }
    }
    loadAll()
  }, [])

  // Derived State (Stats)
  const stats = useMemo(() => {
    const total = factures.length
    const payees = factures.filter(f => f.paye === "OUI").length
    const impayees = factures.filter(f => f.paye === "NON").length
    const totalMontant = factures.reduce((acc, curr) => acc + curr.montant, 0)
    const totalPaye = factures.filter(f => f.paye === "OUI").reduce((acc, curr) => acc + curr.montant, 0)
    const totalImpaye = factures.filter(f => f.paye === "NON").reduce((acc, curr) => acc + curr.montant, 0)

    return { total, payees, impayees, totalMontant, totalPaye, totalImpaye }
  }, [factures])

  // Filtering & Sorting
  const filtered = useMemo(() => {
    return factures.filter(f => {
      const client = clients.find(c => c.id_client === f.id_client)
      const clientName = client ? `${client.prenom ?? ""} ${client.nom}`.toLowerCase() : ""
      
      if (filters.client && !clientName.includes(filters.client.toLowerCase())) return false
      if (filters.statut !== "ALL" && f.paye !== filters.statut) return false
      
      return true
    })
  }, [factures, clients, filters])

  const displayed = useMemo(() => {
    const arr = [...filtered]
    if (!sort) return arr
    const dir = sort.dir === "asc" ? 1 : -1

    return arr.sort((a, b) => {
      let va: any, vb: any

      switch (sort.key) {
        case "client":
          const ca = clients.find(c => c.id_client === a.id_client)
          const cb = clients.find(c => c.id_client === b.id_client)
          va = ca ? `${ca.prenom ?? ""} ${ca.nom}` : ""
          vb = cb ? `${cb.prenom ?? ""} ${cb.nom}` : ""
          break
        case "montant":
          va = a.montant
          vb = b.montant
          break
        case "date":
          va = a.date_facture
          vb = b.date_facture
          break
        case "statut":
          va = a.paye
          vb = b.paye
          break
        case "paiement":
          va = a.mode_paiement ?? ""
          vb = b.mode_paiement ?? ""
          break
        default:
          return 0
      }
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return 0
    })
  }, [filtered, sort, clients])

  // Actions
  function openCreate() {
    setEditingId(null)
    setFormData({
      id_client: 0,
      id_chambre: null,
      id_reservation: null,
      date_facture: new Date().toISOString().split("T")[0],
      montant: "",
      mode_paiement: null,
      paye: "NON",
      observations: "",
    })
    setIsFormOpen(true)
  }

  function openEdit(f: Facture) {
    setEditingId(f.id_facture)
    setFormData({
      id_client: f.id_client,
      id_chambre: f.id_chambre,
      id_reservation: f.id_reservation,
      date_facture: f.date_facture.split("T")[0], // Handle potential T00:00:00
      montant: String(f.montant),
      mode_paiement: f.mode_paiement,
      paye: f.paye as "OUI" | "NON",
      observations: f.observations ?? "",
    })
    setIsFormOpen(true)
  }

  async function handleSave() {
    setFormError(null)
    if (!formData.id_client) {
      setFormError("Veuillez sélectionner un client")
      return
    }
    if (!formData.date_facture) {
      setFormError("Veuillez choisir une date")
      return
    }
    const montant = parseFloat(formData.montant)
    if (isNaN(montant) || montant < 0) {
      setFormError("Le montant doit être valide (>= 0)")
      return
    }

    setIsSaving(true)
    try {
      const input: FactureInput = {
        id_client: formData.id_client,
        id_chambre: formData.id_chambre,
        id_reservation: formData.id_reservation,
        date_facture: formData.date_facture,
        montant: montant,
        mode_paiement: formData.mode_paiement,
        paye: formData.paye,
        observations: formData.observations.trim() || null,
      }

      if (editingId) {
        const updated = await updateFacture(editingId, input)
        setFactures(p => p.map(f => f.id_facture === editingId ? updated : f))
        toast.success("Facture modifiée avec succès")
      } else {
        const created = await createFacture(input)
        setFactures(p => [...p, created])
        toast.success("Facture créée avec succès")
      }
      setIsFormOpen(false)
    } catch (e) {
      console.error(e)
      const msg = e instanceof Error ? e.message : String(e)
      setFormError(msg)
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteFacture(deleteId)
      setFactures(p => p.filter(f => f.id_facture !== deleteId))
      toast.success("Facture supprimée")
      setDeleteConfirmOpen(false)
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de la suppression")
    } finally {
      setIsDeleting(false)
    }
  }

  // Helpers
  function getClientName(id: number) {
    const c = clients.find(x => x.id_client === id)
    return c ? (c.prenom ? `${c.prenom} ${c.nom}` : c.nom) : "Inconnu"
  }
  function getChambreNum(id: number | null) {
    if (!id) return "—"
    const c = chambres.find(x => x.id_chambre === Number(id))
    return c ? c.numero : "—"
  }
  function getChambreFromSejour(clientId: number, dateFacture: string): number | null {
    // Chercher le séjour actif du client à la date de la facture
    const sejour = sejours.find(s => 
      s.id_client === clientId && 
      s.date_jour === dateFacture &&
      (s.statut === 'EN_SEJOUR' || s.statut === 'ARRIVE' || s.statut === 'RESERVE')
    )
    return sejour ? sejour.id_chambre : null
  }
  function formatMoney(amount: number) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount)
  }

  // Auto-fill logic when client selected
  function handleClientSelect(clientId: number) {
    const existing = formData.id_client
    setFormData(p => ({ ...p, id_client: clientId }))
    
    // Only attempt auto-fill if changing client or first select
    if (clientId !== existing) {
       // Find active reservation or stay?
       // For now, let's keep it simple. User can manually link chambre/res.
    }
  }

  function openColumnMenu(key: ColKey) {
    setColMenuKey(key)
    setColMenuOpen(true)
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-primary/10 text-primary">
            <Receipt className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Facturation</h1>
            <p className="text-sm text-muted-foreground">
              Gestion des factures et paiements
            </p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 rounded-none"
        >
          <Plus className="size-4" />
          Nouvelle facture
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* CA Total */}
        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-primary p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-primary-foreground/20">
            <Banknote className="size-7 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-primary-foreground truncate">{formatMoney(stats.totalMontant)}</div>
            <div className="text-sm font-medium text-primary-foreground/90">Chiffre d'Affaires</div>
          </div>
        </div>

        {/* Encaissé */}
        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-emerald-600 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-primary-foreground/20">
            <CheckCircle2 className="size-7 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-primary-foreground truncate">{formatMoney(stats.totalPaye)}</div>
            <div className="text-sm font-medium text-primary-foreground/90">Encaissé ({stats.payees})</div>
          </div>
        </div>

        {/* Impayé */}
        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-rose-500 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-primary-foreground/20">
            <XCircle className="size-7 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-primary-foreground truncate">{formatMoney(stats.totalImpaye)}</div>
            <div className="text-sm font-medium text-primary-foreground/90">Reste à payer ({stats.impayees})</div>
          </div>
        </div>

        {/* Total Factures */}
        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-blue-600 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-primary-foreground/20">
            <FileText className="size-7 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-primary-foreground">{stats.total}</div>
            <div className="text-sm font-medium text-primary-foreground/90">Factures émises</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card className="overflow-hidden border shadow-sm rounded-none">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Historique</CardTitle>
            <Badge variant="secondary" className="ml-2 rounded-none">
              {filtered.length}
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
            <Select 
              value={filters.statut} 
              onValueChange={(v) => setFilters(p => ({ ...p, statut: v }))}
            >
              <SelectTrigger className="w-[140px] rounded-none">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="ALL">Tout</SelectItem>
                <SelectItem value="OUI">Payé</SelectItem>
                <SelectItem value="NON">Impayé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
           {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                Chargement...
              </div>
            </div>
          ) : error ? (
            <div className="flex h-64 items-center justify-center text-destructive">
              {error}
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full">
                <thead className="bg-muted text-xs uppercase tracking-wider">
                  <tr className="border-b-2 border-primary">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-20">ID</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                       <button onClick={() => openColumnMenu("client")} className="flex items-center gap-1 hover:text-primary transition-colors">
                        Client <ChevronDown className="size-3" />
                       </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Chambre</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button onClick={() => openColumnMenu("date")} className="flex items-center gap-1 hover:text-primary transition-colors">
                        Date <ChevronDown className="size-3" />
                       </button>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      <button onClick={() => openColumnMenu("montant")} className="flex items-center gap-1 hover:text-primary ml-auto transition-colors">
                        Montant <ChevronDown className="size-3" />
                       </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button onClick={() => openColumnMenu("paiement")} className="flex items-center gap-1 hover:text-primary transition-colors">
                        Paiement <ChevronDown className="size-3" />
                       </button>
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                      <button onClick={() => openColumnMenu("statut")} className="flex items-center gap-1 hover:text-primary mx-auto transition-colors">
                        Statut <ChevronDown className="size-3" />
                       </button>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                        Aucune facture trouvée.
                      </td>
                    </tr>
                  ) : (
                    displayed.map((f, index) => (
                      <Fragment key={f.id_facture}>
                         <tr
                          className={cn(
                            "group transition-all duration-300 ease-out border-b",
                            "hover:bg-primary/5",
                            index % 2 === 0 ? "bg-card" : "bg-muted/10"
                          )}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            #{f.id_facture}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {getClientName(f.id_client)}
                          </td>
                          <td className="px-4 py-3">
                            {(() => {
                              const chambreId = f.id_chambre || getChambreFromSejour(f.id_client, f.date_facture)
                              return chambreId ? (
                                <Badge variant="outline" className="rounded-none bg-card">
                                  <BedDouble className="size-3 mr-1" />
                                  {getChambreNum(chambreId)}
                                </Badge>
                              ) : "—"
                            })()}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {new Date(f.date_facture).toLocaleDateString("fr-FR")}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-700">
                            {formatMoney(f.montant)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {f.mode_paiement ? (
                               <span className="flex items-center gap-1">
                                <CreditCard className="size-3 text-muted-foreground" />
                                {modesPaiement.find(m => m.value === f.mode_paiement)?.label || f.mode_paiement}
                               </span>
                            ) : "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {f.paye === "OUI" ? (
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 rounded-none border-none">Payée</Badge>
                            ) : (
                              <Badge variant="destructive" className="rounded-none">Impayée</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                               <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(f)}
                                className="h-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-none"
                              >
                                <Edit className="size-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setDeleteId(f.id_facture)
                                    setDeleteConfirmOpen(true)
                                }}
                                className="h-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-none"
                              >
                                <Trash2 className="size-3" />
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

      {/* Sort/Filter Dialog Helper */}
      <Dialog open={colMenuOpen} onOpenChange={setColMenuOpen}>
        <DialogContent className="sm:max-w-xs rounded-none">
          <DialogHeader>
            <DialogTitle>Trier par {colMenuKey}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
             <Button variant="outline" onClick={() => { setSort({ key: colMenuKey, dir: "asc" }); setColMenuOpen(false); }} className="justify-start rounded-none">
                Croissant (A-Z / 1-9)
             </Button>
             <Button variant="outline" onClick={() => { setSort({ key: colMenuKey, dir: "desc" }); setColMenuOpen(false); }} className="justify-start rounded-none">
                Décroissant (Z-A / 9-1)
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl rounded-none">
            <DialogHeader>
                <DialogTitle>{editingId ? "Modifier la facture" : "Nouvelle facture"}</DialogTitle>
                <DialogDescription>Détails de la transaction</DialogDescription>
            </DialogHeader>
            <Separator />
            <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2 col-span-2 md:col-span-1">
                    <label className="text-sm font-medium">Client *</label>
                    <Select 
                        value={String(formData.id_client || "")} 
                        onValueChange={(v) => handleClientSelect(Number(v))}
                        disabled={isSaving}
                    >
                        <SelectTrigger className="rounded-none">
                            <SelectValue placeholder="Client..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                            {clients.map(c => (
                                <SelectItem key={c.id_client} value={String(c.id_client)}>
                                    {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 col-span-2 md:col-span-1">
                     <label className="text-sm font-medium">Date *</label>
                     <Input 
                        type="date" 
                        value={formData.date_facture}
                        onChange={(e) => setFormData(p => ({ ...p, date_facture: e.target.value }))}
                        className="rounded-none"
                     />
                </div>

                <div className="space-y-2 col-span-2 md:col-span-1">
                     <label className="text-sm font-medium">Chambre (Optionnel)</label>
                     <Select 
                        value={formData.id_chambre ? String(formData.id_chambre) : "none"}
                        onValueChange={(v) => setFormData(p => ({ ...p, id_chambre: v === "none" ? null : Number(v) }))}
                    >
                        <SelectTrigger className="rounded-none">
                            <SelectValue placeholder="Aucune" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                             <SelectItem value="none">Aucune</SelectItem>
                            {chambres.map(c => (
                                <SelectItem key={c.id_chambre} value={String(c.id_chambre)}>
                                    {c.numero} - {c.type_chambre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 col-span-2 md:col-span-1">
                     <label className="text-sm font-medium">Réservation (Optionnel)</label>
                     <Select 
                        value={formData.id_reservation ? String(formData.id_reservation) : "none"}
                        onValueChange={(v) => setFormData(p => ({ ...p, id_reservation: v === "none" ? null : Number(v) }))}
                    >
                        <SelectTrigger className="rounded-none">
                            <SelectValue placeholder="Aucune" />
                        </SelectTrigger>
                        <SelectContent className="rounded-none">
                             <SelectItem value="none">Aucune</SelectItem>
                            {reservations
                                .filter(r => !formData.id_client || r.id_client === formData.id_client)
                                .map(r => (
                                <SelectItem key={r.id_reservation} value={String(r.id_reservation)}>
                                    #{r.id_reservation} ({new Date(r.date_arrivee).toLocaleDateString()})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 col-span-2 md:col-span-1">
                     <label className="text-sm font-medium">Montant (XOF) *</label>
                     <Input 
                        type="number" 
                        value={formData.montant}
                        onChange={(e) => setFormData(p => ({ ...p, montant: e.target.value }))}
                        className="rounded-none font-bold"
                        placeholder="0"
                     />
                </div>

                <div className="space-y-2 col-span-2 md:col-span-1">
                     <label className="text-sm font-medium">Statut paiement</label>
                     <div className="flex gap-2">
                        <Button 
                            type="button"
                            variant={formData.paye === "OUI" ? "default" : "outline"}
                            className={cn("flex-1 rounded-none", formData.paye === "OUI" && "bg-emerald-600 hover:bg-emerald-700 text-white")}
                            onClick={() => setFormData(p => ({ ...p, paye: "OUI" }))}
                        >
                            Payé
                        </Button>
                        <Button 
                             type="button"
                             variant={formData.paye === "NON" ? "destructive" : "outline"}
                             className="flex-1 rounded-none"
                             onClick={() => setFormData(p => ({ ...p, paye: "NON" }))}
                        >
                            Impayé
                        </Button>
                     </div>
                </div>

                {formData.paye === "OUI" && (
                    <div className="space-y-2 col-span-2">
                        <label className="text-sm font-medium">Mode de paiement</label>
                        <Select 
                            value={formData.mode_paiement || ""}
                            onValueChange={(v) => setFormData(p => ({ ...p, mode_paiement: v }))}
                        >
                            <SelectTrigger className="rounded-none">
                                <SelectValue placeholder="Choisir..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                                {modesPaiement.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-2 col-span-2">
                     <label className="text-sm font-medium">Observations</label>
                     <Input 
                        value={formData.observations}
                        onChange={(e) => setFormData(p => ({ ...p, observations: e.target.value }))}
                        className="rounded-none"
                        placeholder="Notes internes..."
                     />
                </div>
            </div>

            {formError && (
                <Alert variant="destructive" className="rounded-none mb-4">
                    <AlertDescription>{formError}</AlertDescription>
                </Alert>
            )}

            <div className="flex gap-2 justify-end">
                 <Button variant="outline" onClick={() => setIsFormOpen(false)} className="rounded-none">Annuler</Button>
                 <Button onClick={handleSave} disabled={isSaving} className="rounded-none min-w-24">
                    {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
                 </Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle>Supprimer la facture ?</DialogTitle>
            <DialogDescription>Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="rounded-none">Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="rounded-none">
                {isDeleting ? <Loader2 className="size-4 animate-spin" /> : "Supprimer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
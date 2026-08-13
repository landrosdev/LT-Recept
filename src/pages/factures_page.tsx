import { useMemo, useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { toast } from "sonner"
import {
 listFactures,
 createFacture,
 updateFacture,
 type Facture,
 type FactureInput
} from "@/services/Facture_service"
import { listClients, type Client } from "@/services/Client_service"
import { listChambres, type Chambre } from "@/services/Chambre_service"

import { listReservations, type Reservation } from "@/services/Reservation_service"
import { getConfiguration, type Configuration } from "@/services/Configuration_service"
import { listPaiementsByFacture, createPaiement, deletePaiement, listAllPaiements, type Paiement } from "@/services/Paiement_service"
import { listTarifs, type Tarif } from "@/services/Tarif_service"
import { listCategories, type CategorieChambre } from "@/services/CategorieChambre_service"
import { logAction } from "@/services/Audit_service"
import { useAuth } from "@/hooks/useAuth"
import { FacturePrint } from "@/components/facture/FacturePrint"

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
  Search,
  Plus,
  Loader2,
  Filter,
  Printer,
  Trash2,
  Eye,
  Receipt,
  Banknote,
  Clock,
  CheckCircle2,
  CreditCard
} from "lucide-react"
import { cn } from "@/lib/utils"

type ColKey = "client" | "montant" | "date" | "statut" | "paiement"

const modesPaiement = [
 { value: "ESPECES", label: "Espèces" },
 { value: "MOBILE_MONEY", label: "Mobile Money" },
 { value: "CARTE", label: "Carte Bancaire" },
]

export default function FacturesPage() {
 const { user } = useAuth()
 // Data State
 const [factures, setFactures] = useState<Facture[]>([])
 const [clients, setClients] = useState<Client[]>([])
 const [chambres, setChambres] = useState<Chambre[]>([])

 const [reservations, setReservations] = useState<Reservation[]>([])
 const [tarifs, setTarifs] = useState<Tarif[]>([])
 const [categories, setCategories] = useState<CategorieChambre[]>([])
 const [allPaiements, setAllPaiements] = useState<Paiement[]>([])
 
 const [isLoading, setIsLoading] = useState(true)
 const [config, setConfig] = useState<Configuration | null>(null)
 const [_error, setError] = useState<string | null>(null)

 // Filters & Sorting
  const [filters, setFilters] = useState({
   client: "",
   statut: "ALL",
  })
  const updateFilters = (newFilters: any) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }
  const [sort] = useState<{ key: ColKey; dir: "asc" | "desc" } | null>({ key: "date", dir: "desc" })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

 // Form State
 const [isFormOpen, setIsFormOpen] = useState(false)
 const [editingId, setEditingId] = useState<number | null>(null)
 const [isSaving, setIsSaving] = useState(false)


 // Form Fields
 const [formData, setFormData] = useState<{
  id_client: number
  id_chambre: number | null
  id_reservation: number | null

  date_facture: string
  montant: string
  remise: string
  mode_paiement: string | null
  statut: "EN_ATTENTE" | "PARTIEL" | "PAYE" | "ANNULEE"
  observations: string
 }>({
  id_client: 0,
  id_chambre: null,
  id_reservation: null,

  date_facture: new Date().toISOString().split("T")[0],
  montant: "",
  remise: "0",
  mode_paiement: null,
  statut: "EN_ATTENTE",
  observations: "",
 })

 // Paiement State
 const [paiements, setPaiements] = useState<Paiement[]>([])
 const [isAddingPaiement, setIsAddingPaiement] = useState(false)
 const [newPaiementMontant, setNewPaiementMontant] = useState("")
 const [newPaiementMode, setNewPaiementMode] = useState<string | null>(null)

 // Print State
 const [isPrintOpen, setIsPrintOpen] = useState(false)
 const [printingFacture, setPrintingFacture] = useState<Facture | null>(null)
 const [printingPaiements, setPrintingPaiements] = useState<Paiement[]>([])

 async function loadAll() {
  setIsLoading(true)
  try {
   const [f, c, ch, r, cfg, t, cat, p] = await Promise.all([
    listFactures(),
    listClients(),
    listChambres(),
    listReservations(),
    getConfiguration(),
    listTarifs(),
    listCategories(),
    listAllPaiements(),
   ])
   setFactures(f)
   setClients(c)
   setChambres(ch)
   setReservations(r)
   setConfig(cfg)
   setTarifs(t)
   setCategories(cat)
   setAllPaiements(p)
  } catch (e) {
   console.error("Failed to load data", e)
   setError("Impossible de charger les données.")
  } finally {
   setIsLoading(false)
  }
 }

 const location = useLocation()
 useEffect(() => {
  if (isLoading || factures.length === 0) return
  const params = new URLSearchParams(location.search)
  const id = params.get("id")
  if (id) {
   const f = factures.find(x => x.id_facture === Number(id))
   if (f) openEdit(f)
  }
 }, [location.search, isLoading, factures.length])

 // Load Data
 useEffect(() => {
  loadAll()
 }, [])

 // Load payments for printing when printingFacture changes
 useEffect(() => {
  if (printingFacture) {
   void listPaiementsByFacture(printingFacture.id_facture).then(setPrintingPaiements)
  } else {
   setPrintingPaiements([])
  }
 }, [printingFacture])

 // Derived State (Stats)
  const stats = useMemo(() => {
   const total = factures.length
   const payees = factures.filter(f => f.statut === "PAYE").length
   const enAttente = factures.filter(f => f.statut === "EN_ATTENTE").length
   const partielles = factures.filter(f => f.statut === "PARTIEL").length
   
   const totalCA = allPaiements.reduce((acc, p) => acc + (p.montant || 0), 0)

   const totalRestant = factures.reduce((acc, f) => {
     if (f.statut === "ANNULEE") return acc
     if (f.statut === "PAYE") return acc
     
     // Pour être plus précis, il faudrait soustraire les paiements déjà faits pour cette facture
     const factPaiements = allPaiements.filter(p => p.id_facture === f.id_facture)
     const sumPaid = factPaiements.reduce((s, p) => s + p.montant, 0)
     return acc + Math.max(0, (f.montant - f.remise) - sumPaid)
   }, 0)

   return { total, payees, enAttente, partielles, totalCA, totalRestant }
  }, [factures, allPaiements])

 // Filtering & Sorting
 const filtered = useMemo(() => {
  return factures.filter(f => {
   const client = clients.find(c => c.id_client === f.id_client)
   const clientName = client ? `${client.prenom ?? ""} ${client.nom}`.toLowerCase() : ""
   
   if (filters.client && !clientName.includes(filters.client.toLowerCase())) return false
   if (filters.statut !== "ALL" && f.statut !== filters.statut) return false
   
   return true
  })
 }, [factures, clients, filters])

  const sorted = useMemo(() => {
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
      va = a.statut
      vb = b.statut
      break
     case "paiement":
      va = a.mode_paiement ?? ""
      vb = b.mode_paiement ?? ""
      break
     default:
      return 0
    }

    if (va === vb) return b.id_facture - a.id_facture
    return (va > vb ? 1 : -1) * dir
   })
  }, [filtered, sort, clients])

  const totalPages = Math.ceil(sorted.length / pageSize)
  const displayed = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, currentPage, pageSize])

 // Actions
 function openCreate() {
  setEditingId(null)
  setFormData({
   id_client: 0,
   id_chambre: null,
   id_reservation: null,

   date_facture: new Date().toISOString().split("T")[0],
   montant: "",
   remise: "0",
   mode_paiement: null,
   statut: "EN_ATTENTE",
   observations: "",
  })
  setPaiements([])
  setIsFormOpen(true)
 }

 function openEdit(f: Facture) {
  setEditingId(f.id_facture)
  setFormData({
   id_client: f.id_client,
   id_chambre: f.id_chambre,
   id_reservation: f.id_reservation,

   date_facture: f.date_facture.split("T")[0], 
   montant: String(f.montant),
   remise: String(f.remise),
   mode_paiement: f.mode_paiement,
   statut: f.statut as "EN_ATTENTE" | "PARTIEL" | "PAYE" | "ANNULEE",
   observations: f.observations ?? "",
  })
  setIsFormOpen(true)
  void loadPaiements(f.id_facture)
 }

 async function loadPaiements(factureId: number) {
  try {
   const p = await listPaiementsByFacture(factureId)
   setPaiements(p)
  } catch (e) {
   console.error(e)
  }
 }

 async function handleAddPaiement() {
  if (!editingId) return
  const amount = parseFloat(newPaiementMontant)
  if (isNaN(amount) || amount <= 0) return

  setIsAddingPaiement(true)
  try {
   await createPaiement(editingId, amount, newPaiementMode)
   await logAction(user?.id_utilisateur || null, "PAIEMENT_FACTURE", {
     id_facture: editingId,
     montant: amount,
     mode: newPaiementMode
   });
   toast.success("Paiement enregistré")
   await loadPaiements(editingId)
   const freshFactures = await listFactures()
   setFactures(freshFactures)
   

   
  } catch (e) {
   toast.error("Erreur")
  } finally {
   setIsAddingPaiement(false)
  }
 }

 async function handleRemovePaiement(id: number) {
  
  try {
   await deletePaiement(id)
   if (editingId) {
    await loadPaiements(editingId)
    const freshFactures = await listFactures()
    setFactures(freshFactures)
    

   }
   toast.success("Paiement supprimé")
  } catch (e) {
    toast.error("Erreur")
  }
 }

 async function handleSave() {
  if (!formData.id_client) {
   toast.error("Veuillez sélectionner un client")
   return
  }
  if (!formData.date_facture) {
   toast.error("Veuillez choisir une date")
   return
  }
  const montant = parseFloat(formData.montant || "0")
  const remise = parseFloat(formData.remise || "0")
  if (isNaN(montant) || montant < 0) {
   toast.error("Le montant doit être valide (>= 0)")
   return
  }
  if (isNaN(remise) || remise < 0) {
   toast.error("La remise doit être valide (>= 0)")
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
    remise: remise,
    mode_paiement: formData.mode_paiement,
    statut: formData.statut === "ANNULEE" ? "ANNULEE" : (remainingToPay === 0 ? "PAYE" : (totalPaid > 0 ? "PARTIEL" : "EN_ATTENTE")),
    observations: formData.observations.trim() || null,
   }

   if (editingId) {
    const updated = await updateFacture(editingId, input)
    setFactures(p => p.map(f => f.id_facture === editingId ? updated : f))
    toast.success("Facture modifiée avec succès")
   } else {
    const created = await createFacture(input)
    await logAction(user?.id_utilisateur || null, "CREATION_FACTURE", {
      id_facture: created.id_facture,
      client: clients.find(c => c.id_client === input.id_client)?.nom,
      montant: input.montant
    });
    setFactures(p => [created, ...p])
    toast.success("Facture créée avec succès")
   }
   setIsFormOpen(false)
  } catch (e) {
   console.error(e)
   toast.error("Erreur lors de l'enregistrement de la facture")
  } finally {
   setIsSaving(false)
  }
 }

 function getClientName(id: number) {
  const c = clients.find(x => x.id_client === id)
  return c ? (c.prenom ? `${c.prenom} ${c.nom}` : c.nom) : "Inconnu"
 }
  function getChambreNum(f: Facture) {
    if (f.id_chambre) {
      const c = chambres.find(x => x.id_chambre === Number(f.id_chambre))
      return c ? c.numero.toString() : "—"
    }

    let ids: string | null = null
    if (f.id_reservation) {
      const res = reservations.find(r => r.id_reservation === f.id_reservation)
      if (res) ids = res.chambres_ids
    }

    if (!ids) return "—"

    let idArray: number[] = []
    try {
      // Nettoyage si c'est une chaîne qui ressemble à du JSON mais mal formée ou doublement échappée
      const cleanIds = ids.trim();
      if (cleanIds.startsWith("[") || cleanIds.startsWith("{")) {
        const parsed = JSON.parse(cleanIds);
        if (Array.isArray(parsed)) {
          idArray = parsed.map((x: any) => {
            if (typeof x === 'object' && x !== null) return Number(x.id);
            return Number(x);
          }).filter(id => !isNaN(id));
        } else if (typeof parsed === 'object' && parsed !== null) {
          idArray = [Number(parsed.id)];
        }
      } else {
        // Format CSV classique
        idArray = cleanIds.split(",").map(x => Number(x.trim())).filter(x => !isNaN(x));
      }
    } catch (e) {
      // Fallback split par virgule si JSON.parse échoue
      idArray = ids.split(",").map(x => {
        // En cas de fallback, on essaie d'extraire l'ID si c'est un fragment de JSON
        const match = x.match(/"id":\s*(\d+)/) || x.match(/id:\s*(\d+)/);
        return match ? Number(match[1]) : Number(x.replace(/[^\d]/g, ''));
      }).filter(id => !isNaN(id) && id > 0);
    }

    if (idArray.length === 0) return "—"
    
    return idArray.map(id => {
      const ch = chambres.find(c => c.id_chambre === id)
      return ch ? ch.numero : "?"
    }).join("+")
  }
 function formatMoney(amount: number) {
  let symbol = "Ar"
  try {
    const saved = localStorage.getItem("app-settings")
    if (saved) {
      const c = JSON.parse(saved).currency
      if (c === "EUR") symbol = "€"
      if (c === "USD") symbol = "$"
      if (c === "XOF" || c === "FCFA") symbol = "FCFA"
    }
  } catch(e) {}
  return new Intl.NumberFormat('fr-FR').format(amount) + " " + symbol
 }

 const totalPaid = useMemo(() => {
  return paiements.reduce((acc, curr) => acc + curr.montant, 0)
 }, [paiements])

 const remainingToPay = useMemo(() => {
  const totalNet = parseFloat(formData.montant || "0") - parseFloat(formData.remise || "0")
  return Math.max(0, totalNet - totalPaid)
 }, [formData.montant, formData.remise, totalPaid])

 function handleClientSelect(clientId: number) {
  setFormData(p => ({ ...p, id_client: clientId }))
 }

 function handleChambreSelect(chambreId: number | null) {
  setFormData(p => ({ ...p, id_chambre: chambreId }))
  if (chambreId) {
   const chambre = chambres.find(c => c.id_chambre === chambreId)
   if (chambre) {
    const categorie = categories.find(cat => cat.id_categorie === chambre.id_categorie)
    if (categorie) {
     const tarif = tarifs.find(t => t.nom.toLowerCase() === categorie.libelle.toLowerCase() && t.type_tarif === "CHAMBRE")
     if (tarif) {
       setFormData(p => ({ ...p, montant: String(tarif.montant) }))
       toast.info(`Tarif "${tarif.nom}" appliqué automatiquement: ${tarif.montant} Ar`)
     }
    }
   }
  }
 }

 return (
  <div className="space-y-6 page-enter">
   {/* Header */}
   <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
     <div className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary">
      <Receipt className="size-5" />
     </div>
     <div>
      <h1 className="text-2xl font-bold tracking-tight">Facturation</h1>
      <p className="text-sm text-muted-foreground">Gestion des factures et paiements</p>
     </div>
    </div>
    <Button onClick={openCreate} className="gap-2 shadow-sm ">
     <Plus className="size-4" /> Nouvelle facture
    </Button>
   </div>

   {/* Stats KPI */}
   <div className="grid grid-cols-1 gap-3 md:grid-cols-4 mb-6">
    <Card className="shadow-sm border-none bg-card">
     <CardContent className="kpi-card-content flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
       <Banknote className="size-4" />
      </div>
      <div className="min-w-0">
       <div className="text-base font-bold tracking-tight truncate mb-0.5">{formatMoney(stats.totalCA)}</div>
       <div className="text-[9px] text-muted-foreground font-medium truncate">Encaissé (CA)</div>
      </div>
     </CardContent>
    </Card>

    <Card className="shadow-sm border-none bg-card">
     <CardContent className="kpi-card-content flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
       <Clock className="size-4" />
      </div>
      <div className="min-w-0">
       <div className="text-base font-bold tracking-tight truncate mb-0.5">{formatMoney(stats.totalRestant)}</div>
       <div className="text-[9px] text-muted-foreground font-medium truncate">Reste à percevoir</div>
      </div>
     </CardContent>
    </Card>

    <Card className="shadow-sm border-none bg-card">
     <CardContent className="kpi-card-content flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
       <CheckCircle2 className="size-4" />
      </div>
      <div className="min-w-0">
       <div className="text-base font-bold tracking-tight truncate mb-0.5">{stats.payees}</div>
       <div className="text-[9px] text-muted-foreground font-medium truncate">Factures Payées</div>
      </div>
     </CardContent>
    </Card>

    <Card className="shadow-sm border-none bg-card">
     <CardContent className="kpi-card-content flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
       <Receipt className="size-4" />
      </div>
      <div className="min-w-0">
       <div className="text-base font-bold tracking-tight truncate mb-0.5">{stats.total}</div>
       <div className="text-[9px] text-muted-foreground font-medium truncate">Total Factures</div>
      </div>
     </CardContent>
    </Card>
   </div>

   <Card className="overflow-hidden border shadow-sm ">
    <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/30 pb-4">
     <div className="flex items-center gap-2">
      <Filter className="size-4 text-muted-foreground" />
      <CardTitle className="text-base font-semibold">Historique</CardTitle>
     </div>
     <div className="flex items-center gap-2">
       <Select
        value={filters.statut}
        onValueChange={(v) => updateFilters((p: any) => ({ ...p, statut: v }))}
       >
        <SelectTrigger className="w-40 h-9">
         <SelectValue placeholder="Filtrer par statut" />
        </SelectTrigger>
        <SelectContent className="">
         <SelectItem value="ALL">Tous les statuts</SelectItem>
         <SelectItem value="PAYE">Payées</SelectItem>
         <SelectItem value="PARTIEL">Partielles</SelectItem>
         <SelectItem value="EN_ATTENTE">En attente</SelectItem>
         <SelectItem value="ANNULEE">Annulées</SelectItem>
        </SelectContent>
       </Select>
       <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input placeholder="Rechercher..." value={filters.client} onChange={(e) => updateFilters((p: any) => ({ ...p, client: e.target.value }))} className="w-64 pl-9 h-9" />
       </div>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      {isLoading ? <div className="flex h-64 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div> : (
      <div className="overflow-x-auto">
       <table className="w-full min-w-[900px]">
        <thead className="bg-muted text-xs uppercase tracking-wider">
         <tr className="border-b-2 border-primary">
          <th className="px-4 py-3 text-left w-20">ID</th>
          <th className="px-4 py-3 text-left">Client</th>
          <th className="px-4 py-3 text-left">Chambre</th>
          <th className="px-4 py-3 text-left">Date</th>
          <th className="px-4 py-3 text-right">Montant</th>
          <th className="px-4 py-3 text-center">Statut</th>
          <th className="px-4 py-3 text-right">Actions</th>
         </tr>
        </thead>
        <tbody className="divide-y">
         {displayed.length === 0 ? (
          <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground italic">Aucune facture.</td></tr>
         ) : (() => {
          // Group factures by id_reservation (null = standalone)
          const groups: { key: string; factures: typeof displayed }[] = []
          const seen = new Set<string>()
          
          for (const f of displayed) {
           // Group by reservation ID if present, otherwise group by (client + date) to catch multi-room walk-ins
           const groupKey = f.id_reservation 
            ? `res-${f.id_reservation}` 
            : `client-${f.id_client}-${f.date_facture}`;
            
           if (seen.has(groupKey)) continue
           seen.add(groupKey)
           
           if (f.id_reservation) {
            const grouped = displayed.filter(x => x.id_reservation === f.id_reservation)
            groups.push({ key: groupKey, factures: grouped })
           } else {
            const grouped = displayed.filter(x => 
             !x.id_reservation && 
             x.id_client === f.id_client && 
             x.date_facture === f.date_facture
            )
            groups.push({ key: groupKey, factures: grouped })
           }
          }

          return groups.map(({ key, factures: grp }) => {
           const first = grp[0]
           const totalMontant = grp.reduce((acc, f) => acc + (f.montant - f.remise), 0)
           const allPaye = grp.every(f => f.statut === "PAYE")
           const anyPartiel = grp.some(f => f.statut === "PARTIEL")
           const anyAnnulee = grp.some(f => f.statut === "ANNULEE")
           const displayStatut = allPaye ? "PAYE" : anyPartiel ? "PARTIEL" : anyAnnulee ? "ANNULEE" : "EN_ATTENTE"
           
           return (
            <tr key={key} className="hover:bg-muted/50 transition-colors">
             <td className="px-4 py-3">
              <div className="flex items-center gap-3">
               <div className="flex h-8 w-8 items-center justify-center bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
                <Receipt className="size-4" />
               </div>
               <span className="font-bold text-sm text-foreground">
                {grp.length > 1 ? `F_${first.id_facture} (Grp)` : `F_${first.id_facture}`}
               </span>
              </div>
             </td>
             <td className="px-4 py-3 font-medium">{getClientName(first.id_client)}</td>
             <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {getChambreNum(first).split("+").map((num, i) => (
                  <Badge 
                    key={i} 
                    variant="outline" 
                    className="border-primary/40 text-primary bg-primary/5 font-bold hover:bg-primary/10 transition-colors"
                  >
                    Ch. {num}
                  </Badge>
                ))}
              </div>
             </td>
             <td className="px-4 py-3 text-sm">{new Date(first.date_facture).toLocaleDateString()}</td>
             <td className="px-4 py-3 text-right font-bold">{formatMoney(totalMontant)}</td>
             <td className="px-4 py-3 text-center">
              <div 
               className="cursor-pointer hover:opacity-80 transition-opacity inline-flex"
               onClick={() => openEdit(first)}
               title="Cliquer pour gérer les paiements"
              >
               {displayStatut === "PAYE" ? (
                <Badge className="bg-emerald-500 border-none">Payée</Badge>
               ) : displayStatut === "PARTIEL" ? (
                <Badge className="bg-amber-500 border-none">Partiel</Badge>
               ) : displayStatut === "ANNULEE" ? (
                <Badge className="bg-gray-500 border-none">Annulée</Badge>
               ) : (
                <Badge variant="destructive" className="">En attente</Badge>
               )}
              </div>
             </td>
             <td className="px-4 py-3 text-right space-x-2 flex justify-end">
               <Button variant="outline" size="sm" onClick={() => openEdit(first)} className="h-8 border-primary text-primary gap-1">
                <Eye className="size-3" /> Détails
               </Button>
               <Button variant="outline" size="sm" onClick={() => { setPrintingFacture(first); setIsPrintOpen(true); }} className="h-8 "><Printer className="size-3" /></Button>
             </td>
            </tr>
           )
          })
         })()}
        </tbody>
       </table>
      </div>
     )}
    </CardContent>
     <div className="flex items-center justify-between border-t px-4 py-3 bg-muted/20">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
       <span>Afficher</span>
       <select
        value={pageSize}
        onChange={e => {
          setPageSize(Number(e.target.value))
          setCurrentPage(1)
        }}
        className="h-7 border border-input bg-background text-foreground rounded px-2 text-xs"
       >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
       </select>
       <span>par page</span>
       <span className="ml-2 font-medium">{filtered.length} résultat(s)</span>
      </div>
      <div className="flex items-center gap-2">
       <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs px-3 rounded-none"
        disabled={currentPage <= 1}
        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
       >
        Précédent
       </Button>
       <span className="text-xs font-medium text-muted-foreground">
        Page {currentPage} / {totalPages || 1}
       </span>
       <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs px-3 rounded-none"
        disabled={currentPage >= totalPages}
        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
       >
        Suivant
       </Button>
      </div>
     </div>
    </Card>

   <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
    <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editingId ? "Détails Facture F_" + editingId : "Nouvelle facture"}</DialogTitle>
        <DialogDescription>Gestion du paiement et installments</DialogDescription>
      </DialogHeader>
      <Separator />
      <div className="grid grid-cols-2 gap-6 py-4">
        <div className="space-y-4">
         <div className="space-y-2">
           <label className="text-sm font-medium">Client *</label>
           <select value={formData.id_client} onChange={e => handleClientSelect(Number(e.target.value))} className="w-full h-10 border bg-background px-3 ">
             <option value={0} disabled>Choisir un client...</option>
             {clients.map(c => <option key={c.id_client} value={c.id_client}>{c.prenom ? `${c.prenom} ${c.nom}` : c.nom}</option>)}
           </select>
         </div>
         <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Date *</label>
            <Input type="date" value={formData.date_facture} onChange={e => setFormData(p => ({...p, date_facture: e.target.value}))} className="" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Chambre(s)</label>
            {formData.id_reservation ? (
              <div className="p-2 border bg-muted/50 text-sm font-bold flex flex-wrap gap-2 min-h-[40px]">
                {(() => {
                  let ids: string | null = null;
                  const r = reservations.find(x => x.id_reservation === formData.id_reservation);
                  if (r) ids = r.chambres_ids || null;

                  if (!ids) return <span className="text-muted-foreground font-normal italic">Aucune chambre</span>;

                  let idArray: number[] = [];
                  try {
                    const cleanIds = ids.trim();
                    if (cleanIds.startsWith("[") || cleanIds.startsWith("{")) {
                      const parsed = JSON.parse(cleanIds);
                      if (Array.isArray(parsed)) {
                        idArray = parsed.map((x: any) => {
                          if (typeof x === 'object' && x !== null) return Number(x.id);
                          return Number(x);
                        }).filter(id => !isNaN(id));
                      } else if (typeof parsed === 'object' && parsed !== null) {
                        idArray = [Number(parsed.id)];
                      }
                    } else {
                      idArray = cleanIds.split(",").map(x => Number(x.trim())).filter(x => !isNaN(x));
                    }
                  } catch (e) {
                    idArray = ids.split(",").map(x => {
                      const match = x.match(/"id":\s*(\d+)/) || x.match(/id:\s*(\d+)/);
                      return match ? Number(match[1]) : Number(x.replace(/[^\d]/g, ''));
                    }).filter(id => !isNaN(id) && id > 0);
                  }

                  return idArray.map(id => {
                    const ch = chambres.find(c => c.id_chambre === id);
                    return <Badge key={id} variant="outline" className="border-primary text-primary bg-primary/5">Ch. {ch?.numero || id}</Badge>;
                  });
                })()}
              </div>
            ) : (
              <select value={formData.id_chambre || ""} onChange={e => handleChambreSelect(e.target.value ? Number(e.target.value) : null)} className="w-full h-10 border bg-background px-3 ">
                <option value="">Aucune</option>
                {chambres.map(c => <option key={c.id_chambre} value={c.id_chambre}>{c.numero}</option>)}
              </select>
            )}
          </div>
         </div>
         <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Montant *</label>
            <Input type="number" value={formData.montant} onChange={e => setFormData(p => ({...p, montant: e.target.value}))} className="" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Remise</label>
            <Input type="number" value={formData.remise} onChange={e => setFormData(p => ({...p, remise: e.target.value}))} className=" text-rose-600" />
          </div>
         </div>
         
         <div className="bg-muted/30 p-4 border border-dashed text-center">
           <div className="text-xs uppercase text-muted-foreground">Net à payer</div>
           <div className="text-2xl font-black text-primary">{formatMoney(parseFloat(formData.montant || "0") - parseFloat(formData.remise || "0"))}</div>
         </div>

         <div className="space-y-2">
           <label className="text-sm font-medium">Observations</label>
           <Input value={formData.observations} onChange={e => setFormData(p => ({...p, observations: e.target.value}))} className="" placeholder="Notes..." />
         </div>

         {formData.statut === "ANNULEE" ? (
          <div className="flex gap-2">
            <Badge className="text-center justify-center py-2 flex-1 bg-gray-600 text-white border-transparent">
             Facture Annulée
            </Badge>
          </div>
         ) : (
          <div className="flex gap-2">
           <Badge className={cn("text-center justify-center py-2 flex-1 ", remainingToPay === 0 ? "bg-emerald-600" : "bg-muted text-muted-foreground border-transparent")}>Entièrement payé</Badge>
           <Badge className={cn("text-center justify-center py-2 flex-1 ", remainingToPay > 0 && totalPaid > 0 ? "bg-amber-600 text-white" : "bg-muted text-muted-foreground border-transparent")}>Partiellement payé</Badge>
           <Badge className={cn("text-center justify-center py-2 flex-1 ", totalPaid === 0 ? "bg-destructive text-white" : "bg-muted text-muted-foreground border-transparent")}>En attente</Badge>
          </div>
         )}
        </div>

        <div className="border-l pl-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2"><CreditCard className="size-4" /> Historique des règlements</h3>
          <div className="space-y-2 border p-2 bg-muted/10 min-h-[150px] max-h-[250px] overflow-y-auto">
            {paiements.length === 0 ? <p className="text-xs text-muted-foreground text-center py-8">Aucun paiement enregistré.</p> : (
             paiements.map(p => (
              <div key={p.id_paiement} className="flex items-center justify-between bg-card p-2 text-sm border shadow-sm">
                <div>
                  <div className="font-bold">{formatMoney(p.montant)}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(p.date_paiement).toLocaleDateString()} - {p.mode_paiement}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemovePaiement(p.id_paiement)} className="h-6 w-6 p-0 text-destructive"><Trash2 className="size-3" /></Button>
              </div>
             ))
            )}
          </div>

          <div className="bg-primary/5 p-4 space-y-3 border">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-tight">Ajouter un règlement</h4>
              {remainingToPay > 0 && (
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-[10px] text-primary underline"
                  onClick={() => setNewPaiementMontant(String(remainingToPay))}
                >
                  Saisir le reste ({remainingToPay} Ar)
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Montant" value={newPaiementMontant} onChange={e => setNewPaiementMontant(e.target.value)} className=" h-8" />
              <select value={newPaiementMode || ""} onChange={e => setNewPaiementMode(e.target.value)} className="h-8 border bg-background px-2 text-xs ">
                <option value="">Mode...</option>
                {modesPaiement.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleAddPaiement} 
                disabled={isAddingPaiement || !newPaiementMontant} 
                className="w-full h-8 text-xs font-bold" 
                variant="secondary"
              >
                Confirmer le règlement
              </Button>
              {remainingToPay > 0 && (
                <Button 
                  onClick={async () => {
                    const amount = remainingToPay;
                    const mode = newPaiementMode || "ESPECES";
                    if (!editingId) return;
                    setIsAddingPaiement(true);
                    try {
                      await createPaiement(editingId, amount, mode);
                      setNewPaiementMontant("");
                      await loadPaiements(editingId);
                      loadAll();
                      toast.success("Facture soldée entièrement");
                    } catch(e) { toast.error("Erreur"); } finally { setIsAddingPaiement(false); }
                  }}
                  disabled={isAddingPaiement}
                  className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Tout régler {newPaiementMode ? `(${newPaiementMode})` : ""}
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center px-2 py-1 bg-muted font-bold text-xs">
            <span>Reste à payer :</span>
            <span className={cn(remainingToPay > 0 ? "text-rose-600" : "text-emerald-600")}>{formatMoney(remainingToPay)}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
         <Button variant="outline" onClick={() => setIsFormOpen(false)} className="">Annuler</Button>
         <Button onClick={handleSave} disabled={isSaving} className=" bg-primary text-white">Enregistrer Modifications</Button>
      </div>
    </DialogContent>
   </Dialog>

   <FacturePrint 
    open={isPrintOpen} 
    onOpenChange={setIsPrintOpen} 
    facture={printingFacture} 
    config={config} 
    client={printingFacture ? clients.find(c => c.id_client === printingFacture.id_client) || null : null}

    paiements={printingPaiements}
    reservations={reservations}
    chambres={chambres}
    categories={categories}
    tarifs={tarifs}
   />
  </div>
 )
}

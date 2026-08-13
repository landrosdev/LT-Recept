import { useMemo, useState, useEffect, useCallback } from "react"
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
 DialogHeader,
 DialogTitle,
 DialogDescription,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"


import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { History as HistoryIcon, MoreHorizontal, Plus, Search, CalendarCheck, User, Loader2, CalendarRange } from "lucide-react"
import { getCurrencySymbol } from "@/utils/currency"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { listClients, createClient, type Client } from "@/services/Client_service"
import { listChambres, type Chambre } from "@/services/Chambre_service"

import { listCategories, type CategorieChambre } from "@/services/CategorieChambre_service"
import { listTarifs, type Tarif } from "@/services/Tarif_service"
import { logAction } from "@/services/Audit_service"
import { useAuth } from "@/hooks/useAuth"
import { DisponibilitesView } from "@/components/reservation/DisponibilitesView"



const statutsList = [
 { value: "EN_ATTENTE", label: "En attente" },
 { value: "CONFIRMEE", label: "Confirmée" },
 { value: "ANNULEE", label: "Annulée" },
 { value: "TERMINEE", label: "Terminée" },
]

export default function ReservationsPage() {
 const { user } = useAuth()
 const {
  isLoading,
  reservations,
  stats,
  createOrUpdateReservation,
  updateStatus,
  removeReservation,
  refresh,
 } = useReservations()

 const [clients, setClients] = useState<Client[]>([])
 const [clientsLoading, setClientsLoading] = useState(true)
 const [chambres, setChambres] = useState<Chambre[]>([])

 const [categories, setCategories] = useState<CategorieChambre[]>([])
 const [tarifs, setTarifs] = useState<Tarif[]>([])

 const loadData = useCallback(async () => {
  try {
   console.log("Loading Reservations data...")
   const [c, ch, cats, t] = await Promise.all([
    listClients().catch(e => { console.error("Clients fail", e); return [] }),
    listChambres().catch(e => { console.error("Chambres fail", e); return [] }),
    listCategories().catch(e => { console.error("Categories fail", e); return [] }),
    listTarifs().catch(e => { console.error("Tarifs fail", e); return [] }),
   ])
   console.log("Loaded:", { clients: c.length, chambres: ch.length })
   setClients(c)
   setChambres(ch)
   setCategories(cats)
   setTarifs(t)
  } catch (e) {
   console.error("Failed to load data", e)
  } finally {
   setClientsLoading(false)
  }
 }, [])

 useEffect(() => {
  loadData()
 }, [loadData])

 // Rafraîchissement automatique toutes les minutes pour garantir le temps réel
 useEffect(() => {
  const intervalId = setInterval(() => {
   loadData()
   refresh()
  }, 60000)
  return () => clearInterval(intervalId)
 }, [loadData, refresh])





 const [searchQuery, setSearchQuery] = useState("")
 const [isFormOpen, setIsFormOpen] = useState(false)
 const [editingId, setEditingId] = useState<number | null>(null)

 // Form fields
 const [selectedClientId, setSelectedClientId] = useState<number>(0)
 const [selectedChambres, setSelectedChambres] = useState<number[]>([])
 const [chambreToAdd, setChambreToAdd] = useState<number>(0)
 const [dateDebut, setDateDebut] = useState("")
 const [dateFin, setDateFin] = useState("")
 const [statut, setStatut] = useState("EN_ATTENTE")
 const [paiement, setPaiement] = useState("")
 const [avance, setAvance] = useState<string>("")
 const [remise, setRemise] = useState<string>("0")
 const [roomNights, setRoomNights] = useState<Record<number, number>>({})
 const [isSaving, setIsSaving] = useState(false)
 const [formError, setFormError] = useState<string | null>(null)
 const [activeTab, setActiveTab] = useState("current")



 const [currentPageList, setCurrentPageList] = useState(1)
 const [pageSizeList, setPageSizeList] = useState(10)

 const [deleteReservationId, setDeleteReservationId] = useState<number | null>(null)
 const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
 const [isDeleting, setIsDeleting] = useState(false)
 const [viewingId, setViewingId] = useState<number | null>(null)


 useEffect(() => {
   setCurrentPageList(1)
 }, [activeTab, searchQuery, pageSizeList])

 const parseRoomDetails = (chambresIds: string | null) => {
   if (!chambresIds) return [];
   try {
     const parsed = JSON.parse(chambresIds);
     if (Array.isArray(parsed)) {
       if (parsed.length > 0 && typeof parsed[0] === "number") {
         return parsed.map(id => ({ id: Number(id), nuits: 0, fin: "" }));
       }
       return parsed as { id: number; nuits: number; fin: string }[];
     }
   } catch (e) {
     return chambresIds.split(",").filter(Boolean).map(id => ({ id: Number(id), nuits: 0, fin: "" }));
   }
   return [];
 };

  const selectedReservation = useMemo(() => 
    reservations.find(r => r.id_reservation === viewingId),
    [reservations, viewingId]
  );


 const filtered = useMemo(() => {
  return reservations.filter((r) => {
   // Filter by tab
   if (activeTab === "current") {
    if (r.statut === "TERMINEE" || r.statut === "ANNULEE") return false
   } else if (activeTab === "history") {
    if (r.statut !== "TERMINEE" && r.statut !== "ANNULEE") return false
   } else {
       return true
   }

   const client = clients.find(c => c.id_client === r.id_client)


   if (searchQuery) {
    const clientName = client ? `${client.prenom ?? ""} ${client.nom || ""}`.toLowerCase() : ""
    const idMatch = r.id_reservation.toString().includes(searchQuery)
    const clientMatch = clientName.includes(searchQuery.toLowerCase())
    const roomMatch = parseRoomDetails(r.chambres_ids).some(item => chambres.find(ch => ch.id_chambre === item.id)?.numero?.toString().includes(searchQuery));
    if (!idMatch && !clientMatch && !roomMatch) return false
   }
   return true
  })
 }, [reservations, clients, categories, activeTab, searchQuery, chambres])

 const displayed = useMemo(() => {
  return [...filtered].sort((a, b) => b.id_reservation - a.id_reservation)
 }, [filtered])

 const totalPagesList = Math.ceil(displayed.length / pageSizeList);
 const paginatedList = useMemo(() => {
   const start = (currentPageList - 1) * pageSizeList;
   return displayed.slice(start, start + pageSizeList);
 }, [displayed, currentPageList, pageSizeList]);

 const editing = useMemo(
  () => reservations.find((r) => r.id_reservation === editingId) ?? null,
  [reservations, editingId]
 )
 const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

  // Automatic calculation of total price
  const totalPrix = useMemo(() => {
   let nights = 1;
   if (dateDebut) {
    const start = new Date(dateDebut);
    if (dateFin) {
     const end = new Date(dateFin);
     nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
    }
   }

   let total = 0;
   selectedChambres.forEach(idChambre => {
    const chambre = chambres.find(c => c.id_chambre === idChambre);
    if (chambre) {
     const cat = categories.find(cat => cat.id_categorie === chambre.id_categorie);
     if (cat) {
      // Find tariff for this category (case-insensitive and normalized)
      const catLib = normalize(cat.libelle);
      const tarif = tarifs.find(t => 
        t.type_tarif === 'CHAMBRE' && 
        normalize(t.nom) === catLib
      );
      if (tarif) {
       const n = roomNights[idChambre] || nights;
       total += (tarif.montant || 0) * n;
      }
     }
    }
   });

   return total;
  }, [selectedChambres, dateDebut, dateFin, chambres, categories, tarifs, roomNights]);

 const netToPay = useMemo(() => {
  const rem = parseFloat(remise) || 0;
  return Math.max(0, totalPrix - rem);
 }, [totalPrix, remise]);

 const remainingToPay = useMemo(() => {
  const av = parseFloat(avance) || 0;
  return Math.max(0, netToPay - av);
 }, [netToPay, avance]);



 const getRoomStatus = (idChambre: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = dateDebut ? new Date(dateDebut) : today;
  start.setHours(0, 0, 0, 0);

  const end = dateFin ? new Date(dateFin) : new Date(start.getTime() + 24 * 3600 * 1000);
  end.setHours(0, 0, 0, 0);

  // 1. Check current occupancy (active stays)
  // (Removed sejours logic)

  // 2. Check for overlapping reservations
  for (const r of reservations) {
   if (editing && r.id_reservation === editing.id_reservation) continue;
   if (r.statut === "ANNULEE" || r.statut === "TERMINEE") continue;

   const rRooms = parseRoomDetails(r.chambres_ids);
   if (rRooms.some(rr => rr.id === idChambre)) {
    const rStart = new Date(r.date_debut);
    rStart.setHours(0, 0, 0, 0);
    const rEnd = r.date_fin ? new Date(r.date_fin) : new Date(rStart.getTime() + 24 * 3600 * 1000);
    rEnd.setHours(0, 0, 0, 0);

    if (start < rEnd && end > rStart) {
     return { available: false, reason: "Réservée", date: rStart };
    }
   }
  }

  // 3. Find next reservation
  let nextRes: Date | null = null;
  for (const r of reservations) {
   if (editing && r.id_reservation === editing.id_reservation) continue;
   if (r.statut === "ANNULEE" || r.statut === "TERMINEE") continue;
   const rRooms = parseRoomDetails(r.chambres_ids);
   if (rRooms.some(rr => rr.id === idChambre)) {
    const rStart = new Date(r.date_debut);
    rStart.setHours(0, 0, 0, 0);
    if (rStart > start) {
     if (!nextRes || rStart < nextRes) nextRes = rStart;
    }
   }
  }

  return { available: true, nextReservation: nextRes };
 };

 function openCreate() {
  setEditingId(null)
  setSelectedClientId(0)
  setSelectedChambres([])
  setChambreToAdd(0)
  setDateDebut("")
  setDateFin("")
  setStatut("EN_ATTENTE")
  setPaiement("")
  setAvance("")
  setRemise("0")
  setRoomNights({})
  setFormError(null)
  setIsFormOpen(true)
 }

 function openEdit(id: number) {
  const r = reservations.find((x) => x.id_reservation === id)
  if (!r) return
  setEditingId(id)
  setSelectedClientId(r.id_client)

  const parsedRooms = parseRoomDetails(r.chambres_ids);
  const roomIds = parsedRooms.map(rr => rr.id);
  setSelectedChambres(roomIds);
  setChambreToAdd(0)
  setDateDebut(r.date_debut.split("T")[0])
  setDateFin(r.date_fin ? r.date_fin.split("T")[0] : "")
  setStatut(r.statut)
  setPaiement(r.paiement ?? "")
  setAvance(r.avance ? r.avance.toString() : "")
  setRemise(r.remise ? r.remise.toString() : "0")
  const initialNights: Record<number, number> = {}
  parsedRooms.forEach(item => {
    initialNights[item.id] = item.nuits
  })
  setRoomNights(initialNights)
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
   const res = reservations.find(r => r.id_reservation === deleteReservationId);
   await removeReservation(deleteReservationId)
   
   await logAction(user?.id_utilisateur || null, "SUPPRESSION_RESERVATION", {
     id_reservation: deleteReservationId,
     client: res ? getClientName(res.id_client) : "Inconnu",
     date_debut: res?.date_debut
   });

   toast.success("Réservation supprimée")
   setDeleteConfirmOpen(false)
  } catch (e) {
   toast.error("Erreur lors de la suppression")
  } finally {
   setIsDeleting(false)
  }
 }

 async function handleCreateClientAndGetId(clientData: { nom: string; prenom: string; telephone: string; email: string, cin?: string }): Promise<number> {
  const newClient = await createClient({
   nom: clientData.nom || null,
   prenom: clientData.prenom || null,
   telephone: clientData.telephone || null,
   cin: clientData.cin || null,
   email: clientData.email || null,
  })
  const updatedClients = await listClients()
  setClients(updatedClients)
  return newClient.id_client
 }

 function getClientName(id_client: number): string {
  const c = clients.find(x => x.id_client === id_client)
  if (!c) return "Client inconnu"
  if (!c.nom && !c.prenom) return "Client #" + c.id_client
  return (c.prenom ? c.prenom + " " : "") + (c.nom || "")
  }

 function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return d.toLocaleDateString("fr-FR")
 }

 return (
  <div className="page-enter">
  <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab} className="flex flex-col w-full h-[calc(100vh-3.5rem)] -m-6" style={{ width: 'calc(100% + 3rem)' }}>
   
   {/* HEADER GLOBAL FIXE */}
   <div className="flex-none bg-background p-6 pb-4 shadow-sm z-40 border-b flex flex-col gap-6">
    <div className="flex items-center justify-between">
     <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary">
       <CalendarCheck className="size-5" />
      </div>
      <div>
       <h1 className="text-2xl font-bold tracking-tight">Gestion des réservations</h1>
       <p className="text-sm text-muted-foreground">{reservations.length} réservation(s)</p>
      </div>
     </div>
     <Button onClick={openCreate} className="gap-2 shadow-sm">
      <Plus className="size-4" /> Nouvelle réservation
     </Button>
    </div>

    <div className="flex items-center justify-between">
     <div className="flex flex-col lg:flex-row lg:items-center gap-4">
      <TabsList className="bg-muted/50 p-1">
       <TabsTrigger value="current" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
        <CalendarCheck className="size-4" />
        Réservations Actuelles
       </TabsTrigger>
       <TabsTrigger value="disponibilites" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
        <CalendarRange className="size-4" />
        Disponibilités 
       </TabsTrigger>
       <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
        <HistoryIcon className="size-4" />
        Historique
       </TabsTrigger>
      </TabsList>
      
      <div className="hidden xl:flex items-center gap-4 text-[10px] uppercase font-bold bg-muted/30 rounded-lg p-1.5 px-3 border text-muted-foreground shadow-sm">
       <div className="flex items-center gap-1.5" title="Total réservations">
        <span className="text-sm font-black text-foreground">{stats.total}</span>
        <span>Total</span>
       </div>
       <div className="w-px h-4 bg-border" />
       <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500" title="En attente">
        <span className="text-sm font-black">{stats.pending}</span>
        <span>En attente</span>
       </div>
       <div className="w-px h-4 bg-border" />
       <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500" title="Confirmées">
        <span className="text-sm font-black">{stats.confirmed}</span>
        <span>Confirmées</span>
       </div>
       <div className="w-px h-4 bg-border" />
       <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-500" title="Annulées">
        <span className="text-sm font-black">{stats.cancelled}</span>
        <span>Annulées</span>
       </div>
      </div>
     </div>

     <div className="relative">
      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
      <Input
       placeholder="Rechercher une réservation..."
       className="w-64 pl-9 "
       value={searchQuery}
       onChange={(e) => setSearchQuery(e.target.value)}
      />
     </div>
    </div>
   </div>

   {/* ZONE DE CONTENU (SCROLLABLE INDIVIDUELLEMENT) */}
   <div className="flex-1 flex flex-col min-h-0 bg-muted/10">
    <TabsContent value={activeTab} className="flex-1 flex flex-col min-h-0 mt-0 outline-none">
     {activeTab === "disponibilites" ? (
       <DisponibilitesView categories={categories} chambres={chambres} reservations={reservations} />
     ) : (
      <div className="flex-1 overflow-auto p-6">
       <Card className="border shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-muted/30 py-3">
         <CardTitle className="text-base font-semibold">
          {activeTab === "current" ? "Liste des réservations" : "Archives des réservations"}
         </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
        {isLoading || clientsLoading ? (
         <div className="flex h-64 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : (
         <div className="overflow-auto">
          <table className="w-full">
           <thead className="bg-muted text-xs uppercase">
            <tr className="border-b-2 border-primary">
             <th className="px-4 py-3 text-left font-medium cursor-pointer">Client</th>
             <th className="px-4 py-3 text-left font-medium cursor-pointer">Chambres</th>
             <th className="px-4 py-3 text-left font-medium cursor-pointer">Dates</th>
             <th className="px-4 py-3 text-left font-medium cursor-pointer">Statut</th>
             <th className="px-4 py-3 text-right">Actions</th>
            </tr>
           </thead>
           <tbody className="divide-y">
            {paginatedList.map((r) => (
             <tr key={r.id_reservation} className="hover:bg-muted/50 transition-colors">
              <td className="px-4 py-3">
               <div className="flex items-center gap-2">
                <User className="size-4 text-primary" />
                <span className="font-medium">{getClientName(r.id_client)}</span>
               </div>
              </td>

              <td className="px-4 py-3">
               <div className="flex flex-wrap gap-1">
                {r.chambres_ids ? (
                 parseRoomDetails(r.chambres_ids).map(item => {
                   const c = chambres.find(ch => ch.id_chambre === item.id)
                   return (
                    <Badge key={item.id} variant="secondary" className=" border-primary text-primary cursor-help" title={item.fin ? `Fin: ${new Date(item.fin).toLocaleDateString()}` : ""}>
                     Ch. {c?.numero || item.id} {item.nuits > 0 ? `(${item.nuits}n)` : ""}
                    </Badge>
                   )
                  })
                ) : (
                 <Badge variant="secondary" className="">
                  {categories.find(c => c.id_categorie === r.id_categorie)?.libelle || "Type inconnu"}
                 </Badge>
                )}
               </div>
              </td>
              <td className="px-4 py-3 text-sm">
               <div>{formatDate(r.date_debut)}</div>
               <div className="text-muted-foreground">→ {formatDate(r.date_fin)}</div>
              </td>
              <td className="px-4 py-3"><StatusBadge statut={r.statut} /></td>
              <td className="px-4 py-3 text-right">
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                 </Button>
                </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-48">
                  <div className="text-[9px] font-bold px-2 py-1.5 uppercase text-muted-foreground bg-muted/50">Actions</div>
                  <DropdownMenuItem onClick={() => setViewingId(r.id_reservation)}>
                   Voir les détails
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEdit(r.id_reservation)}>
                   Modifier
                  </DropdownMenuItem>

                  <div className="text-[9px] font-bold px-2 py-1.5 uppercase text-muted-foreground bg-muted/50 border-t">Changer le statut</div>
                  {r.statut === "EN_ATTENTE" && (
                    <DropdownMenuItem onClick={() => updateStatus(r.id_reservation, "CONFIRMEE")} className="text-emerald-600 focus:text-emerald-600">
                     Confirmer la réservation
                    </DropdownMenuItem>
                  )}
                  {(r.statut === "EN_ATTENTE" || r.statut === "CONFIRMEE") && (
                    <DropdownMenuItem onClick={() => updateStatus(r.id_reservation, "ANNULEE")} className="text-rose-600 focus:text-rose-600">
                     Annuler la réservation
                    </DropdownMenuItem>
                  )}
                  {r.statut === "CONFIRMEE" && (
                    <DropdownMenuItem onClick={() => updateStatus(r.id_reservation, "TERMINEE")} className="text-blue-600 focus:text-blue-600">
                     Marquer comme terminée
                    </DropdownMenuItem>
                  )}

                  <div className="border-t mt-1" />
                  <DropdownMenuItem 
                   className="text-destructive focus:text-destructive" 
                   onClick={() => openDeleteConfirm(r.id_reservation)}
                  >
                   Supprimer définitivement
                  </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
              </td>
             </tr>
            ))}
            {paginatedList.length === 0 && (
             <tr>
              <td colSpan={5} className="text-center py-12 text-muted-foreground">
               Aucune réservation trouvée
              </td>
             </tr>
            )}
           </tbody>
          </table>
         </div>
        )}
        {displayed.length > 0 && (
         <div className="flex items-center justify-between border-t p-4 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
           <span>Afficher</span>
           <select 
            className="bg-transparent border rounded p-1"
            value={pageSizeList}
            onChange={(e) => setPageSizeList(Number(e.target.value))}
           >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
           </select>
           <span>sur {displayed.length}</span>
          </div>
          <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={() => setCurrentPageList(p => Math.max(1, p - 1))} disabled={currentPageList === 1}>
            Précédent
           </Button>
           <span className="text-sm">Page {currentPageList} sur {totalPagesList}</span>
           <Button variant="outline" size="sm" onClick={() => setCurrentPageList(p => Math.min(totalPagesList, p + 1))} disabled={currentPageList === totalPagesList}>
            Suivant
           </Button>
          </div>
         </div>
        )}
       </CardContent>
      </Card>
      </div>
     )}
    </TabsContent>
   </div>
  </Tabs>

   <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
    <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
     <DialogHeader>
      <DialogTitle>{editing ? "Modifier la réservation" : "Nouvelle réservation"}</DialogTitle>
      <DialogDescription className="sr-only">
       Formulaire de création et modification de réservation.
      </DialogDescription>
     </DialogHeader>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
      {/* Colonne Gauche: Client et Chambres */}
      <div className="space-y-4">
       <div className="space-y-2">
        <label className="text-sm font-medium">Client *</label>
        <ClientSelector
         clients={clients.filter(c => {
          if (editing && c.id_client === selectedClientId) return true;
          const hasActiveRes = reservations.some(r => r.id_client === c.id_client && (r.statut === "EN_ATTENTE" || r.statut === "CONFIRMEE"));
          return !hasActiveRes;
         })}
         selectedId={selectedClientId || null}
         onSelect={(id) => setSelectedClientId(id)}
         onCreateNew={handleCreateClientAndGetId}
         disabled={isSaving}
        />
       </div>

       <div className="space-y-2">
        <label className="text-sm font-medium">Chambres (sélection multiple) *</label>
        <div className="flex gap-2">
         <select
          className="flex h-10 w-full border border-input bg-background px-3 py-2 text-sm"
          value={chambreToAdd}
          onChange={(e) => setChambreToAdd(Number(e.target.value))}
          disabled={isSaving}
         >
          <option value={0} disabled>Sélectionner...</option>
          {chambres.map(c => {
           if (selectedChambres.includes(c.id_chambre)) return null

           const status = getRoomStatus(c.id_chambre);
           if (!status.available) return null;

           const cat = categories.find(cat => cat.id_categorie === c.id_categorie)
           const nextResNote = status.nextReservation
            ? ` (Réservée le ${status.nextReservation.toLocaleDateString()})`
            : "";

           return (
            <option key={c.id_chambre} value={c.id_chambre}>
             Ch. {c.numero} - {cat?.libelle || ""}{nextResNote}
            </option>
           )
          })}
         </select>
         <Button
          type="button"
          variant="secondary"
          className=" px-3"
          disabled={isSaving || chambreToAdd === 0}
          onClick={() => {
           if (chambreToAdd > 0 && !selectedChambres.includes(chambreToAdd)) {
            setSelectedChambres(prev => [...prev, chambreToAdd])
            setChambreToAdd(0)
           }
          }}
         >
          Ajouter
         </Button>
        </div>

        {selectedChambres.length > 0 && (
         <div className="space-y-3 border border-input p-3 bg-muted/5">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Configuration des chambres</p>
          {selectedChambres.map(id => {
           const c = chambres.find(x => x.id_chambre === id)
           return (
            <div key={id} className="flex items-center justify-between gap-3 bg-card p-2 border shadow-sm">
             <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary text-primary font-bold">Ch. {c?.numero}</Badge>
             </div>
             <div className="flex items-center gap-2">
              <button type="button" className="text-destructive hover:scale-110 transition-transform px-1" onClick={() => {
                setSelectedChambres(p => p.filter(x => x !== id))
              }}>×</button>
             </div>
            </div>
           )
          })}
         </div>
        )}
       </div>

       <div className="space-y-2">
        <label className="text-sm font-medium">Statut *</label>
        <select
         value={statut}
         onChange={e => setStatut(e.target.value)}
         className="w-full flex h-10 border border-input bg-background px-3 py-2 text-sm"
         disabled={isSaving}
        >
         {statutsList.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
       </div>
      </div>

      {/* Colonne Droite: Dates, Paiement et Résumé */}
      <div className="space-y-4">
       <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
         <label className="text-sm font-medium">Date de début *</label>
         <Input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} className="" disabled={isSaving} />
        </div>
        <div className="space-y-2">
         <label className="text-sm font-medium">Date de fin *</label>
         <Input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} className="" disabled={isSaving} />
        </div>
       </div>

       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
         <label className="text-sm font-medium">Remise ({getCurrencySymbol()})</label>
         <Input 
          type="number" 
          value={remise} 
          onChange={e => setRemise(e.target.value)} 
          className="font-bold text-rose-600 h-10 border-rose-200 focus-visible:ring-rose-500" 
          placeholder="0"
         />
        </div>
        <div className="space-y-2">
         <label className="text-sm font-medium">Avance / Versement ({getCurrencySymbol()})</label>
         <Input 
          type="number" 
          value={avance} 
          onChange={e => setAvance(e.target.value)} 
          className="font-bold text-emerald-600 h-10 border-emerald-200 focus-visible:ring-emerald-500" 
          placeholder="0"
         />
        </div>
       </div>

       <div className="bg-muted/30 p-4 border rounded-lg space-y-3">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold text-muted-foreground">
            <span>Détails financiers</span>
            <span>Total Brut: {totalPrix.toLocaleString()} {getCurrencySymbol()}</span>
          </div>
          
          <div className="space-y-1">
            {parseFloat(remise) > 0 && (
              <div className="flex justify-between text-sm text-rose-600">
                <span className="flex items-center gap-1">Remise:</span>
                <span className="font-bold">- {parseFloat(remise).toLocaleString()} {getCurrencySymbol()}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-dashed pt-1 text-base font-black">
              <span>NET À PAYER:</span>
              <span className="text-primary">{netToPay.toLocaleString()} {getCurrencySymbol()}</span>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center p-2 bg-emerald-500 text-white rounded shadow-sm">
            <div className="text-[10px] uppercase font-bold opacity-90">Reste à payer</div>
            <div className="text-2xl font-black">{remainingToPay.toLocaleString()} {getCurrencySymbol()}</div>
          </div>
       </div>

       <div className="space-y-2">
        <label className="text-sm font-medium">Mode de Paiement</label>
        <PaymentSelector value={paiement} onChange={v => setPaiement(v)} disabled={isSaving} />
       </div>



      </div>
     </div>

     {formError && <Alert variant="destructive" className=""><AlertDescription>{formError}</AlertDescription></Alert>}

     <div className="flex gap-2 pt-4 border-t mt-2">
      <Button variant="outline" className="flex-1 " onClick={() => setIsFormOpen(false)}>Annuler</Button>
      <Button className="flex-1 shadow-lg" disabled={isSaving || !selectedClientId || selectedChambres.length === 0 || !dateDebut || !dateFin} onClick={async () => {
       setIsSaving(true)
       setFormError(null)
       try {
        const checkIn = new Date(dateDebut)
        const checkOut = new Date(dateFin)
        
        if (checkOut <= checkIn) {
          throw new Error("La date de fin doit être postérieure à la date de début.");
        }

        const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
        const totalNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const roomDetails = selectedChambres.map(id => {
          return { id, nuits: totalNights, fin: dateFin };
        });

        for (const item of roomDetails) {
         const chambreId = item.id;
         // Check other reservations
         const overlap = reservations.find(r => {
          if (r.id_reservation === editingId) return false
          if (r.statut === "ANNULEE") return false
          const rRooms = parseRoomDetails(r.chambres_ids);
          if (!rRooms.some(rr => rr.id === chambreId)) return false
          
          const rStart = new Date(r.date_debut)
          const rEnd = r.date_fin ? new Date(r.date_fin) : new Date(rStart.getTime() + 24 * 60 * 60 * 1000)
          
          return (checkIn < rEnd && checkOut > rStart)
         })

         if (overlap) {
          const c = chambres.find(ch => ch.id_chambre === chambreId)
          throw new Error(`La chambre ${c?.numero} est déjà réservée pour cette période.`)
         }
        }

        const firstChambreId = selectedChambres[0];
        const firstChambre = chambres.find(c => c.id_chambre === firstChambreId);
        const id_categorie = firstChambre?.id_categorie || 1;

        await createOrUpdateReservation({
         id_reservation: editing?.id_reservation,
         id_client: selectedClientId,
         id_categorie: editing ? (firstChambre?.id_categorie || editing.id_categorie) : id_categorie,
         date_debut: checkIn.toISOString(),
         date_fin: checkOut.toISOString(),
         nombre_nuite: totalNights,
         paiement: paiement || null,
         statut,
         chambres_ids: JSON.stringify(roomDetails),
         montant_total: totalPrix,
         avance: parseFloat(avance || "0"),
         remise: parseFloat(remise || "0")
        })

         await logAction(user?.id_utilisateur || null, editing ? "MISE_A_JOUR_RESERVATION" : "CREATION_RESERVATION", {
           client: getClientName(selectedClientId),
           date_debut: dateDebut,
           total: totalPrix,
           statut
         });

        toast.success("Enregistrement réussi")
        setIsFormOpen(false)
       } catch (e) {
        toast.error("Erreur lors de l'enregistrement")
        setFormError(e instanceof Error ? e.message : "Erreur inconnue")
       } finally {
        setIsSaving(false)
       }
      }}>
       {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
      </Button>
     </div>
    </DialogContent>
   </Dialog>

    {/* Detail Sidebar (Dialog) */}
    <Dialog open={!!viewingId} onOpenChange={(open) => !open && setViewingId(null)}>
     <DialogContent className="!left-auto !right-0 !top-0 !translate-x-0 !translate-y-0 fixed inset-y-0 w-[450px] h-full sm:!max-w-none rounded-none border-l shadow-2xl overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right duration-300 z-[100]">
      <DialogHeader className="border-b pb-4 mb-4">
       <DialogTitle className="text-xl font-bold text-primary">Détails de la réservation</DialogTitle>
       <DialogDescription className="sr-only">Affichage détaillé des informations de la réservation sélectionnée.</DialogDescription>
      </DialogHeader>
      {selectedReservation && (
       <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
         <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border">
          <span className="text-sm font-medium text-muted-foreground">Client:</span>
          <span className="font-bold text-lg">{getClientName(selectedReservation.id_client)}</span>
         </div>
         
         <div className="space-y-3">
          <div className="flex justify-between items-center text-sm border-b pb-2">
           <span className="text-muted-foreground">Date de début:</span>
           <span className="font-semibold">{formatDate(selectedReservation.date_debut)}</span>
          </div>
          <div className="flex justify-between items-center text-sm border-b pb-2">
           <span className="text-muted-foreground">Date de fin prévue:</span>
           <span className="font-semibold">{formatDate(selectedReservation.date_fin)}</span>
          </div>
         </div>
        </div>
        
        <div className="space-y-2">
         <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chambres et Échéances</h4>
         <div className="space-y-2">
          {parseRoomDetails(selectedReservation.chambres_ids).map((item, idx) => {
            const c = chambres.find(ch => ch.id_chambre === item.id);
            return (
             <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded border">
              <div className="flex flex-col">
               <span className="font-bold">Chambre {c?.numero || item.id}</span>
               <span className="text-[10px] text-muted-foreground">{categories.find(cat => cat.id_categorie === c?.id_categorie)?.libelle}</span>
              </div>
              <div className="text-right">
               <div className="text-xs font-bold text-primary">{item.nuits} nuit(s)</div>
               <div className="text-[10px] text-muted-foreground italic">Termine le {item.fin ? new Date(item.fin).toLocaleDateString() : 'N/A'}</div>
              </div>
             </div>
            );
          })}
         </div>
        </div>
 
        <div className="pt-4 mt-auto space-y-3">
         <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg border border-dashed">
          <div className="flex justify-between items-center">
           <span className="text-muted-foreground">Total Brut:</span>
           <span className="font-bold">{(selectedReservation.montant_total || 0).toLocaleString()} {getCurrencySymbol()}</span>
          </div>
          {(selectedReservation.remise || 0) > 0 && (
            <div className="flex justify-between items-center text-rose-600">
             <span className="font-medium">Remise:</span>
             <span className="font-bold">- {(selectedReservation.remise || 0).toLocaleString()} {getCurrencySymbol()}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-primary font-medium border-t pt-1">
           <span>Avance déjà payée:</span>
           <span>- {(selectedReservation.avance || 0).toLocaleString()} {getCurrencySymbol()}</span>
          </div>
         </div>
         <div className="flex justify-between items-center bg-primary text-primary-foreground p-4 rounded-xl shadow-lg">
          <span className="text-sm font-bold uppercase tracking-wider">Reste à payer:</span>
          <span className="text-2xl font-black">{(Math.max(0, (selectedReservation.montant_total || 0) - (selectedReservation.remise || 0) - (selectedReservation.avance || 0))).toLocaleString()} {getCurrencySymbol()}</span>
         </div>
        </div>
       </div>
      )}
     </DialogContent>
    </Dialog>

   {/* Delete Confirmation */}
   <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
    <DialogContent className="sm:max-w-md ">
     <DialogHeader>
      <DialogTitle>Confirmer suppression</DialogTitle>
      <DialogDescription>
       Voulez-vous vraiment supprimer cette réservation ? Cette action est irréversible.
      </DialogDescription>
     </DialogHeader>
     <div className="flex justify-end gap-2 pt-4">
      <Button variant="outline" className="" onClick={() => setDeleteConfirmOpen(false)}>Annuler</Button>
      <Button variant="destructive" className=" shadow-lg" onClick={handleDelete} disabled={isDeleting}>
       {isDeleting ? <Loader2 className="size-4 animate-spin" /> : "Supprimer"}
      </Button>
     </div>
    </DialogContent>
   </Dialog>
  </div>
 )
}



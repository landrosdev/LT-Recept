import { useMemo, useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { useSejours } from "@/components/sejour/useSejours"
import { useReservations } from "@/components/reservation/useReservations"
import { SejourStatusBadge } from "@/components/sejour/SejourStatusBadge"
import { ClientSelector } from "@/components/reservation/ClientSelector"
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
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
 Loader2,
 Plus,
 Search,
 DoorOpen,
 History as HistoryIcon,
 CalendarCheck,
 BedDouble,
} from "lucide-react"
import { getCurrencySymbol } from "@/utils/currency"

import { listClients, createClient, type Client } from "@/services/Client_service"
import { listChambres, type Chambre } from "@/services/Chambre_service"
import { listReservations, type Reservation } from "@/services/Reservation_service"
import { listFactures, type Facture } from "@/services/Facture_service"
import { listCategories, type CategorieChambre } from "@/services/CategorieChambre_service"
import { listTarifs, type Tarif } from "@/services/Tarif_service"
import { logAction } from "@/services/Audit_service"
import { useAuth } from "@/hooks/useAuth"

const statutsList = [
 { value: "EN_SEJOUR", label: "En séjour" },
 { value: "TERMINE", label: "Terminé" },
 { value: "ANNULE", label: "Annulé" },
]

export default function ArriveeDepartPage() {
 const { user } = useAuth()
 const { isLoading: sejoursLoading, sejours, createOrUpdateSejour } = useSejours()
 const { updateStatus: updateResStatus } = useReservations()
 const navigate = useNavigate()

 const [clients, setClients] = useState<Client[]>([])
 const [chambres, setChambres] = useState<Chambre[]>([])
 const [reservations, setReservations] = useState<Reservation[]>([])
 const [factures, setFactures] = useState<Facture[]>([])
 const [categories, setCategories] = useState<CategorieChambre[]>([])
 const [tarifs, setTarifs] = useState<Tarif[]>([])
 const [dataLoading, setDataLoading] = useState(true)

 const loadData = useCallback(async () => {
  try {
   console.log("Loading ArriveeDepart data...")
   const [c, ch, r, f, cats, t] = await Promise.all([
    listClients().catch(e => { console.error("Clients load fail", e); return [] }),
    listChambres().catch(e => { console.error("Chambres load fail", e); return [] }),
    listReservations().catch(e => { console.error("Reservations load fail", e); return [] }),
    listFactures().catch(e => { console.error("Factures load fail", e); return [] }),
    listCategories().catch(e => { console.error("Categories load fail", e); return [] }),
    listTarifs().catch(e => { console.error("Tarifs load fail", e); return [] }),
   ])
   console.log("Loaded:", { clients: c.length, chambres: ch.length, reservations: r.length })
   setClients(c)
   setChambres(ch)
   setReservations(r)
   setFactures(f)
   setCategories(cats)
   setTarifs(t)
  } catch (e) {
   console.error("Critical load error", e)
  } finally {
   setDataLoading(false)
  }
 }, [])

 useEffect(() => {
  loadData()
 }, [loadData])

 const [searchQuery, setSearchQuery] = useState("")
 const [activeTab, setActiveTab] = useState("current")

 // Form States
 const [isDirectFormOpen, setIsDirectFormOpen] = useState(false)
 const [isResaModalOpen, setIsResaModalOpen] = useState(false)
 const [editingId, setEditingId] = useState<number | null>(null)
 const [avance, setAvance] = useState<string>("0")
 const [remise, setRemise] = useState<string>("0")
 const [roomNights, setRoomNights] = useState<Record<number, number>>({})

 const [selectedClientId, setSelectedClientId] = useState<number>(0)
 const [selectedChambres, setSelectedChambres] = useState<number[]>([])
 const [chambreToAdd, setChambreToAdd] = useState<number>(0)
 const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0])
 const [dateFin, setDateFin] = useState("")

 // Pagination State
 const [currentPage, setCurrentPage] = useState(1)
 const [pageSize, setPageSize] = useState(10)

 const [paiement, setPaiement] = useState("")
 const [statut, setStatut] = useState("EN_SEJOUR")
 const [remarques, setRemarques] = useState("")
 const [isSaving, setIsSaving] = useState(false)
 const [formError, setFormError] = useState<string | null>(null)
 const [viewingId, setViewingId] = useState<number | null>(null)

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
     return (chambresIds || "").split(",").filter(Boolean).map(id => ({ id: Number(id), nuits: 0, fin: "" }));
   }
   return [];
 };

 const selectedSejour = useMemo(() => 
   sejours.find(s => s.id_sejour === viewingId),
   [sejours, viewingId]
 );

 // Lists filters
 const filteredSejours = useMemo(() => {
  return sejours.filter((s) => {
   if (activeTab === "current") {
    if (s.statut !== "EN_SEJOUR") return false
   } else {
    if (s.statut === "EN_SEJOUR") return false
   }

   if (searchQuery) {
    const c = clients.find(x => x.id_client === s.id_client)
    const clientName = c ? `${c.prenom || ""} ${c.nom || ""}`.toLowerCase() : ""
    const roomMatch = parseRoomDetails(s.chambres_ids).some(item => chambres.find(ch => ch.id_chambre === item.id)?.numero?.toString().includes(searchQuery));
    if (!clientName.includes(searchQuery.toLowerCase()) && !roomMatch) return false
   }
   return true
  }).sort((a, b) => b.id_sejour - a.id_sejour)
 }, [sejours, activeTab, searchQuery, clients, chambres])

 const totalPages = Math.ceil(filteredSejours.length / pageSize)
 const displayedSejours = useMemo(() => {
   const start = (currentPage - 1) * pageSize
   return filteredSejours.slice(start, start + pageSize)
 }, [filteredSejours, currentPage, pageSize])

 useEffect(() => {
   setCurrentPage(1)
 }, [activeTab, searchQuery, pageSize])

  const activeReservations = useMemo(() => {
    const clientsInSejourIds = sejours
      .filter(s => s.statut === "EN_SEJOUR")
      .map(s => s.id_client)

    return reservations.filter(r => 
      (r.statut === "EN_ATTENTE" || r.statut === "CONFIRMEE") &&
      !clientsInSejourIds.includes(r.id_client)
    )
  }, [reservations, sejours])

  const visualRooms = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return chambres.map((ch) => {
      const activeSejour = sejours.find(s =>
        s.statut === "EN_SEJOUR" && parseRoomDetails(s.chambres_ids).some((r: any) => r.id === ch.id_chambre)
      );

      if (activeSejour) {
        const client = clients.find(c => c.id_client === activeSejour.id_client);
        const roomDetail = parseRoomDetails(activeSejour.chambres_ids).find((r: any) => r.id === ch.id_chambre);
        return {
          chambre: ch,
          status: 'OCCUPEE' as const,
          client: client ? `${client.prenom || ""} ${client.nom || ""}` : "Client inconnu",
          nuits: roomDetail?.nuits || activeSejour.nombre_nuite,
          debut: activeSejour.date_debut,
          fin: roomDetail?.fin || activeSejour.date_fin
        };
      }

      const activeReservation = reservations.find(r => {
        if (r.statut === "ANNULEE" || r.statut === "TERMINEE") return false;
        const roomDetail = parseRoomDetails(r.chambres_ids).find((rr: any) => rr.id === ch.id_chambre);
        if (!roomDetail) return false;
        const rStart = new Date(r.date_debut);
        rStart.setHours(0, 0, 0, 0);
        const rEnd = r.date_fin ? new Date(r.date_fin) : new Date(rStart.getTime() + (roomDetail.nuits || r.nombre_nuite) * 24 * 3600 * 1000);
        rEnd.setHours(0, 0, 0, 0);
        return rEnd > today;
      });

      if (activeReservation) {
        const client = clients.find(c => c.id_client === activeReservation.id_client);
        const roomDetail = parseRoomDetails(activeReservation.chambres_ids).find((r: any) => r.id === ch.id_chambre);
        return {
          chambre: ch,
          status: 'RESERVEE' as const,
          client: client ? `${client.prenom || ""} ${client.nom || ""}` : "Client inconnu",
          nuits: roomDetail?.nuits || activeReservation.nombre_nuite,
          debut: activeReservation.date_debut,
          fin: roomDetail?.fin || activeReservation.date_fin
        };
      }

      return {
        chambre: ch,
        status: 'DISPONIBLE' as const
      };
    }).sort((a: any, b: any) => {
      const statusOrder: any = { 'DISPONIBLE': 1, 'RESERVEE': 2, 'OCCUPEE': 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
      return (parseInt(a.chambre.numero) || 0) - (parseInt(b.chambre.numero) || 0);
    });
  }, [chambres, sejours, clients, reservations])

 const availableChambres = useMemo(() => {
   const occupiedRoomIds = sejours
     .filter(s => s.statut === "EN_SEJOUR" && s.id_sejour !== editingId)
     .flatMap(s => parseRoomDetails(s.chambres_ids).map(item => item.id))
   
   return chambres.filter(c => !occupiedRoomIds.includes(c.id_chambre))
 }, [chambres, sejours, editingId])

 const availableClients = useMemo(() => {
   const clientsInSejourIds = sejours
     .filter(s => s.statut === "EN_SEJOUR" && s.id_sejour !== editingId)
     .map(s => s.id_client)

   const clientsWithResaIds = reservations
     .filter(r => r.statut === "EN_ATTENTE" || r.statut === "CONFIRMEE")
     .map(r => r.id_client)
   
   return clients.filter(c => 
     (!clientsInSejourIds.includes(c.id_client) && !clientsWithResaIds.includes(c.id_client)) 
     || selectedClientId === c.id_client
   )
 }, [clients, sejours, reservations, editingId, selectedClientId])

 // Utilities
 function getClientName(id_client: number): string {
  const c = clients.find(x => x.id_client === id_client)
  if (!c) return "Inconnu"
  return `${c.prenom || ""} ${c.nom || ""}`.trim() || `Client #${id_client}`
 }

 function getChambreLabels(idsStr: string): { numero: string, id: number, nuits: number, fin: string }[] {
  return parseRoomDetails(idsStr).map(item => {
   const c = chambres.find(x => x.id_chambre === item.id)
   return { numero: c ? c.numero : item.id.toString(), id: item.id, nuits: item.nuits, fin: item.fin }
  })
 }

 function getFactureForSejour(s: any) {
  if (s.id_reservation) {
   return factures.find(f => f.id_reservation === s.id_reservation)
  }
  return factures.find(f => 
   f.id_client === s.id_client && 
   !f.id_reservation &&
   f.date_facture.startsWith(s.date_debut.split('T')[0])
  )
 }

 // Forms
 function openDirectForm() {
  setEditingId(null)
  setSelectedClientId(0)
  setSelectedChambres([])
  setChambreToAdd(0)
  setDateDebut(new Date().toISOString().split("T")[0])
  setDateFin("")
  setStatut("EN_SEJOUR")
  setPaiement("ESPECES")
  setRemarques("")
  setAvance("0")
  setRemise("0")
  setRoomNights({})
  setFormError(null)
  setIsDirectFormOpen(true)
 }

 function openEditForm(id: number) {
  const s = sejours.find(x => x.id_sejour === id)
  if (!s) return
  setEditingId(id)
  setSelectedClientId(s.id_client)
  const parsedRooms = parseRoomDetails(s.chambres_ids)
  const ids = parsedRooms.map(rr => rr.id)
  setSelectedChambres(ids)
  setChambreToAdd(0)
  setDateDebut(s.date_debut.split("T")[0])
  setDateFin(s.date_fin ? s.date_fin.split("T")[0] : "")
  setStatut(s.statut)
  setPaiement(s.paiement || "ESPECES")
  setRemarques(s.remarques || "")
  setAvance((s.avance || 0).toString())
  setRemise((s.remise || 0).toString())

  const initialNights: Record<number, number> = {}
  parsedRooms.forEach(item => {
    initialNights[item.id] = item.nuits
  })
  setRoomNights(initialNights)

  setFormError(null)
  setIsDirectFormOpen(true)
 }

 function handleSejourParReservation() {
  if (activeReservations.length === 0) {
   toast.info("Aucune réservation active. Redirection vers les réservations.")
   navigate("/reservations")
  } else {
   setIsResaModalOpen(true)
  }
 }

  async function handleStartSejourFromResa(r: Reservation) {
   setIsSaving(true)
   try {
    await createOrUpdateSejour({
     id_client: r.id_client,
     id_reservation: r.id_reservation,
     chambres_ids: r.chambres_ids || "",
     id_categorie: r.id_categorie,
     date_debut: (new Date()).toISOString(),
     date_fin: r.date_fin,
     nombre_nuite: r.nombre_nuite,
     paiement: r.paiement || "ESPECES",
     statut: "EN_SEJOUR",
     remarques: `Séjour démarré depuis la réservation #${r.id_reservation}`,
     avance: r.avance || 0,
     montant_total: r.montant_total,
     remise: r.remise || 0
    })

    await logAction(user?.id_utilisateur || null, "ARRIVEE_CLIENT", {
      client: getClientName(r.id_client),
      chambres: r.chambres_ids,
      id_reservation: r.id_reservation
    });

    await updateResStatus(r.id_reservation, "CONFIRMEE")

    toast.success("Séjour démarré et réservation confirmée")
    setIsResaModalOpen(false)
    loadData()
   } catch (e) {
    toast.error("Erreur lors du démarrage du séjour")
   } finally {
    setIsSaving(false)
   }
  }

  async function handleSaveDirectForm() {
   setIsSaving(true)
   setFormError(null)
   try {
    const firstChambre = chambres.find(c => c.id_chambre === selectedChambres[0])
    const idCat = firstChambre?.id_categorie || 1
    const totalNights = Object.values(roomNights).reduce((a, b) => a + b, 0) || 1
    const montantTotal = totalToPay
    
    const checkIn = new Date(dateDebut)
    const roomDetails = selectedChambres.map(id => {
      const n = roomNights[id] || 1;
      const dFin = new Date(checkIn.getTime() + n * 24 * 3600 * 1000);
      return { id, nuits: n, fin: dFin.toISOString().split('T')[0] };
    });

    await createOrUpdateSejour({
     id_sejour: editingId || undefined,
     id_client: selectedClientId,
     id_reservation: null,
     chambres_ids: JSON.stringify(roomDetails),
     id_categorie: idCat,
     date_debut: checkIn.toISOString(),
     date_fin: dateFin ? (new Date(dateFin)).toISOString() : null,
     nombre_nuite: totalNights,
     paiement,
     statut,
     remarques,
     avance: parseFloat(avance) || 0,
     montant_total: montantTotal,
     remise: parseFloat(remise) || 0
    })

    await logAction(user?.id_utilisateur || null, editingId ? "MODIFICATION_SEJOUR" : "CREATION_SEJOUR_DIRECT", {
      client: getClientName(selectedClientId),
      chambres: JSON.stringify(roomDetails),
      total: montantTotal
    });

    toast.success("Séjour enregistré")
    setIsDirectFormOpen(false)
    loadData()
   } catch(e) {
    setFormError(e instanceof Error ? e.message : "Erreur")
    toast.error("Erreur")
   } finally {
    setIsSaving(false)
   }
  }

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

  const currentPricePerNight = useMemo(() => {
    if (selectedChambres.length === 0) return 0
    const ch = chambres.find(c => c.id_chambre === selectedChambres[0])
    if (!ch) return 0
    const cat = categories.find(c => c.id_categorie === ch.id_categorie)
    if (!cat) return 0
    
    const catLib = normalize(cat.libelle);
    const t = tarifs.find(t => 
      t.type_tarif === "CHAMBRE" && 
      normalize(t.nom) === catLib
    )
    return t?.montant || 0
  }, [selectedChambres, chambres, categories, tarifs])

  const totalToPay = useMemo(() => {
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
  }, [selectedChambres, dateDebut, dateFin, chambres, categories, tarifs, roomNights])

  const netToPay = useMemo(() => {
    return Math.max(0, totalToPay - (parseFloat(remise) || 0))
  }, [totalToPay, remise])

  const remainingToPay = useMemo(() => {
    return Math.max(0, netToPay - (parseFloat(avance) || 0))
  }, [netToPay, avance])

 async function handleFinishSejour(id: number) {
  const s = sejours.find(x => x.id_sejour === id)
  if (!s) return
  try {
   await createOrUpdateSejour({
    ...s,
    statut: "TERMINE"
   })

   await logAction(user?.id_utilisateur || null, "DEPART_CLIENT", {
     id_sejour: s.id_sejour,
     client: getClientName(s.id_client)
   });

   toast.success("Séjour terminé et facturé")
   loadData()
  } catch(e) {
   toast.error("Erreur de clôture")
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

 return (
  <div className="space-y-6 page-enter">
   <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
     <div className="flex h-10 w-10 items-center justify-center bg-primary/10 text-primary">
      <DoorOpen className="size-5" />
     </div>
     <div>
      <h1 className="text-2xl font-bold tracking-tight">Arrivées / Départs</h1>
      <p className="text-sm text-muted-foreground font-medium">Gestion des séjours</p>
     </div>
    </div>
    <div className="flex gap-2">
     <Button onClick={openDirectForm} variant="outline" className="gap-2 shadow-sm">
      <Plus className="size-4" /> Séjour Direct
     </Button>
     <Button onClick={handleSejourParReservation} className="gap-2 shadow-sm">
      <CalendarCheck className="size-4" /> Séjour par Réservation
     </Button>
    </div>
   </div>

   <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab} className="w-full">
    <div className="flex items-center justify-between mb-4">
     <TabsList className="bg-muted/50 p-1">
      <TabsTrigger value="current" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
       <DoorOpen className="size-4" /> Séjours en cours
      </TabsTrigger>
      <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
       <HistoryIcon className="size-4" /> Historique
      </TabsTrigger>
     </TabsList>
     <div className="relative">
      <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
      <Input
       placeholder="Rechercher..."
       value={searchQuery}
       onChange={(e) => setSearchQuery(e.target.value)}
       className="w-64 pl-9"
      />
     </div>
    </div>

    {/* État des chambres */}
    <Card className="border shadow-sm">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <BedDouble className="size-4 text-primary" />
          <CardTitle className="text-sm font-bold">État des chambres</CardTitle>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" />
            {visualRooms.filter((r: any) => r.status === 'DISPONIBLE').length} Libres
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-amber-500" />
            {visualRooms.filter((r: any) => r.status === 'OCCUPEE').length} Occupées
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-primary" />
            {visualRooms.length} Total
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-2">
          {visualRooms.map((r: any, idx: number) => {
            const cat = categories.find((c: any) => c.id_categorie === r.chambre.id_categorie);
            const catLabel = cat?.libelle?.toUpperCase() || '';
            if (r.status === 'OCCUPEE') {
              return (
                <div key={idx} className="flex items-center gap-2 rounded-md border border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-3 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 shadow-sm">
                  <BedDouble className="size-3.5" />
                  <span className="font-bold">{r.chambre.numero}</span>
                  <span className="text-[10px] font-medium opacity-70">({catLabel})</span>
                  <span className="text-[10px]">- {r.client}</span>
                </div>
              );
            }
            if (r.status === 'RESERVEE') {
              return (
                <div key={idx} className="flex items-center gap-2 rounded-md border border-blue-400 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-700 px-3 py-1.5 text-xs font-semibold text-blue-800 dark:text-blue-300 shadow-sm">
                  <BedDouble className="size-3.5" />
                  <span className="font-bold">{r.chambre.numero}</span>
                  <span className="text-[10px] font-medium opacity-70">({catLabel})</span>
                  <span className="text-[10px]">- {r.client}</span>
                </div>
              );
            }
            return (
              <div key={idx} className="flex items-center gap-2 rounded-md border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-700 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-sm">
                <BedDouble className="size-3.5" />
                <span className="font-bold">{r.chambre.numero}</span>
                <span className="text-[10px] font-medium opacity-70">({catLabel})</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>

    <TabsContent value={activeTab}>
     <Card className="overflow-hidden border shadow-sm">
      <CardHeader className="py-3 bg-muted/30 border-b flex flex-row items-center justify-between">
       <CardTitle className="text-base font-semibold">
        {activeTab === "current" ? "Séjours actifs" : "Historique"}
       </CardTitle>
       <Badge variant="secondary" className="font-mono">{filteredSejours.length}</Badge>
      </CardHeader>
      <CardContent className="p-0">
       {sejoursLoading || dataLoading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="size-6 animate-spin text-primary" /></div>
       ) : (
        <div className="overflow-x-auto">
         <table className="w-full min-w-[900px]">
          <thead className="bg-muted text-[10px] uppercase tracking-widest font-bold">
           <tr className="border-b-2 border-primary">
            <th className="px-4 py-3 text-left">Client</th>
            <th className="px-4 py-3 text-left">Chambres</th>
            <th className="px-4 py-3 text-left">Dates</th>
            <th className="px-4 py-3 text-left">Statut</th>
            <th className="px-4 py-3 text-left">Paiement</th>
            <th className="px-4 py-3 text-right">Actions</th>
           </tr>
          </thead>
          <tbody className="divide-y">
           {displayedSejours.map(s => (
            <tr key={s.id_sejour} className="hover:bg-muted/50">
             <td className="px-4 py-3 font-medium">{getClientName(s.id_client)}</td>
             <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
               {getChambreLabels(s.chambres_ids).map(room => (
                <Badge key={room.id} variant="outline" className="border-primary text-primary cursor-help" title={room.fin ? `Fin: ${new Date(room.fin).toLocaleDateString()}` : ""}>
                 Ch. {room.numero} {room.nuits > 0 ? `(${room.nuits}n)` : ""}
                </Badge>
               ))}
              </div>
             </td>
             <td className="px-4 py-3">
              <div>{new Date(s.date_debut).toLocaleDateString()}</div>
              <div className="text-muted-foreground text-xs">{s.date_fin ? "→ " + new Date(s.date_fin).toLocaleDateString() : ""}</div>
             </td>
             <td className="px-4 py-3"><SejourStatusBadge statut={s.statut} /></td>
             <td className="px-4 py-3">
              {(() => {
               const fact = getFactureForSejour(s)
               if (!fact) return <span className="text-xs text-muted-foreground">-</span>
               if (fact.statut === "PAYE") return <Badge className="bg-emerald-500">Payé</Badge>
               if (fact.statut === "PARTIEL") return <Badge className="bg-amber-500">Partiel</Badge>
               return <Badge variant="destructive">En attente</Badge>
              })()}
             </td>
             <td className="px-4 py-3 text-right">
              <div className="flex justify-end gap-2">
               <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-primary" onClick={() => setViewingId(s.id_sejour)}>
                Détails
               </Button>
               {s.statut === "EN_SEJOUR" && (
                <>
                 <Button variant="outline" size="sm" className="h-8 border-emerald-600 text-emerald-600 font-bold text-xs" onClick={() => handleFinishSejour(s.id_sejour)}>
                  Terminer
                 </Button>
                 <Button variant="outline" size="sm" className="h-8 text-primary border-primary font-bold text-xs" onClick={() => openEditForm(s.id_sejour)}>
                  Editer
                 </Button>
                </>
               )}
              </div>
             </td>
            </tr>
           ))}
           {displayedSejours.length === 0 && (
            <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Aucun séjour</td></tr>
           )}
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
         onChange={e => setPageSize(Number(e.target.value))}
         className="h-7 border border-input bg-background text-foreground rounded px-2 text-xs"
        >
         <option value={5}>5</option>
         <option value={10}>10</option>
         <option value={20}>20</option>
        </select>
        <span>par page</span>
        <span className="ml-2 font-medium">{filteredSejours.length} résultat(s)</span>
       </div>
       <div className="flex items-center gap-2">
        <Button
         variant="outline"
         size="sm"
         className="h-7 text-xs px-3"
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
         className="h-7 text-xs px-3"
         disabled={currentPage >= totalPages}
         onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
        >
         Suivant
        </Button>
       </div>
      </div>
     </Card>
    </TabsContent>
   </Tabs>

   {/* Modal Séjour par réservation */}
   <Dialog open={isResaModalOpen} onOpenChange={setIsResaModalOpen}>
    <DialogContent className="sm:max-w-2xl">
     <DialogHeader>
      <DialogTitle>Sélectionner une réservation</DialogTitle>
      <DialogDescription>Choisissez une réservation pour démarrer le séjour.</DialogDescription>
     </DialogHeader>
     <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      {activeReservations.map(r => (
       <Card key={r.id_reservation} className="p-4 flex items-center justify-between border shadow-sm hover:border-primary transition-colors">
        <div>
         <div className="font-bold text-lg">{getClientName(r.id_client)}</div>
         <div className="text-sm text-muted-foreground">Chambres : {getChambreLabels(r.chambres_ids || "").map(c => c.numero).join(", ")}</div>
         <div className="text-sm font-medium text-primary">Avance déjà payée: {r.avance?.toLocaleString() || 0} {getCurrencySymbol()}</div>
         <div className="text-xs text-muted-foreground">Du {new Date(r.date_debut).toLocaleDateString()} au {r.date_fin ? new Date(r.date_fin).toLocaleDateString() : '...'}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
         <Button onClick={() => handleStartSejourFromResa(r)} disabled={isSaving} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          Démarrer séjour
         </Button>
        </div>
       </Card>
      ))}
     </div>
    </DialogContent>
   </Dialog>

   {/* Modal Formulaire Séjour Direct */}
   <Dialog open={isDirectFormOpen} onOpenChange={setIsDirectFormOpen}>
    <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto">
     <DialogHeader>
      <DialogTitle>{editingId ? "Modifier le séjour" : "Nouveau séjour direct"}</DialogTitle>
     </DialogHeader>
     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
      <div className="space-y-4">
       <div className="space-y-2">
        <label className="text-sm font-medium">Client *</label>
        <ClientSelector
         clients={availableClients}
         selectedId={selectedClientId || null}
         onSelect={id => setSelectedClientId(id)}
         onCreateNew={handleCreateClientAndGetId}
         disabled={isSaving}
        />
       </div>

       <div className="space-y-2">
        <label className="text-sm font-medium">Chambres *</label>
        <div className="flex gap-2">
         <select
          className="flex h-10 w-full border border-input bg-background px-3 py-2 text-sm"
          value={chambreToAdd}
          onChange={(e) => setChambreToAdd(Number(e.target.value))}
          disabled={isSaving}
         >
          <option value={0} disabled>Sélectionner...</option>
          {availableChambres.map(c => {
           const cat = categories.find(cat => cat.id_categorie === c.id_categorie)
           return (
            <option key={c.id_chambre} value={c.id_chambre} disabled={selectedChambres.includes(c.id_chambre)}>
             Ch. {c.numero} - {cat?.libelle || 'Standard'}
            </option>
           )
          })}
         </select>
         <Button type="button" variant="secondary" disabled={isSaving || chambreToAdd === 0} onClick={() => {
          if (chambreToAdd > 0 && !selectedChambres.includes(chambreToAdd)) {
           setSelectedChambres(p => [...p, chambreToAdd])
           setChambreToAdd(0)
          }
         }}>Ajouter</Button>
        </div>
        {selectedChambres.length > 0 && (
         <div className="space-y-3 border border-input p-3 bg-muted/5">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Configuration des chambres (Nuitées)</p>
          {selectedChambres.map(id => {
           const c = chambres.find(x => x.id_chambre === id)
           return (
            <div key={id} className="flex items-center justify-between gap-3 bg-card p-2 border shadow-sm">
             <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary text-primary font-bold">Ch. {c?.numero}</Badge>
             </div>
             <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold">Nuitées:</label>
              <Input 
                type="number" 
                min={1} 
                className="w-16 h-8 text-xs font-bold" 
                value={roomNights[id] || 1} 
                onChange={(e) => setRoomNights(prev => ({ ...prev, [id]: parseInt(e.target.value) || 1 }))}
              />
              <button type="button" className="text-destructive hover:scale-110 transition-transform px-1" onClick={() => {
                setSelectedChambres(p => p.filter(x => x !== id))
                setRoomNights(prev => {
                  const n = { ...prev }
                  delete n[id]
                  return n
                })
              }}>×</button>
             </div>
            </div>
           )
          })}
         </div>
        )}
       </div>

        <div className="grid grid-cols-2 gap-3">
         <div className="space-y-2">
          <label className="text-sm font-medium">Date de début *</label>
          <Input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)} disabled={isSaving} />
         </div>
         <div className="space-y-2">
          <label className="text-sm font-medium">Date fin</label>
          <Input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)} disabled={isSaving} />
         </div>
        </div>

        <div className="space-y-2">
         <label className="text-sm font-medium">Statut</label>
         <select value={statut} onChange={e => setStatut(e.target.value)} className="w-full flex h-10 border border-input bg-background px-3 py-2 text-sm" disabled={isSaving}>
          {statutsList.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
         </select>
        </div>
       </div>

      <div className="space-y-4">
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
            <span>Prix / Nuit: {currentPricePerNight.toLocaleString()} {getCurrencySymbol()}</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Brut:</span>
              <span className="font-bold">{totalToPay.toLocaleString()} {getCurrencySymbol()}</span>
            </div>
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

        <div className="space-y-2">
         <label className="text-sm font-medium">Remarques</label>
         <Textarea value={remarques} onChange={e => setRemarques(e.target.value)} disabled={isSaving} className="min-h-[100px] resize-none" placeholder="Notes ou observations particulières..." />
        </div>
      </div>
     </div>
     {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
     <div className="flex gap-2 pt-4 border-t mt-2">
      <Button variant="outline" className="flex-1" onClick={() => setIsDirectFormOpen(false)}>Annuler</Button>
      <Button className="flex-1 shadow-lg" disabled={isSaving || !selectedClientId || selectedChambres.length === 0 || !dateDebut} onClick={handleSaveDirectForm}>
       {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
      </Button>
     </div>
    </DialogContent>
   </Dialog>

   {/* Detail Sidebar (Dialog) */}
    <Dialog open={!!viewingId} onOpenChange={(open) => !open && setViewingId(null)}>
     <DialogContent className="!left-auto !right-0 !top-0 !translate-x-0 !translate-y-0 fixed inset-y-0 w-[450px] h-full sm:!max-w-none rounded-none border-l shadow-2xl overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right duration-300 z-[100]">
      <DialogHeader className="border-b pb-4 mb-4">
      <DialogTitle className="text-xl font-bold text-primary">Détails du séjour</DialogTitle>
     </DialogHeader>
     {selectedSejour && (
      <div className="space-y-6">
       <div className="grid grid-cols-1 gap-4">
        <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border">
         <span className="text-sm font-medium text-muted-foreground">Client:</span>
         <span className="font-bold text-lg">{getClientName(selectedSejour.id_client)}</span>
        </div>
        
        <div className="space-y-3">
         <div className="flex justify-between items-center text-sm border-b pb-2">
          <span className="text-muted-foreground">Date d'arrivée:</span>
          <span className="font-semibold">{new Date(selectedSejour.date_debut).toLocaleDateString()}</span>
         </div>
         <div className="flex justify-between items-center text-sm border-b pb-2">
          <span className="text-muted-foreground">Statut actuel:</span>
          <SejourStatusBadge statut={selectedSejour.statut} />
         </div>
        </div>
       </div>
       
       <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chambres et Dates de fin</h4>
        <div className="space-y-2">
         {parseRoomDetails(selectedSejour.chambres_ids).map((item, idx) => {
           const c = chambres.find(ch => ch.id_chambre === item.id);
           return (
            <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded border">
             <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[300px]">
               <tbody>
                <tr>
                 <td>
                  <span className="font-bold block">Chambre {c?.numero || item.id}</span>
                  <span className="text-[10px] text-muted-foreground">{categories.find(cat => cat.id_categorie === c?.id_categorie)?.libelle}</span>
                 </td>
                 <td className="text-right">
                  <div className="text-xs font-bold text-primary">{item.nuits} nuit(s)</div>
                  <div className="text-[10px] text-muted-foreground italic">Termine le {item.fin ? new Date(item.fin).toLocaleDateString() : 'N/A'}</div>
                 </td>
                </tr>
               </tbody>
              </table>
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
          <span className="font-bold">{(selectedSejour.montant_total || 0).toLocaleString()} {getCurrencySymbol()}</span>
         </div>
         {(selectedSejour.remise || 0) > 0 && (
           <div className="flex justify-between items-center text-rose-600">
            <span>Remise:</span>
            <span className="font-medium">- {(selectedSejour.remise || 0).toLocaleString()} {getCurrencySymbol()}</span>
           </div>
         )}
         <div className="flex justify-between items-center border-t pt-1 font-bold">
          <span>Net à payer:</span>
          <span>{(Math.max(0, (selectedSejour.montant_total || 0) - (selectedSejour.remise || 0))).toLocaleString()} {getCurrencySymbol()}</span>
         </div>
         <div className="flex justify-between items-center text-emerald-600 font-medium">
          <span>Déjà payé:</span>
          <span>{(selectedSejour.avance || 0).toLocaleString()} {getCurrencySymbol()}</span>
         </div>
        </div>
        <div className="flex justify-between items-center bg-emerald-600 text-white p-4 rounded-xl shadow-lg">
         <span className="text-sm font-bold uppercase tracking-wider">Reste à payer:</span>
         <span className="text-2xl font-black">{(Math.max(0, (selectedSejour.montant_total || 0) - (selectedSejour.remise || 0) - (selectedSejour.avance || 0))).toLocaleString()} {getCurrencySymbol()}</span>
        </div>
       </div>
      </div>
     )}
    </DialogContent>
   </Dialog>
  </div>
 )
}

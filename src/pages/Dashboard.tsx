import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  BedDouble,
  CalendarCheck,
  ClipboardList,
  DoorOpen,
  FileText,
  Home,
  Users,
  Flag,
  ChevronRight,
  Plus,
  TrendingUp,
  DollarSign,
  Activity,
  ShieldCheck,
  User,
  Clock,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { invoke } from "@tauri-apps/api/core"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === "admin"

  const [chambres, setChambres] = useState<any[]>([])
  const [sejours, setSejours] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [factures, setFactures] = useState<any[]>([])
  const [paiements, setPaiements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [ch, s, c, r, f, p] = await Promise.all([
          invoke<any[]>("list_chambres_command"),
          invoke<any[]>("list_sejours_command"),
          invoke<any[]>("list_clients_command"),
          invoke<any[]>("list_reservations_command"),
          invoke<any[]>("list_factures_command"),
          invoke<any[]>("list_all_paiements_command"),
        ])
        setChambres(ch)
        setSejours(s)
        setClients(c)
        setReservations(r)
        setFactures(f)
        setPaiements(p)
      } catch (e) {
        console.error("Erreur de chargement", e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const visualRooms = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parseRoomDetails = (ids: string | null) => {
      if (!ids) return [];
      try {
        const p = JSON.parse(ids);
        if (Array.isArray(p)) {
          if (p.length > 0 && typeof p[0] === "number") return p.map(id => ({ id }));
          return p;
        }
      } catch (e) {
        return ids.split(",").filter(Boolean).map(id => ({ id: Number(id) }));
      }
      return [];
    };

    return chambres.map((ch) => {
      const activeSejour = sejours.find(s => 
        s.statut === "EN_SEJOUR" && parseRoomDetails(s.chambres_ids).some((r: any) => r.id === ch.id_chambre)
      );
      
      if (activeSejour) {
        const client = clients.find(c => c.id_client === activeSejour.id_client);
        const roomDetail = parseRoomDetails(activeSejour.chambres_ids).find((r: any) => r.id === ch.id_chambre);
        return {
          chambre: ch,
          status: 'OCCUPEE',
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
          status: 'RESERVEE',
          client: client ? `${client.prenom || ""} ${client.nom || ""}` : "Client inconnu",
          nuits: roomDetail?.nuits || activeReservation.nombre_nuite,
          debut: activeReservation.date_debut,
          fin: roomDetail?.fin || activeReservation.date_fin
        };
      }

      return {
        chambre: ch,
        status: 'DISPONIBLE'
      };
    }).sort((a: any, b: any) => {
      const statusOrder: any = { 'DISPONIBLE': 1, 'RESERVEE': 2, 'OCCUPEE': 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
      return (parseInt(a.chambre.numero) || 0) - (parseInt(b.chambre.numero) || 0);
    });
  }, [chambres, sejours, clients, reservations])

  const stats = useMemo(() => {
    const totalRevenue = paiements.reduce((acc, p) => acc + (p.montant || 0), 0)
    const occupancyRate = chambres.length > 0 ? Math.round((visualRooms.filter((r: any) => r.status === "OCCUPEE").length / chambres.length) * 100) : 0

    return {
      available: visualRooms.filter((r: any) => r.status === "DISPONIBLE").length,
      occupied: visualRooms.filter((r: any) => r.status === "OCCUPEE").length,
      reserved: visualRooms.filter((r: any) => r.status === "RESERVEE").length,
      totalRevenue,
      occupancyRate
    }
  }, [visualRooms, factures, chambres])

  const formatMoney = (amount: number) => {
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

  const handleDetails = (roomId: number) => {
    navigate(`/arrivee-depart?roomId=${roomId}`)
  }

  if (isLoading) return <div className="flex h-screen items-center justify-center font-bold text-primary animate-pulse tracking-tight">Chargement...</div>

  const KpiCard = ({ icon: Icon, value, label, colorClass, bgClass }: any) => (
    <Card className="shadow-sm border-none bg-card">
      <CardContent className="kpi-card-content flex items-center gap-3">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", bgClass, colorClass)}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="text-base font-bold tracking-tight truncate leading-none mb-0.5">{value}</div>
          <div className="text-[10px] text-muted-foreground font-medium truncate leading-none">{label}</div>
        </div>
      </CardContent>
    </Card>
  )

  if (isAdmin) {
    return (
      <div className="mx-auto max-w-full space-y-6 page-enter pb-12">
        <div className="flex items-center justify-between border-b pb-4 px-4 bg-card/50 pt-4 rounded-xl">
          <div className="pl-2">
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              Direction & Management
            </h1>
            <p className="text-[11px] text-muted-foreground font-medium">Administration générale</p>
          </div>
          <div className="text-right pr-2">
             <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">CA (Encaissé)</div>
             <div className="text-base font-bold text-primary">{formatMoney(stats.totalRevenue)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <KpiCard icon={TrendingUp} value={`${stats.occupancyRate}%`} label="Occupation" bgClass="bg-primary/10" colorClass="text-primary" />
          <KpiCard icon={DollarSign} value={formatMoney(stats.totalRevenue)} label="Chiffre d'Affaires" bgClass="bg-emerald-50" colorClass="text-emerald-600" />
          <KpiCard icon={CalendarCheck} value={stats.reserved} label="Réservations" bgClass="bg-blue-50" colorClass="text-blue-600" />
          <KpiCard icon={BedDouble} value={stats.available} label="Libres" bgClass="bg-amber-50" colorClass="text-amber-600" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xs font-bold tracking-tight flex items-center gap-2 border-b pb-2 uppercase text-muted-foreground">
              <Activity className="size-3 text-primary" /> Activité récente
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <Card className="shadow-sm border overflow-hidden">
                  <div className="bg-muted/30 p-2 border-b text-[9px] font-bold">Dernières factures</div>
                  <CardContent className="p-0 divide-y max-h-[180px] overflow-auto">
                    {[...factures].sort((a, b) => b.id_facture - a.id_facture).slice(0, 5).map(f => (
                      <div key={f.id_facture} className="p-3 text-[10px] flex justify-between hover:bg-muted/20">
                        <div>
                          <span className="font-bold">Facture F_{f.id_facture}</span>
                          <div className="text-[9px] text-muted-foreground">{new Date(f.date_facture).toLocaleDateString()}</div>
                        </div>
                        <span className="font-bold text-emerald-700">{formatMoney(f.montant)}</span>
                      </div>
                    ))}
                  </CardContent>
               </Card>

               <Card className="shadow-sm border overflow-hidden">
                  <div className="bg-muted/30 p-2 border-b text-[9px] font-bold">Réservations récentes</div>
                  <CardContent className="p-0 divide-y max-h-[180px] overflow-auto">
                    {[...reservations].filter(r => r.statut === "CONFIRMEE").sort((a, b) => b.id_reservation - a.id_reservation).slice(0, 5).map(r => {
                      const client = clients.find(c => c.id_client === r.id_client);
                      const clientName = client ? (client.prenom ? `${client.prenom} ${client.nom}` : client.nom) : `Client #${r.id_client}`;
                      return (
                        <div key={r.id_reservation} className="p-3 text-[10px] flex justify-between hover:bg-muted/20">
                          <div>
                            <span className="font-bold">{clientName}</span>
                            <div className="text-[9px] text-muted-foreground">{new Date(r.date_debut).toLocaleDateString()}</div>
                          </div>
                          <Badge variant="outline" className="text-[8px] h-4">Confirmée</Badge>
                        </div>
                      );
                    })}
                  </CardContent>
               </Card>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xs font-bold tracking-tight border-b pb-2 uppercase text-muted-foreground">Actions rapides</h2>
            <div className="grid grid-cols-1 gap-2">
               <Button onClick={() => navigate("/chambres")} variant="outline" className="justify-between h-10 text-[11px] font-bold px-3 border-primary/50 bg-primary/5">
                  <span className="flex items-center gap-2"><BedDouble className="size-4 text-primary" /> Gestion des chambres</span>
                  <ChevronRight className="size-3 text-muted-foreground" />
               </Button>
               <Button onClick={() => navigate("/arrivee-depart")} variant="outline" className="justify-between h-10 text-[11px] font-bold px-3">
                  <span className="flex items-center gap-2"><DoorOpen className="size-4 text-primary" /> Arrivées / Départs</span>
                  <ChevronRight className="size-3 text-muted-foreground" />
               </Button>
               <Button onClick={() => navigate("/reservations")} variant="outline" className="justify-between h-10 text-[11px] font-bold px-3">
                  <span className="flex items-center gap-2"><CalendarCheck className="size-4 text-primary" /> Réservations</span>
                  <ChevronRight className="size-3 text-muted-foreground" />
               </Button>
               <Button onClick={() => navigate("/factures")} variant="outline" className="justify-between h-10 text-[11px] font-bold px-3">
                  <span className="flex items-center gap-2"><FileText className="size-4 text-primary" /> Facturation</span>
                  <ChevronRight className="size-3 text-muted-foreground" />
               </Button>
               <Button onClick={() => navigate("/admin/utilisateurs")} variant="outline" className="justify-between h-10 text-[11px] font-bold px-3">
                  <span className="flex items-center gap-2"><Users className="size-4 text-primary" /> Utilisateurs</span>
                  <ChevronRight className="size-3 text-muted-foreground" />
               </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
           <div className="flex items-center justify-between border-b pb-2">
             <h3 className="text-xs font-bold tracking-tight flex items-center gap-2 uppercase text-muted-foreground">
               <Home className="size-3 text-primary" /> Plan des chambres (10 premières)
             </h3>
             <button onClick={() => navigate("/reservations")} className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1">
               Voir tout l'état <ChevronRight className="size-2" />
             </button>
           </div>
           
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3">
             {visualRooms.slice(0, 10).map((r: any, idx) => (
               <Card key={idx} className={`overflow-hidden border transition-all hover:shadow-sm ${
                 r.status === 'OCCUPEE' ? 'border-amber-400 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20' :
                 r.status === 'RESERVEE' ? 'border-primary/50 dark:border-primary/50 bg-primary/5 dark:bg-primary/10' :
                 'border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20'
               }`}>
                 <div className={`p-2 border-b flex justify-between items-center ${
                   r.status === 'OCCUPEE' ? 'bg-amber-200/50 dark:bg-amber-900/40' :
                   r.status === 'RESERVEE' ? 'bg-primary/10 dark:bg-primary/20' :
                   'bg-emerald-200/50 dark:bg-emerald-900/40'
                 }`}>
                   <span className="font-bold text-xs">Ch. {r.chambre.numero}</span>
                   <Badge className={`text-[8px] h-4 px-1 ${
                     r.status === 'OCCUPEE' ? 'bg-amber-500 border-none' :
                     r.status === 'RESERVEE' ? 'bg-primary' :
                     'bg-emerald-500 border-none'
                   }`}>
                     {r.status}
                   </Badge>
                 </div>
                 <div className="p-2 min-h-[40px] flex flex-col justify-center">
                   {r.status === 'DISPONIBLE' ? (
                     <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 opacity-60">
                       <BedDouble className="size-3" />
                       <span className="text-[9px] font-medium">Libre</span>
                     </div>
                   ) : (
                     <div className="space-y-1">
                       <div className="flex items-center gap-1.5 truncate">
                         <User className="size-2.5 text-muted-foreground" />
                         <span className="text-[9px] font-bold truncate">{r.client}</span>
                       </div>
                       <div className="flex items-center gap-1.5 text-muted-foreground">
                         <CalendarCheck className="size-2.5" />
                         <span className="text-[8px] font-medium">Du {new Date(r.debut).toLocaleDateString()}</span>
                       </div>
                       <div className="flex items-center gap-1.5 text-muted-foreground">
                         <Clock className="size-2.5" />
                         <span className="text-[8px]">{r.nuits}n • Jusqu'au {r.fin ? new Date(r.fin).toLocaleDateString() : 'N/A'}</span>
                       </div>
                     </div>
                   )}
                 </div>
               </Card>
             ))}
           </div>
         </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-full space-y-6 page-enter px-4 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <ClipboardList className="size-5 text-primary" />
            Réception
          </h1>
          <p className="text-[11px] text-muted-foreground font-medium">Gestion opérationnelle</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => navigate("/arrivee-depart")} variant="outline" size="sm" className="gap-2 h-8 text-[11px]">
             <DoorOpen className="size-3.5" /> Arrivées / Départs
          </Button>
          <Button onClick={() => navigate("/reservations")} size="sm" className="gap-2 h-8 text-[11px]">
             <Plus className="size-3.5" /> Nouvelle Réservation
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KpiCard icon={Home} value={stats.available} label="Disponibles" bgClass="bg-emerald-50" colorClass="text-emerald-600" />
        <KpiCard icon={CalendarCheck} value={stats.reserved} label="Réservations" bgClass="bg-blue-50" colorClass="text-blue-600" />
        <KpiCard icon={Users} value={clients.length} label="Clients" bgClass="bg-primary/10" colorClass="text-primary" />
      </div>

       <div className="space-y-3">
         <div className="flex items-center justify-between border-b pb-1">
           <h2 className="text-xs font-bold tracking-tight flex items-center gap-2">
             <Flag className="size-3.5 text-primary" /> État des chambres (10 premières)
           </h2>
           <button onClick={() => navigate("/reservations")} className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1">
               Voir tout l'état <ChevronRight className="size-2" />
           </button>
         </div>
         
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
             {visualRooms.slice(0, 10).map((r: any, idx) => (
               <Card key={idx} className={`overflow-hidden border transition-all hover:shadow-sm cursor-pointer ${
                 r.status === 'OCCUPEE' ? 'border-amber-400 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20' :
                 r.status === 'RESERVEE' ? 'border-primary/50 dark:border-primary/50 bg-primary/5 dark:bg-primary/10' :
                 'border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20'
               }`} onClick={() => handleDetails(r.chambre.id_chambre)}>
                 <div className={`p-2 border-b flex justify-between items-center ${
                   r.status === 'OCCUPEE' ? 'bg-amber-200/50 dark:bg-amber-900/40' :
                   r.status === 'RESERVEE' ? 'bg-primary/10 dark:bg-primary/20' :
                   'bg-emerald-200/50 dark:bg-emerald-900/40'
                 }`}>
                   <span className="font-bold text-xs">Ch. {r.chambre.numero}</span>
                   <Badge className={`text-[8px] h-4 px-1 ${
                     r.status === 'OCCUPEE' ? 'bg-amber-500 border-none' :
                     r.status === 'RESERVEE' ? 'bg-primary' :
                     'bg-emerald-500 border-none'
                   }`}>
                     {r.status}
                   </Badge>
                 </div>
                 <div className="p-2 min-h-[40px] flex flex-col justify-center">
                   {r.status === 'DISPONIBLE' ? (
                     <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 opacity-60">
                       <BedDouble className="size-3" />
                       <span className="text-[9px] font-medium">Libre</span>
                     </div>
                   ) : (
                     <div className="space-y-1">
                       <div className="flex items-center gap-1.5 truncate">
                         <User className="size-2.5 text-muted-foreground" />
                         <span className="text-[9px] font-bold truncate">{r.client}</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <Clock className="size-2.5 text-muted-foreground" />
                         <span className="text-[8px] text-muted-foreground">{r.nuits}n • {r.fin ? new Date(r.fin).toLocaleDateString() : 'N/A'}</span>
                       </div>
                     </div>
                   )}
                 </div>
               </Card>
             ))}
           </div>
       </div>
    </div>
  )
}

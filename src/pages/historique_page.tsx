import { useState, useEffect, useMemo } from "react"
import { listSejours, type Sejour } from "@/services/Sejours_service"
import { listReservations, type Reservation } from "@/services/Reservation_service"
import { listFactures, type Facture } from "@/services/Facture_service"
import { listClients, type Client } from "@/services/Client_service"
import { listChambres, type Chambre } from "@/services/Chambre_service"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, History, Search, Filter, User, BedDouble, Calendar, FileText, CheckCircle2, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export default function HistoriquePage() {
  const [sejours, setSejours] = useState<Sejour[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [factures, setFactures] = useState<Facture[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [chambres, setChambres] = useState<Chambre[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [search, setSearch] = useState("")

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [s, r, f, c, ch] = await Promise.all([
          listSejours(),
          listReservations(),
          listFactures(),
          listClients(),
          listChambres(),
        ])
        setSejours(s.filter(x => x.statut === "FINI"))
        setReservations(r.filter(x => x.statut === "TERMINEE" || x.statut === "ANNULEE"))
        setFactures(f.filter(x => x.statut === "PAYEE"))
        setClients(c)
        setChambres(ch)
      } catch (e) {
        console.error("Failed to load history data", e)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  function getClientName(id: number) {
    const c = clients.find(x => x.id_client === id)
    return c ? `${c.prenom ?? ""} ${c.nom}`.trim() : "Inconnu"
  }

  function getChambreNumero(id: number) {
    return chambres.find(x => x.id_chambre === id)?.numero ?? "—"
  }

  const filteredSejours = useMemo(() => {
    return sejours.filter(s => getClientName(s.id_client).toLowerCase().includes(search.toLowerCase()))
  }, [sejours, search, clients])

  const filteredReservations = useMemo(() => {
    return reservations.filter(r => getClientName(r.id_client).toLowerCase().includes(search.toLowerCase()))
  }, [reservations, search, clients])

  const filteredFactures = useMemo(() => {
    return factures.filter(f => getClientName(f.id_client).toLowerCase().includes(search.toLowerCase()))
  }, [factures, search, clients])

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-primary/10 text-primary">
            <History className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Historique</h1>
            <p className="text-sm text-muted-foreground">
              Archives des activités passées
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-9 rounded-none"
          />
        </div>
      </div>

      <Tabs defaultValue="sejours" className="w-full">
        <TabsList className="rounded-none bg-muted w-full justify-start border-b mb-4 h-12">
          <TabsTrigger value="sejours" className="rounded-none h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Séjours ({filteredSejours.length})
          </TabsTrigger>
          <TabsTrigger value="reservations" className="rounded-none h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Réservations ({filteredReservations.length})
          </TabsTrigger>
          <TabsTrigger value="factures" className="rounded-none h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Factures ({filteredFactures.length})
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="size-8 animate-spin mr-2" /> Chargement des archives...
          </div>
        ) : (
          <>
            <TabsContent value="sejours">
              <Card className="rounded-none border shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-auto">
                    <table className="w-full">
                      <thead className="bg-muted text-xs uppercase tracking-wider">
                        <tr className="border-b-2 border-primary">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Chambre</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredSejours.length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Aucun séjour archivé</td></tr>
                        ) : (
                          filteredSejours.map(s => (
                            <tr key={s.id_sejour} className="hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <User className="size-4 text-muted-foreground" />
                                  <span className="font-medium text-foreground">{getClientName(s.id_client)}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="rounded-none">
                                  {getChambreNumero(s.id_chambre)}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {new Date(s.date_jour).toLocaleDateString("fr-FR")}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className="bg-emerald-100 text-emerald-800 rounded-none border-emerald-200">
                                  <CheckCircle2 className="size-3 mr-1" /> Terminé
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reservations">
              <Card className="rounded-none border shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-auto">
                    <table className="w-full">
                      <thead className="bg-muted text-xs uppercase tracking-wider">
                        <tr className="border-b-2 border-primary">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Dates</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredReservations.length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Aucune réservation archivée</td></tr>
                        ) : (
                          filteredReservations.map(r => (
                            <tr key={r.id_reservation} className="hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <User className="size-4 text-muted-foreground" />
                                  <span className="font-medium text-foreground">{getClientName(r.id_client)}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs">
                                Du {new Date(r.date_arrivee).toLocaleDateString()} au {new Date(r.date_depart).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground">{r.type_chambre}</td>
                              <td className="px-4 py-3">
                                <Badge 
                                  className={cn(
                                    "rounded-none",
                                    r.statut === "TERMINEE" ? "bg-blue-100 text-blue-800 border-blue-200" : "bg-rose-100 text-rose-800 border-rose-200"
                                  )}
                                >
                                  {r.statut === "TERMINEE" ? <CheckCircle2 className="size-3 mr-1" /> : <XCircle className="size-3 mr-1" />}
                                  {r.statut}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="factures">
              <Card className="rounded-none border shadow-sm">
                <CardContent className="p-0">
                  <div className="overflow-auto">
                    <table className="w-full">
                      <thead className="bg-muted text-xs uppercase tracking-wider">
                        <tr className="border-b-2 border-primary">
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Montant</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                          <th className="px-4 py-3 text-left font-medium text-muted-foreground">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredFactures.length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Aucune facture archivée</td></tr>
                        ) : (
                          filteredFactures.map(f => (
                            <tr key={f.id_facture} className="hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <User className="size-4 text-muted-foreground" />
                                  <span className="font-medium text-foreground">{getClientName(f.id_client)}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-semibold text-foreground">
                                {f.montant_total.toLocaleString()} FCFA
                              </td>
                              <td className="px-4 py-3 text-sm text-foreground">
                                {new Date(f.date_facture).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className="bg-emerald-100 text-emerald-800 rounded-none border-emerald-200">
                                  Payée
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}

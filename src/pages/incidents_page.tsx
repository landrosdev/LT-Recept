import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import {
  listIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
  type Incident,
  type IncidentInput
} from "@/services/Incident_service"
import { listChambres, type Chambre } from "@/services/Chambre_service"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Loader2, Plus, Search, Filter, AlertTriangle, CheckCircle2, Wrench, Calendar, User } from "lucide-react"
import { IncidentStatusBadge } from "@/components/incident/IncidentStatusBadge"

import { IncidentList } from "@/components/incident/IncidentList"
import { IncidentForm } from "@/components/incident/IncidentForm"

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [chambres, setChambres] = useState<Chambre[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters - statusFilter will be used for filtering incidents
  const [search, setSearch] = useState("")
  const [statusFilter, _setStatusFilter] = useState<"ALL" | "EN_COURS" | "RESOLU">("ALL")

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null)

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [viewingIncident, setViewingIncident] = useState<Incident | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [inc, ch] = await Promise.all([listIncidents(), listChambres()])
        setIncidents(inc)
        setChambres(ch)
      } catch (e) {
        console.error(e)
        setError("Impossible de charger les données")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Derived
  const stats = useMemo(() => {
    const total = incidents.length
    const enCours = incidents.filter(i => i.statut === "EN_COURS").length
    const resolus = incidents.filter(i => i.statut === "RESOLU").length
    return { total, enCours, resolus }
  }, [incidents])

  const filtered = useMemo(() => {
    return incidents.filter(i => {
      if (statusFilter !== "ALL" && i.statut !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const room = chambres.find(c => c.id_chambre === i.id_chambre)?.numero.toLowerCase() ?? ""
        return (
          i.probleme.toLowerCase().includes(q) ||
          i.responsable?.toLowerCase().includes(q) ||
          room.includes(q)
        )
      }
      return true
    })
  }, [incidents, chambres, search, statusFilter])

  // Handlers
  async function handleSave(data: IncidentInput) {
    if (editingIncident) {
      const updated = await updateIncident(editingIncident.id_incident, data)
      setIncidents(prev => prev.map(i => i.id_incident === editingIncident.id_incident ? updated : i))
      toast.success("Incident mis à jour")
    } else {
      const created = await createIncident(data)
      setIncidents(prev => [...prev, created])
      toast.success("Incident signalé")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteIncident(deleteId)
      setIncidents(prev => prev.filter(i => i.id_incident !== deleteId))
      toast.success("Incident supprimé")
      setDeleteConfirmOpen(false)
    } catch (e) {
      toast.error("Erreur lors de la suppression")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-primary/10 text-primary">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Incidents</h1>
            <p className="text-sm text-muted-foreground">
              Gestion des problèmes techniques
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingIncident(null)
            setIsFormOpen(true)
          }}
          className="gap-2 shadow-sm hover:shadow-md rounded-none"
        >
          <Plus className="size-4" />
          Signaler un incident
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-6">
        <Card className="shadow-sm border-none bg-card">
          <CardContent className="kpi-card-content flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Wrench className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold tracking-tight truncate mb-0.5">{stats.enCours}</div>
              <div className="text-[9px] text-muted-foreground font-medium truncate">En cours</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-card">
          <CardContent className="kpi-card-content flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold tracking-tight truncate mb-0.5">{stats.resolus}</div>
              <div className="text-[9px] text-muted-foreground font-medium truncate">Résolus</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-card">
          <CardContent className="kpi-card-content flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <AlertTriangle className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold tracking-tight truncate mb-0.5">{stats.total}</div>
              <div className="text-[9px] text-muted-foreground font-medium truncate">Total signalés</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <Card className="rounded-none border shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Liste des incidents</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-9 rounded-none"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin mr-2" /> Chargement...
            </div>
          ) : error ? (
            <div className="flex h-48 items-center justify-center text-destructive">
              {error}
            </div>
          ) : (
            <IncidentList
              incidents={filtered}
              chambres={chambres}
              onEdit={(inc) => {
                setEditingIncident(inc)
                setIsFormOpen(true)
              }}
              onDelete={(id) => {
                setDeleteId(id)
                setDeleteConfirmOpen(true)
              }}
              onViewDetails={(inc) => setViewingIncident(inc)}
            />
          )}
        </CardContent>
      </Card>

      <IncidentForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingIncident={editingIncident}
        chambres={chambres}
        onSave={handleSave}
      />

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle>Supprimer ?</DialogTitle>
            <DialogDescription>Action irréversible.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="rounded-none">Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="rounded-none">
              {isDeleting ? <Loader2 className="size-4 animate-spin" /> : "Supprimer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barre Latérale Détails Incident */}
      <Sheet open={!!viewingIncident} onOpenChange={(open) => !open && setViewingIncident(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-4">
            <SheetTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Détails de l'Incident
            </SheetTitle>
          </SheetHeader>
          {viewingIncident && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-dashed">
                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Chambre</div>
                  <div className="text-xl font-black text-primary">
                    Ch. {chambres.find(c => c.id_chambre === viewingIncident.id_chambre)?.numero}
                  </div>
                </div>
                <IncidentStatusBadge statut={viewingIncident.statut} />
              </div>

              <div className="space-y-3">
                <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                  <Calendar className="size-3" /> Date du signalement
                </div>
                <div className="text-sm font-medium">
                  {new Date(viewingIncident.date_incident).toLocaleDateString("fr-FR", { dateStyle: 'full' })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="size-3" /> Description du problème
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50 text-sm leading-relaxed whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto scrollbar-thin">
                  {viewingIncident.probleme}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                   <User className="size-3" /> Responsable & Action
                </div>
                <div className="bg-muted/30 p-4 rounded-xl border space-y-3">
                   <div>
                      <div className="text-[10px] text-muted-foreground mb-1">Signalé par :</div>
                      <div className="text-sm font-bold">{viewingIncident.responsable || "Non spécifié"}</div>
                   </div>
                   <Separator />
                   <div>
                      <div className="text-[10px] text-muted-foreground mb-1">Action entreprise :</div>
                      <div className="text-sm italic text-foreground">
                        {viewingIncident.action_prise ? `"${viewingIncident.action_prise}"` : "Aucune action enregistrée pour le moment."}
                      </div>
                   </div>
                </div>
              </div>

              <div className="pt-6 border-t mt-auto flex flex-col gap-2">
                 <Button className="w-full" onClick={() => {
                   setEditingIncident(viewingIncident)
                   setViewingIncident(null)
                   setIsFormOpen(true)
                 }}>
                   Modifier l'incident
                 </Button>
                 <Button variant="outline" className="w-full" onClick={() => setViewingIncident(null)}>
                   Fermer
                 </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
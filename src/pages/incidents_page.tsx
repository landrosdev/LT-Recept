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
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Search, Filter, AlertTriangle, CheckCircle2, Wrench } from "lucide-react"

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

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="group relative flex h-20 items-center gap-4 overflow-hidden rounded-none bg-destructive p-4 shadow-sm hover:brightness-110 transition-all">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <Wrench className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">{stats.enCours}</div>
            <div className="text-sm font-medium text-white/90">Incidents en cours</div>
          </div>
          <div className="absolute right-0 top-0 h-full w-2 bg-black/10" />
        </div>

        <div className="group relative flex h-20 items-center gap-4 overflow-hidden rounded-none bg-emerald-600 p-4 shadow-sm hover:brightness-110 transition-all">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <CheckCircle2 className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">{stats.resolus}</div>
            <div className="text-sm font-medium text-white/90">Résolus</div>
          </div>
        </div>

        <div className="group relative flex h-20 items-center gap-4 overflow-hidden rounded-none bg-blue-600 p-4 shadow-sm hover:brightness-110 transition-all">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <AlertTriangle className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm font-medium text-white/90">Total signalés</div>
          </div>
        </div>
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
    </div>
  )
}
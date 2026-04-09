import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import {
  listTaches,
  createTache,
  updateTache,
  deleteTache,
  type Tache,
  type TacheInput
} from "@/services/Tache_service"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Search, Filter, ClipboardList, Clock, AlertCircle } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { TacheList } from "@/components/tache/TacheList"
import { TacheForm } from "@/components/tache/TacheForm"

export default function TachesPage() {
  const [taches, setTaches] = useState<Tache[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "A_FAIRE" | "EN_COURS" | "TERMINEE">("ALL")

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTache, setEditingTache] = useState<Tache | null>(null)

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const data = await listTaches()
        setTaches(data)
      } catch (e) {
        console.error(e)
        setError("Impossible de charger les tâches")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Derived Stats
  const stats = useMemo(() => {
    const total = taches.length
    const aFaire = taches.filter(t => t.statut === "A_FAIRE").length
    const enCours = taches.filter(t => t.statut === "EN_COURS").length
    const hautePriorite = taches.filter(t => t.priorite === "HAUTE" && t.statut !== "TERMINEE").length
    return { total, aFaire, enCours, hautePriorite }
  }, [taches])

  const filtered = useMemo(() => {
    return taches.filter(t => {
      if (statusFilter !== "ALL" && t.statut !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          t.description.toLowerCase().includes(q) ||
          t.responsable?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [taches, search, statusFilter])

  // Handlers
  async function handleSave(data: TacheInput) {
    if (editingTache) {
      const updated = await updateTache(editingTache.id_tache, data)
      setTaches(prev => prev.map(t => t.id_tache === editingTache.id_tache ? updated : t))
      toast.success("Tâche mise à jour")
    } else {
      const created = await createTache(data)
      setTaches(prev => [...prev, created])
      toast.success("Tâche créée")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteTache(deleteId)
      setTaches(prev => prev.filter(t => t.id_tache !== deleteId))
      toast.success("Tâche supprimée")
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
            <ClipboardList className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tâches</h1>
            <p className="text-sm text-muted-foreground">
              Organisation et maintenance
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingTache(null)
            setIsFormOpen(true)
          }}
          className="gap-2 shadow-sm hover:shadow-md rounded-none"
        >
          <Plus className="size-4" />
          Nouvelle tâche
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="group relative flex h-20 items-center gap-4 overflow-hidden rounded-none bg-blue-600 p-4 shadow-sm hover:brightness-110 transition-all">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <Clock className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">{stats.aFaire + stats.enCours}</div>
            <div className="text-sm font-medium text-white/90">Tâches actives</div>
          </div>
        </div>

        <div className="group relative flex h-20 items-center gap-4 overflow-hidden rounded-none bg-destructive p-4 shadow-sm hover:brightness-110 transition-all">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <AlertCircle className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">{stats.hautePriorite}</div>
            <div className="text-sm font-medium text-white/90">Priorité Haute</div>
          </div>
        </div>

        <div className="group relative flex h-20 items-center gap-4 overflow-hidden rounded-none bg-primary p-4 shadow-sm hover:brightness-110 transition-all">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <ClipboardList className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm font-medium text-white/90">Total tâches</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <Card className="rounded-none border shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Liste des tâches</CardTitle>
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
            <Select
               value={statusFilter}
               onValueChange={(v: any) => setStatusFilter(v)}
            >
               <SelectTrigger className="w-[150px] rounded-none">
                  <SelectValue placeholder="Filtre statut" />
               </SelectTrigger>
               <SelectContent className="rounded-none">
                  <SelectItem value="ALL">Tout</SelectItem>
                  <SelectItem value="A_FAIRE">À faire</SelectItem>
                  <SelectItem value="EN_COURS">En cours</SelectItem>
                  <SelectItem value="TERMINEE">Terminée</SelectItem>
               </SelectContent>
            </Select>
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
            <TacheList
              taches={filtered}
              onEdit={(tache) => {
                setEditingTache(tache)
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

      <TacheForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingTache={editingTache}
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
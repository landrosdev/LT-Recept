import { Fragment, useMemo, useState, useEffect } from "react"
import { toast } from "sonner"

import { useChambres } from "@/components/chambre/useChambres"
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
import { ChevronDown, Loader2, Plus, Search, BedDouble, Filter, ArrowRight, Home, Users, Crown, DoorOpen, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { listSejours, type Sejour } from "@/services/Sejours_service"

export default function ChambresPage() {
  const {
    isLoading,
    error,
    chambres,
    equipements,
    liaisons,
    createOrUpdateChambre,
    removeChambre,
    assignEquipementsBatch,
    toggleEquipementForChambre,
  } = useChambres()

  const [filters, setFilters] = useState({
    numero: "",
    type: "",
    description: "",
    equipement: "",
  })
  const [sort, setSort] = useState<{ key: "numero" | "type" | "description" | "equipement"; dir: "asc" | "desc" } | null>(null)
  const [colMenuOpen, setColMenuOpen] = useState(false)
  const [colMenuKey, setColMenuKey] = useState<"numero" | "type" | "description" | "equipement">("numero")

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [assignRowId, setAssignRowId] = useState<number | null>(null)
  const [assignSelected, setAssignSelected] = useState<Set<string>>(new Set())
  const [assignError, setAssignError] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [isUnassigning, setIsUnassigning] = useState<number | null>(null) // id_equipement en cours de retrait

  const [numero, setNumero] = useState("")
  const [typeChambre, setTypeChambre] = useState("SIMPLE")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteChambreId, setDeleteChambreId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load sejours for occupancy tracking
  const [sejours, setSejours] = useState<Sejour[]>([])

  useEffect(() => {
    async function loadSejours() {
      try {
        const data = await listSejours()
        setSejours(data)
      } catch (e) {
        console.error("Failed to load sejours", e)
      }
    }
    loadSejours()
  }, [])

  // Calculate occupancy
  const occupiedChambreIds = useMemo(() => {
    const occupied = new Set<number>()
    sejours.forEach(s => {
      if (s.statut === "ARRIVE" || s.statut === "EN_SEJOUR") {
        occupied.add(s.id_chambre)
      }
    })
    return occupied
  }, [sejours])

  const occupancyStats = useMemo(() => {
    const available = chambres.length - occupiedChambreIds.size
    return {
      total: chambres.length,
      occupied: occupiedChambreIds.size,
      available: Math.max(0, available),
    }
  }, [chambres, occupiedChambreIds])

  const equipementById = useMemo(() => {
    const m = new Map<string, string>()
    for (const e of equipements) m.set(String(e.id_equipement), e.nom)
    return m
  }, [equipements])

  const equipementsByChambre = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const l of liaisons) {
      const k = String(l.id_chambre)
      const arr = m.get(k) ?? []
      arr.push(String(l.id_equipement))
      m.set(k, arr)
    }
    return m
  }, [liaisons])

  const filtered = useMemo(() => {
    return chambres.filter((c) => {
      const qNumero = filters.numero.trim().toLowerCase()
      const qType = filters.type.trim().toLowerCase()
      const qDesc = filters.description.trim().toLowerCase()
      const qEquip = filters.equipement.trim().toLowerCase()

      const listEquip = (equipementsByChambre.get(String(c.id_chambre)) ?? [])
        .map((id) => equipementById.get(id) ?? "")
        .join(" ")
        .toLowerCase()

      if (qNumero && !c.numero.toLowerCase().includes(qNumero)) return false
      if (qType && !c.type_chambre.toLowerCase().includes(qType)) return false
      if (qDesc && !(c.description ?? "").toLowerCase().includes(qDesc)) return false
      if (qEquip && !listEquip.includes(qEquip)) return false
      return true
    })
  }, [
    chambres,
    equipementById,
    equipementsByChambre,
    filters,
  ])

  const displayed = useMemo(() => {
    const arr = [...filtered]
    if (!sort) return arr
    const dir = sort.dir === "asc" ? 1 : -1

    return arr.sort((a, b) => {
      const aEquip = (equipementsByChambre.get(String(a.id_chambre)) ?? [])
        .map((id) => equipementById.get(id) ?? "")
        .join(", ")
      const bEquip = (equipementsByChambre.get(String(b.id_chambre)) ?? [])
        .map((id) => equipementById.get(id) ?? "")
        .join(", ")

      const va =
        sort.key === "numero"
          ? a.numero
          : sort.key === "type"
            ? a.type_chambre
            : sort.key === "description"
              ? a.description ?? ""
              : aEquip
      const vb =
        sort.key === "numero"
          ? b.numero
          : sort.key === "type"
            ? b.type_chambre
            : sort.key === "description"
              ? b.description ?? ""
              : bEquip

      return va.localeCompare(vb) * dir
    })
  }, [equipementById, equipementsByChambre, filtered, sort])

  function openColumnMenu(key: "numero" | "type" | "description" | "equipement") {
    setColMenuKey(key)
    setColMenuOpen(true)
  }

  const editing = useMemo(
    () => chambres.find((c) => c.id_chambre === editingId) ?? null,
    [chambres, editingId]
  )

  function openCreate() {
    setEditingId(null)
    setNumero("")
    setTypeChambre("SIMPLE")
    setDescription("")
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEdit(id: number) {
    const c = chambres.find((x) => x.id_chambre === id)
    setEditingId(id)
    setNumero(c?.numero ?? "")
    setTypeChambre(c?.type_chambre ?? "SIMPLE")
    setDescription(c?.description ?? "")
    setFormError(null)
    setIsFormOpen(true)
  }

  function toggleAssignRow(id: number) {
    if (isAssigning) return
    setAssignError(null)
    if (assignRowId === id) {
      setAssignRowId(null)
      setAssignSelected(new Set())
      return
    }
    setAssignRowId(id)
    setAssignSelected(new Set())
  }

  function openDeleteConfirm(id: number) {
    setDeleteChambreId(id)
    setDeleteConfirmOpen(true)
  }

  async function handleDelete() {
    if (!deleteChambreId) return
    setIsDeleting(true)
    try {
      await removeChambre(deleteChambreId)
      toast.success("Chambre supprimée avec succès")
      setDeleteConfirmOpen(false)
      setDeleteChambreId(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la suppression"
      toast.error(msg)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header with title and action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-muted-foreground">
            <BedDouble className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des chambres</h1>
            <p className="text-sm text-muted-foreground">
              {chambres.length} chambre{chambres.length > 1 ? "s" : ""} enregistrée{chambres.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button 
          onClick={openCreate}
          className="gap-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <Plus className="size-4" />
          Nouvelle chambre
        </Button>
      </div>

      {/* Stats KPI - cartes individuelles style dashboard */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total chambres */}
        <div className="group relative flex h-20 items-center gap-4 overflow-hidden rounded-sm bg-primary p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-primary/10">
            <Home className="size-7 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-muted-foreground">{chambres.length}</div>
            <div className="text-sm font-medium text-muted-foreground/90">Total chambres</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground border border-border transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>

        {/* Chambres SIMPLE */}
        <div className="group relative flex h-20 items-center gap-4 overflow-hidden rounded-sm bg-secondary p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-secondary/90">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-primary/10">
            <BedDouble className="size-7 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-muted-foreground">
              {chambres.filter(c => c.type_chambre === "SIMPLE").length}
            </div>
            <div className="text-sm font-medium text-muted-foreground/90">Chambres simples</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground border border-border transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>

        {/* Chambres DOUBLE */}
        <div className="group relative flex h-20 items-center gap-4 overflow-hidden rounded-sm bg-secondary p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-secondary/90">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-primary/10">
            <Users className="size-7 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-muted-foreground">
              {chambres.filter(c => c.type_chambre === "DOUBLE").length}
            </div>
            <div className="text-sm font-medium text-muted-foreground/90">Chambres doubles</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground border border-border transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>

        {/* Suites */}
        <div className="group relative flex h-20 items-center gap-4 overflow-hidden rounded-sm bg-card border border-border p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-muted">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-primary/10">
            <Crown className="size-7 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-foreground">
              {chambres.filter(c => c.type_chambre === "SUITE").length}
            </div>
            <div className="text-sm font-medium text-muted-foreground">Suites</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground border border-border transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>

        {/* Chambres disponibles */}
        <div className="group relative flex h-20 items-center gap-4 overflow-hidden rounded-sm bg-emerald-600 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-primary/10">
            <DoorOpen className="size-7 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-muted-foreground">{occupancyStats.available}</div>
            <div className="text-sm font-medium text-muted-foreground/90">Chambres libres</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-primary-foreground transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>

        {/* Chambres occupées */}
        <div className="group relative flex h-20 items-center gap-4 overflow-hidden rounded-sm bg-amber-500 p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-primary/10">
            <User className="size-7 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-muted-foreground">{occupancyStats.occupied}</div>
            <div className="text-sm font-medium text-muted-foreground/90">Chambres occupées</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-primary-foreground transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>
      </div>

      {/* Main content - Table */}
      <Card className="overflow-hidden border shadow-sm transition-shadow hover:shadow-md">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Liste des chambres</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {filtered.length}/{chambres.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={filters.numero}
                onChange={(e) => setFilters(p => ({ ...p, numero: e.target.value }))}
                className="w-64 pl-9"
              />
            </div>
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
            <div className="flex h-64 items-center justify-center">
              <Alert variant="destructive" className="max-w-md">
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
                        className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
                        onClick={() => openColumnMenu("numero")}
                      >
                        Numéro
                        <ChevronDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button 
                        type="button" 
                        className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
                        onClick={() => openColumnMenu("type")}
                      >
                        Type
                        <ChevronDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button 
                        type="button" 
                        className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
                        onClick={() => openColumnMenu("description")}
                      >
                        Description
                        <ChevronDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button 
                        type="button" 
                        className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
                        onClick={() => openColumnMenu("equipement")}
                      >
                        Équipements
                        <ChevronDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <BedDouble className="size-8 opacity-20" />
                          <p>Aucune chambre trouvée</p>
                          <p className="text-sm">Essayez de modifier vos filtres</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayed.map((c, index) => {
                      const ids = equipementsByChambre.get(String(c.id_chambre)) ?? []
                      const names = ids.map((id) => equipementById.get(id)).filter(Boolean) as string[]
                      const more = Math.max(0, ids.length - 3)
                      const isAssignOpen = assignRowId === c.id_chambre
                      const unassigned = equipements.filter(
                        (e) => !ids.includes(String(e.id_equipement))
                      )

                      return (
                        <Fragment key={c.id_chambre}>
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
                                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-muted-foreground font-semibold text-sm">
                                  {c.numero}
                                </div>
                                {occupiedChambreIds.has(c.id_chambre) && (
                                  <Badge variant="outline" className="text-xs border-amber-500 text-amber-600 bg-amber-500/10 dark:bg-amber-500/20 dark:text-amber-400">
                                    Occupée
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={c.type_chambre === "SUITE" ? "default" : "secondary"}>
                                {c.type_chambre}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                              {c.description || "—"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="space-y-2">
                                {ids.length === 0 ? (
                                  <span className="text-xs text-muted-foreground italic">Aucun équipement</span>
                                ) : (
                                  <div className="flex flex-wrap items-center gap-1">
                                    {names.slice(0, 3).map((n, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {n}
                                      </Badge>
                                    ))}
                                    {more > 0 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{more}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-xs border-primary/50 text-muted-foreground hover:bg-primary hover:text-muted-foreground-foreground"
                                    onClick={() => toggleAssignRow(c.id_chambre)}
                                  >
                                    {isAssignOpen ? "Fermer" : "Gérer équipements"}
                                  </Button>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEdit(c.id_chambre)}
                                  className="h-8 border-primary text-muted-foreground hover:bg-primary hover:text-muted-foreground-foreground"
                                >
                                  Modifier
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openDeleteConfirm(c.id_chambre)}
                                  className="h-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                >
                                  Supprimer
                                </Button>
                              </div>
                            </td>
                          </tr>

                          {isAssignOpen && (
                            <tr className="bg-muted/20">
                              <td colSpan={5} className="px-4 py-4">
                                <div className="rounded-lg border bg-card p-4 shadow-sm">
                                  {assignError && (
                                    <Alert variant="destructive" className="mb-4">
                                      <AlertTitle>Erreur</AlertTitle>
                                      <AlertDescription>{assignError}</AlertDescription>
                                    </Alert>
                                  )}

                                  <div className="mb-4 text-sm font-medium">
                                    Gérer les équipements de la chambre {c.numero}
                                  </div>

                                  {/* Section: Équipements déjà assignés */}
                                  <div className="mb-4">
                                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                      Équipements assignés ({ids.length})
                                    </div>
                                    {ids.length === 0 ? (
                                      <p className="text-sm text-muted-foreground italic">
                                        Aucun équipement assigné
                                      </p>
                                    ) : (
                                      <div className="flex flex-wrap gap-2">
                                        {ids.map((id) => {
                                          const eq = equipements.find((e) => String(e.id_equipement) === id)
                                          if (!eq) return null
                                          return (
                                            <div
                                              key={id}
                                              className="flex items-center gap-1 rounded-md border bg-primary/5 px-2 py-1"
                                            >
                                              <span className="text-sm">{eq.nom}</span>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-5 w-5 p-0 text-destructive hover:bg-destructive/10"
                                                disabled={isUnassigning === eq.id_equipement}
                                                onClick={async () => {
                                                  setAssignError(null)
                                                  setIsUnassigning(eq.id_equipement)
                                                  try {
                                                    await toggleEquipementForChambre({
                                                      id_chambre: c.id_chambre,
                                                      id_equipement: eq.id_equipement,
                                                      checked: false,
                                                    })
                                                    toast.success(`"${eq.nom}" retiré de la chambre`)
                                                  } catch (e) {
                                                    const msg = e instanceof Error ? e.message : "Erreur"
                                                    setAssignError(msg)
                                                    toast.error(msg)
                                                  } finally {
                                                    setIsUnassigning(null)
                                                  }
                                                }}
                                              >
                                                {isUnassigning === eq.id_equipement ? (
                                                  <Loader2 className="size-3 animate-spin" />
                                                ) : (
                                                  <span className="text-xs">×</span>
                                                )}
                                              </Button>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  <Separator className="my-4" />

                                  {/* Section: Ajouter des équipements */}
                                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Ajouter des équipements ({unassigned.length} disponible{unassigned.length > 1 ? "s" : ""})
                                  </div>

                                  {unassigned.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                      Tous les équipements sont déjà assignés.
                                    </p>
                                  ) : (
                                    <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                                      {unassigned.map((e) => {
                                        const idStr = String(e.id_equipement)
                                        const checked = assignSelected.has(idStr)
                                        return (
                                          <label
                                            key={e.id_equipement}
                                            className={cn(
                                              "flex cursor-pointer items-center gap-2 rounded-md border p-2 transition-all hover:border-primary",
                                              checked && "border-primary bg-primary/5"
                                            )}
                                          >
                                            <input
                                              type="checkbox"
                                              className="size-4 accent-primary"
                                              checked={checked}
                                              onChange={(ev) => {
                                                const next = new Set(assignSelected)
                                                if (ev.target.checked) next.add(idStr)
                                                else next.delete(idStr)
                                                setAssignSelected(next)
                                              }}
                                            />
                                            <span className="text-sm">{e.nom}</span>
                                          </label>
                                        )
                                      })}
                                    </div>
                                  )}

                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setAssignSelected(new Set())
                                        setAssignRowId(null)
                                      }}
                                    >
                                      Fermer
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={assignSelected.size === 0 || isAssigning}
                                      onClick={async () => {
                                        setAssignError(null)
                                        try {
                                          setIsAssigning(true)
                                          await assignEquipementsBatch({
                                            id_chambre: c.id_chambre,
                                            ids_equipement: Array.from(assignSelected).map((x) => Number(x)),
                                          })
                                          toast.success("Équipements assignés avec succès")
                                          setAssignSelected(new Set())
                                          setAssignRowId(null)
                                        } catch (e) {
                                          const msg = e instanceof Error ? e.message : "Erreur"
                                          setAssignError(msg)
                                          toast.error(msg)
                                        } finally {
                                          setIsAssigning(false)
                                        }
                                      }}
                                    >
                                      {isAssigning ? (
                                        <span className="inline-flex items-center gap-2">
                                          <Loader2 className="size-3 animate-spin" />
                                          ...
                                        </span>
                                      ) : (
                                        "Ajouter"
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter/Sort Dialog */}
      <Dialog open={colMenuOpen} onOpenChange={setColMenuOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filtrer et trier</DialogTitle>
            <DialogDescription>
              Colonne : {colMenuKey}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Filtre</label>
              <Input
                value={filters[colMenuKey]}
                onChange={(e) => setFilters((p) => ({ ...p, [colMenuKey]: e.target.value }))}
                placeholder="Contient..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSort({ key: colMenuKey, dir: "asc" })}
                className={cn(sort?.key === colMenuKey && sort?.dir === "asc" && "border-primary")}
              >
                Trier A → Z
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSort({ key: colMenuKey, dir: "desc" })}
                className={cn(sort?.key === colMenuKey && sort?.dir === "desc" && "border-primary")}
              >
                Trier Z → A
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFilters((p) => ({ ...p, [colMenuKey]: "" }))}
              >
                Effacer filtre
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSort(null)}
              >
                Effacer tri
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Modifier la chambre ${editing.numero}` : "Nouvelle chambre"}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations de la chambre.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Numéro</label>
                <Input
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Ex: 101"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <div className="flex gap-2">
                  {["SIMPLE", "DOUBLE", "SUITE"].map((t) => (
                    <Button
                      key={t}
                      type="button"
                      variant={typeChambre === t ? "default" : "outline"}
                      onClick={() => setTypeChambre(t)}
                      className="flex-1"
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Vue mer, 2 lits..."
              />
            </div>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsFormOpen(false)
                  setEditingId(null)
                }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="flex-1"
                disabled={isSaving}
                onClick={async () => {
                  setFormError(null)
                  if (!numero.trim()) {
                    setFormError("Numéro obligatoire")
                    return
                  }
                  setIsSaving(true)
                  try {
                    await createOrUpdateChambre({
                      id_chambre: editing?.id_chambre,
                      numero: numero.trim(),
                      type_chambre: typeChambre,
                      description: description.trim() ? description.trim() : null,
                    })
                    toast.success(editing ? "Chambre modifiée avec succès" : "Chambre créée avec succès")
                    setIsFormOpen(false)
                    setEditingId(null)
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "Erreur"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette chambre ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setDeleteChambreId(null)
              }}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
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

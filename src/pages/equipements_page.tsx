import { Fragment, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

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
import { ChevronDown, Loader2, Plus, Search, Wrench, Filter, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  createEquipement,
  deleteEquipement,
  listEquipements,
  updateEquipement,
  type Equipement,
} from "@/services/Chambre_service"

type ColKey = "nom"

export default function EquipementsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<Equipement[]>([])

  const [filters, setFilters] = useState({ nom: "" })
  const [sort, setSort] = useState<{ key: ColKey; dir: "asc" | "desc" } | null>(null)
  const [colMenuOpen, setColMenuOpen] = useState(false)
  const [colMenuKey, setColMenuKey] = useState<ColKey>("nom")

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newNom, setNewNom] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editNom, setEditNom] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteEquipementId, setDeleteEquipementId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filtered = useMemo(() => {
    const q = filters.nom.trim().toLowerCase()
    if (!q) return items
    return items.filter((e) => e.nom.toLowerCase().includes(q))
  }, [filters.nom, items])

  const displayed = useMemo(() => {
    const arr = [...filtered]
    if (!sort) return arr
    const dir = sort.dir === "asc" ? 1 : -1
    return arr.sort((a, b) => a.nom.localeCompare(b.nom) * dir)
  }, [filtered, sort])

  async function refresh() {
    setIsLoading(true)
    setError(null)
    try {
      const e = await listEquipements()
      setItems(e)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur"
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openColumnMenu(key: ColKey) {
    setColMenuKey(key)
    setColMenuOpen(true)
  }

  function startEdit(e: Equipement) {
    setEditingId(e.id_equipement)
    setEditNom(e.nom)
  }

  function openDeleteConfirm(id: number) {
    setDeleteEquipementId(id)
    setDeleteConfirmOpen(true)
  }

  async function handleDelete() {
    if (!deleteEquipementId) return
    setIsDeleting(true)
    try {
      await deleteEquipement(deleteEquipementId)
      toast.success("Équipement supprimé avec succès")
      setDeleteConfirmOpen(false)
      setDeleteEquipementId(null)
      await refresh()
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
          <div className="flex h-10 w-10 items-center justify-center  bg-primary/10 text-primary">
            <Settings className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des équipements</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} équipement{items.length > 1 ? "s" : ""} enregistré{items.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button 
          onClick={() => {
            setNewNom("")
            setCreateError(null)
            setIsCreateOpen(true)
          }}
          className="gap-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <Plus className="size-4" />
          Nouvel équipement
        </Button>
      </div>

      {/* Stats KPI */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-6">
        <Card className="shadow-sm border-none bg-card">
          <CardContent className="kpi-card-content flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Settings className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold tracking-tight truncate mb-0.5">{items.length}</div>
              <div className="text-[9px] text-muted-foreground font-medium truncate">Total équipements</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-card">
          <CardContent className="kpi-card-content flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Wrench className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold tracking-tight truncate mb-0.5">{items.length}</div>
              <div className="text-[9px] text-muted-foreground font-medium truncate">Disponibles</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-card">
          <CardContent className="kpi-card-content flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Filter className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold tracking-tight truncate mb-0.5">{filtered.length}</div>
              <div className="text-[9px] text-muted-foreground font-medium truncate">Filtrés</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content - Table */}
      <Card className="overflow-hidden border shadow-sm transition-shadow hover:shadow-md ">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Liste des équipements</CardTitle>
            <Badge variant="secondary" className="ml-2 ">
              {filtered.length}/{items.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={filters.nom}
                onChange={(e) => setFilters({ nom: e.target.value })}
                className="w-64 pl-9 "
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
              <Alert variant="destructive" className="max-w-md ">
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
                        className="flex items-center gap-1 hover:text-primary transition-colors"
                        onClick={() => openColumnMenu("nom")}
                      >
                        Nom
                        <ChevronDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Settings className="size-8 opacity-20" />
                          <p>Aucun équipement trouvé</p>
                          <p className="text-sm">Essayez de modifier vos filtres</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayed.map((e, index) => {
                      const isEditing = editingId === e.id_equipement
                      return (
                        <Fragment key={e.id_equipement}>
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
                              {isEditing ? (
                                <Input
                                  value={editNom}
                                  onChange={(ev) => setEditNom(ev.target.value)}
                                  className="h-9 "
                                  autoFocus
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="flex h-8 w-8 items-center justify-center  bg-primary/10 text-primary font-semibold text-sm">
                                    <Wrench className="size-4" />
                                  </div>
                                  <span className="font-semibold">{e.nom}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                {isEditing ? (
                                  <>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingId(null)}
                                      className="h-8 "
                                    >
                                      Annuler
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={isSaving}
                                      onClick={async () => {
                                        setError(null)
                                        const nom = editNom.trim()
                                        if (!nom) return
                                        setIsSaving(true)
                                        try {
                                          await updateEquipement({
                                            id_equipement: e.id_equipement,
                                            nom,
                                          })
                                          toast.success("Équipement modifié avec succès")
                                          setEditingId(null)
                                          await refresh()
                                        } catch (e) {
                                          const msg = e instanceof Error ? e.message : "Erreur"
                                          setError(msg)
                                          toast.error(msg)
                                        } finally {
                                          setIsSaving(false)
                                        }
                                      }}
                                      className="h-8 "
                                    >
                                      {isSaving ? (
                                        <span className="inline-flex items-center gap-2">
                                          <Loader2 className="size-3 animate-spin" />
                                          ...
                                        </span>
                                      ) : (
                                        "Enregistrer"
                                      )}
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => startEdit(e)}
                                      className="h-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground "
                                    >
                                      Modifier
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openDeleteConfirm(e.id_equipement)}
                                      className="h-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground "
                                    >
                                      Supprimer
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
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
        <DialogContent className="sm:max-w-md ">
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
                onChange={(e) => setFilters({ nom: e.target.value })}
                placeholder="Contient..."
                className=""
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSort({ key: colMenuKey, dir: "asc" })}
                className={cn(sort?.key === colMenuKey && sort?.dir === "asc" && "border-primary", "")}
              >
                Trier A → Z
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSort({ key: colMenuKey, dir: "desc" })}
                className={cn(sort?.key === colMenuKey && sort?.dir === "desc" && "border-primary", "")}
              >
                Trier Z → A
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFilters({ nom: "" })}
                className=""
              >
                Effacer filtre
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSort(null)}
                className=""
              >
                Effacer tri
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md ">
          <DialogHeader>
            <DialogTitle>Nouvel équipement</DialogTitle>
            <DialogDescription>
              Créer un nouvel équipement pour les chambres.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom</label>
              <Input
                value={newNom}
                onChange={(e) => setNewNom(e.target.value)}
                placeholder="Ex: Climatisation, TV, Minibar..."
                className=""
              />
            </div>
            {createError && (
              <Alert variant="destructive" className="">
                <AlertDescription>{createError}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 "
                onClick={() => {
                  setIsCreateOpen(false)
                  setCreateError(null)
                }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="flex-1 "
                disabled={isCreating}
                onClick={async () => {
                  setCreateError(null)
                  const nom = newNom.trim()
                  if (!nom) {
                    setCreateError("Nom obligatoire")
                    return
                  }
                  setIsCreating(true)
                  try {
                    await createEquipement(nom)
                    toast.success("Équipement créé avec succès")
                    setIsCreateOpen(false)
                    await refresh()
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "Erreur"
                    setCreateError(msg)
                    toast.error(msg)
                  } finally {
                    setIsCreating(false)
                  }
                }}
              >
                {isCreating ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Création...
                  </span>
                ) : (
                  "Créer"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md ">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet équipement ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setDeleteEquipementId(null)
              }}
              disabled={isDeleting}
              className=""
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className=""
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

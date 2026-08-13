import { Fragment, useMemo, useState, useEffect } from "react"
import { toast } from "sonner"

import { useChambres } from "@/components/chambre/useChambres"
import { logAction } from "@/services/Audit_service"
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, BedDouble, Filter, Tag, Wrench, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

import { useAuth } from "@/hooks/useAuth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import IncidentsPage from "@/pages/incidents_page"
import EquipementsPage from "@/pages/equipements_page"
import GrilleTarifairePage from "@/pages/admin/grille_tarifaire_page"

export default function ChambresPage() {
  const {
    chambres,
    categories,
    equipements,
    liaisons,
    createOrUpdateChambre,
    removeChambre,
    createOrUpdateCategorie,
    removeCategorie,
    toggleEquipementForChambre,
  } = useChambres()

  const { user } = useAuth()

  const [filters, setFilters] = useState({
    numero: "",
    type: "",
    description: "",
    equipement: "",
  })
  const [sort] = useState<{ key: "numero" | "type" | "description" | "equipement"; dir: "asc" | "desc" } | null>(null)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [numero, setNumero] = useState("")
  const [idCategorie, setIdCategorie] = useState<number>(0)
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteChambreId, setDeleteChambreId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [editingCatId, setEditingCatId] = useState<number | null>(null)
  const [catLibelle, setCatLibelle] = useState("")
  const [catDesc, setCatDesc] = useState("")

  const [assignRowId, setAssignRowId] = useState<number | null>(null)
  const [isAssigning] = useState(false)

  const [isCatFormOpen, setIsCatFormOpen] = useState(false)
  const [catDeleteConfirmOpen, setCatDeleteConfirmOpen] = useState(false)
  const [deleteCatId, setDeleteCatId] = useState<number | null>(null)


  const [viewingChambreId, setViewingChambreId] = useState<number | null>(null)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)





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

      const cat = categories.find(cat => cat.id_categorie === c.id_categorie)
      const catLib = cat?.libelle.toLowerCase() || ""

      const listEquip = (equipementsByChambre.get(String(c.id_chambre)) ?? [])
        .map((id) => equipementById.get(id) ?? "")
        .join(" ")
        .toLowerCase()

      if (qNumero && !c.numero.toLowerCase().includes(qNumero)) return false
      if (qType && !catLib.includes(qType)) return false
      if (qDesc && !(c.description ?? "").toLowerCase().includes(qDesc)) return false
      if (qEquip && !listEquip.includes(qEquip)) return false
      return true
    })
  }, [chambres, categories, equipementById, equipementsByChambre, filters])

   const displayed = useMemo(() => {
    let arr = [...filtered]
    if (sort) {
      const dir = sort.dir === "asc" ? 1 : -1
      arr.sort((a, b) => {
        const aCat = categories.find(cat => cat.id_categorie === a.id_categorie)?.libelle || ""
        const bCat = categories.find(cat => cat.id_categorie === b.id_categorie)?.libelle || ""

        const aEquip = (equipementsByChambre.get(String(a.id_chambre)) ?? [])
          .map((id) => equipementById.get(id) ?? "")
          .join(", ")
        const bEquip = (equipementsByChambre.get(String(b.id_chambre)) ?? [])
          .map((id) => equipementById.get(id) ?? "")
          .join(", ")

        const va =
          sort.key === "numero" ? a.numero :
          sort.key === "type" ? aCat :
          sort.key === "description" ? a.description ?? "" : aEquip

        const vb =
          sort.key === "numero" ? b.numero :
          sort.key === "type" ? bCat :
          sort.key === "description" ? b.description ?? "" : bEquip

        return va.localeCompare(vb) * dir
      })
    }
    
    // Apply pagination
    const start = (currentPage - 1) * pageSize
    return arr.slice(start, start + pageSize)
  }, [categories, equipementById, equipementsByChambre, filtered, sort, currentPage, pageSize])

  const totalPages = Math.ceil(filtered.length / pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [filters, pageSize])

  const getCategoryBadgeVariant = (id: number) => {
    const colors = [
      "bg-blue-100 text-blue-700 border-blue-200",
      "bg-purple-100 text-purple-700 border-purple-200",
      "bg-emerald-100 text-emerald-700 border-emerald-200",
      "bg-amber-100 text-amber-700 border-amber-200",
      "bg-rose-100 text-rose-700 border-rose-200",
      "bg-indigo-100 text-indigo-700 border-indigo-200",
    ]
    return colors[id % colors.length]
  }



  const editing = useMemo(
    () => chambres.find((c) => c.id_chambre === editingId) ?? null,
    [chambres, editingId]
  )

  function openCreate() {
    setEditingId(null)
    setNumero("")
    setIdCategorie(categories[0]?.id_categorie || 0)
    setDescription("")
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEdit(id: number) {
    const c = chambres.find((x) => x.id_chambre === id)
    setEditingId(id)
    setNumero(c?.numero ?? "")
    setIdCategorie(c?.id_categorie || 0)
    setDescription(c?.description ?? "")
    setFormError(null)
    setIsFormOpen(true)
  }

  function toggleAssignRow(id: number) {
    if (isAssigning) return
    if (assignRowId === id) {
      setAssignRowId(null)
      return
    }
    setAssignRowId(id)
  }

  function openDeleteConfirm(id: number) {
    setDeleteChambreId(id)
    setDeleteConfirmOpen(true)
  }

  async function handleDelete() {
    if (!deleteChambreId) return
    setIsDeleting(true)
    try {
      const chambre = chambres.find(c => c.id_chambre === deleteChambreId);
      await removeChambre(deleteChambreId)
      await logAction(user?.id_utilisateur || null, "SUPPRESSION_CHAMBRE", {
        id_chambre: deleteChambreId,
        numero: chambre?.numero || "Inconnue"
      });
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
      <Tabs defaultValue="chambres" className="w-full">
        <div className="flex items-center justify-between pb-2 mb-4">
          <TabsList className="bg-muted/40 p-1.5 flex items-center shadow-inner border">
            
            <TabsTrigger 
              value="chambres" 
              className="gap-2 px-4 py-2 transition-all data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-blue-600/10"
            >
              <BedDouble className="size-4" /> Chambres
            </TabsTrigger>
            
            <div className="w-px h-5 bg-border mx-1" />
            
            <TabsTrigger 
              value="types" 
              className="gap-2 px-4 py-2 transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-purple-600/10"
            >
              <Filter className="size-4" /> Catégories
            </TabsTrigger>
            
            {user?.role === "admin" && (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <TabsTrigger 
                  value="tarifs" 
                  className="gap-2 px-4 py-2 transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-emerald-600/10"
                >
                  <Tag className="size-4" /> Tarifs
                </TabsTrigger>
              </>
            )}

            <div className="w-px h-5 bg-border mx-1" />
            
            <TabsTrigger 
              value="equipements" 
              className="gap-2 px-4 py-2 transition-all data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-orange-500/10"
            >
              <Wrench className="size-4" /> Équipements
            </TabsTrigger>

            <div className="w-px h-5 bg-border mx-1" />
            
            <TabsTrigger 
              value="incidents" 
              className="gap-2 px-4 py-2 transition-all data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-rose-600/10"
            >
              <AlertTriangle className="size-4" /> Incidents
            </TabsTrigger>

          </TabsList>
        </div>

        <TabsContent value="chambres" className="space-y-6 mt-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-primary/10 text-muted-foreground">
            <BedDouble className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des chambres</h1>
            <p className="text-sm text-muted-foreground">
              {chambres.length} chambre{chambres.length > 1 ? "s" : ""} enregistrée{chambres.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={openCreate} className="gap-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
            <Plus className="size-4" /> Nouvelle chambre
          </Button>
        </div>
      </div>


      {/* Table */}
      <Card className="overflow-hidden border shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Liste des chambres</CardTitle>
            <Badge variant="secondary" className="ml-2">{filtered.length}/{chambres.length}</Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Rechercher..." value={filters.numero} onChange={(e) => setFilters(p => ({ ...p, numero: e.target.value }))} className="w-64 pl-9" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left">Numéro</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Équipements</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayed.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-muted-foreground italic">Aucune chambre trouvée</td></tr>
                ) : (
                  displayed.map((c) => {
                    const ids = equipementsByChambre.get(String(c.id_chambre)) ?? []
                    const names = ids.map(id => equipementById.get(id)).filter(Boolean) as string[]
                    const isAssignOpen = assignRowId === c.id_chambre

                    return (
                      <Fragment key={c.id_chambre}>
                        <tr className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                <BedDouble className="size-4" />
                              </div>
                              <span className="font-bold text-sm">Ch. {c.numero}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn("font-bold text-[10px] border", getCategoryBadgeVariant(c.id_categorie))}>
                              {categories.find(cat => cat.id_categorie === c.id_categorie)?.libelle || "—"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px]">
                            <div className="truncate" title={c.description || ""}>{c.description || "—"}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {names.map((n, i) => <Badge key={i} variant="outline" className="text-[10px]">{n}</Badge>)}
                              <Button variant="ghost" size="sm" className="h-6 px-1 text-[10px] text-primary" onClick={() => toggleAssignRow(c.id_chambre)}>
                                {isAssignOpen ? "Fermer" : "Gérer"}
                              </Button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingChambreId(c.id_chambre)}
                                className="h-8 text-muted-foreground hover:text-primary font-bold text-[10px] uppercase px-2"
                              >
                                Détails
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(c.id_chambre)}
                                className="h-8 border-primary text-primary font-bold text-[10px] uppercase px-2"
                              >
                                Modifier
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive" 
                                    onClick={() => openDeleteConfirm(c.id_chambre)}
                                  >
                                    Supprimer définitivement
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                        {isAssignOpen && (
                          <tr className="bg-muted/10">
                            <td colSpan={5} className="p-4">
                                <div className="border border-dashed p-4 rounded-md bg-card">
                                  <div className="text-xs font-bold uppercase mb-4 text-primary">Équipements de la chambre {c.numero}</div>
                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
                                    {equipements.map(e => {
                                      const idStr = String(e.id_equipement)
                                      const isOwned = ids.includes(idStr)
                                      return (
                                        <label key={e.id_equipement} className={cn("flex items-center gap-2 border p-2 text-xs cursor-pointer hover:bg-muted/50", isOwned && "bg-primary/5 border-primary/20")}>
                                          <input 
                                            type="checkbox" 
                                            checked={isOwned}
                                            onChange={async (ev) => {
                                              try {
                                                await toggleEquipementForChambre({ id_chambre: c.id_chambre, id_equipement: e.id_equipement, checked: ev.target.checked })
                                                toast.success(ev.target.checked ? "Ajouté" : "Retiré")
                                              } catch (err) { toast.error("Erreur") }
                                            }}
                                          />
                                          {e.nom}
                                        </label>
                                      )
                                    })}
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
              <option value={50}>50</option>
            </select>
            <span>par page</span>
            <span className="ml-2 font-medium">{filtered.length} résultat(s)</span>
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
      <TabsContent value="types" className="mt-0">
        <Card className=" shadow-sm">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle>Gérer les types de chambre</CardTitle>
            <p className="text-sm text-muted-foreground">Définissez ici les catégories de chambres de votre hôtel.</p>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="space-y-4">
                  <Input value={catLibelle} onChange={e => setCatLibelle(e.target.value)} placeholder="Libelle (ex: Standard)" className="" />
                  <Input value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Description" className="" />
                  <Button className="w-full  shadow-sm" size="sm" onClick={async () => {
                    if (!catLibelle) return
                    await createOrUpdateCategorie({ id_categorie: editingCatId || undefined, libelle: catLibelle, description: catDesc || null })
                    setCatLibelle(""); setCatDesc(""); setEditingCatId(null)
                    toast.success("Enregistré")
                  }}>Enregistrer</Button>
               </div>
               <div className="lg:col-span-2 border  divide-y overflow-auto h-[300px] bg-background">
                  {categories.map(cat => (
                    <div key={cat.id_categorie} className="p-3 flex justify-between items-center text-sm hover:bg-muted/30 transition-colors">
                      <div>
                        <div className="font-bold">{cat.libelle}</div>
                        <div className="text-xs text-muted-foreground">{cat.description}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCatId(cat.id_categorie);
                            setCatLibelle(cat.libelle);
                            setCatDesc(cat.description || "");
                          }}
                          className="h-8 border-primary text-primary font-bold text-[10px] uppercase px-2"
                        >
                          Modifier
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive" 
                              onClick={() => {
                                setDeleteCatId(cat.id_categorie)
                                setCatDeleteConfirmOpen(true)
                              }}
                            >
                              Supprimer définitivement
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="equipements" className="mt-0">
        <EquipementsPage />
      </TabsContent>
      {user?.role === "admin" && (
        <TabsContent value="tarifs" className="mt-0">
          <GrilleTarifairePage />
        </TabsContent>
      )}
      <TabsContent value="incidents" className="mt-0">
        <IncidentsPage />
      </TabsContent>
    </Tabs>

      {/* Confirmation Suppression */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmation</DialogTitle>
            <DialogDescription className="sr-only">Confirmer la suppression</DialogDescription>
          </DialogHeader>
          <p className="py-4 text-sm">Supprimer la chambre {chambres.find(x => x.id_chambre === deleteChambreId)?.numero} ?</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulaire Chambre */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier" : "Nouvelle"} chambre</DialogTitle>
            <DialogDescription className="sr-only">Formulaire de chambre</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-sm font-medium">Numéro</label>
                 <Input value={numero} onChange={e => setNumero(e.target.value)} placeholder="101" />
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center justify-between">
                    Type
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 px-1.5 text-[10px] text-primary"
                      onClick={() => {
                        setEditingCatId(null)
                        setCatLibelle("")
                        setCatDesc("")
                        setIsCatFormOpen(true)
                      }}
                    >
                      + Nouveau type
                    </Button>
                  </label>
                  <select 
                    value={idCategorie} 
                    onChange={e => setIdCategorie(Number(e.target.value))}
                    className="w-full border border-input rounded-md h-10 px-3 text-sm bg-background text-foreground"
                  >
                    <option value={0}>Choisir...</option>
                    {categories.map(cat => <option key={cat.id_categorie} value={cat.id_categorie}>{cat.libelle}</option>)}
                  </select>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Détails de la chambre (vue, étage, etc.)"
                  className="min-h-[100px] resize-none"
                />
              </div>
             {formError && <p className="text-xs text-destructive font-bold">{formError}</p>}
          </div>
          <div className="flex justify-end gap-2">
             <Button variant="outline" onClick={() => setIsFormOpen(false)}>Annuler</Button>
             <Button onClick={async () => {
                if (!numero || idCategorie === 0) { setFormError("Veuillez remplir les champs"); return }
                setIsSaving(true)
                try {
                  await createOrUpdateChambre({ id_chambre: editing?.id_chambre, numero, id_categorie: idCategorie, description: description || null })
                  await logAction(user?.id_utilisateur || null, editing ? "MODIFICATION_CHAMBRE" : "CREATION_CHAMBRE", {
                    numero,
                    categorie: categories.find(c => c.id_categorie === idCategorie)?.libelle
                  });
                  setIsFormOpen(false)
                  toast.success("Succès")
                } catch (e) { 
                   const err = String(e)
                   if (err.includes("UNIQUE constraint failed")) {
                     setFormError("Ce numéro de chambre existe déjà.")
                   } else {
                     setFormError("Erreur lors de l'enregistrement.")
                   }
                 }
                setIsSaving(false)
             }} disabled={isSaving}>{isSaving ? "Sauvegarde..." : "Enregistrer"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Barre Latérale Détails Chambre */}
      <Sheet open={!!viewingChambreId} onOpenChange={(open) => !open && setViewingChambreId(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-4">
            <SheetTitle className="flex items-center gap-2">
              <BedDouble className="size-5 text-primary" />
              Détails de la Chambre {chambres.find(x => x.id_chambre === viewingChambreId)?.numero}
            </SheetTitle>
          </SheetHeader>
          {(() => {
            const c = chambres.find(x => x.id_chambre === viewingChambreId);
            if (!c) return null;
            const cat = categories.find(cat => cat.id_categorie === c.id_categorie);
            const eqIds = equipementsByChambre.get(String(c.id_chambre)) ?? [];
            const eqNames = eqIds.map(id => equipementById.get(id)).filter(Boolean);

            return (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                    <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Information Générale</div>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-black text-primary">Ch. {c.numero}</span>
                      <Badge className={cn("font-bold", getCategoryBadgeVariant(c.id_categorie))}>
                        {cat?.libelle || "—"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                    <Filter className="size-3" /> Description
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap min-h-[120px] max-h-[250px] overflow-y-auto break-all scrollbar-thin">
                    {c.description || "Aucune description enregistrée pour cette chambre."}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                    <Wrench className="size-3" /> Équipements disponibles
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {eqNames.length > 0 ? eqNames.map((n, i) => (
                      <Badge key={i} variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                        {n}
                      </Badge>
                    )) : (
                      <div className="text-xs text-muted-foreground italic bg-muted/50 w-full p-4 rounded-lg border border-dashed text-center">
                        Aucun équipement enregistré.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t mt-auto">
                   <Button variant="outline" className="w-full" onClick={() => setViewingChambreId(null)}>
                     Fermer le panneau
                   </Button>
                </div>
              </div>
            )
          })()}
        </SheetContent>
      </Sheet>

      {/* Formulaire Catégorie (Modal) */}
      <Dialog open={isCatFormOpen} onOpenChange={setIsCatFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau type de chambre</DialogTitle>
            <DialogDescription>Définissez une nouvelle catégorie pour vos chambres.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Libellé</label>
              <Input value={catLibelle} onChange={e => setCatLibelle(e.target.value)} placeholder="Ex: Suite Royale" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Détails de la catégorie..." className="min-h-[80px]" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCatFormOpen(false)}>Annuler</Button>
            <Button onClick={async () => {
              if (!catLibelle) return
              await createOrUpdateCategorie({ libelle: catLibelle, description: catDesc || null })
              setIsCatFormOpen(false)
              setCatLibelle("")
              setCatDesc("")
              toast.success("Catégorie ajoutée")
            }}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Suppression Catégorie */}
      <Dialog open={catDeleteConfirmOpen} onOpenChange={setCatDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la catégorie ?</DialogTitle>
            <DialogDescription>Cette action est irréversible et peut affecter les chambres liées.</DialogDescription>
          </DialogHeader>
          <p className="py-4 text-sm font-medium text-destructive">
            Attention : Toutes les chambres de type "{categories.find(c => c.id_categorie === deleteCatId)?.libelle}" perdront leur catégorie.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCatDeleteConfirmOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={async () => {
              if (deleteCatId) {
                await removeCategorie(deleteCatId)
                setCatDeleteConfirmOpen(false)
                setDeleteCatId(null)
                toast.success("Catégorie supprimée")
              }
            }}>Supprimer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

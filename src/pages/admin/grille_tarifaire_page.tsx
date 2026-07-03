import { Plus, Tag, AlertCircle, MoreHorizontal, Filter, Info } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { getCurrencySymbol } from "@/utils/currency"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"


import type {
  Tarif
} from "@/services/Tarif_service"
import {
  listTarifs,
  createTarif,
  updateTarif,
  deleteTarif,
} from "@/services/Tarif_service"
import { listCategories, type CategorieChambre } from "@/services/CategorieChambre_service"

type TarifFormValues = {
  nom: string
  montant: number
  description: string
}

export default function GrilleTarifairePage() {
  const [tarifs, setTarifs] = useState<Tarif[]>([])
  const [categories, setCategories] = useState<CategorieChambre[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTarif, setEditingTarif] = useState<Tarif | null>(null)
  const [viewingTarifId, setViewingTarifId] = useState<number | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const form = useForm<TarifFormValues>({
    defaultValues: {
      nom: "",
      montant: 0,
      description: "",
    },
  })

  const loadTarifs = async () => {
    try {
      setIsLoading(true)
      const [data, cats] = await Promise.all([
        listTarifs(),
        listCategories(),
      ])
      setTarifs(data)
      setCategories(cats)
    } catch (error) {
      toast.error("Erreur", { description: String(error) })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTarifs()
  }, [])

  const handleOpenCreate = () => {
    setEditingTarif(null)
    form.reset({
      nom: "",
      montant: 0,
      description: "",
    })
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (t: Tarif) => {
    setEditingTarif(t)
    form.reset({
      nom: t.nom,
      montant: t.montant,
      description: t.description || "",
    })
    setIsDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    setDeleteId(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    try {
      await deleteTarif(deleteId)
      toast.success("Tarif supprimé")
      setDeleteConfirmOpen(false)
      setDeleteId(null)
      loadTarifs()
    } catch (error) {
      toast.error("Erreur", { description: String(error) })
    }
  }

  const onSubmit = async (values: TarifFormValues) => {
    try {
      if (editingTarif) {
        await updateTarif(
          editingTarif.id_tarif,
          values.nom,
          "CHAMBRE",
          values.montant,
          false,
          values.description || null
        )
        toast.success("Tarif modifié avec succès")
      } else {
        await createTarif(
          values.nom,
          "CHAMBRE",
          values.montant,
          false,
          values.description || null
        )
        toast.success("Tarif créé avec succès")
      }
      setIsDialogOpen(false)
      loadTarifs()
    } catch (error) {
      toast.error("Erreur", { description: String(error) })
    }
  }

  const availableCategories = useMemo(() => {
    return categories.filter(c => 
      !tarifs.some(t => t.nom === c.libelle && t.type_tarif === "CHAMBRE") || 
      (editingTarif && editingTarif.nom === c.libelle)
    )
  }, [categories, tarifs, editingTarif])

  const allCategoriesPriced = categories.length > 0 && availableCategories.length === 0 && !editingTarif;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Tag className="h-8 w-8 text-primary" />
            Grille Tarifaire
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos tarifs fixes par catégorie de chambre.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="shadow-md transition-transform hover:scale-105">
          <Plus className="mr-2 h-4 w-4" /> Ajouter un tarif
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-lg">Liste des tarifs</CardTitle>
          <CardDescription>Tous les tarifs configurés dans le système.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Catégorie de Chambre</TableHead>
                <TableHead>Prix par nuit</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : tarifs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun tarif configuré
                  </TableCell>
                </TableRow>
              ) : (
                tarifs.filter(t => t.type_tarif === "CHAMBRE").map((tarif) => (
                  <TableRow key={tarif.id_tarif} className="group transition-colors">
                    <TableCell className="font-bold text-primary">
                      {tarif.nom}
                    </TableCell>
                    <TableCell className="font-semibold text-lg">
                      {tarif.montant.toLocaleString()} {getCurrencySymbol()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                      <div className="truncate" title={tarif.description || ""}>{tarif.description || "—"}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingTarifId(tarif.id_tarif)}
                          className="h-8 text-muted-foreground hover:text-primary font-bold text-[10px] uppercase px-2"
                        >
                          Détails
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(tarif)}
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
                            <DropdownMenuItem onClick={() => handleDelete(tarif.id_tarif)} className="text-destructive focus:text-destructive">
                              Supprimer définitivement
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTarif ? "Modifier le prix" : "Ajouter un prix"}</DialogTitle>
            <DialogDescription>
              Fixez le tarif par nuit pour une catégorie de chambre spécifique.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            {allCategoriesPriced ? (
              <Alert variant="destructive" className=" border-primary/50 bg-primary/5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Toutes les catégories sont déjà tarifées</AlertTitle>
                <AlertDescription className="text-xs">
                  Toutes vos catégories de chambres ont déjà un prix fixe. Vous devez soit :
                  <ul className="list-disc ml-4 mt-2 space-y-1">
                    <li>Modifier un prix existant dans la liste</li>
                    <li>Créer une nouvelle catégorie dans le menu "Chambres"</li>
                  </ul>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <label className="text-sm font-medium">Catégorie de chambre</label>
                    <Select onValueChange={(val) => form.setValue("nom", val)} value={form.watch("nom") || undefined}>
                      <SelectTrigger className="">
                        <SelectValue placeholder="Choisir une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map(c => (
                          <SelectItem key={c.id_categorie} value={c.libelle}>{c.libelle}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.nom && <p className="text-sm text-destructive">{form.formState.errors.nom.message}</p>}
                  </div>

                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <label className="text-sm font-medium">Prix par nuit (Ar)</label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        placeholder="Ex: 80000"
                        className=""
                        {...form.register("montant", { 
                          required: "Le montant est requis", 
                          min: { value: 0, message: "Doit être positif" }, 
                          valueAsNumber: true 
                        })} 
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground font-bold">
                        {getCurrencySymbol()}
                      </div>
                    </div>
                    {form.formState.errors.montant && <p className="text-sm text-destructive">{form.formState.errors.montant.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Optionnel)</label>
                  <textarea 
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="Détails du tarif..." 
                    {...form.register("description")} 
                  />
                </div>
              </>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="">
                Annuler
              </Button>
              {!allCategoriesPriced && (
                <Button type="submit" className="">Enregistrer</Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Barre Latérale Détails Tarif */}
      <Sheet open={!!viewingTarifId} onOpenChange={(open) => !open && setViewingTarifId(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Tag className="size-5 text-primary" />
              Détails du Tarif
            </SheetTitle>
          </SheetHeader>
          {(() => {
            const t = tarifs.find(x => x.id_tarif === viewingTarifId);
            if (!t) return null;

            return (
              <div className="space-y-6">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Catégorie</div>
                  <div className="text-2xl font-black text-primary uppercase">{t.nom}</div>
                </div>

                <div className="bg-muted/50 p-4 rounded-xl border border-primary/5">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Prix de base par nuit</div>
                  <div className="text-3xl font-black text-foreground">{t.montant.toLocaleString()} {getCurrencySymbol()}</div>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-2">
                    <Filter className="size-3" /> Description & Conditions
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap min-h-[120px] max-h-[300px] overflow-y-auto break-all scrollbar-thin">
                    {t.description || "Aucune description spécifique pour ce tarif."}
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 flex gap-3">
                   <Info className="size-5 text-blue-500 flex-shrink-0 mt-0.5" />
                   <div className="text-[11px] text-blue-700 dark:text-blue-400 leading-normal">
                     Ce tarif s'applique automatiquement à toutes les chambres de type <strong>{t.nom}</strong> lors de la création d'une nouvelle réservation ou d'un séjour.
                   </div>
                </div>

                <div className="pt-6 border-t mt-auto">
                   <Button variant="outline" className="w-full" onClick={() => setViewingTarifId(null)}>
                     Fermer
                   </Button>
                </div>
              </div>
            )
          })()}
        </SheetContent>
      </Sheet>

      {/* Confirmation Suppression Tarif */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce tarif ?</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le tarif de la catégorie "{tarifs.find(t => t.id_tarif === deleteId)?.nom}" ?
            </DialogDescription>
          </DialogHeader>
          <p className="py-4 text-sm font-medium text-destructive">
            Attention : Cela n'affectera pas les réservations déjà existantes, mais ce tarif ne sera plus proposé pour les nouvelles saisies.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmDelete}>Supprimer définitivement</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

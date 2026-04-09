import { Fragment, useMemo, useState } from "react"
import { toast } from "sonner"

import { useClients } from "@/components/client/useClients"
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
import { ChevronDown, Loader2, Plus, Search, Users, Filter, ArrowRight, Mail, Phone, User } from "lucide-react"
import { cn } from "@/lib/utils"

type ColKey = "nom" | "prenom" | "telephone" | "email"

export default function ClientsPage() {
  const {
    isLoading,
    error,
    clients,
    stats,
    createOrUpdateClient,
    removeClient,
  } = useClients()

  const [filters, setFilters] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
  })
  const [sort, setSort] = useState<{ key: ColKey; dir: "asc" | "desc" } | null>(null)
  const [colMenuOpen, setColMenuOpen] = useState(false)
  const [colMenuKey, setColMenuKey] = useState<ColKey>("nom")

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [telephone, setTelephone] = useState("")
  const [email, setEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteClientId, setDeleteClientId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const qNom = filters.nom.trim().toLowerCase()
      const qPrenom = filters.prenom.trim().toLowerCase()
      const qTel = filters.telephone.trim().toLowerCase()
      const qEmail = filters.email.trim().toLowerCase()

      if (qNom && !c.nom.toLowerCase().includes(qNom)) return false
      if (qPrenom && !(c.prenom ?? "").toLowerCase().includes(qPrenom)) return false
      if (qTel && !(c.telephone ?? "").toLowerCase().includes(qTel)) return false
      if (qEmail && !(c.email ?? "").toLowerCase().includes(qEmail)) return false
      return true
    })
  }, [clients, filters])

  const displayed = useMemo(() => {
    const arr = [...filtered]
    if (!sort) return arr
    const dir = sort.dir === "asc" ? 1 : -1

    return arr.sort((a, b) => {
      const va = sort.key === "nom" ? a.nom :
        sort.key === "prenom" ? (a.prenom ?? "") :
        sort.key === "telephone" ? (a.telephone ?? "") :
        (a.email ?? "")
      const vb = sort.key === "nom" ? b.nom :
        sort.key === "prenom" ? (b.prenom ?? "") :
        sort.key === "telephone" ? (b.telephone ?? "") :
        (b.email ?? "")
      return va.localeCompare(vb) * dir
    })
  }, [filtered, sort])

  function openColumnMenu(key: ColKey) {
    setColMenuKey(key)
    setColMenuOpen(true)
  }

  const editing = useMemo(
    () => clients.find((c) => c.id_client === editingId) ?? null,
    [clients, editingId]
  )

  function openCreate() {
    setEditingId(null)
    setNom("")
    setPrenom("")
    setTelephone("")
    setEmail("")
    setFormError(null)
    setIsFormOpen(true)
  }

  function openEdit(id: number) {
    const c = clients.find((x) => x.id_client === id)
    setEditingId(id)
    setNom(c?.nom ?? "")
    setPrenom(c?.prenom ?? "")
    setTelephone(c?.telephone ?? "")
    setEmail(c?.email ?? "")
    setFormError(null)
    setIsFormOpen(true)
  }

  function openDeleteConfirm(id: number) {
    setDeleteClientId(id)
    setDeleteConfirmOpen(true)
  }

  async function handleDelete() {
    if (!deleteClientId) return
    setIsDeleting(true)
    try {
      await removeClient(deleteClientId)
      toast.success("Client supprimé avec succès")
      setDeleteConfirmOpen(false)
      setDeleteClientId(null)
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
          <div className="flex h-10 w-10 items-center justify-center rounded-none bg-primary/10 text-muted-foreground">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestion des clients</h1>
            <p className="text-sm text-muted-foreground">
              {clients.length} client{clients.length > 1 ? "s" : ""} enregistré{clients.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <Plus className="size-4" />
          Nouveau client
        </Button>
      </div>

      {/* Stats KPI - cartes individuelles style dashboard */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total clients */}
        <div className="group relative flex h-20 items-center gap-4 overflow-hidden rounded-none bg-primary p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-white/20">
            <Users className="size-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-primary-foreground">{stats.total}</div>
            <div className="text-sm font-medium text-primary-foreground/90">Total clients</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-secondary text-secondary-foreground transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>

        {/* Clients avec email */}
        <div className="group relative flex h-20 items-center gap-4 overflow-hidden rounded-none bg-secondary p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-secondary/90">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-primary/10">
            <Mail className="size-7 text-secondary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-secondary-foreground">{stats.withEmail}</div>
            <div className="text-sm font-medium text-secondary-foreground/90">Clients avec email</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-secondary text-secondary-foreground transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>

        {/* Clients avec téléphone */}
        <div className="group relative flex h-20 items-center gap-4 overflow-hidden rounded-none bg-card border border-border p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:bg-muted">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-primary/10">
            <Phone className="size-7 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-foreground">{stats.withPhone}</div>
            <div className="text-sm font-medium text-muted-foreground">Clients avec téléphone</div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none bg-secondary text-secondary-foreground transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="size-5" />
          </div>
        </div>
      </div>

      {/* Main content - Table */}
      <Card className="overflow-hidden border shadow-sm transition-shadow hover:shadow-md rounded-none">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Liste des clients</CardTitle>
            <Badge variant="secondary" className="ml-2 rounded-none">
              {filtered.length}/{clients.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={filters.nom}
                onChange={(e) => setFilters(p => ({ ...p, nom: e.target.value }))}
                className="w-64 pl-9 rounded-none"
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
              <Alert variant="destructive" className="max-w-md rounded-none">
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
                        onClick={() => openColumnMenu("nom")}
                      >
                        Nom
                        <ChevronDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
                        onClick={() => openColumnMenu("prenom")}
                      >
                        Prénom
                        <ChevronDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
                        onClick={() => openColumnMenu("telephone")}
                      >
                        Téléphone
                        <ChevronDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      <button
                        type="button"
                        className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
                        onClick={() => openColumnMenu("email")}
                      >
                        Email
                        <ChevronDown className="size-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="size-8 opacity-20" />
                          <p>Aucun client trouvé</p>
                          <p className="text-sm">Essayez de modifier vos filtres</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayed.map((c, index) => (
                      <Fragment key={c.id_client}>
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
                              <div className="flex h-8 w-8 items-center justify-center rounded-none bg-primary text-primary-foreground font-semibold text-sm">
                                <User className="size-4" />
                              </div>
                              <span className="font-semibold text-foreground">{c.nom}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-muted-foreground">{c.prenom || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm">{c.telephone || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-muted-foreground">{c.email || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(c.id_client)}
                                className="h-8 border-primary text-muted-foreground hover:bg-primary hover:text-muted-foreground-foreground rounded-none"
                              >
                                Modifier
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteConfirm(c.id_client)}
                                className="h-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-none"
                              >
                                Supprimer
                              </Button>
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter/Sort Dialog */}
      <Dialog open={colMenuOpen} onOpenChange={setColMenuOpen}>
        <DialogContent className="sm:max-w-md rounded-none">
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
                onChange={(e) => setFilters(p => ({ ...p, [colMenuKey]: e.target.value }))}
                placeholder="Contient..."
                className="rounded-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSort({ key: colMenuKey, dir: "asc" })}
                className={cn(sort?.key === colMenuKey && sort?.dir === "asc" && "border-primary", "rounded-none")}
              >
                Trier A → Z
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSort({ key: colMenuKey, dir: "desc" })}
                className={cn(sort?.key === colMenuKey && sort?.dir === "desc" && "border-primary", "rounded-none")}
              >
                Trier Z → A
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFilters(p => ({ ...p, [colMenuKey]: "" }))}
                className="rounded-none"
              >
                Effacer filtre
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSort(null)}
                className="rounded-none"
              >
                Effacer tri
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Modifier le client ${editing.nom}` : "Nouveau client"}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations du client.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom</label>
                <Input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Dupont"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prénom</label>
                <Input
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  placeholder="Ex: Jean"
                  className="rounded-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Téléphone</label>
                <Input
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="Ex: 0123456789"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: jean.dupont@email.com"
                  className="rounded-none"
                />
              </div>
            </div>
            {formError && (
              <Alert variant="destructive" className="rounded-none">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-none"
                onClick={() => {
                  setIsFormOpen(false)
                  setEditingId(null)
                }}
              >
                Annuler
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-none"
                disabled={isSaving}
                onClick={async () => {
                  setFormError(null)
                  if (!nom.trim()) {
                    setFormError("Nom obligatoire")
                    return
                  }
                  setIsSaving(true)
                  try {
                    await createOrUpdateClient({
                      id_client: editing?.id_client,
                      nom: nom.trim(),
                      prenom: prenom.trim() || null,
                      telephone: telephone.trim() || null,
                      email: email.trim() || null,
                    })
                    toast.success(editing ? "Client modifié avec succès" : "Client créé avec succès")
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
        <DialogContent className="sm:max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setDeleteClientId(null)
              }}
              disabled={isDeleting}
              className="rounded-none"
            >
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-none"
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

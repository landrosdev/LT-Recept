import { useMemo, useState } from "react"
import { toast } from "sonner"
import { logAction } from "@/services/Audit_service"
import { useAuth } from "@/hooks/useAuth"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Loader2, Plus, Search, Users, Filter, MoreHorizontal } from "lucide-react"

type ColKey = "nom" | "prenom" | "telephone" | "cin" | "email"

export default function ClientsPage() {
  const { user } = useAuth()
  const {
    isLoading,
    clients,
    createOrUpdateClient,
    removeClient,
  } = useClients()

  const [filters, setFilters] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    cin: "",
    email: "",
  })
  
  // Reset page when filters change
  const updateFilters = (newFilters: any) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const [sort, setSort] = useState<{ key: ColKey; dir: "asc" | "desc" } | null>(null)
  const [colMenuOpen, setColMenuOpen] = useState(false)
  const [colMenuKey, setColMenuKey] = useState<ColKey>("nom")

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [telephone, setTelephone] = useState("")
  const [cin, setCin] = useState("")
  const [email, setEmail] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteClientId, setDeleteClientId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const qNom = filters.nom.trim().toLowerCase()
      const qPrenom = filters.prenom.trim().toLowerCase()
      const qTel = filters.telephone.trim().toLowerCase()
      const qCin = filters.cin.trim().toLowerCase()
      const qEmail = filters.email.trim().toLowerCase()

      if (qNom && !(c.nom || "").toLowerCase().includes(qNom)) return false
      if (qPrenom && !(c.prenom ?? "").toLowerCase().includes(qPrenom)) return false
      if (qTel && !(c.telephone ?? "").toLowerCase().includes(qTel)) return false
      if (qCin && !(c.cin ?? "").toLowerCase().includes(qCin)) return false
      if (qEmail && !(c.email ?? "").toLowerCase().includes(qEmail)) return false
      return true
    })
  }, [clients, filters])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    if (!sort) return arr
    const dir = sort.dir === "asc" ? 1 : -1

    return arr.sort((a, b) => {
      const va = sort.key === "nom" ? (a.nom || "") :
        sort.key === "prenom" ? (a.prenom ?? "") :
        sort.key === "telephone" ? (a.telephone ?? "") :
        sort.key === "cin" ? (a.cin ?? "") :
        (a.email ?? "")
      const vb = sort.key === "nom" ? (b.nom || "") :
        sort.key === "prenom" ? (b.prenom ?? "") :
        sort.key === "telephone" ? (b.telephone ?? "") :
        sort.key === "cin" ? (b.cin ?? "") :
        (b.email ?? "")
      return va.localeCompare(vb) * dir
    })
  }, [filtered, sort])

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE)
  const displayed = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return sorted.slice(start, start + ITEMS_PER_PAGE)
  }, [sorted, currentPage])

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
    setCin("")
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
    setCin(c?.cin ?? "")
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
      const client = clients.find(c => c.id_client === deleteClientId);
      await removeClient(deleteClientId)
      await logAction(user?.id_utilisateur || null, "SUPPRESSION_CLIENT", {
        id_client: deleteClientId,
        nom: client ? `${client.prenom || ""} ${client.nom}`.trim() : "Inconnu"
      });
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center  bg-primary/10 text-muted-foreground">
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

      <Card className="overflow-hidden border shadow-sm transition-shadow hover:shadow-md ">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Liste des clients</CardTitle>
            <Badge variant="secondary" className="ml-2 ">
              {filtered.length}/{clients.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom..."
                value={filters.nom}
                onChange={(e) => updateFilters((p: any) => ({ ...p, nom: e.target.value }))}
                className="w-64 pl-9 "
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full">
                <thead className="bg-muted text-xs uppercase tracking-wider">
                  <tr className="border-b-2 border-primary">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer" onClick={() => openColumnMenu("nom")}>Nom</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer" onClick={() => openColumnMenu("prenom")}>Prénom</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer" onClick={() => openColumnMenu("cin")}>CIN</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer" onClick={() => openColumnMenu("telephone")}>Téléphone</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground italic">Aucun client trouvé</td>
                    </tr>
                  ) : (
                    displayed.map((c) => (
                      <tr key={c.id_client} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-semibold">{c.nom || "—"}</td>
                        <td className="px-4 py-3">{c.prenom || "—"}</td>
                        <td className="px-4 py-3 text-xs">{c.cin || "—"}</td>
                        <td className="px-4 py-3 text-sm">{c.telephone || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(c.id_client)}
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
                                  onClick={() => openDeleteConfirm(c.id_client)}
                                >
                                  Supprimer définitivement
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        {totalPages >= 1 && (
          <div className="flex items-center justify-between border-t bg-muted/20 px-4 py-3">
            <div className="text-xs text-muted-foreground font-medium">
              Page {currentPage} sur {totalPages} ({filtered.length} clients)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-none px-4"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-none px-4"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg ">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier Client" : "Nouveau Client"}</DialogTitle>
            <DialogDescription>Note: Le nom ou le prénom est obligatoire.</DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground tracking-tighter">Nom</label>
                <Input value={nom} onChange={e => setNom(e.target.value)} placeholder="Dupont" className="" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground tracking-tighter">Prénom</label>
                <Input value={prenom} onChange={e => setPrenom(e.target.value)} placeholder="Jean" className="" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground tracking-tighter">Téléphone</label>
                <Input value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="01..." className="" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground tracking-tighter">CIN / ID</label>
                <Input value={cin} onChange={e => setCin(e.target.value)} placeholder="Numéro CIN" className="" />
              </div>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground tracking-tighter">Email</label>
                <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" className="" />
            </div>

            {formError && <Alert variant="destructive" className=""><AlertDescription>{formError}</AlertDescription></Alert>}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 " onClick={() => setIsFormOpen(false)}>Annuler</Button>
              <Button className="flex-1  shadow-indigo-500/20 shadow-lg" disabled={isSaving} onClick={async () => {
                 setFormError(null)
                 if (!nom.trim() && !prenom.trim()) {
                   setFormError("Vous devez renseigner au moins un Nom ou un Prénom.")
                   return
                 }
                 setIsSaving(true)
                 try {
                   await createOrUpdateClient({
                     id_client: editing?.id_client,
                     nom: nom.trim() || null,
                     prenom: prenom.trim() || null,
                     telephone: telephone.trim() || null,
                     cin: cin.trim() || null,
                     email: email.trim() || null
                   })
                   await logAction(user?.id_utilisateur || null, editing ? "MODIFICATION_CLIENT" : "CREATION_CLIENT", {
                     nom: `${prenom} ${nom}`.trim(),
                     cin: cin
                   });
                   toast.success("Client enregistré")
                   setIsFormOpen(false)
                 } catch (e) {
                   setFormError("Erreur lors de l'enregistrement")
                 } finally {
                   setIsSaving(false)
                 }
              }}>
                {isSaving ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Colonne Menu Dialog */}
      <Dialog open={colMenuOpen} onOpenChange={setColMenuOpen}>
        <DialogContent className="sm:max-w-xs ">
          <DialogHeader>
            <DialogTitle>Filtrer/Trier {colMenuKey}</DialogTitle>
            <DialogDescription className="sr-only">Options de filtre et tri</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
             <Input value={filters[colMenuKey]} onChange={e => updateFilters((p: any) => ({...p, [colMenuKey]: e.target.value}))} placeholder="Chercher..." className="" />
             <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="" onClick={() => { setSort({key: colMenuKey, dir: 'asc'}); setCurrentPage(1); }}>A-Z</Button>
                <Button variant="outline" size="sm" className="" onClick={() => { setSort({key: colMenuKey, dir: 'desc'}); setCurrentPage(1); }}>Z-A</Button>
             </div>
             <Button variant="ghost" className="w-full text-xs" onClick={() => { updateFilters((p: any) => ({...p, [colMenuKey]: ""})); setSort(null); }}>Réinitialiser</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md ">
          <DialogHeader>
            <DialogTitle>Confirmer suppression</DialogTitle>
            <DialogDescription className="sr-only">Confirmation de suppression du client</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Voulez-vous vraiment supprimer ce client ?</p>
          <div className="flex justify-end gap-2 pt-4">
             <Button variant="outline" className="" onClick={() => setDeleteConfirmOpen(false)}>Annuler</Button>
             <Button variant="destructive" className="" onClick={handleDelete} disabled={isDeleting}>Supprimer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

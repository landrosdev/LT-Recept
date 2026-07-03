import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import {
  listUtilisateurs,
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur,
  type Utilisateur,
  type UtilisateurInput
} from "@/services/Utilisateur_service"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Loader2, Plus, Search, Filter, Users, Shield, UserCheck } from "lucide-react"

import { logAction } from "@/services/Audit_service"
import { useAuth } from "@/hooks/useAuth"
import { UtilisateurList } from "@/components/utilisateur/UtilisateurList"
import { UtilisateurForm } from "@/components/utilisateur/UtilisateurForm"

export default function UtilisateursPage() {
  const { user } = useAuth()
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState("")

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Utilisateur | null>(null)

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const data = await listUtilisateurs()
        setUtilisateurs(data)
      } catch (e) {
        console.error(e)
        setError("Impossible de charger les utilisateurs")
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Derived Stats
  const stats = useMemo(() => {
    const total = utilisateurs.length
    const actifs = utilisateurs.filter(u => u.is_active === 1).length
    const admins = utilisateurs.filter(u => u.role === "admin").length
    return { total, actifs, admins }
  }, [utilisateurs])

  const filtered = useMemo(() => {
    return utilisateurs.filter(u => {
      if (search) {
        return u.nom_user.toLowerCase().includes(search.toLowerCase())
      }
      return true
    })
  }, [utilisateurs, search])

  // Handlers
  async function handleSave(data: UtilisateurInput) {
    if (editingUser) {
      const updated = await updateUtilisateur(editingUser.id_utilisateur, data)
      await logAction(user?.id_utilisateur || null, "MODIFICATION_UTILISATEUR", {
        nom_user: data.nom_user,
        role: data.role
      });
      setUtilisateurs(prev => prev.map(u => u.id_utilisateur === editingUser.id_utilisateur ? updated : u))
      toast.success("Utilisateur mis à jour")
    } else {
      const created = await createUtilisateur(data)
      await logAction(user?.id_utilisateur || null, "CREATION_UTILISATEUR", {
        nom_user: data.nom_user,
        role: data.role
      });
      setUtilisateurs(prev => [...prev, created])
      toast.success("Utilisateur créé")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const userToDelete = utilisateurs.find(u => u.id_utilisateur === deleteId);
      await deleteUtilisateur(deleteId)
      await logAction(user?.id_utilisateur || null, "SUPPRESSION_UTILISATEUR", {
        id_utilisateur: deleteId,
        nom_user: userToDelete?.nom_user || "Inconnu"
      });
      setUtilisateurs(prev => prev.filter(u => u.id_utilisateur !== deleteId))
      toast.success("Utilisateur supprimé")
      setDeleteConfirmOpen(false)
    } catch (e) {
      const err = String(e)
      if (err.includes("FOREIGN KEY")) {
        toast.error("Impossible de supprimer cet utilisateur car il a des logs d'audit.")
      } else {
        toast.error("Erreur lors de la suppression")
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center  bg-primary/10 text-primary">
            <Users className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
            <p className="text-sm text-muted-foreground">
              Gestion des comptes et des permissions
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null)
            setIsFormOpen(true)
          }}
          className="gap-2 shadow-sm hover:shadow-md "
        >
          <Plus className="size-4" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-6">
        <Card className="shadow-sm border-none bg-card">
          <CardContent className="kpi-card-content flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold tracking-tight truncate mb-0.5">{stats.total}</div>
              <div className="text-[9px] text-muted-foreground font-medium truncate">Total utilisateurs</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-card">
          <CardContent className="kpi-card-content flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <UserCheck className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold tracking-tight truncate mb-0.5">{stats.actifs}</div>
              <div className="text-[9px] text-muted-foreground font-medium truncate">Utilisateurs actifs</div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-card">
          <CardContent className="kpi-card-content flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
              <Shield className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-base font-bold tracking-tight truncate mb-0.5">{stats.admins}</div>
              <div className="text-[9px] text-muted-foreground font-medium truncate">Administrateurs</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <Card className=" border shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/30 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Liste des utilisateurs</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-9 "
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
            <UtilisateurList
              utilisateurs={filtered}
              currentUserId={user?.id_utilisateur}
              onEdit={(user) => {
                setEditingUser(user)
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

      <UtilisateurForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingUser={editingUser}
        onSave={handleSave}
      />

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md ">
          <DialogHeader>
            <DialogTitle>Supprimer ?</DialogTitle>
            <DialogDescription>Cette action est irréversible.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="">Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="">
              {isDeleting ? <Loader2 className="size-4 animate-spin" /> : "Supprimer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

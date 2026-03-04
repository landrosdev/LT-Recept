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

import { UtilisateurList } from "@/components/utilisateur/UtilisateurList"
import { UtilisateurForm } from "@/components/utilisateur/UtilisateurForm"

export default function UtilisateursPage() {
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
    const actifs = utilisateurs.filter(u => u.statut === "ACTIF").length
    const admins = utilisateurs.filter(u => u.admin === 1).length
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
      setUtilisateurs(prev => prev.map(u => u.id_utilisateur === editingUser.id_utilisateur ? updated : u))
      toast.success("Utilisateur mis à jour")
    } else {
      const created = await createUtilisateur(data)
      setUtilisateurs(prev => [...prev, created])
      toast.success("Utilisateur créé")
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      await deleteUtilisateur(deleteId)
      setUtilisateurs(prev => prev.filter(u => u.id_utilisateur !== deleteId))
      toast.success("Utilisateur supprimé")
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
          className="gap-2 shadow-sm hover:shadow-md rounded-none"
        >
          <Plus className="size-4" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-primary p-4 shadow-sm hover:brightness-110 transition-all">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-primary/10">
            <Users className="size-7 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-primary-foreground">{stats.total}</div>
            <div className="text-sm font-medium text-primary-foreground/90">Total utilisateurs</div>
          </div>
        </div>

        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-emerald-600 p-4 shadow-sm hover:brightness-110 transition-all">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-primary/10">
            <UserCheck className="size-7 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-primary-foreground">{stats.actifs}</div>
            <div className="text-sm font-medium text-primary-foreground/90">Comptes actifs</div>
          </div>
        </div>

        <div className="group relative flex h-24 items-center gap-4 overflow-hidden rounded-none bg-blue-600 p-4 shadow-sm hover:brightness-110 transition-all">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-primary/10">
            <Shield className="size-7 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-2xl font-bold text-primary-foreground">{stats.admins}</div>
            <div className="text-sm font-medium text-primary-foreground/90">Administrateurs</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <Card className="rounded-none border shadow-sm">
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
            <UtilisateurList
              utilisateurs={filtered}
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
        <DialogContent className="sm:max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle>Supprimer ?</DialogTitle>
            <DialogDescription>Cette action est irréversible.</DialogDescription>
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
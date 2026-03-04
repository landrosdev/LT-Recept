import { useState, useEffect } from "react"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import type { UtilisateurInput, Utilisateur } from "@/services/Utilisateur_service"

// Checking component.json or structure for Checkbox
// Using standard input type=checkbox or switch if UI components not fully known, 
// but sticking to standard Select for roles is safer.

interface UtilisateurFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingUser: Utilisateur | null
  onSave: (data: UtilisateurInput) => Promise<void>
}

export function UtilisateurForm({
  open,
  onOpenChange,
  editingUser,
  onSave,
}: UtilisateurFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState<UtilisateurInput>({
    nom_user: "",
    mot_de_passe: "",
    statut: "ACTIF",
    admin: 0,
  })

  useEffect(() => {
    if (editingUser) {
      setFormData({
        nom_user: editingUser.nom_user,
        mot_de_passe: editingUser.mot_de_passe,
        statut: editingUser.statut as "ACTIF" | "INACTIF",
        admin: editingUser.admin,
      })
    } else {
      setFormData({
        nom_user: "",
        mot_de_passe: "",
        statut: "ACTIF",
        admin: 0,
      })
    }
    setError(null)
    setShowPassword(false)
  }, [editingUser, open])

  async function handleSubmit() {
    setError(null)
    if (!formData.nom_user.trim()) {
      setError("Le nom d'utilisateur est requis")
      return
    }
    if (!formData.mot_de_passe.trim()) {
      setError("Le mot de passe est requis")
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        ...formData,
        nom_user: formData.nom_user.trim(),
      })
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-none">
        <DialogHeader>
          <DialogTitle>
            {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </DialogTitle>
          <DialogDescription>
            Gestion des accès et des rôles
          </DialogDescription>
        </DialogHeader>
        <Separator />
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nom d'utilisateur *</label>
            <Input
              value={formData.nom_user}
              onChange={(e) => setFormData(p => ({ ...p, nom_user: e.target.value }))}
              placeholder="Ex: admin"
              className="rounded-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Mot de passe *</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={formData.mot_de_passe}
                onChange={(e) => setFormData(p => ({ ...p, mot_de_passe: e.target.value }))}
                className="rounded-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {editingUser && (
              <p className="text-xs text-muted-foreground">
                Laisser tel quel pour ne pas changer
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select
                value={formData.statut}
                onValueChange={(v) => setFormData(p => ({ ...p, statut: v as any }))}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="ACTIF">Actif</SelectItem>
                  <SelectItem value="INACTIF">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Rôle</label>
              <Select
                value={String(formData.admin)}
                onValueChange={(v) => setFormData(p => ({ ...p, admin: Number(v) }))}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="0">Utilisateur</SelectItem>
                  <SelectItem value="1">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-none mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-none">
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="rounded-none min-w-24">
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

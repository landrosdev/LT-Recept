import { useState, useEffect } from "react"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
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
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "../ui/checkbox"
import type { UtilisateurInput, Utilisateur } from "@/services/Utilisateur_service"

const MODULES = [
  { id: "arrivee_depart", label: "Arrivée / Départ" },
  { id: "reservations", label: "Réservations" },
  { id: "chambres", label: "Chambres" },
  { id: "clients", label: "Clients" },
  { id: "factures", label: "Factures" },
  { id: "incidents", label: "Incidents" },
  { id: "taches", label: "Tâches" },
  { id: "historique", label: "Historique" },
  { id: "parametres", label: "Paramètres" },
  { id: "utilisateurs", label: "Utilisateurs" },
] as const;

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
    nom: "",
    prenom: "",
    nom_user: "",
    mot_de_passe: "",
    role: "user",
    permissions: "dashboard",
    is_active: 1,
  })

  useEffect(() => {
    if (editingUser) {
      setFormData({
        nom: editingUser.nom || "",
        prenom: editingUser.prenom || "",
        nom_user: editingUser.nom_user,
        mot_de_passe: editingUser.mot_de_passe,
        role: editingUser.role,
        permissions: editingUser.permissions,
        is_active: editingUser.is_active,
      })
    } else {
      setFormData({
        nom: "",
        prenom: "",
        nom_user: "",
        mot_de_passe: "",
        role: "user",
        permissions: "dashboard",
        is_active: 1,
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
      // For admins, we just set permissions to '*'
      const finalPermissions = formData.role === "admin" ? "*" : formData.permissions;
      
      await onSave({
        ...formData,
        permissions: finalPermissions,
        nom_user: formData.nom_user.trim(),
      })
      onOpenChange(false)
    } catch (e) {
      console.error(e)
      const err = String(e)
      if (err.includes("UNIQUE constraint failed")) {
        setError("Ce nom d'utilisateur est déjà utilisé par un autre compte.")
      } else if (err.includes("FOREIGN KEY")) {
        setError("Impossible de modifier cet utilisateur car il est lié à d'autres données.")
      } else {
        setError(e instanceof Error ? e.message : String(e))
      }
    } finally {
      setIsLoading(false)
    }
  }

  function togglePermission(id: string) {
    const current = formData.permissions.split(",").filter(Boolean);
    let updated: string[];
    if (current.includes(id)) {
      updated = current.filter(p => p !== id);
    } else {
      updated = [...current, id];
    }
    setFormData(p => ({ ...p, permissions: updated.join(",") }));
  }

  function isPermissionChecked(id: string) {
    if (formData.role === "admin") return true;
    return formData.permissions.split(",").includes(id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl rounded-none">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">
            {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
          </DialogTitle>
          <DialogDescription className="text-xs uppercase font-medium text-muted-foreground">
            Configuration des accès et des rôles de sécurité
          </DialogDescription>
        </DialogHeader>
        <Separator />
        
        <div className="grid gap-6 py-4">
          {/* Main Info Grid - 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground">Nom</label>
              <Input
                value={formData.nom || ""}
                onChange={(e) => setFormData(p => ({ ...p, nom: e.target.value || null }))}
                placeholder="Ex: Dupont"
                className="rounded-none h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground">Prénom</label>
              <Input
                value={formData.prenom || ""}
                onChange={(e) => setFormData(p => ({ ...p, prenom: e.target.value || null }))}
                placeholder="Ex: Jean"
                className="rounded-none h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-primary">Nom d'utilisateur *</label>
              <Input
                value={formData.nom_user}
                onChange={(e) => setFormData(p => ({ ...p, nom_user: e.target.value }))}
                placeholder="Ex: admin"
                className="rounded-none h-10 border-primary/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-primary">Mot de passe *</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.mot_de_passe}
                  onChange={(e) => setFormData(p => ({ ...p, mot_de_passe: e.target.value }))}
                  className="rounded-none h-10 pr-10 border-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground">Rôle système</label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData(p => ({ ...p, role: v as "admin" | "user" }))}
              >
                <SelectTrigger className="rounded-none h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="user">Utilisateur Standard</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground">Statut du compte</label>
              <Select
                value={String(formData.is_active)}
                onValueChange={(v) => setFormData(p => ({ ...p, is_active: Number(v) }))}
              >
                <SelectTrigger className="rounded-none h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="1">ACTIF</SelectItem>
                  <SelectItem value="0">INACTIF / BLOQUÉ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Permissions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider">Permissions de modules</label>
              {formData.role === "admin" && (
                <Badge className="bg-primary/20 text-primary border-primary/30 rounded-none text-[9px] uppercase font-black">
                  Accès Total Illimité
                </Badge>
              )}
            </div>
            
            <div className={cn(
              "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 p-4 border bg-muted/5",
              formData.role === "admin" && "opacity-40 pointer-events-none grayscale"
            )}>
              {MODULES.map((mod) => (
                <div key={mod.id} className="flex items-center space-x-3 group cursor-pointer hover:bg-muted p-1 transition-colors">
                  <Checkbox 
                    id={`perm-${mod.id}`}
                    checked={isPermissionChecked(mod.id)}
                    onCheckedChange={() => togglePermission(mod.id)}
                    disabled={formData.role === "admin"}
                    className="rounded-none border-primary/40 data-[state=checked]:bg-primary"
                  />
                  <label 
                    htmlFor={`perm-${mod.id}`}
                    className="text-[11px] font-bold uppercase cursor-pointer leading-none peer-disabled:cursor-not-allowed text-muted-foreground group-hover:text-foreground"
                  >
                    {mod.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="rounded-none mb-4 py-2 border-l-4">
            <AlertDescription className="text-xs font-bold">{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-none text-xs uppercase font-bold">
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="rounded-none min-w-32 bg-primary text-xs uppercase font-black tracking-widest">
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

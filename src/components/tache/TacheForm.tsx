import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
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
import type { TacheInput, Tache } from "@/services/Tache_service"

interface TacheFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTache: Tache | null
  onSave: (data: TacheInput) => Promise<void>
}

export function TacheForm({
  open,
  onOpenChange,
  editingTache,
  onSave,
}: TacheFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<TacheInput>({
    date_tache: new Date().toISOString().split("T")[0],
    description: "",
    priorite: "MOYENNE",
    responsable: "",
    statut: "A_FAIRE",
  })

  useEffect(() => {
    if (editingTache) {
      setFormData({
        date_tache: editingTache.date_tache.split("T")[0],
        description: editingTache.description,
        priorite: editingTache.priorite as any,
        responsable: editingTache.responsable ?? "",
        statut: editingTache.statut as any,
      })
    } else {
      setFormData({
        date_tache: new Date().toISOString().split("T")[0],
        description: "",
        priorite: "MOYENNE",
        responsable: "",
        statut: "A_FAIRE",
      })
    }
    setError(null)
  }, [editingTache, open])

  async function handleSubmit() {
    setError(null)
    if (!formData.description.trim()) {
      setError("La description est requise")
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        ...formData,
        description: formData.description.trim(),
        responsable: formData.responsable?.trim() || null,
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
      <DialogContent className="sm:max-w-lg rounded-none">
        <DialogHeader>
          <DialogTitle>
            {editingTache ? "Modifier la tâche" : "Nouvelle tâche"}
          </DialogTitle>
          <DialogDescription>
            Organisation du travail et maintenance
          </DialogDescription>
        </DialogHeader>
        <Separator />
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
             <label className="text-sm font-medium">Description *</label>
             <Input
               value={formData.description}
               onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
               placeholder="Ex: Nettoyer le hall, Vérifier stock..."
               className="rounded-none"
             />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date d'échéance *</label>
              <Input
                type="date"
                value={formData.date_tache}
                onChange={(e) => setFormData(p => ({ ...p, date_tache: e.target.value }))}
                className="rounded-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Priorité</label>
              <Select
                value={formData.priorite}
                onValueChange={(v) => setFormData(p => ({ ...p, priorite: v as any }))}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="BASSE">Basse</SelectItem>
                  <SelectItem value="MOYENNE">Moyenne</SelectItem>
                  <SelectItem value="HAUTE">Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Responsable</label>
              <Input
                value={formData.responsable ?? ""}
                onChange={(e) => setFormData(p => ({ ...p, responsable: e.target.value }))}
                placeholder="Ex: Marie"
                className="rounded-none"
              />
            </div>
            
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
                  <SelectItem value="A_FAIRE">À faire</SelectItem>
                  <SelectItem value="EN_COURS">En cours</SelectItem>
                  <SelectItem value="TERMINEE">Terminée</SelectItem>
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

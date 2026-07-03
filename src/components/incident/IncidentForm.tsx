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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import type { IncidentInput, Incident } from "@/services/Incident_service"
import type { Chambre } from "@/services/Chambre_service"

interface IncidentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingIncident: Incident | null
  chambres: Chambre[]
  onSave: (data: IncidentInput) => Promise<void>
}

export function IncidentForm({
  open,
  onOpenChange,
  editingIncident,
  chambres,
  onSave,
}: IncidentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<IncidentInput>({
    id_chambre: 0,
    date_incident: new Date().toISOString().split("T")[0],
    probleme: "",
    action_prise: "",
    responsable: "",
    statut: "EN_COURS",
  })

  useEffect(() => {
    if (editingIncident) {
      setFormData({
        id_chambre: editingIncident.id_chambre,
        date_incident: editingIncident.date_incident.split("T")[0],
        probleme: editingIncident.probleme,
        action_prise: editingIncident.action_prise ?? "",
        responsable: editingIncident.responsable ?? "",
        statut: editingIncident.statut as "EN_COURS" | "RESOLU",
      })
    } else {
      setFormData({
        id_chambre: 0,
        date_incident: new Date().toISOString().split("T")[0],
        probleme: "",
        action_prise: "",
        responsable: "",
        statut: "EN_COURS",
      })
    }
    setError(null)
  }, [editingIncident, open])

  async function handleSubmit() {
    setError(null)
    if (!formData.id_chambre) {
      setError("Veuillez sélectionner une chambre")
      return
    }
    if (!formData.probleme.trim()) {
      setError("Le problème doit être décrit")
      return
    }

    setIsLoading(true)
    try {
      await onSave({
        ...formData,
        probleme: formData.probleme.trim(),
        action_prise: formData.action_prise?.trim() || null,
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
            {editingIncident ? "Modifier l'incident" : "Signaler un incident"}
          </DialogTitle>
          <DialogDescription>
            Suivi des problèmes techniques et maintenance
          </DialogDescription>
        </DialogHeader>
        <Separator />
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chambre *</label>
              <Select
                value={formData.id_chambre ? String(formData.id_chambre) : ""}
                onValueChange={(v) => setFormData(p => ({ ...p, id_chambre: Number(v) }))}
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Chambre..." />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {chambres.map(c => (
                    <SelectItem key={c.id_chambre} value={String(c.id_chambre)}>
                      Ch. {c.numero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date *</label>
              <Input
                type="date"
                value={formData.date_incident}
                onChange={(e) => setFormData(p => ({ ...p, date_incident: e.target.value }))}
                className="rounded-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Problème *</label>
            <Textarea
              value={formData.probleme}
              onChange={(e) => setFormData(p => ({ ...p, probleme: e.target.value }))}
              placeholder="Ex: Fuite d'eau, Ampoule grillée..."
              className="rounded-none min-h-[100px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Responsable</label>
              <Input
                value={formData.responsable ?? ""}
                onChange={(e) => setFormData(p => ({ ...p, responsable: e.target.value }))}
                placeholder="Ex: Jean"
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
                  <SelectItem value="EN_COURS">En cours</SelectItem>
                  <SelectItem value="RESOLU">Résolu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Action prise</label>
            <Input
              value={formData.action_prise ?? ""}
              onChange={(e) => setFormData(p => ({ ...p, action_prise: e.target.value }))}
              placeholder="Ex: Plombier appelé, Ampoule changée..."
              className="rounded-none"
            />
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

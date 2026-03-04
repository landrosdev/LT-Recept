import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Chambre } from "@/services/Chambre_service"

type Props = {
  chambres: Chambre[]
  editingId: number | null
  onCancel: () => void
  onSubmit: (payload: {
    id_chambre?: number
    numero: string
    type_chambre: string
    description?: string | null
  }) => Promise<void>
}

export default function ChambreForm({
  chambres,
  editingId,
  onCancel,
  onSubmit,
}: Props) {
  const editing = useMemo(
    () => chambres.find((c) => c.id_chambre === editingId) ?? null,
    [chambres, editingId]
  )

  const [numero, setNumero] = useState("")
  const [typeChambre, setTypeChambre] = useState("SIMPLE")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!editing) {
      setNumero("")
      setTypeChambre("SIMPLE")
      setDescription("")
      return
    }
    setNumero(editing.numero)
    setTypeChambre(editing.type_chambre)
    setDescription(editing.description ?? "")
  }, [editing])

  const title = editing ? `Modifier chambre ${editing.numero}` : "Nouvelle chambre"

  return (
    <Card className="rounded-none border-border/40 bg-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
        <Button variant="outline" onClick={onCancel} type="button">
          Annuler
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Numéro</div>
            <Input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ex: 101"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Type</div>
            <div className="flex gap-2">
              {["SIMPLE", "DOUBLE", "SUITE"].map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={typeChambre === t ? "default" : "outline"}
                  onClick={() => setTypeChambre(t)}
                  className="flex-1"
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold">Description</div>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Vue mer, 2 lits..."
          />
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <Button
          type="button"
          disabled={isSaving}
          onClick={async () => {
            setError(null)
            if (!numero.trim()) {
              setError("Numéro obligatoire")
              return
            }
            setIsSaving(true)
            try {
              await onSubmit({
                id_chambre: editing?.id_chambre,
                numero: numero.trim(),
                type_chambre: typeChambre,
                description: description.trim() ? description.trim() : null,
              })
            } catch (e) {
              const msg = e instanceof Error ? e.message : "Erreur"
              setError(msg)
            } finally {
              setIsSaving(false)
            }
          }}
          className="h-11 w-full"
        >
          {isSaving ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </CardContent>
    </Card>
  )
}

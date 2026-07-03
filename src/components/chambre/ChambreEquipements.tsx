import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { Chambre, ChambreEquipement, Equipement } from "@/services/Chambre_service"

type Props = {
  selectedChambreId: number | null
  chambres: Chambre[]
  equipements: Equipement[]
  liaisons: ChambreEquipement[]
  onToggle: (params: {
    id_chambre: number
    id_equipement: number
    checked: boolean
  }) => Promise<void>
  onCreateEquipement: (nom: string) => Promise<void>
  onDeleteEquipement: (id_equipement: number) => Promise<void>
}

export default function ChambreEquipements({
  selectedChambreId,
  chambres,
  equipements,
  liaisons,
  onToggle,
  onCreateEquipement,
  onDeleteEquipement,
}: Props) {
  const selected = useMemo(
    () => chambres.find((c) => c.id_chambre === selectedChambreId) ?? null,
    [chambres, selectedChambreId]
  )

  const [newEquipement, setNewEquipement] = useState("")
  const assignedSet = useMemo(() => {
    const s = new Set<number>()
    if (!selectedChambreId) return s
    for (const l of liaisons) {
      if (l.id_chambre === selectedChambreId) s.add(l.id_equipement)
    }
    return s
  }, [liaisons, selectedChambreId])

  return (
    <Card className="rounded-none border-border/40 bg-card">
      <CardHeader className="pb-3">
        <CardTitle>Équipements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selected ? (
          <div className="text-sm text-muted-foreground">
            Chambre sélectionnée: <span className="font-semibold">{selected.numero}</span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Sélectionne une chambre pour gérer ses équipements.
          </div>
        )}

        <div className="space-y-2">
          <div className="text-sm font-semibold">Créer un équipement</div>
          <div className="flex gap-2">
            <Input
              value={newEquipement}
              onChange={(e) => setNewEquipement(e.target.value)}
              placeholder="Ex: Climatisation"
            />
            <Button
              type="button"
              onClick={async () => {
                const nom = newEquipement.trim()
                if (!nom) return
                await onCreateEquipement(nom)
                setNewEquipement("")
              }}
            >
              Ajouter
            </Button>
          </div>
        </div>

        <Separator className="bg-border/50" />

        <div className="space-y-2">
          <div className="text-sm font-semibold">Liste des équipements</div>
          <div className="max-h-[36svh] overflow-auto border border-border/40">
            {equipements.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">Aucun équipement</div>
            ) : (
              <div className="divide-y divide-border/40">
                {equipements.map((e) => {
                  const checked = selectedChambreId
                    ? assignedSet.has(e.id_equipement)
                    : false
                  return (
                    <div key={e.id_equipement} className="flex items-center gap-2 p-3">
                      <label className="flex flex-1 items-center gap-2">
                        <input
                          type="checkbox"
                          className="size-4 accent-[color:var(--primary)]"
                          disabled={!selectedChambreId}
                          checked={checked}
                          onChange={async (ev) => {
                            if (!selectedChambreId) return
                            await onToggle({
                              id_chambre: selectedChambreId,
                              id_equipement: e.id_equipement,
                              checked: ev.target.checked,
                            })
                          }}
                        />
                        <span className="text-sm">{e.nom}</span>
                      </label>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteEquipement(e.id_equipement)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

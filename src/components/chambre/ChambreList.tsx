import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Chambre } from "@/services/Chambre_service"

type Props = {
  chambres: Chambre[]
  filter: string
  onFilterChange: (v: string) => void
  selectedId: number | null
  onSelect: (id: number) => void
  onCreate: () => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

export default function ChambreList({
  chambres,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
}: Props) {
  const filtered = chambres.filter((c) => {
    const q = filter.trim().toLowerCase()
    if (!q) return true
    return (
      c.numero.toLowerCase().includes(q) ||
      c.type_chambre.toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q)
    )
  })

  return (
    <Card className="rounded-none border-border/40 bg-card">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Chambres</CardTitle>
        <Button onClick={onCreate} type="button">
          Nouvelle chambre
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          value={filter}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="Rechercher (numéro, type, description)"
        />

        <div className="max-h-[48svh] overflow-auto border border-border/40">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">
              Aucun résultat
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {filtered.map((c) => {
                const isActive = selectedId === c.id_chambre
                return (
                  <div
                    key={c.id_chambre}
                    className={
                      "flex items-center justify-between gap-2 p-3 " +
                      (isActive ? "bg-primary/10" : "bg-background")
                    }
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => onSelect(c.id_chambre)}
                    >
                      <div className="font-semibold">Chambre {c.numero}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.type_chambre}
                        {c.description ? ` · ${c.description}` : ""}
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => onEdit(c.id_chambre)}
                      >
                        Modifier
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        type="button"
                        onClick={() => onDelete(c.id_chambre)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

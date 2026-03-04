import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Chambre } from "@/services/Chambre_service"

type Props = {
  chambres: Chambre[]
}

export default function ChambreStats({ chambres }: Props) {
  const total = chambres.length
  const byType = chambres.reduce<Record<string, number>>((acc, c) => {
    acc[c.type_chambre] = (acc[c.type_chambre] ?? 0) + 1
    return acc
  }, {})

  return (
    <Card className="rounded-none border-border/40 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Statistiques</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <div>Total chambres</div>
          <div className="font-semibold text-primary">{total}</div>
        </div>
        <Separator className="bg-border/50" />
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Par type</div>
          {Object.keys(byType).length === 0 ? (
            <div className="text-sm text-muted-foreground">Aucune donnée</div>
          ) : (
            Object.entries(byType)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <div>{k}</div>
                  <div className="font-semibold text-primary">{v}</div>
                </div>
              ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

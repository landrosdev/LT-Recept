import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  statut: string
}

export function StatusBadge({ statut }: StatusBadgeProps) {
  const variants: Record<string, { class: string; label: string }> = {
    "CONFIRMEE": {
      class: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200",
      label: "Confirmée",
    },
    "EN_ATTENTE": {
      class: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200",
      label: "En attente",
    },
    "ANNULEE": {
      class: "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200",
      label: "Annulée",
    },
    "TERMINEE": {
      class: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
      label: "Terminée",
    },
  }

  const v = variants[statut] ?? { class: "bg-muted text-muted-foreground", label: statut }

  return (
    <Badge className={cn("rounded-none font-medium", v.class)}>
      {v.label}
    </Badge>
  )
}

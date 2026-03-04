import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface SejourStatusBadgeProps {
  statut: string
}

export function SejourStatusBadge({ statut }: SejourStatusBadgeProps) {
  const variants: Record<string, { class: string; label: string }> = {
    "RESERVE": {
      class: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
      label: "Réservé",
    },
    "ARRIVE": {
      class: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200",
      label: "Arrivé",
    },
    "EN_SEJOUR": {
      class: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200",
      label: "En séjour",
    },
    "PARTI": {
      class: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
      label: "Parti",
    },
  }

  const v = variants[statut] ?? { class: "bg-muted text-muted-foreground", label: statut }

  return (
    <Badge className={cn("rounded-none font-medium", v.class)}>
      {v.label}
    </Badge>
  )
}

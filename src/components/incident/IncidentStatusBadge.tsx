import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle } from "lucide-react"

export function IncidentStatusBadge({ statut }: { statut: string }) {
  if (statut === "RESOLU") {
    return (
      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none gap-1 rounded-none">
        <CheckCircle2 className="size-3" />
        Résolu
      </Badge>
    )
  }
  return (
    <Badge variant="destructive" className="gap-1 rounded-none text-white">
      <AlertCircle className="size-3" />
      En cours
    </Badge>
  )
}

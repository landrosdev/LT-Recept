import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Clock } from "lucide-react"

export function TacheStatusBadge({ statut }: { statut: string }) {
  switch (statut) {
    case "TERMINEE":
      return (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none gap-1 rounded-none">
          <CheckCircle2 className="size-3" />
          Terminée
        </Badge>
      )
    case "EN_COURS":
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none gap-1 rounded-none">
          <Clock className="size-3" />
          En cours
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="gap-1 rounded-none">
          <Circle className="size-3" />
          À faire
        </Badge>
      )
  }
}

import { Badge } from "@/components/ui/badge"
import { AlertCircle, AlertTriangle, Info } from "lucide-react"

export function TachePriorityBadge({ priorite }: { priorite: string }) {
  switch (priorite) {
    case "HAUTE":
      return (
        <Badge variant="destructive" className="gap-1 rounded-none">
          <AlertCircle className="size-3" />
          Haute
        </Badge>
      )
    case "MOYENNE":
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 border-none gap-1 rounded-none">
          <AlertTriangle className="size-3" />
          Moyenne
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="gap-1 rounded-none">
          <Info className="size-3" />
          Basse
        </Badge>
      )
  }
}

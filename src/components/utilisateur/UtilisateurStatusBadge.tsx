import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Shield, User } from "lucide-react"

export function UtilisateurStatusBadge({ isActive }: { isActive: number }) {
  if (isActive === 1) {
    return (
      <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none gap-1 rounded-none">
        <CheckCircle2 className="size-3" />
        Actif
      </Badge>
    )
  }
  return (
    <Badge variant="destructive" className="gap-1 rounded-none">
      <XCircle className="size-3" />
      Inactif
    </Badge>
  )
}

export function UtilisateurRoleBadge({ role }: { role: string }) {
  if (role === "admin") {
    return (
      <Badge variant="outline" className="gap-1 rounded-none border-primary text-primary">
        <Shield className="size-3" />
        Admin
      </Badge>
    )
  }
  return (
    <Badge variant="secondary" className="gap-1 rounded-none">
      <User className="size-3" />
      Utilisateur
    </Badge>
  )
}

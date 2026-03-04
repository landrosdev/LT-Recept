import { Fragment } from "react"
import { Edit, Trash2, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Utilisateur } from "@/services/Utilisateur_service"
import { UtilisateurStatusBadge, UtilisateurRoleBadge } from "./UtilisateurStatusBadge"

interface UtilisateurListProps {
  utilisateurs: Utilisateur[]
  onEdit: (user: Utilisateur) => void
  onDelete: (id: number) => void
}

export function UtilisateurList({ utilisateurs, onEdit, onDelete }: UtilisateurListProps) {
  if (utilisateurs.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Aucun utilisateur trouvé.
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full">
        <thead className="bg-muted text-xs uppercase tracking-wider">
          <tr className="border-b-2 border-primary">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Utilisateur</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date de création</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Rôle</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Statut</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {utilisateurs.map((user, index) => (
            <Fragment key={user.id_utilisateur}>
              <tr
                className={cn(
                  "group transition-all duration-300 ease-out border-b",
                  "hover:bg-primary/5",
                  index % 2 === 0 ? "bg-card" : "bg-muted/30"
                )}
              >
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="size-4" />
                    </div>
                    {user.nom_user}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="size-3" />
                    {new Date(user.date_creation).toLocaleDateString("fr-FR")}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <UtilisateurRoleBadge admin={user.admin} />
                </td>
                <td className="px-4 py-3 text-center">
                  <UtilisateurStatusBadge statut={user.statut} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(user)}
                      className="h-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-none"
                    >
                      <Edit className="size-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(user.id_utilisateur)}
                      className="h-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-none"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

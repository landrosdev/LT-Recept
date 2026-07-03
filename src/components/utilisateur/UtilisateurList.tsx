import { Fragment } from "react"
import { Calendar, User, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Utilisateur } from "@/services/Utilisateur_service"
import { UtilisateurStatusBadge, UtilisateurRoleBadge } from "./UtilisateurStatusBadge"

interface UtilisateurListProps {
  utilisateurs: Utilisateur[]
  onEdit: (user: Utilisateur) => void
  onDelete: (id: number) => void
  currentUserId?: number
}

export function UtilisateurList({ utilisateurs, onEdit, onDelete, currentUserId }: UtilisateurListProps) {
  if (utilisateurs.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Aucun utilisateur trouvé.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead className="bg-muted text-xs uppercase tracking-wider">
          <tr className="border-b-2 border-primary">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Utilisateur</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date de création</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Rôle</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Permissions</th>
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
                    <div className="flex flex-col">
                      <span>{user.nom_user}</span>
                      {(user.nom || user.prenom) && (
                        <span className="text-xs text-muted-foreground font-normal">
                          {user.prenom} {user.nom}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="size-3" />
                    {new Date(user.date_creation).toLocaleDateString("fr-FR")}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <UtilisateurRoleBadge role={user.role} />
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[150px]">
                    {user.role === "admin" ? "Tout accès (*)" : user.permissions.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <UtilisateurStatusBadge isActive={user.is_active} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(user)}
                      className="h-8 border-primary text-primary font-bold text-[10px] uppercase px-2"
                    >
                      Modifier
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.id_utilisateur !== currentUserId ? (
                          <DropdownMenuItem onClick={() => onDelete(user.id_utilisateur)} className="text-destructive focus:text-destructive">
                            Supprimer définitivement
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled className="text-muted-foreground italic text-[10px]">
                            Vous êtes connecté
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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

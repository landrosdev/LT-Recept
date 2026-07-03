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
import type { Tache } from "@/services/Tache_service"
import { TacheStatusBadge } from "./TacheStatusBadge"
import { TachePriorityBadge } from "./TachePriorityBadge"

interface TacheListProps {
  taches: Tache[]
  onEdit: (tache: Tache) => void
  onDelete: (id: number) => void
}

export function TacheList({ taches, onEdit, onDelete }: TacheListProps) {
  if (taches.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Aucune tâche trouvée.
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full">
        <thead className="bg-muted text-xs uppercase tracking-wider">
          <tr className="border-b-2 border-primary">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Échéance</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Priorité</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Responsable</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Statut</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {taches.map((tache, index) => (
            <Fragment key={tache.id_tache}>
              <tr
                className={cn(
                  "group transition-all duration-300 ease-out border-b",
                  "hover:bg-primary/5",
                  index % 2 === 0 ? "bg-card" : "bg-muted/10"
                )}
              >
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3 text-muted-foreground" />
                    {new Date(tache.date_tache).toLocaleDateString("fr-FR")}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">
                  {tache.description}
                </td>
                <td className="px-4 py-3 text-center">
                  <TachePriorityBadge priorite={tache.priorite} />
                </td>
                <td className="px-4 py-3 text-sm">
                   {tache.responsable ? (
                      <div className="flex items-center gap-1">
                         <User className="size-3 text-muted-foreground" />
                         {tache.responsable}
                      </div>
                   ) : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  <TacheStatusBadge statut={tache.statut} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(tache)}
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
                        <DropdownMenuItem onClick={() => onDelete(tache.id_tache)} className="text-destructive focus:text-destructive">
                          Supprimer définitivement
                        </DropdownMenuItem>
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

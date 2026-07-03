import { Fragment } from "react"
import { BedDouble, Calendar, User, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Incident } from "@/services/Incident_service"
import type { Chambre } from "@/services/Chambre_service"
import { IncidentStatusBadge } from "./IncidentStatusBadge"

interface IncidentListProps {
  incidents: Incident[]
  chambres: Chambre[]
  onEdit: (incident: Incident) => void
  onDelete: (id: number) => void
  onViewDetails: (incident: Incident) => void
}

export function IncidentList({ incidents, chambres, onEdit, onDelete, onViewDetails }: IncidentListProps) {
  function getChambreNum(id: number) {
    const c = chambres.find(x => x.id_chambre === id)
    return c ? c.numero : "?"
  }

  if (incidents.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Aucun incident signalé.
      </div>
    )
  }

  return (
    <div className="overflow-auto">
      <table className="w-full">
        <thead className="bg-muted text-xs uppercase tracking-wider">
          <tr className="border-b-2 border-primary">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Chambre</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Problème</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action / Responsable</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Statut</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((inc, index) => (
            <Fragment key={inc.id_incident}>
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
                    {new Date(inc.date_incident).toLocaleDateString("fr-FR")}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="bg-primary/10 rounded-none border-primary/20 text-primary font-bold">
                    <BedDouble className="size-3 mr-1" />
                    Ch. {getChambreNum(inc.id_chambre)}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-medium max-w-[200px]">
                   <div className="truncate" title={inc.probleme}>{inc.probleme}</div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-col gap-1">
                     {inc.action_prise && (
                        <span className="text-muted-foreground italic">
                           "{inc.action_prise}"
                        </span>
                     )}
                     {inc.responsable && (
                        <div className="flex items-center gap-1 text-xs font-medium text-primary">
                           <User className="size-3" />
                           {inc.responsable}
                        </div>
                     )}
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <IncidentStatusBadge statut={inc.statut} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(inc)}
                      className="h-8 text-muted-foreground hover:text-primary font-bold text-[10px] uppercase px-2"
                    >
                      Détails
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(inc)}
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
                        <DropdownMenuItem onClick={() => onDelete(inc.id_incident)} className="text-destructive focus:text-destructive">
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

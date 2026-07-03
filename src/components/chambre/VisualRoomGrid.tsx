import { BedDouble, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "RESERVED" | "OUT_OF_ORDER"

export interface VisualRoom {
  id: number
  numero: string
  type: string
  status: RoomStatus
  clientName?: string
  dateDepart?: string
  sejourId?: number
}

interface VisualRoomGridProps {
  rooms: VisualRoom[]
  onDetails: (roomId: number) => void
}

export function VisualRoomGrid({ rooms, onDetails }: VisualRoomGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {rooms.map((room) => {
        const isOccupied = room.status === "OCCUPIED"
        const isReserved = room.status === "RESERVED"
        const isAvailable = room.status === "AVAILABLE"

        return (
          <div
            key={room.id}
            className={cn(
              "group relative flex flex-col justify-between overflow-hidden border-2 transition-all duration-200 hover:shadow-lg",
              isAvailable && "border-emerald-100 bg-emerald-50/30 hover:border-emerald-500",
              isOccupied && "border-amber-100 bg-amber-50/30 hover:border-amber-500",
              isReserved && "border-blue-100 bg-blue-50/30 hover:border-blue-500",
              room.status === "OUT_OF_ORDER" && "border-gray-200 bg-gray-50 opacity-60"
            )}
          >
            {/* Header: Room Number & Type */}
            <div className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className={cn(
                    "text-xl font-black uppercase tracking-tighter",
                    isAvailable && "text-emerald-700",
                    isOccupied && "text-amber-700",
                    isReserved && "text-blue-700"
                  )}>
                    #{room.numero}
                  </div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground truncate max-w-[80px]">
                    {room.type.length > 10 ? room.type.substring(0, 10) + "..." : room.type}
                  </div>
                </div>
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center",
                  isAvailable && "bg-emerald-100 text-emerald-600",
                  isOccupied && "bg-amber-100 text-amber-600",
                  isReserved && "bg-blue-100 text-blue-600"
                )}>
                  <BedDouble className="size-4" />
                </div>
              </div>

              {/* Occupant Info if any */}
              <div className="mt-3 min-h-[40px]">
                {room.clientName ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs font-bold truncate max-w-[100px]">
                      <User className="size-3 shrink-0" />
                      {room.clientName.length > 10 ? room.clientName.substring(0, 10) + "..." : room.clientName}
                    </div>
                    {room.dateDepart && (
                      <div className="text-[10px] text-muted-foreground italic">
                        Jusqu'au {new Date(room.dateDepart).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] text-muted-foreground mt-2 font-medium tracking-wide italic">
                    {isAvailable ? "DISPONIBLE" : "—"}
                  </div>
                )}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-auto border-t bg-muted/50 p-2">
              <Button 
                size="sm" 
                variant="outline"
                className="w-full gap-1 text-[11px] font-bold uppercase h-8"
                onClick={() => onDetails(room.id)}
              >
                Détails
              </Button>
            </div>

            {/* Indicator bar */}
            <div className={cn(
              "h-1 w-full",
              isAvailable && "bg-emerald-500",
              isOccupied && "bg-amber-500",
              isReserved && "bg-blue-500"
            )} />
          </div>
        )
      })}
    </div>
  )
}

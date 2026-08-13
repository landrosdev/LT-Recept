import { useMemo, useState } from "react"
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, startOfDay, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar, ChevronLeft, ChevronRight, List } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import type { CategorieChambre } from "@/services/CategorieChambre_service"
import type { Chambre } from "@/services/Chambre_service"
import type { Reservation } from "@/services/Reservation_service"
import type { Sejour } from "@/services/Sejours_service"

interface DisponibilitesViewProps {
  categories: CategorieChambre[]
  chambres: Chambre[]
  reservations: Reservation[]
  sejours: Sejour[]
}

type ViewMode = "LISTE" | "CALENDRIER"

export function DisponibilitesView({ categories, chambres, reservations, sejours }: DisponibilitesViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("LISTE")
  const [currentDate, setCurrentDate] = useState(new Date())

  // Navigation
  const prevMonth = () => setCurrentDate(addDays(startOfMonth(currentDate), -1))
  const nextMonth = () => setCurrentDate(addDays(endOfMonth(currentDate), 1))
  const today = startOfDay(new Date())

  // Generate days for the current month view
  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    })
  }, [currentDate])

  // Helper to parse room JSON details if needed
  const parseRoomDetails = (chambresIds: string | null) => {
    if (!chambresIds) return []
    try {
      const parsed = JSON.parse(chambresIds)
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === "number") {
          return parsed.map(id => ({ id: Number(id) }))
        }
        return parsed as { id: number }[]
      }
    } catch (e) {
      return chambresIds.split(",").filter(Boolean).map(id => ({ id: Number(id) }))
    }
    return []
  }

  // Pre-calculate Total rooms per category
  const totalRoomsPerCat = useMemo(() => {
    const counts: Record<number, number> = {}
    categories.forEach(c => {
      counts[c.id_categorie] = chambres.filter(ch => ch.id_categorie === c.id_categorie).length
    })
    return counts
  }, [categories, chambres])

  // Core Availability Logic
  const getAvailability = (date: Date, id_categorie: number) => {
    const total = totalRoomsPerCat[id_categorie] || 0
    if (total === 0) return { total: 0, booked: 0, available: 0, status: "Aucun hébergement" }

    const targetDate = startOfDay(date).getTime()
    let bookedCount = 0

    // 1. Count Active Stays (EN_SEJOUR)
    sejours.forEach(s => {
      if (s.statut !== "EN_SEJOUR") return
      const sStart = startOfDay(new Date(s.date_debut)).getTime()
      // If there's no end date, we assume it's ongoing, but let's safely parse date_fin
      const sEnd = s.date_fin ? startOfDay(new Date(s.date_fin)).getTime() : Infinity
      
      // Each date from start to end (inclusive) = 1 nuit occupée
      if (targetDate >= sStart && targetDate <= sEnd) {
        // Did they book rooms of this category?
        const assignedRooms = parseRoomDetails(s.chambres_ids)
        if (assignedRooms.length > 0) {
          const roomsOfCat = assignedRooms.filter(r => {
            const ch = chambres.find(c => c.id_chambre === r.id)
            return ch && ch.id_categorie === id_categorie
          })
          bookedCount += roomsOfCat.length
        }
      }
    })

    // 2. Count Active/Confirmed Reservations
    reservations.forEach(r => {
      if (r.statut === "ANNULEE" || r.statut === "TERMINEE") return
      const rStart = startOfDay(new Date(r.date_debut)).getTime()
      
      // Calculate End Date
      let rEnd = r.date_fin ? startOfDay(new Date(r.date_fin)).getTime() : null
      if (!rEnd) {
         rEnd = rStart + (r.nombre_nuite * 24 * 3600 * 1000)
      }

      if (targetDate >= rStart && targetDate <= rEnd) {
        // If rooms are already assigned in the reservation
        const assignedRooms = parseRoomDetails(r.chambres_ids)
        if (assignedRooms.length > 0) {
          const roomsOfCat = assignedRooms.filter(roomObj => {
            const ch = chambres.find(c => c.id_chambre === roomObj.id)
            return ch && ch.id_categorie === id_categorie
          })
          bookedCount += roomsOfCat.length
        } else {
          // If no specific rooms assigned yet, but the reservation category matches
          if (r.id_categorie === id_categorie) {
            bookedCount += 1 // One booking = One room booked in that category
          }
        }
      }
    })

    const available = Math.max(0, total - bookedCount)
    let status = "Réservable"
    if (available === 0) status = "Complet"

    return {
      total,
      booked: bookedCount,
      available,
      status
    }
  }

  // Render Category Item for List View
  const renderCategoryListItem = (date: Date, cat: CategorieChambre) => {
    const data = getAvailability(date, cat.id_categorie)
    
    let statusColor = "bg-primary text-primary-foreground"
    if (data.status === "Complet") statusColor = "bg-amber-500 text-white"
    if (data.status === "Aucun hébergement") statusColor = "bg-destructive text-destructive-foreground"

    return (
      <div key={cat.id_categorie} className="flex flex-col sm:flex-row justify-between py-4 border-b last:border-0 items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <h4 className="font-bold text-sm">{cat.libelle}</h4>
          <Badge className={`${statusColor} hover:${statusColor} border-0 rounded-sm font-semibold`}>
            {data.status}
          </Badge>
          <div className="text-xs text-muted-foreground mt-2">
            Tarifs et restrictions
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">Disponibles</span>
            <span className="text-xs text-muted-foreground">Réservé(e)s: {data.booked}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-10 border rounded bg-muted/30 font-bold text-lg">
              {data.available}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-muted p-1 rounded-lg">
          <Button 
            variant={viewMode === "LISTE" ? "default" : "ghost"} 
            className="w-32 gap-2"
            onClick={() => setViewMode("LISTE")}
          >
            <List className="size-4" /> LISTE
          </Button>
          <Button 
            variant={viewMode === "CALENDRIER" ? "default" : "ghost"} 
            className="w-32 gap-2"
            onClick={() => setViewMode("CALENDRIER")}
          >
            <Calendar className="size-4" /> CALENDRIER
          </Button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="size-5" />
        </Button>
        <span className="font-bold text-lg capitalize">
          {format(currentDate, "MMMM yyyy", { locale: fr })}
        </span>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="size-5" />
        </Button>
      </div>

      {/* LIST VIEW */}
      {viewMode === "LISTE" && (
        <div className="space-y-8">
          {daysInMonth.map(date => (
            <Card key={date.toISOString()} className="overflow-hidden border shadow-sm">
              <CardHeader className={`py-3 border-b ${isSameDay(date, today) ? "bg-primary/10" : "bg-muted/40"}`}>
                <h3 className="font-black text-lg capitalize">
                  {format(date, "EEEE dd MMMM", { locale: fr })}
                  {isSameDay(date, today) && <span className="ml-2 text-xs font-medium text-primary">(Aujourd'hui)</span>}
                </h3>
              </CardHeader>
              <CardContent className="p-0 px-4">
                {categories.map(cat => renderCategoryListItem(date, cat))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === "CALENDRIER" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <Card key={cat.id_categorie} className="overflow-hidden border">
              <CardHeader className="bg-muted/30 py-3 border-b">
                <h3 className="font-bold">{cat.libelle}</h3>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["L", "M", "M", "J", "V", "S", "D"].map((day, i) => (
                    <div key={i} className="text-center text-xs font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for starting day offset */}
                  {Array.from({ length: (startOfMonth(currentDate).getDay() + 6) % 7 }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8" />
                  ))}
                  
                  {daysInMonth.map(date => {
                    const data = getAvailability(date, cat.id_categorie)
                    const isPast = isBefore(date, today) && !isSameDay(date, today)
                    
                    let bgColor = "bg-emerald-600/90 text-white" // Available
                    if (data.available === 0) bgColor = "bg-rose-600/90 text-white" // Full
                    if (data.total === 0) bgColor = "bg-muted text-muted-foreground" // No rooms
                    if (isPast) bgColor = "bg-muted text-muted-foreground opacity-50"

                    return (
                      <div 
                        key={date.toISOString()}
                        className={`h-8 flex items-center justify-center rounded-sm text-xs font-medium ${bgColor}`}
                        title={`${data.available} dispo(s) / ${data.total} total`}
                      >
                        {format(date, "d")}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

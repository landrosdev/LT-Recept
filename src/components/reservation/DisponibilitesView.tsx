import { useMemo, useState, useRef, useEffect } from "react"
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, startOfDay, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar, ChevronLeft, ChevronRight, List, Bed, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import type { CategorieChambre } from "@/services/CategorieChambre_service"
import type { Chambre } from "@/services/Chambre_service"
import type { Reservation } from "@/services/Reservation_service"

interface DisponibilitesViewProps {
  categories: CategorieChambre[]
  chambres: Chambre[]
  reservations: Reservation[]
}

type ViewMode = "LISTE" | "CALENDRIER"

export function DisponibilitesView({ categories, chambres, reservations }: DisponibilitesViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("LISTE")
  const [currentDate, setCurrentDate] = useState(new Date())
  const todayCardRef = useRef<HTMLDivElement>(null)

  // Navigation
  const prevMonth = () => setCurrentDate(addDays(startOfMonth(currentDate), -1))
  const nextMonth = () => setCurrentDate(addDays(endOfMonth(currentDate), 1))
  const today = startOfDay(new Date())

  // Auto-scroll to today's card when in list view
  useEffect(() => {
    if (viewMode === "LISTE" && todayCardRef.current) {
      // Small delay to let the DOM render
      const timer = setTimeout(() => {
        todayCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [viewMode, currentDate])

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
    if (total === 0) return { total: 0, booked: 0, available: 0, status: "no_rooms" as const }

    const targetDate = startOfDay(date).getTime()
    let bookedCount = 0

    // Count Active/Confirmed Reservations
    reservations.forEach(r => {
      if (r.statut === "ANNULEE" || r.statut === "TERMINEE") return
      const rStart = startOfDay(new Date(r.date_debut)).getTime()
      
      // Calculate End Date
      let rEnd = r.date_fin ? startOfDay(new Date(r.date_fin)).getTime() : null
      if (!rEnd) {
         rEnd = rStart + (r.nombre_nuite * 24 * 3600 * 1000)
      }

      if (targetDate >= rStart && targetDate < rEnd) {
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
    let status: "available" | "full" | "no_rooms" = "available"
    if (available === 0) status = "full"

    return {
      total,
      booked: bookedCount,
      available,
      status
    }
  }

  // Status styling helper
  const getStatusStyle = (status: "available" | "full" | "no_rooms") => {
    switch (status) {
      case "available":
        return {
          badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
          icon: <CheckCircle2 className="size-3.5" />,
          label: "Disponible",
          accent: "text-emerald-600 dark:text-emerald-400",
          border: "border-l-emerald-500"
        }
      case "full":
        return {
          badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
          icon: <AlertTriangle className="size-3.5" />,
          label: "Complet",
          accent: "text-amber-600 dark:text-amber-400",
          border: "border-l-amber-500"
        }
      case "no_rooms":
        return {
          badge: "bg-gray-100 text-gray-500 dark:bg-gray-800/40 dark:text-gray-400 border-gray-200 dark:border-gray-700",
          icon: <XCircle className="size-3.5" />,
          label: "Aucun hébergement",
          accent: "text-gray-400 dark:text-gray-500",
          border: "border-l-gray-300 dark:border-l-gray-600"
        }
    }
  }

  // Render Category Item for List View
  const renderCategoryListItem = (date: Date, cat: CategorieChambre) => {
    const data = getAvailability(date, cat.id_categorie)
    const style = getStatusStyle(data.status)

    return (
      <div key={cat.id_categorie} className={`flex flex-col sm:flex-row justify-between py-3.5 border-b last:border-0 items-start sm:items-center gap-3 pl-3 border-l-[3px] ${style.border}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex items-center justify-center size-9 rounded-lg bg-muted/50 ${style.accent}`}>
            <Bed className="size-4" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-sm leading-tight">{cat.libelle}</h4>
            <Badge variant="outline" className={`text-[10px] px-2 py-0 gap-1 font-medium ${style.badge}`}>
              {style.icon}
              {style.label}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider">Total</span>
            <span className="text-sm font-bold">{data.total}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider">Occupées</span>
            <span className={`text-sm font-bold ${data.booked > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>{data.booked}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-medium text-muted-foreground tracking-wider">Libres</span>
            <div className={`flex items-center justify-center min-w-[36px] h-8 rounded-md font-bold text-base ${
              data.available > 0 
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                : data.total === 0
                  ? "bg-muted text-muted-foreground"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            } px-2`}>
              {data.available}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* FIXED CONTROLS */}
      <div className="flex-none bg-background p-6 pb-4 border-b flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        {/* Month Navigation */}
        <div className="flex items-center gap-4 bg-muted/30 p-1.5 px-3 border w-full sm:w-auto justify-between sm:justify-start">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="font-bold text-base capitalize min-w-[140px] text-center">
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        {/* View Toggle */}
        <div className="inline-flex bg-muted p-1 w-full sm:w-auto justify-center">
          <Button 
            variant={viewMode === "LISTE" ? "default" : "ghost"} 
            size="sm"
            className="gap-2 px-4 flex-1 sm:flex-none"
            onClick={() => setViewMode("LISTE")}
          >
            <List className="size-4" /> Liste
          </Button>
          <Button 
            variant={viewMode === "CALENDRIER" ? "default" : "ghost"} 
            size="sm"
            className="gap-2 px-4 flex-1 sm:flex-none"
            onClick={() => setViewMode("CALENDRIER")}
          >
            <Calendar className="size-4" /> Calendrier
          </Button>
        </div>
      </div>

      {/* SCROLLABLE LIST */}
      <div className="flex-1 overflow-auto p-6 bg-muted/10">
      {/* LIST VIEW */}
      {viewMode === "LISTE" && (
        <div className="space-y-6">
          {daysInMonth.map(date => {
            const isToday = isSameDay(date, today)
            return (
              <Card
                key={date.toISOString()}
                ref={isToday ? todayCardRef : undefined}
                className={`overflow-hidden border shadow-sm ${isToday ? "ring-2 ring-primary/50" : ""}`}
              >
                <CardHeader className={`py-3 border-b ${isToday ? "bg-primary/10" : "bg-muted/40"}`}>
                  <h3 className="font-black text-lg capitalize flex items-center gap-2">
                    {format(date, "EEEE dd MMMM", { locale: fr })}
                    {isToday && (
                      <Badge variant="default" className="text-[10px] px-2 py-0.5 font-semibold">
                        Aujourd'hui
                      </Badge>
                    )}
                  </h3>
                </CardHeader>
                <CardContent className="p-0 px-4">
                  {categories.map(cat => renderCategoryListItem(date, cat))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === "CALENDRIER" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <Card key={cat.id_categorie} className="overflow-hidden border">
              <CardHeader className="bg-muted/30 py-3 border-b">
                <div className="flex items-center gap-2">
                  <Bed className="size-4 text-primary" />
                  <h3 className="font-bold">{cat.libelle}</h3>
                </div>
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
                    const isToday = isSameDay(date, today)
                    
                    let bgColor = "bg-emerald-600/90 text-white" // Available
                    if (data.available === 0 && data.total > 0) bgColor = "bg-amber-500/90 text-white" // Full
                    if (data.total === 0) bgColor = "bg-muted text-muted-foreground" // No rooms
                    if (isPast) bgColor = "bg-muted text-muted-foreground opacity-50"

                    return (
                      <div 
                        key={date.toISOString()}
                        className={`h-8 flex items-center justify-center rounded-sm text-xs font-medium ${bgColor} ${isToday ? "ring-2 ring-primary ring-offset-1" : ""}`}
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
    </div>
  )
}

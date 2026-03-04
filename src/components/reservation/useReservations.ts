import { useCallback, useEffect, useMemo, useState } from "react"

import {
  listReservations,
  createReservation,
  updateReservation,
  deleteReservation,
  type Reservation,
} from "@/services/Reservation_service"

export function useReservations() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const r = await listReservations()
      setReservations(r)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur"
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const stats = useMemo(() => {
    const total = reservations.length
    const confirmed = reservations.filter(r => r.statut === "confirmée").length
    const pending = reservations.filter(r => r.statut === "en attente").length
    const cancelled = reservations.filter(r => r.statut === "annulée").length
    return { total, confirmed, pending, cancelled }
  }, [reservations])

  const createOrUpdateReservation = useCallback(
    async (payload: {
      id_reservation?: number
      id_client: number
      type_chambre: string
      date_arrivee: string
      date_depart: string
      paiement?: string | null
      statut: string
    }) => {
      if (payload.id_reservation) {
        await updateReservation({
          id_reservation: payload.id_reservation,
          id_client: payload.id_client,
          type_chambre: payload.type_chambre,
          date_arrivee: payload.date_arrivee,
          date_depart: payload.date_depart,
          paiement: payload.paiement ?? null,
          statut: payload.statut,
        })
      } else {
        await createReservation({
          id_client: payload.id_client,
          type_chambre: payload.type_chambre,
          date_arrivee: payload.date_arrivee,
          date_depart: payload.date_depart,
          paiement: payload.paiement ?? null,
          statut: payload.statut,
        })
      }
      await refresh()
    },
    [refresh]
  )

  const removeReservation = useCallback(
    async (id_reservation: number) => {
      await deleteReservation(id_reservation)
      await refresh()
    },
    [refresh]
  )

  return {
    isLoading,
    error,
    reservations,
    stats,
    refresh,
    createOrUpdateReservation,
    removeReservation,
  }
}

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
    // Case insensitive/normalized counts
    const confirmed = reservations.filter(r => r.statut?.toLowerCase() === "confirmee" || r.statut?.toLowerCase() === "confirmée").length
    const pending = reservations.filter(r => r.statut?.toLowerCase() === "en_attente" || r.statut?.toLowerCase() === "en attente").length
    const cancelled = reservations.filter(r => r.statut?.toLowerCase() === "annulee" || r.statut?.toLowerCase() === "annulée").length
    return { total, confirmed, pending, cancelled }
  }, [reservations])

  const createOrUpdateReservation = useCallback(
    async (payload: {
      id_reservation?: number
      id_client: number
      id_categorie: number
      date_debut: string
      date_fin?: string | null
      nombre_nuite: number
      paiement?: string | null
      statut: string
      chambres_ids?: string | null
      montant_total: number
      avance?: number
      remise?: number
    }) => {
      let result;
      if (payload.id_reservation) {
        result = await updateReservation({
          id_reservation: payload.id_reservation,
          id_client: payload.id_client,
          id_categorie: payload.id_categorie,
          date_debut: payload.date_debut,
          date_fin: payload.date_fin ?? null,
          nombre_nuite: payload.nombre_nuite,
          paiement: payload.paiement ?? null,
          statut: payload.statut,
          chambres_ids: payload.chambres_ids ?? null,
          montant_total: payload.montant_total,
          avance: payload.avance ?? 0,
          remise: payload.remise ?? 0,
        })
      } else {
        result = await createReservation({
          id_client: payload.id_client,
          id_categorie: payload.id_categorie,
          date_debut: payload.date_debut,
          date_fin: payload.date_fin ?? null,
          nombre_nuite: payload.nombre_nuite,
          paiement: payload.paiement ?? null,
          statut: payload.statut,
          chambres_ids: payload.chambres_ids ?? null,
          montant_total: payload.montant_total,
          avance: payload.avance ?? 0,
          remise: payload.remise ?? 0,
        })
      }
      await refresh()
      return result;
    },
    [refresh]
  )

  const updateStatus = useCallback(
    async (id_reservation: number, statut: string) => {
      const r = reservations.find(x => x.id_reservation === id_reservation)
      if (!r) return
      await updateReservation({
        ...r,
        statut,
        montant_total: r.montant_total,
        avance: r.avance || 0,
        remise: r.remise || 0
      })
      await refresh()
    },
    [reservations, refresh]
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
    updateStatus,
    removeReservation,
  }
}

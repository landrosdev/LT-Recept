import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { listSejours, createSejour, updateSejour, deleteSejour, type Sejour, type SejourInput } from "@/services/Sejours_service"

export function useSejours() {
  const [sejours, setSejours] = useState<Sejour[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSejours = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await listSejours()
      setSejours(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors du chargement des séjours"
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSejours()
  }, [loadSejours])

  const createOrUpdateSejour = useCallback(async (data: SejourInput & { id_sejour?: number }) => {
    const { id_sejour, ...input } = data
    if (id_sejour) {
      const updated = await updateSejour(id_sejour, input)
      setSejours((prev) => prev.map((s) => (s.id_sejour === id_sejour ? updated : s)))
      return updated
    } else {
      const created = await createSejour(input)
      setSejours((prev) => [...prev, created])
      return created
    }
  }, [])

  const removeSejour = useCallback(async (id_sejour: number) => {
    await deleteSejour(id_sejour)
    setSejours((prev) => prev.filter((s) => s.id_sejour !== id_sejour))
  }, [])

  // Stats
  const stats = useMemo(() => {
    const total = sejours.length
    const enSejour = sejours.filter(s => s.statut === "EN_SEJOUR").length
    const termine = sejours.filter(s => s.statut === "TERMINE").length
    const annule = sejours.filter(s => s.statut === "ANNULE").length
    return { total, enSejour, termine, annule }
  }, [sejours])

  return {
    sejours,
    isLoading,
    error,
    stats,
    createOrUpdateSejour,
    removeSejour,
    reload: loadSejours,
  }
}

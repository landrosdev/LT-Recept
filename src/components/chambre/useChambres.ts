import { useCallback, useEffect, useMemo, useState } from "react"

import {
  assignEquipementToChambre,
  createChambre,
  createEquipement,
  deleteChambre,
  deleteEquipement,
  listChambreEquipements,
  listChambres,
  listEquipements,
  normalizeTypeChambre,
  unassignEquipementFromChambre,
  updateChambre,
  updateEquipement,
  type Chambre,
  type ChambreEquipement,
  type Equipement,
} from "@/services/Chambre_service"

export function useChambres() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [chambres, setChambres] = useState<Chambre[]>([])
  const [equipements, setEquipements] = useState<Equipement[]>([])
  const [liaisons, setLiaisons] = useState<ChambreEquipement[]>([])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [c, e, l] = await Promise.all([
        listChambres(),
        listEquipements(),
        listChambreEquipements(),
      ])
      setChambres(c)
      setEquipements(e)
      setLiaisons(l)
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
    const total = chambres.length
    const byType: Record<string, number> = {}
    for (const c of chambres) {
      byType[c.type_chambre] = (byType[c.type_chambre] ?? 0) + 1
    }
    return { total, byType }
  }, [chambres])

  const createOrUpdateChambre = useCallback(
    async (payload: {
      id_chambre?: number
      numero: string
      type_chambre: string
      description?: string | null
    }) => {
      const type_chambre = normalizeTypeChambre(payload.type_chambre)
      if (payload.id_chambre) {
        await updateChambre({
          id_chambre: payload.id_chambre,
          numero: payload.numero,
          type_chambre,
          description: payload.description ?? null,
        })
      } else {
        await createChambre({
          numero: payload.numero,
          type_chambre,
          description: payload.description ?? null,
        })
      }
      await refresh()
    },
    [refresh]
  )

  const removeChambre = useCallback(
    async (id_chambre: number) => {
      await deleteChambre(id_chambre)
      await refresh()
    },
    [refresh]
  )

  const createOrUpdateEquipement = useCallback(
    async (payload: { id_equipement?: number; nom: string }) => {
      if (payload.id_equipement) {
        await updateEquipement({
          id_equipement: payload.id_equipement,
          nom: payload.nom,
        })
      } else {
        await createEquipement(payload.nom)
      }
      await refresh()
    },
    [refresh]
  )

  const removeEquipement = useCallback(
    async (id_equipement: number) => {
      await deleteEquipement(id_equipement)
      await refresh()
    },
    [refresh]
  )

  const createEquipementAndAssign = useCallback(
    async (params: { id_chambre: number; nom: string }) => {
      const created = await createEquipement(params.nom)
      await assignEquipementToChambre({
        id_chambre: params.id_chambre,
        id_equipement: created.id_equipement,
      })
      await refresh()
      return created
    },
    [refresh]
  )

  const toggleEquipementForChambre = useCallback(
    async (params: {
      id_chambre: number
      id_equipement: number
      checked: boolean
    }) => {
      if (params.checked) {
        await assignEquipementToChambre({
          id_chambre: params.id_chambre,
          id_equipement: params.id_equipement,
        })
      } else {
        await unassignEquipementFromChambre({
          id_chambre: params.id_chambre,
          id_equipement: params.id_equipement,
        })
      }
      await refresh()
    },
    [refresh]
  )

  const assignEquipementsBatch = useCallback(
    async (params: { id_chambre: number; ids_equipement: number[] }) => {
      for (const id_equipement of params.ids_equipement) {
        await assignEquipementToChambre({
          id_chambre: params.id_chambre,
          id_equipement,
        })
      }
      await refresh()
    },
    [refresh]
  )

  return {
    isLoading,
    error,
    chambres,
    equipements,
    liaisons,
    stats,
    refresh,
    createOrUpdateChambre,
    removeChambre,
    createOrUpdateEquipement,
    createEquipementAndAssign,
    removeEquipement,
    toggleEquipementForChambre,
    assignEquipementsBatch,
  }
}

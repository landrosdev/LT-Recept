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
  unassignEquipementFromChambre,
  updateChambre,
  updateEquipement,
  type Chambre,
  type ChambreEquipement,
  type Equipement,
} from "@/services/Chambre_service"
import {
  listCategories,
  createCategorie,
  updateCategorie,
  deleteCategorie,
  type CategorieChambre,
} from "@/services/CategorieChambre_service"

export function useChambres() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [chambres, setChambres] = useState<Chambre[]>([])
  const [equipements, setEquipements] = useState<Equipement[]>([])
  const [liaisons, setLiaisons] = useState<ChambreEquipement[]>([])
  const [categories, setCategories] = useState<CategorieChambre[]>([])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [c, e, l, cats] = await Promise.all([
        listChambres(),
        listEquipements(),
        listChambreEquipements(),
        listCategories(),
      ])
      setChambres(c)
      setEquipements(e)
      setLiaisons(l)
      setCategories(cats)
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
    const byType: Record<number, number> = {}
    for (const c of chambres) {
      byType[c.id_categorie] = (byType[c.id_categorie] ?? 0) + 1
    }
    return { total, byType }
  }, [chambres])

  const createOrUpdateChambre = useCallback(
    async (payload: {
      id_chambre?: number
      numero: string
      id_categorie: number
      description?: string | null
    }) => {
      if (payload.id_chambre) {
        await updateChambre({
          id_chambre: payload.id_chambre,
          numero: payload.numero,
          id_categorie: payload.id_categorie,
          description: payload.description ?? null,
        })
      } else {
        await createChambre({
          numero: payload.numero,
          id_categorie: payload.id_categorie,
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

  const createOrUpdateCategorie = useCallback(
    async (payload: { id_categorie?: number; libelle: string; description?: string | null }) => {
      if (payload.id_categorie) {
        await updateCategorie(payload.id_categorie, payload.libelle, payload.description ?? null)
      } else {
        await createCategorie(payload.libelle, payload.description ?? null)
      }
      await refresh()
    },
    [refresh]
  )

  const removeCategorie = useCallback(
    async (id_categorie: number) => {
      await deleteCategorie(id_categorie)
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
    categories,
    stats,
    refresh,
    createOrUpdateChambre,
    removeChambre,
    createOrUpdateCategorie,
    removeCategorie,
    createOrUpdateEquipement,
    removeEquipement,
    toggleEquipementForChambre,
    assignEquipementsBatch,
  }
}

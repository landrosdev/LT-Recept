import { useCallback, useEffect, useMemo, useState } from "react"

import {
  listClients,
  createClient,
  updateClient,
  deleteClient,
  type Client,
} from "@/services/Client_service"

export function useClients() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const c = await listClients()
      setClients(c)
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
    const total = clients.length
    const withEmail = clients.filter(c => c.email).length
    const withPhone = clients.filter(c => c.telephone).length
    return { total, withEmail, withPhone }
  }, [clients])

  const createOrUpdateClient = useCallback(
    async (payload: {
      id_client?: number
      nom: string
      prenom?: string | null
      telephone?: string | null
      email?: string | null
    }) => {
      if (payload.id_client) {
        await updateClient({
          id_client: payload.id_client,
          nom: payload.nom,
          prenom: payload.prenom ?? null,
          telephone: payload.telephone ?? null,
          email: payload.email ?? null,
        })
      } else {
        await createClient({
          nom: payload.nom,
          prenom: payload.prenom ?? null,
          telephone: payload.telephone ?? null,
          email: payload.email ?? null,
        })
      }
      await refresh()
    },
    [refresh]
  )

  const removeClient = useCallback(
    async (id_client: number) => {
      await deleteClient(id_client)
      await refresh()
    },
    [refresh]
  )

  return {
    isLoading,
    error,
    clients,
    stats,
    refresh,
    createOrUpdateClient,
    removeClient,
  }
}

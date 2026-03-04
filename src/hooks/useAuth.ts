import { useCallback, useEffect, useMemo, useState } from "react"

import {
  AUTH_CHANGED_EVENT,
  getCurrentUser,
  loginWithPassword,
  logout as logoutService,
  type Utilisateur,
} from "@/services/Auth_service"

export function useAuth() {
  const [user, setUser] = useState<Utilisateur | null>(() => getCurrentUser())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handler = () => {
      setUser(getCurrentUser())
    }

    window.addEventListener(AUTH_CHANGED_EVENT, handler)
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handler)
  }, [])

  const login = useCallback(
    async (params: { nomUser: string; motDePasse: string }) => {
      setIsLoading(true)
      setError(null)
      try {
        const u = await loginWithPassword(params)
        setUser(u)
        return u
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur de connexion"
        setError(msg)
        throw e
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const logout = useCallback(() => {
    logoutService()
    setUser(null)
  }, [])

  return useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      login,
      logout,
    }),
    [user, isLoading, error, login, logout]
  )
}

import { invoke } from "@tauri-apps/api/core"

export type Utilisateur = {
  id_utilisateur: number
  nom_user: string
  mot_de_passe: string
  date_creation: string
  statut: string
  admin: number
}

const STORAGE_KEY = "auth.utilisateur"

export const AUTH_CHANGED_EVENT = "auth-changed"

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
}

export async function listUtilisateurs(): Promise<Utilisateur[]> {
  return invoke<Utilisateur[]>("list_utilisateurs_command")
}

export async function loginWithPassword(params: {
  nomUser: string
  motDePasse: string
}): Promise<Utilisateur> {
  const { nomUser, motDePasse } = params

  const utilisateurs = await listUtilisateurs()
  const found = utilisateurs.find(
    (u) => u.nom_user === nomUser && u.mot_de_passe === motDePasse
  )

  if (!found) {
    throw new Error("Identifiants invalides")
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(found))
  notifyAuthChanged()
  return found
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY)
  notifyAuthChanged()
}

export function getCurrentUser(): Utilisateur | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as Utilisateur
  } catch {
    return null
  }
}

import { invoke } from "@tauri-apps/api/core"

export type Utilisateur = {
  id_utilisateur: number
  nom: string | null
  prenom: string | null
  nom_user: string
  mot_de_passe: string
  role: "admin" | "user"
  permissions: string
  is_active: number
  date_creation: string
  date_modification: string
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
  await invoke("log_action_command", { idUtilisateur: found.id_utilisateur, action: "CONNEXION", details: `Utilisateur ${found.nom_user} s'est connecté.` })
  notifyAuthChanged()
  return found
}

export async function logout(): Promise<void> {
  const user = getCurrentUser()
  if (user) {
    await invoke("log_action_command", { idUtilisateur: user.id_utilisateur, action: "DECONNEXION", details: `Utilisateur ${user.nom_user} s'est déconnecté.` })
  }
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

export async function logAction(action: string, details?: string): Promise<void> {
  const user = getCurrentUser()
  await invoke("log_action_command", { 
    idUtilisateur: user?.id_utilisateur || null, 
    action, 
    details: details || null 
  })
}

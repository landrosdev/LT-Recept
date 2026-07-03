import { invoke } from "@tauri-apps/api/core"

export interface Utilisateur {
  id_utilisateur: number
  nom: string | null
  prenom: string | null
  nom_user: string
  mot_de_passe: string
  role: "admin" | "user"
  permissions: string
  is_active: number // 0 or 1
  date_creation: string
  date_modification: string
}

export type UtilisateurInput = {
  nom: string | null
  prenom: string | null
  nom_user: string
  mot_de_passe: string
  role: "admin" | "user"
  permissions: string
  is_active: number
}

export async function listUtilisateurs(): Promise<Utilisateur[]> {
  return await invoke("list_utilisateurs_command")
}

export async function getUtilisateur(id_utilisateur: number): Promise<Utilisateur> {
  return await invoke("get_utilisateur_command", { idUtilisateur: id_utilisateur })
}

export async function createUtilisateur(data: UtilisateurInput): Promise<Utilisateur> {
  return await invoke("create_utilisateur_command", {
    nom: data.nom,
    prenom: data.prenom,
    nomUser: data.nom_user,
    motDePasse: data.mot_de_passe,
    role: data.role,
    permissions: data.permissions,
    isActive: data.is_active,
  })
}

export async function updateUtilisateur(id_utilisateur: number, data: UtilisateurInput): Promise<Utilisateur> {
  return await invoke("update_utilisateur_command", {
    idUtilisateur: id_utilisateur,
    nom: data.nom,
    prenom: data.prenom,
    nomUser: data.nom_user,
    motDePasse: data.mot_de_passe,
    role: data.role,
    permissions: data.permissions,
    isActive: data.is_active,
  })
}

export async function deleteUtilisateur(id_utilisateur: number): Promise<void> {
  return await invoke("delete_utilisateur_command", { idUtilisateur: id_utilisateur })
}

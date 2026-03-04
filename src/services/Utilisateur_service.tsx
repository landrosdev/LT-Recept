import { invoke } from "@tauri-apps/api/core"

export interface Utilisateur {
  id_utilisateur: number
  nom_user: string
  mot_de_passe: string
  date_creation: string
  statut: "ACTIF" | "INACTIF"
  admin: number // 0 or 1
}

export type UtilisateurInput = {
  nom_user: string
  mot_de_passe: string
  statut: "ACTIF" | "INACTIF"
  admin: number
}

export async function listUtilisateurs(): Promise<Utilisateur[]> {
  return await invoke("list_utilisateurs_command")
}

export async function getUtilisateur(id_utilisateur: number): Promise<Utilisateur> {
  return await invoke("get_utilisateur_command", { idUtilisateur: id_utilisateur })
}

export async function createUtilisateur(data: UtilisateurInput): Promise<Utilisateur> {
  return await invoke("create_utilisateur_command", {
    nomUser: data.nom_user,
    motDePasse: data.mot_de_passe,
    statut: data.statut,
    admin: data.admin,
  })
}

export async function updateUtilisateur(id_utilisateur: number, data: UtilisateurInput): Promise<Utilisateur> {
  return await invoke("update_utilisateur_command", {
    idUtilisateur: id_utilisateur,
    nomUser: data.nom_user,
    motDePasse: data.mot_de_passe,
    statut: data.statut,
    admin: data.admin,
  })
}

export async function deleteUtilisateur(id_utilisateur: number): Promise<void> {
  return await invoke("delete_utilisateur_command", { idUtilisateur: id_utilisateur })
}

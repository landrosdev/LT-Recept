import { invoke } from "@tauri-apps/api/core"

export interface Tache {
  id_tache: number
  date_tache: string
  description: string
  priorite: "HAUTE" | "MOYENNE" | "BASSE"
  responsable: string | null
  statut: "A_FAIRE" | "EN_COURS" | "TERMINEE"
}

export type TacheInput = Omit<Tache, "id_tache">

export async function listTaches(): Promise<Tache[]> {
  return await invoke("list_taches_command")
}

export async function getTache(id_tache: number): Promise<Tache> {
  return await invoke("get_tache_command", { idTache: id_tache })
}

export async function createTache(data: TacheInput): Promise<Tache> {
  return await invoke("create_tache_command", {
    dateTache: data.date_tache,
    description: data.description,
    priorite: data.priorite,
    responsable: data.responsable,
    statut: data.statut,
  })
}

export async function updateTache(id_tache: number, data: TacheInput): Promise<Tache> {
  return await invoke("update_tache_command", {
    idTache: id_tache,
    dateTache: data.date_tache,
    description: data.description,
    priorite: data.priorite,
    responsable: data.responsable,
    statut: data.statut,
  })
}

export async function deleteTache(id_tache: number): Promise<void> {
  return await invoke("delete_tache_command", { idTache: id_tache })
}

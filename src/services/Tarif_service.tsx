import { invoke } from "@tauri-apps/api/core"

export interface Tarif {
  id_tarif: number
  nom: string
  type_tarif: string // 'CHAMBRE', 'OPTION', 'REMISE'
  montant: number
  est_pourcentage: boolean
  description: string | null
}

export const listTarifs = async (): Promise<Tarif[]> => {
  return await invoke("list_tarifs_command")
}

export const createTarif = async (
  nom: string,
  type_tarif: string,
  montant: number,
  est_pourcentage: boolean,
  description: string | null
): Promise<Tarif> => {
  return await invoke("create_tarif_command", {
    nom,
    typeTarif: type_tarif,
    montant,
    estPourcentage: est_pourcentage,
    description,
  })
}

export const updateTarif = async (
  id_tarif: number,
  nom: string,
  type_tarif: string,
  montant: number,
  est_pourcentage: boolean,
  description: string | null
): Promise<Tarif> => {
  return await invoke("update_tarif_command", {
    idTarif: id_tarif,
    nom,
    typeTarif: type_tarif,
    montant,
    estPourcentage: est_pourcentage,
    description,
  })
}

export const deleteTarif = async (id_tarif: number): Promise<void> => {
  await invoke("delete_tarif_command", { idTarif: id_tarif })
}

/// sejours 

import { invoke } from "@tauri-apps/api/core"

export interface Sejour {
  id_sejour: number
  id_client: number
  id_reservation: number | null
  chambres_ids: string
  id_categorie: number
  date_debut: string
  date_fin: string | null
  nombre_nuite: number
  paiement: string | null
  statut: string
  remarques: string | null
  montant_total: number
  avance: number
  remise: number
}

export type SejourInput = Omit<Sejour, "id_sejour"> & { avance?: number; montant_total?: number; remise?: number }

export async function listSejours(): Promise<Sejour[]> {
  return await invoke("list_sejours_command")
}

export async function createSejour(data: SejourInput): Promise<Sejour> {
  return await invoke("create_sejour_command", {
    idClient: data.id_client,
    idReservation: data.id_reservation,
    chambresIds: data.chambres_ids,
    idCategorie: data.id_categorie,
    dateDebut: data.date_debut,
    dateFin: data.date_fin,
    nombreNuite: data.nombre_nuite,
    paiement: data.paiement,
    statut: data.statut,
    remarques: data.remarques,
    avance: data.avance ?? 0,
    montantTotal: data.montant_total ?? 0,
    remise: data.remise ?? 0,
  })
}

export async function getSejour(id_sejour: number): Promise<Sejour> {
  return await invoke("get_sejour_command", { idSejour: id_sejour })
}

export async function updateSejour(id_sejour: number, data: SejourInput): Promise<Sejour> {
  return await invoke("update_sejour_command", {
    idSejour: id_sejour,
    idClient: data.id_client,
    idReservation: data.id_reservation,
    chambresIds: data.chambres_ids,
    idCategorie: data.id_categorie,
    dateDebut: data.date_debut,
    dateFin: data.date_fin,
    nombreNuite: data.nombre_nuite,
    paiement: data.paiement,
    statut: data.statut,
    remarques: data.remarques,
    montantTotal: data.montant_total ?? 0,
    avance: data.avance ?? 0,
    remise: data.remise ?? 0,
  })
}

export async function deleteSejour(id_sejour: number): Promise<void> {
  return await invoke("delete_sejour_command", { idSejour: id_sejour })
}
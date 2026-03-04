/// sejours 

import { invoke } from "@tauri-apps/api/core"

export interface Sejour {
  id_sejour: number
  id_client: number
  id_reservation: number | null
  id_chambre: number
  date_jour: string
  heure_arrivee: string | null
  heure_depart_prevue: string | null
  statut: string
  remarques: string | null
}

export type SejourInput = Omit<Sejour, "id_sejour">

export async function listSejours(): Promise<Sejour[]> {
  return await invoke("list_sejours_command")
}

export async function createSejour(data: SejourInput): Promise<Sejour> {
  return await invoke("create_sejour_command", {
    idClient: data.id_client,
    idReservation: data.id_reservation,
    idChambre: data.id_chambre,
    dateJour: data.date_jour,
    heureArrivee: data.heure_arrivee,
    heureDepartPrevue: data.heure_depart_prevue,
    statut: data.statut,
    remarques: data.remarques,
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
    idChambre: data.id_chambre,
    dateJour: data.date_jour,
    heureArrivee: data.heure_arrivee,
    heureDepartPrevue: data.heure_depart_prevue,
    statut: data.statut,
    remarques: data.remarques,
  })
}

export async function deleteSejour(id_sejour: number): Promise<void> {
  return await invoke("delete_sejour_command", { idSejour: id_sejour })
}
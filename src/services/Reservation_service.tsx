import { invoke } from "@tauri-apps/api/core"

export type Reservation = {
  id_reservation: number
  id_client: number
  id_categorie: number
  date_debut: string
  date_fin: string | null
  nombre_nuite: number
  paiement: string | null
  statut: string
  created_at: string
  chambres_ids: string | null
  montant_total: number
  avance: number
  remise: number
}

export type CreateReservationPayload = {
  id_client: number
  id_categorie: number
  date_debut: string
  date_fin?: string | null
  nombre_nuite: number
  paiement?: string | null
  statut: string
  chambres_ids?: string | null
  montant_total: number
  avance: number
  remise: number
}

export type UpdateReservationPayload = {
  id_reservation: number
  id_client: number
  id_categorie: number
  date_debut: string
  date_fin?: string | null
  nombre_nuite: number
  paiement?: string | null
  statut: string
  chambres_ids?: string | null
  montant_total: number
  avance: number
  remise: number
}

export async function listReservations(): Promise<Reservation[]> {
  return await invoke("list_reservations_command")
}

export async function getReservation(id_reservation: number): Promise<Reservation> {
  return await invoke("get_reservation_command", { id_reservation })
}

export async function createReservation(payload: CreateReservationPayload): Promise<Reservation> {
  return await invoke("create_reservation_command", {
    idClient: payload.id_client,
    idCategorie: payload.id_categorie,
    dateDebut: payload.date_debut,
    dateFin: payload.date_fin ?? null,
    nombreNuite: payload.nombre_nuite,
    paiement: payload.paiement ?? null,
    statut: payload.statut,
    chambresIds: payload.chambres_ids ?? null,
    montantTotal: payload.montant_total,
    avance: payload.avance,
    remise: payload.remise,
  })
}

export async function updateReservation(payload: UpdateReservationPayload): Promise<Reservation> {
  return await invoke("update_reservation_command", {
    idReservation: payload.id_reservation,
    idClient: payload.id_client,
    idCategorie: payload.id_categorie,
    dateDebut: payload.date_debut,
    dateFin: payload.date_fin ?? null,
    nombreNuite: payload.nombre_nuite,
    paiement: payload.paiement ?? null,
    statut: payload.statut,
    chambresIds: payload.chambres_ids ?? null,
    montantTotal: payload.montant_total,
    avance: payload.avance,
    remise: payload.remise,
  })
}

export async function deleteReservation(id_reservation: number): Promise<void> {
  return await invoke("delete_reservation_command", { id_reservation })
}
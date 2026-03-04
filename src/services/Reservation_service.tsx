// service pour la reservation

import { invoke } from "@tauri-apps/api/core"

export type Reservation = {
  id_reservation: number
  id_client: number
  type_chambre: string
  date_arrivee: string
  date_depart: string
  paiement: string | null
  statut: string
  created_at: string
}

export type CreateReservationPayload = {
  id_client: number
  type_chambre: string
  date_arrivee: string
  date_depart: string
  paiement?: string | null
  statut: string
}

export type UpdateReservationPayload = {
  id_reservation: number
  id_client: number
  type_chambre: string
  date_arrivee: string
  date_depart: string
  paiement?: string | null
  statut: string
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
    typeChambre: payload.type_chambre,
    dateArrivee: payload.date_arrivee,
    dateDepart: payload.date_depart,
    paiement: payload.paiement ?? null,
    statut: payload.statut,
  })
}

export async function updateReservation(payload: UpdateReservationPayload): Promise<Reservation> {
  return await invoke("update_reservation_command", {
    idReservation: payload.id_reservation,
    idClient: payload.id_client,
    typeChambre: payload.type_chambre,
    dateArrivee: payload.date_arrivee,
    dateDepart: payload.date_depart,
    paiement: payload.paiement ?? null,
    statut: payload.statut,
  })
}

export async function deleteReservation(id_reservation: number): Promise<void> {
  return await invoke("delete_reservation_command", { id_reservation })
}
import { invoke } from "@tauri-apps/api/core"

export interface Facture {
  id_facture: number
  id_client: number
  id_chambre: number | null
  id_reservation: number | null
  id_sejour: number | null
  date_facture: string
  montant: number
  remise: number
  mode_paiement: string | null
  statut: "EN_ATTENTE" | "PARTIEL" | "PAYE" | "ANNULEE"
  observations: string | null
}

export type FactureInput = Omit<Facture, "id_facture">

export async function listFactures(): Promise<Facture[]> {
  return await invoke("list_factures_command")
}

export async function getFacture(id_facture: number): Promise<Facture> {
  return await invoke("get_facture_command", { idFacture: id_facture })
}

export async function createFacture(data: FactureInput): Promise<Facture> {
  return await invoke("create_facture_command", {
    idClient: data.id_client,
    idChambre: data.id_chambre,
    idReservation: data.id_reservation,
    idSejour: data.id_sejour,
    dateFacture: data.date_facture,
    montant: data.montant,
    remise: data.remise,
    modePaiement: data.mode_paiement,
    statut: data.statut,
    observations: data.observations,
  })
}

export async function updateFacture(id_facture: number, data: FactureInput): Promise<Facture> {
  return await invoke("update_facture_command", {
    idFacture: id_facture,
    idClient: data.id_client,
    idChambre: data.id_chambre,
    idReservation: data.id_reservation,
    idSejour: data.id_sejour,
    dateFacture: data.date_facture,
    montant: data.montant,
    remise: data.remise,
    modePaiement: data.mode_paiement,
    statut: data.statut,
    observations: data.observations,
  })
}

export async function deleteFacture(id_facture: number): Promise<void> {
  return await invoke("delete_facture_command", { idFacture: id_facture })
}

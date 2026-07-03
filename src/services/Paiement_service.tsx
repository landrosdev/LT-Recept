import { invoke } from "@tauri-apps/api/core"

export type Paiement = {
  id_paiement: number
  id_facture: number
  montant: number
  date_paiement: string
  mode_paiement: string | null
}

export async function listPaiementsByFacture(idFacture: number): Promise<Paiement[]> {
  return await invoke("list_paiements_by_facture_command", { idFacture })
}

export async function createPaiement(idFacture: number, montant: number, modePaiement?: string | null): Promise<Paiement> {
  return await invoke("create_paiement_command", { idFacture, montant, modePaiement: modePaiement ?? null })
}

export async function deletePaiement(idPaiement: number): Promise<void> {
  return await invoke("delete_paiement_command", { idPaiement })
}

export async function listAllPaiements(): Promise<Paiement[]> {
  return await invoke("list_all_paiements_command")
}

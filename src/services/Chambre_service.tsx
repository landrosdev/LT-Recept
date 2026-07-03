import { invoke } from "@tauri-apps/api/core"

export type Chambre = {
  id_chambre: number
  numero: string
  id_categorie: number
  type_chambre?: string | null
  description: string | null
}

export type Equipement = {
  id_equipement: number
  nom: string
}

export type ChambreEquipement = {
  id_chambre: number
  id_equipement: number
}

export async function listChambres(): Promise<Chambre[]> {
  return invoke<Chambre[]>("list_chambres_command")
}

export async function getChambre(id_chambre: number): Promise<Chambre> {
  return invoke<Chambre>("get_chambre_command", { idChambre: id_chambre })
}

export async function createChambre(params: {
  numero: string
  id_categorie: number
  description?: string | null
}): Promise<Chambre> {
  const { numero, id_categorie, description } = params
  return invoke<Chambre>("create_chambre_command", {
    numero,
    idCategorie: id_categorie,
    description: description ?? null,
  })
}

export async function updateChambre(params: {
  id_chambre: number
  numero: string
  id_categorie: number
  description?: string | null
}): Promise<Chambre> {
  const { id_chambre, numero, id_categorie, description } = params
  return invoke<Chambre>("update_chambre_command", {
    idChambre: id_chambre,
    numero,
    idCategorie: id_categorie,
    description: description ?? null,
  })
}

export async function deleteChambre(id_chambre: number): Promise<void> {
  await invoke<void>("delete_chambre_command", { idChambre: id_chambre })
}

export async function listEquipements(): Promise<Equipement[]> {
  return invoke<Equipement[]>("list_equipements_command")
}

export async function getEquipement(id_equipement: number): Promise<Equipement> {
  return invoke<Equipement>("get_equipement_command", { idEquipement: id_equipement })
}

export async function createEquipement(nom: string): Promise<Equipement> {
  return invoke<Equipement>("create_equipement_command", { nom })
}

export async function updateEquipement(params: {
  id_equipement: number
  nom: string
}): Promise<Equipement> {
  const { id_equipement, nom } = params
  return invoke<Equipement>("update_equipement_command", { idEquipement: id_equipement, nom })
}

export async function deleteEquipement(id_equipement: number): Promise<void> {
  await invoke<void>("delete_equipement_command", { idEquipement: id_equipement })
}

export async function listChambreEquipements(): Promise<ChambreEquipement[]> {
  return invoke<ChambreEquipement[]>("list_chambre_equipements_command")
}

export async function assignEquipementToChambre(params: {
  id_chambre: number
  id_equipement: number
}): Promise<ChambreEquipement> {
  const { id_chambre, id_equipement } = params
  return invoke<ChambreEquipement>("assigner_equipement_a_chambre_command", {
    idChambre: id_chambre,
    idEquipement: id_equipement,
  })
}

export async function unassignEquipementFromChambre(params: {
  id_chambre: number
  id_equipement: number
}): Promise<void> {
  const { id_chambre, id_equipement } = params
  await invoke<void>("delete_chambre_equipement_command", {
    idChambre: id_chambre,
    idEquipement: id_equipement,
  })
}
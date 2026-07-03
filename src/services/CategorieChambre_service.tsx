import { invoke } from "@tauri-apps/api/core"

export interface CategorieChambre {
  id_categorie: number
  libelle: string
  description: string | null
}

export async function listCategories(): Promise<CategorieChambre[]> {
  return await invoke("list_categories_command")
}

export async function createCategorie(libelle: string, description: string | null): Promise<CategorieChambre> {
  return await invoke("create_categorie_command", { libelle, description })
}

export async function updateCategorie(id_categorie: number, libelle: string, description: string | null): Promise<CategorieChambre> {
  return await invoke("update_categorie_command", { idCategorie: id_categorie, libelle, description })
}

export async function deleteCategorie(id_categorie: number): Promise<void> {
  return await invoke("delete_categorie_command", { idCategorie: id_categorie })
}

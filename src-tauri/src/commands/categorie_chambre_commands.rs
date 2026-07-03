use crate::models::categorie_chambre_model::CategorieChambre;
use crate::services::categorie_chambre_service;

#[tauri::command]
pub async fn list_categories_command() -> Result<Vec<CategorieChambre>, String> {
  categorie_chambre_service::list_categories().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_categorie_command(libelle: String, description: Option<String>) -> Result<CategorieChambre, String> {
  categorie_chambre_service::create_categorie(libelle, description).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_categorie_command(id_categorie: i64, libelle: String, description: Option<String>) -> Result<CategorieChambre, String> {
  categorie_chambre_service::update_categorie(id_categorie, libelle, description).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_categorie_command(id_categorie: i64) -> Result<(), String> {
  categorie_chambre_service::delete_categorie(id_categorie).map_err(|e| e.to_string())
}

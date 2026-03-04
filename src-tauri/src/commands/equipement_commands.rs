use crate::models::Equipement;
use crate::services::equipement_service;

#[tauri::command]
pub async fn list_equipements_command() -> Result<Vec<Equipement>, String> {
  equipement_service::list_equipements().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_equipement_command(nom: String) -> Result<Equipement, String> {
  equipement_service::create_equipement(nom).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_equipement_command(id_equipement: i64) -> Result<Equipement, String> {
  equipement_service::get_equipement(id_equipement).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_equipement_command(id_equipement: i64, nom: String) -> Result<Equipement, String> {
  equipement_service::update_equipement(id_equipement, nom).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_equipement_command(id_equipement: i64) -> Result<(), String> {
  equipement_service::delete_equipement(id_equipement).map_err(|e| e.to_string())
}

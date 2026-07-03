use crate::models::Tarif;
use crate::services::tarif_service;

#[tauri::command]
pub async fn list_tarifs_command() -> Result<Vec<Tarif>, String> {
    tarif_service::list_tarifs().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_tarif_command(nom: String, type_tarif: String, montant: f64, est_pourcentage: bool, description: Option<String>) -> Result<Tarif, String> {
    tarif_service::create_tarif(nom, type_tarif, montant, est_pourcentage, description).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_tarif_command(id_tarif: i64, nom: String, type_tarif: String, montant: f64, est_pourcentage: bool, description: Option<String>) -> Result<Tarif, String> {
    tarif_service::update_tarif(id_tarif, nom, type_tarif, montant, est_pourcentage, description).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_tarif_command(id_tarif: i64) -> Result<(), String> {
    tarif_service::delete_tarif(id_tarif).map_err(|e| e.to_string())
}

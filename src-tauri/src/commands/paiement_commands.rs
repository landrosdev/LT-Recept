use crate::models::Paiement;
use crate::services::paiement_service;

#[tauri::command]
pub async fn list_paiements_by_facture_command(id_facture: i64) -> Result<Vec<Paiement>, String> {
    paiement_service::list_paiements_by_facture(id_facture).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_paiement_command(id_facture: i64, montant: f64, mode_paiement: Option<String>) -> Result<Paiement, String> {
    paiement_service::create_paiement(id_facture, montant, mode_paiement).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_paiement_command(id_paiement: i64) -> Result<(), String> {
    paiement_service::delete_paiement(id_paiement).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_all_paiements_command() -> Result<Vec<Paiement>, String> {
    paiement_service::list_all_paiements().map_err(|e| e.to_string())
}

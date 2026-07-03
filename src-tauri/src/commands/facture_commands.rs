use crate::models::Facture;
use crate::services::facture_service;

#[tauri::command]
pub async fn list_factures_command() -> Result<Vec<Facture>, String> {
  facture_service::list_factures().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_facture_command(
  id_client: i64,
  id_chambre: Option<i64>,
  id_reservation: Option<i64>,
  id_sejour: Option<i64>,
  date_facture: String,
  montant: f64,
  remise: f64,
  mode_paiement: Option<String>,
  statut: String,
  observations: Option<String>,
) -> Result<Facture, String> {
  facture_service::create_facture(
    id_client,
    id_chambre,
    id_reservation,
    id_sejour,
    date_facture,
    montant,
    remise,
    mode_paiement,
    statut,
    observations,
  )
  .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_facture_command(id_facture: i64) -> Result<Facture, String> {
  facture_service::get_facture(id_facture).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_facture_command(
  id_facture: i64,
  id_client: i64,
  id_chambre: Option<i64>,
  id_reservation: Option<i64>,
  id_sejour: Option<i64>,
  date_facture: String,
  montant: f64,
  remise: f64,
  mode_paiement: Option<String>,
  statut: String,
  observations: Option<String>,
) -> Result<Facture, String> {
  facture_service::update_facture(
    id_facture,
    id_client,
    id_chambre,
    id_reservation,
    id_sejour,
    date_facture,
    montant,
    remise,
    mode_paiement,
    statut,
    observations,
  )
  .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_facture_command(id_facture: i64) -> Result<(), String> {
  facture_service::delete_facture(id_facture).map_err(|e| e.to_string())
}

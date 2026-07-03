use crate::models::Sejour;
use crate::services::sejour_service;

#[tauri::command]
pub async fn list_sejours_command() -> Result<Vec<Sejour>, String> {
  sejour_service::list_sejours().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_sejour_command(
  id_client: i64,
  id_reservation: Option<i64>,
  chambres_ids: String,
  id_categorie: i64,
  date_debut: String,
  date_fin: Option<String>,
  nombre_nuite: i64,
  paiement: Option<String>,
  statut: String,
  remarques: Option<String>,
  avance: f64,
  montant_total: f64,
  remise: f64,
) -> Result<Sejour, String> {
  sejour_service::create_sejour(
    id_client,
    id_reservation,
    chambres_ids,
    id_categorie,
    date_debut,
    date_fin,
    nombre_nuite,
    paiement,
    statut,
    remarques,
    avance,
    montant_total,
    remise,
  )
  .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_sejour_command(id_sejour: i64) -> Result<Sejour, String> {
  sejour_service::get_sejour(id_sejour).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_sejour_command(
  id_sejour: i64,
  id_client: i64,
  id_reservation: Option<i64>,
  chambres_ids: String,
  id_categorie: i64,
  date_debut: String,
  date_fin: Option<String>,
  nombre_nuite: i64,
  paiement: Option<String>,
  statut: String,
  remarques: Option<String>,
  montant_total: f64,
  avance: f64,
  remise: f64,
) -> Result<Sejour, String> {
  sejour_service::update_sejour(
    id_sejour,
    id_client,
    id_reservation,
    chambres_ids,
    id_categorie,
    date_debut,
    date_fin,
    nombre_nuite,
    paiement,
    statut,
    remarques,
    montant_total,
    avance,
    remise,
  )
  .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_sejour_command(id_sejour: i64) -> Result<(), String> {
  sejour_service::delete_sejour(id_sejour).map_err(|e| e.to_string())
}

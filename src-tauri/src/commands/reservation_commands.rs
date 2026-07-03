use crate::models::Reservation;
use crate::services::reservation_service;

#[tauri::command]
pub async fn list_reservations_command() -> Result<Vec<Reservation>, String> {
  reservation_service::list_reservations().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_reservation_command(
  id_client: i64,
  id_categorie: i64,
  date_debut: String,
  date_fin: Option<String>,
  nombre_nuite: i64,
  paiement: Option<String>,
  statut: String,
  chambres_ids: Option<String>,
  montant_total: f64,
  avance: f64,
  remise: f64,
) -> Result<Reservation, String> {
  reservation_service::create_reservation(
    id_client,
    id_categorie,
    date_debut,
    date_fin,
    nombre_nuite,
    paiement,
    statut,
    chambres_ids,
    montant_total,
    avance,
    remise,
  )
  .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_reservation_command(id_reservation: i64) -> Result<Reservation, String> {
  reservation_service::get_reservation(id_reservation).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_reservation_command(
  id_reservation: i64,
  id_client: i64,
  id_categorie: i64,
  date_debut: String,
  date_fin: Option<String>,
  nombre_nuite: i64,
  paiement: Option<String>,
  statut: String,
  chambres_ids: Option<String>,
  montant_total: f64,
  avance: f64,
  remise: f64,
) -> Result<Reservation, String> {
  reservation_service::update_reservation(
    id_reservation,
    id_client,
    id_categorie,
    date_debut,
    date_fin,
    nombre_nuite,
    paiement,
    statut,
    chambres_ids,
    montant_total,
    avance,
    remise,
  )
  .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_reservation_command(id_reservation: i64) -> Result<(), String> {
  reservation_service::delete_reservation(id_reservation).map_err(|e| e.to_string())
}

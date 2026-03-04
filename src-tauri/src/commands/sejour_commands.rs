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
  id_chambre: i64,
  date_jour: String,
  heure_arrivee: Option<String>,
  heure_depart_prevue: Option<String>,
  statut: String,
  remarques: Option<String>,
) -> Result<Sejour, String> {
  sejour_service::create_sejour(
    id_client,
    id_reservation,
    id_chambre,
    date_jour,
    heure_arrivee,
    heure_depart_prevue,
    statut,
    remarques,
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
  id_chambre: i64,
  date_jour: String,
  heure_arrivee: Option<String>,
  heure_depart_prevue: Option<String>,
  statut: String,
  remarques: Option<String>,
) -> Result<Sejour, String> {
  sejour_service::update_sejour(
    id_sejour,
    id_client,
    id_reservation,
    id_chambre,
    date_jour,
    heure_arrivee,
    heure_depart_prevue,
    statut,
    remarques,
  )
  .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_sejour_command(id_sejour: i64) -> Result<(), String> {
  sejour_service::delete_sejour(id_sejour).map_err(|e| e.to_string())
}

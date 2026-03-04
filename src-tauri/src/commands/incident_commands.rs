use crate::models::Incident;
use crate::services::incident_service;

#[tauri::command]
pub async fn list_incidents_command() -> Result<Vec<Incident>, String> {
  incident_service::list_incidents().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_incident_command(
  id_chambre: i64,
  date_incident: String,
  probleme: String,
  action_prise: Option<String>,
  responsable: Option<String>,
  statut: String,
) -> Result<Incident, String> {
  incident_service::create_incident(
    id_chambre,
    date_incident,
    probleme,
    action_prise,
    responsable,
    statut,
  )
  .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_incident_command(id_incident: i64) -> Result<Incident, String> {
  incident_service::get_incident(id_incident).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_incident_command(
  id_incident: i64,
  id_chambre: i64,
  date_incident: String,
  probleme: String,
  action_prise: Option<String>,
  responsable: Option<String>,
  statut: String,
) -> Result<Incident, String> {
  incident_service::update_incident(
    id_incident,
    id_chambre,
    date_incident,
    probleme,
    action_prise,
    responsable,
    statut,
  )
  .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_incident_command(id_incident: i64) -> Result<(), String> {
  incident_service::delete_incident(id_incident).map_err(|e| e.to_string())
}

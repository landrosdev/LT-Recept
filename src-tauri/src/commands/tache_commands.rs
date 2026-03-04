use crate::models::Tache;
use crate::services::tache_service;

#[tauri::command]
pub async fn list_taches_command() -> Result<Vec<Tache>, String> {
  tache_service::list_taches().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_tache_command(
  date_tache: String,
  description: String,
  priorite: String,
  responsable: Option<String>,
  statut: String,
) -> Result<Tache, String> {
  tache_service::create_tache(
    date_tache,
    description,
    priorite,
    responsable,
    statut,
  )
  .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_tache_command(id_tache: i64) -> Result<Tache, String> {
  tache_service::get_tache(id_tache).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_tache_command(
  id_tache: i64,
  date_tache: String,
  description: String,
  priorite: String,
  responsable: Option<String>,
  statut: String,
) -> Result<Tache, String> {
  tache_service::update_tache(
    id_tache,
    date_tache,
    description,
    priorite,
    responsable,
    statut,
  )
  .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_tache_command(id_tache: i64) -> Result<(), String> {
  tache_service::delete_tache(id_tache).map_err(|e| e.to_string())
}

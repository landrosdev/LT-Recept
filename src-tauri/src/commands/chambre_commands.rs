use crate::models::Chambre;
use crate::services::chambre_service;

/// Liste toutes les chambres.
#[tauri::command]
pub async fn list_chambres_command() -> Result<Vec<Chambre>, String> {
  chambre_service::list_chambres().map_err(|e| e.to_string())
}

/// Crée une chambre.
#[tauri::command]
pub async fn create_chambre_command(
  numero: String,
  type_chambre: String,
  description: Option<String>,
) -> Result<Chambre, String> {
  chambre_service::create_chambre(numero, type_chambre, description).map_err(|e| e.to_string())
}

/// Récupère une chambre par son id.
#[tauri::command]
pub async fn get_chambre_command(id_chambre: i64) -> Result<Chambre, String> {
  chambre_service::get_chambre(id_chambre).map_err(|e| e.to_string())
}

/// Met à jour une chambre.
#[tauri::command]
pub async fn update_chambre_command(
  id_chambre: i64,
  numero: String,
  type_chambre: String,
  description: Option<String>,
) -> Result<Chambre, String> {
  chambre_service::update_chambre(id_chambre, numero, type_chambre, description)
    .map_err(|e| e.to_string())
}

/// Supprime une chambre.
#[tauri::command]
pub async fn delete_chambre_command(id_chambre: i64) -> Result<(), String> {
  chambre_service::delete_chambre(id_chambre).map_err(|e| e.to_string())
}

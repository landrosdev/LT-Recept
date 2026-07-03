use crate::models::Client;
use crate::services::client_service;

/// Liste tous les clients.
#[tauri::command]
pub async fn list_clients_command() -> Result<Vec<Client>, String> {
  client_service::list_clients().map_err(|e| e.to_string())
}

/// Crée un client.
#[tauri::command]
pub async fn create_client_command(
  nom: Option<String>,
  prenom: Option<String>,
  telephone: Option<String>,
  cin: Option<String>,
  email: Option<String>,
) -> Result<Client, String> {
  client_service::create_client(nom, prenom, telephone, cin, email).map_err(|e| e.to_string())
}

/// Récupère un client par son id.
#[tauri::command]
pub async fn get_client_command(id_client: i64) -> Result<Client, String> {
  client_service::get_client(id_client).map_err(|e| e.to_string())
}

/// Met à jour un client.
#[tauri::command]
pub async fn update_client_command(
  id_client: i64,
  nom: Option<String>,
  prenom: Option<String>,
  telephone: Option<String>,
  cin: Option<String>,
  email: Option<String>,
) -> Result<Client, String> {
  client_service::update_client(id_client, nom, prenom, telephone, cin, email)
    .map_err(|e| e.to_string())
}

/// Supprime un client.
#[tauri::command]
pub async fn delete_client_command(id_client: i64) -> Result<(), String> {
  client_service::delete_client(id_client).map_err(|e| e.to_string())
}

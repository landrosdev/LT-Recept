use crate::models::Utilisateur;
use crate::services::utilisateur_service;

#[tauri::command]
pub async fn list_utilisateurs_command() -> Result<Vec<Utilisateur>, String> {
  utilisateur_service::list_utilisateurs().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_utilisateur_command(id_utilisateur: i64) -> Result<Utilisateur, String> {
  utilisateur_service::get_utilisateur(id_utilisateur).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_utilisateur_command(
  nom: Option<String>,
  prenom: Option<String>,
  nom_user: String,
  mot_de_passe: String,
  role: String,
  permissions: String,
  is_active: i64,
) -> Result<Utilisateur, String> {
  utilisateur_service::create_utilisateur(nom, prenom, nom_user, mot_de_passe, role, permissions, is_active)
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_utilisateur_command(
  id_utilisateur: i64,
  nom: Option<String>,
  prenom: Option<String>,
  nom_user: String,
  mot_de_passe: String,
  role: String,
  permissions: String,
  is_active: i64,
) -> Result<Utilisateur, String> {
  utilisateur_service::update_utilisateur(id_utilisateur, nom, prenom, nom_user, mot_de_passe, role, permissions, is_active)
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_utilisateur_command(id_utilisateur: i64) -> Result<(), String> {
  utilisateur_service::delete_utilisateur(id_utilisateur).map_err(|e| e.to_string())
}

use crate::models::ChambreEquipement;
use crate::services::chambre_equipement_service;

#[tauri::command]
pub async fn list_chambre_equipements_command() -> Result<Vec<ChambreEquipement>, String> {
  chambre_equipement_service::list_chambre_equipements().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn assigner_equipement_a_chambre_command(
  id_chambre: i64,
  id_equipement: i64,
) -> Result<ChambreEquipement, String> {
  chambre_equipement_service::assigner_equipement_a_chambre(id_chambre, id_equipement)
    .map_err(|e| e.to_string())
}

/// Désassocie un équipement d'une chambre.
#[tauri::command]
pub async fn delete_chambre_equipement_command(
  id_chambre: i64,
  id_equipement: i64,
) -> Result<(), String> {
  chambre_equipement_service::delete_chambre_equipement(id_chambre, id_equipement)
    .map_err(|e| e.to_string())
}

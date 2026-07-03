use crate::models::Configuration;
use crate::services::configuration_service;

#[tauri::command]
pub async fn get_configuration_command() -> Result<Configuration, String> {
  configuration_service::get_configuration().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_configuration_command(config: Configuration) -> Result<Configuration, String> {
  configuration_service::update_configuration(config).map_err(|e| e.to_string())
}

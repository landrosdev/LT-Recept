use crate::services;
use crate::errors::AppResult;

#[tauri::command]
pub async fn log_action_command(id_utilisateur: Option<i64>, action: String, details: Option<String>) -> AppResult<()> {
    services::log_action(id_utilisateur, &action, details.as_deref())
}

use crate::models::AuditLog;
use crate::services;
use crate::errors::AppResult;

#[tauri::command]
pub async fn list_audit_logs_command() -> AppResult<Vec<AuditLog>> {
    services::list_audit_logs()
}

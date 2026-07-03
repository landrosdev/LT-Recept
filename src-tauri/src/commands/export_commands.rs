use crate::services;
use crate::errors::AppResult;
use directories::UserDirs;

#[tauri::command]
pub async fn export_data_command() -> AppResult<String> {
    let download_dir = UserDirs::new()
        .and_then(|dirs| dirs.download_dir().map(|p| p.to_path_buf()))
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_default());
    
    let path_str = download_dir.to_string_lossy();
    services::export_all_to_csv(&path_str)
}

// Connection à la base de donnee

use std::fs;
use std::path::PathBuf;

use directories::ProjectDirs;
use rusqlite::Connection;

use crate::errors::{AppError, AppResult};

/// Nom de fichier de la base de données SQLite.
const DB_FILE: &str = "app.db";

fn resolve_db_path() -> AppResult<PathBuf> {
  let proj = ProjectDirs::from("", "", "app")
    .ok_or_else(|| AppError::Validation("ProjectDirs introuvable".into()))?;

  let dir = proj.data_local_dir();
  fs::create_dir_all(dir).map_err(|e| AppError::Validation(e.to_string()))?;

  let target = dir.join(DB_FILE);

  let legacy = PathBuf::from(DB_FILE);
  if legacy.exists() && !target.exists() {
    fs::copy(&legacy, &target).map_err(|e| AppError::Validation(e.to_string()))?;
  }

  Ok(target)
}

/// Ouvre une connexion vers la base SQLite locale.
///
/// Active `PRAGMA foreign_keys = ON` pour respecter les contraintes.
pub fn get_connection() -> AppResult<Connection> {
  let db_path = resolve_db_path()?;
  let conn = Connection::open(db_path)?;
  conn.execute_batch("PRAGMA foreign_keys = ON;")?;
  Ok(conn)
}
// Gestion d'erreur 

use std::error::Error;
use std::fmt;
use serde::{Serialize, Serializer};

/// Type d'erreur centralisé pour l'application.
#[derive(Debug)]
pub enum AppError {
  /// Erreur liée à la base de données SQLite.
  Database(rusqlite::Error),
  /// Erreur d'entrée/sortie (fichiers, export).
  Io(std::io::Error),
  /// Ressource non trouvée (par ex. client, chambre...).
  NotFound(&'static str),
  /// Erreur de validation métier (données invalides côté domaine).
  Validation(String),
}

/// Alias de résultat utilisé dans tout le backend.
pub type AppResult<T> = Result<T, AppError>;

impl fmt::Display for AppError {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    match self {
      AppError::Database(e) => write!(f, "Database error: {}", e),
      AppError::Io(e) => write!(f, "IO error: {}", e),
      AppError::NotFound(entity) => write!(f, "{} not found", entity),
      AppError::Validation(msg) => write!(f, "Validation error: {}", msg),
    }
  }
}

impl Error for AppError {}

impl From<rusqlite::Error> for AppError {
  fn from(err: rusqlite::Error) -> Self {
    AppError::Database(err)
  }
}

impl From<std::io::Error> for AppError {
  fn from(err: std::io::Error) -> Self {
    AppError::Io(err)
  }
}

// Pour que Tauri puisse renvoyer l'erreur au frontend, elle doit être sérialisable.
impl Serialize for AppError {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    serializer.serialize_str(&self.to_string())
  }
}
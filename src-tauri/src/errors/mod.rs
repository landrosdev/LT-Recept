// Gestion d'erreur 

use std::error::Error;
use std::fmt;

/// Type d'erreur centralisé pour l'application.
#[derive(Debug)]
pub enum AppError {
  /// Erreur liée à la base de données SQLite.
  Database(rusqlite::Error),
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
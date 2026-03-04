// CREATE ET ALTER

use rusqlite::Connection;

use crate::errors::AppResult;

/// Script SQL complet des créations de tables.
///
/// Le fichier `model_logique.sql` se trouve à la racine du projet.
/// Le chemin est relatif à ce fichier : src-tauri/src/db/../../../model_logique.sql
const MIGRATIONS_SQL: &str = include_str!("./model_logique.sql");

/// Exécute les migrations sur la connexion donnée.
pub fn run_migrations(conn: &Connection) -> AppResult<()> {
  conn.execute_batch(MIGRATIONS_SQL)?;
  Ok(())
}
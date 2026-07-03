// Initialisation de donnees

use rusqlite::{params, Connection};

use crate::errors::AppResult;

/// Insère quelques données initiales si la base est vide.
pub fn seed_database(conn: &Connection) -> AppResult<()> {
  // On vérifie s'il existe déjà des utilisateurs pour éviter de reseeder.
  let existing_users: i64 = conn
    .query_row("SELECT COUNT(*) FROM utilisateur", [], |row| row.get(0))
    .unwrap_or(0);

  if existing_users > 0 {
    return Ok(());
  }

  // Admin par défaut.
  conn.execute(
    "INSERT INTO utilisateur (nom_user, mot_de_passe, is_active, role) VALUES (?1, ?2, 1, 'admin')",
    params!["admin", "admin"],
  )?;

  Ok(())
}

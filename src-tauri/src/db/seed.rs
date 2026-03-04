// Initialisation de donnees

use rusqlite::{params, Connection};

use crate::errors::AppResult;

/// Insère quelques données initiales si la base est vide.
pub fn seed_database(conn: &Connection) -> AppResult<()> {
  // On vérifie s'il existe déjà des clients pour éviter de reseeder.
  let existing_clients: i64 = conn
    .query_row("SELECT COUNT(*) FROM client", [], |row| row.get(0))
    .unwrap_or(0);

  if existing_clients > 0 {
    return Ok(());
  }

  // Admin par défaut.
  conn.execute(
    "INSERT INTO utilisateur (nom_user, mot_de_passe, statut, admin) VALUES (?1, ?2, 'ACTIF', 1)",
    params!["admin", "admin"],
  )?;

  // Client de démonstration.
  conn.execute(
    "INSERT INTO client (nom, prenom, telephone, email) VALUES (?1, ?2, ?3, ?4)",
    params!["DUPONT", "Jean", "000000000", "jean.dupont@example.com"],
  )?;

  // Quelques chambres de base.
  conn.execute(
    "INSERT INTO chambre (numero, type_chambre, description) VALUES ('101', 'SIMPLE', 'Chambre simple'),
       ('102', 'DOUBLE', 'Chambre double'),
       ('201', 'SUITE', 'Suite familiale')",
    [],
  )?;

  Ok(())
}

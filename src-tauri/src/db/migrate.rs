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
  // Création des tables de base (si elles n'existent pas)
  conn.execute_batch(MIGRATIONS_SQL)?;

  // Migrations incrémentales : on ignore l'erreur si la colonne existe déjà
  // car SQLite ne supporte pas nativement le IF NOT EXISTS sur ADD COLUMN.
  let _ = conn.execute("ALTER TABLE utilisateur ADD COLUMN nom TEXT", []);
  let _ = conn.execute("ALTER TABLE utilisateur ADD COLUMN prenom TEXT", []);
  let _ = conn.execute("ALTER TABLE utilisateur ADD COLUMN is_active INTEGER DEFAULT 1", []);

  // Migrations for facture
  let _ = conn.execute("ALTER TABLE facture ADD COLUMN statut TEXT DEFAULT 'EN_ATTENTE'", []);

  // Migrations for reservation
  let _ = conn.execute("ALTER TABLE reservation ADD COLUMN chambres_ids TEXT", []);
  let _ = conn.execute("ALTER TABLE reservation ADD COLUMN date_debut TEXT", []);
  let _ = conn.execute("ALTER TABLE reservation ADD COLUMN date_fin TEXT", []);
  let _ = conn.execute("ALTER TABLE reservation ADD COLUMN id_categorie INTEGER", []);
  let _ = conn.execute("ALTER TABLE reservation ADD COLUMN nombre_nuite INTEGER DEFAULT 1", []);

  let _ = conn.execute("ALTER TABLE sejour ADD COLUMN id_reservation INTEGER", []);
  let _ = conn.execute("ALTER TABLE sejour ADD COLUMN chambres_ids TEXT", []);
  let _ = conn.execute("ALTER TABLE sejour ADD COLUMN id_categorie INTEGER", []);
  let _ = conn.execute("ALTER TABLE sejour ADD COLUMN date_debut TEXT", []);
  let _ = conn.execute("ALTER TABLE sejour ADD COLUMN date_fin TEXT", []);
  let _ = conn.execute("ALTER TABLE sejour ADD COLUMN nombre_nuite INTEGER DEFAULT 1", []);
  let _ = conn.execute("ALTER TABLE sejour ADD COLUMN paiement TEXT", []);
  let _ = conn.execute("ALTER TABLE sejour ADD COLUMN statut TEXT", []);
  let _ = conn.execute("ALTER TABLE sejour ADD COLUMN remarques TEXT", []);

  // Migrations for facture
  let _ = conn.execute("ALTER TABLE facture ADD COLUMN id_sejour INTEGER", []);
  let _ = conn.execute("ALTER TABLE facture ADD COLUMN montant REAL DEFAULT 0", []);

  // Financial migrations for reservations and stays
  let _ = conn.execute("ALTER TABLE reservation ADD COLUMN montant_total REAL DEFAULT 0", []);
  let _ = conn.execute("ALTER TABLE reservation ADD COLUMN avance REAL DEFAULT 0", []);
  let _ = conn.execute("ALTER TABLE sejour ADD COLUMN montant_total REAL DEFAULT 0", []);
  let _ = conn.execute("ALTER TABLE sejour ADD COLUMN avance REAL DEFAULT 0", []);

  // Clean up data: trim whitespace from names
  let _ = conn.execute("UPDATE categorie_chambre SET libelle = TRIM(libelle)", []);
  let _ = conn.execute("UPDATE tarif SET nom = TRIM(nom)", []);

  // Migrations for configuration
  let _ = conn.execute("ALTER TABLE configuration ADD COLUMN stat TEXT", []);
  let _ = conn.execute("ALTER TABLE configuration ADD COLUMN message_perso TEXT", []);
  let _ = conn.execute("ALTER TABLE configuration ADD COLUMN facebook TEXT", []);

  // Migrations for remise
  let _ = conn.execute("ALTER TABLE sejour ADD COLUMN remise REAL DEFAULT 0", []);
  let _ = conn.execute("ALTER TABLE reservation ADD COLUMN remise REAL DEFAULT 0", []);

  // Fix audit_log foreign key (SQLite table swap pattern)
  // We check if the table exists and if it already has ON DELETE SET NULL
  let needs_migration: bool = conn.query_row(
    "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='audit_log' AND sql NOT LIKE '%ON DELETE SET NULL%'",
    [],
    |row| {
      let count: i64 = row.get(0)?;
      Ok(count > 0)
    }
  ).unwrap_or(false);

  if needs_migration {
    println!("Migrating audit_log table to support ON DELETE SET NULL...");
    conn.execute_batch("
      PRAGMA foreign_keys=OFF;
      DROP TABLE IF EXISTS audit_log_new;
      CREATE TABLE audit_log_new (
          id_audit INTEGER PRIMARY KEY AUTOINCREMENT,
          id_utilisateur INTEGER,
          action TEXT NOT NULL,
          details TEXT,
          date_action TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL
      );
      INSERT INTO audit_log_new (id_audit, id_utilisateur, action, details, date_action)
      SELECT id_audit, id_utilisateur, action, details, date_action FROM audit_log;
      DROP TABLE audit_log;
      ALTER TABLE audit_log_new RENAME TO audit_log;
      PRAGMA foreign_keys=ON;
    ")?;
    println!("Migration completed successfully.");
  }

  Ok(())
}
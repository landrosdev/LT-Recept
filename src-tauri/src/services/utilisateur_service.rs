use rusqlite::{params, Connection};

use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::Utilisateur;

pub fn list_utilisateurs() -> AppResult<Vec<Utilisateur>> {
  let conn = get_connection()?;
  query_utilisateurs(&conn)
}

pub fn get_utilisateur(id_utilisateur: i64) -> AppResult<Utilisateur> {
  let conn = get_connection()?;

  let item = conn.query_row(
    "SELECT id_utilisateur, nom, prenom, nom_user, mot_de_passe, role, permissions, is_active, date_creation, date_modification \
     FROM utilisateur \
     WHERE id_utilisateur = ?1",
    params![id_utilisateur],
    |row| {
      Ok(Utilisateur {
        id_utilisateur: row.get(0)?,
        nom: row.get(1)?,
        prenom: row.get(2)?,
        nom_user: row.get(3)?,
        mot_de_passe: row.get(4)?,
        role: row.get(5)?,
        permissions: row.get(6)?,
        is_active: row.get(7)?,
        date_creation: row.get(8)?,
        date_modification: row.get(9)?,
      })
    },
  )?;

  Ok(item)
}

pub fn create_utilisateur(
  nom: Option<String>,
  prenom: Option<String>,
  nom_user: String,
  mot_de_passe: String,
  role: String,
  permissions: String,
  is_active: i64,
) -> AppResult<Utilisateur> {
  let conn = get_connection()?;

  conn.execute(
    "INSERT INTO utilisateur (nom, prenom, nom_user, mot_de_passe, role, permissions, is_active) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
    params![nom, prenom, nom_user, mot_de_passe, role, permissions, is_active],
  )?;

  let id = conn.last_insert_rowid();
  get_utilisateur(id)
}

pub fn update_utilisateur(
  id_utilisateur: i64,
  nom: Option<String>,
  prenom: Option<String>,
  nom_user: String,
  mot_de_passe: String,
  role: String,
  permissions: String,
  is_active: i64,
) -> AppResult<Utilisateur> {
  let conn = get_connection()?;

  conn.execute(
    "UPDATE utilisateur SET nom = ?1, prenom = ?2, nom_user = ?3, mot_de_passe = ?4, role = ?5, permissions = ?6, is_active = ?7, date_modification = CURRENT_TIMESTAMP WHERE id_utilisateur = ?8",
    params![nom, prenom, nom_user, mot_de_passe, role, permissions, is_active, id_utilisateur],
  )?;

  get_utilisateur(id_utilisateur)
}

pub fn delete_utilisateur(id_utilisateur: i64) -> AppResult<()> {
  let conn = get_connection()?;
  conn.execute(
    "DELETE FROM utilisateur WHERE id_utilisateur = ?1",
    params![id_utilisateur],
  )?;
  Ok(())
}

fn query_utilisateurs(conn: &Connection) -> AppResult<Vec<Utilisateur>> {
  let mut stmt = conn.prepare(
    "SELECT id_utilisateur, nom, prenom, nom_user, mot_de_passe, role, permissions, is_active, date_creation, date_modification FROM utilisateur ORDER BY nom_user",
  )?;

  let iter = stmt.query_map([], |row| {
    Ok(Utilisateur {
      id_utilisateur: row.get(0)?,
      nom: row.get(1)?,
      prenom: row.get(2)?,
      nom_user: row.get(3)?,
      mot_de_passe: row.get(4)?,
      role: row.get(5)?,
      permissions: row.get(6)?,
      is_active: row.get(7)?,
      date_creation: row.get(8)?,
      date_modification: row.get(9)?,
    })
  })?;

  let mut items = Vec::new();
  for item in iter {
    items.push(item?);
  }

  Ok(items)
}

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
    "SELECT id_utilisateur, nom_user, mot_de_passe, date_creation, statut, admin \
     FROM utilisateur \
     WHERE id_utilisateur = ?1",
    params![id_utilisateur],
    |row| {
      Ok(Utilisateur {
        id_utilisateur: row.get(0)?,
        nom_user: row.get(1)?,
        mot_de_passe: row.get(2)?,
        date_creation: row.get(3)?,
        statut: row.get(4)?,
        admin: row.get(5)?,
      })
    },
  )?;

  Ok(item)
}

pub fn create_utilisateur(
  nom_user: String,
  mot_de_passe: String,
  statut: String,
  admin: i64,
) -> AppResult<Utilisateur> {
  let conn = get_connection()?;

  conn.execute(
    "INSERT INTO utilisateur (nom_user, mot_de_passe, statut, admin) VALUES (?1, ?2, ?3, ?4)",
    params![nom_user, mot_de_passe, statut, admin],
  )?;

  let id = conn.last_insert_rowid();
  get_utilisateur(id)
}

pub fn update_utilisateur(
  id_utilisateur: i64,
  nom_user: String,
  mot_de_passe: String,
  statut: String,
  admin: i64,
) -> AppResult<Utilisateur> {
  let conn = get_connection()?;

  conn.execute(
    "UPDATE utilisateur SET nom_user = ?1, mot_de_passe = ?2, statut = ?3, admin = ?4 WHERE id_utilisateur = ?5",
    params![nom_user, mot_de_passe, statut, admin, id_utilisateur],
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
    "SELECT id_utilisateur, nom_user, mot_de_passe, date_creation, statut, admin FROM utilisateur ORDER BY nom_user",
  )?;

  let iter = stmt.query_map([], |row| {
    Ok(Utilisateur {
      id_utilisateur: row.get(0)?,
      nom_user: row.get(1)?,
      mot_de_passe: row.get(2)?,
      date_creation: row.get(3)?,
      statut: row.get(4)?,
      admin: row.get(5)?,
    })
  })?;

  let mut items = Vec::new();
  for item in iter {
    items.push(item?);
  }

  Ok(items)
}

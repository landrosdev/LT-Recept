use rusqlite::{params, Connection};

use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::Equipement;

pub fn list_equipements() -> AppResult<Vec<Equipement>> {
  let conn = get_connection()?;

  let mut stmt = conn.prepare("SELECT id_equipement, nom FROM equipement ORDER BY nom")?;

  let iter = stmt.query_map([], |row| {
    Ok(Equipement {
      id_equipement: row.get(0)?,
      nom: row.get(1)?,
    })
  })?;

  let mut items = Vec::new();
  for item in iter {
    items.push(item?);
  }

  Ok(items)
}

pub fn get_equipement(id_equipement: i64) -> AppResult<Equipement> {
  let conn = get_connection()?;

  let equipement = conn.query_row(
    "SELECT id_equipement, nom FROM equipement WHERE id_equipement = ?1",
    params![id_equipement],
    |row| {
      Ok(Equipement {
        id_equipement: row.get(0)?,
        nom: row.get(1)?,
      })
    },
  )?;

  Ok(equipement)
}

pub fn create_equipement(nom: String) -> AppResult<Equipement> {
  let conn = get_connection()?;

  conn.execute("INSERT INTO equipement (nom) VALUES (?1)", params![nom])?;

  let id = conn.last_insert_rowid();

  Ok(Equipement { id_equipement: id, nom })
}

pub fn update_equipement(id_equipement: i64, nom: String) -> AppResult<Equipement> {
  let conn = get_connection()?;

  conn.execute(
    "UPDATE equipement SET nom = ?1 WHERE id_equipement = ?2",
    params![nom, id_equipement],
  )?;

  get_equipement(id_equipement)
}

pub fn delete_equipement(id_equipement: i64) -> AppResult<()> {
  let conn = get_connection()?;
  conn.execute("DELETE FROM equipement WHERE id_equipement = ?1", params![id_equipement])?;
  Ok(())
}

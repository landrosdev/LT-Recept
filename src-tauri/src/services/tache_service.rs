use rusqlite::{params, Connection};

use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::Tache;

pub fn list_taches() -> AppResult<Vec<Tache>> {
  let conn = get_connection()?;

  let mut stmt = conn.prepare(
    "SELECT id_tache, date_tache, description, priorite, responsable, statut \
     FROM tache \
     ORDER BY date_tache",
  )?;

  let iter = stmt.query_map([], |row| {
    Ok(Tache {
      id_tache: row.get(0)?,
      date_tache: row.get(1)?,
      description: row.get(2)?,
      priorite: row.get(3)?,
      responsable: row.get(4)?,
      statut: row.get(5)?,
    })
  })?;

  let mut items = Vec::new();
  for item in iter {
    items.push(item?);
  }

  Ok(items)
}

pub fn create_tache(
  date_tache: String,
  description: String,
  priorite: String,
  responsable: Option<String>,
  statut: String,
) -> AppResult<Tache> {
  let conn = get_connection()?;

  conn.execute(
    "INSERT INTO tache \
       (date_tache, description, priorite, responsable, statut) \
     VALUES (?1, ?2, ?3, ?4, ?5)",
    params![
      date_tache,
      description,
      priorite,
      responsable,
      statut,
    ],
  )?;

  let id = conn.last_insert_rowid();

  let tache = conn.query_row(
    "SELECT id_tache, date_tache, description, priorite, responsable, statut \
     FROM tache \
     WHERE id_tache = ?1",
    params![id],
    |row| {
      Ok(Tache {
        id_tache: row.get(0)?,
        date_tache: row.get(1)?,
        description: row.get(2)?,
        priorite: row.get(3)?,
        responsable: row.get(4)?,
        statut: row.get(5)?,
      })
    },
  )?;

  Ok(tache)
}

pub fn get_tache(id_tache: i64) -> AppResult<Tache> {
  let conn = get_connection()?;

  let tache = conn.query_row(
    "SELECT id_tache, date_tache, description, priorite, responsable, statut \
     FROM tache \
     WHERE id_tache = ?1",
    params![id_tache],
    |row| {
      Ok(Tache {
        id_tache: row.get(0)?,
        date_tache: row.get(1)?,
        description: row.get(2)?,
        priorite: row.get(3)?,
        responsable: row.get(4)?,
        statut: row.get(5)?,
      })
    },
  )?;

  Ok(tache)
}

pub fn update_tache(
  id_tache: i64,
  date_tache: String,
  description: String,
  priorite: String,
  responsable: Option<String>,
  statut: String,
) -> AppResult<Tache> {
  let conn = get_connection()?;

  conn.execute(
    "UPDATE tache \
       SET date_tache = ?1, description = ?2, priorite = ?3, responsable = ?4, statut = ?5 \
     WHERE id_tache = ?6",
    params![
      date_tache,
      description,
      priorite,
      responsable,
      statut,
      id_tache,
    ],
  )?;

  get_tache(id_tache)
}

pub fn delete_tache(id_tache: i64) -> AppResult<()> {
  let conn = get_connection()?;
  conn.execute("DELETE FROM tache WHERE id_tache = ?1", params![id_tache])?;
  Ok(())
}

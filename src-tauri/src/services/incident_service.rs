use rusqlite::{params, Connection};

use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::Incident;

pub fn list_incidents() -> AppResult<Vec<Incident>> {
  let conn = get_connection()?;

  let mut stmt = conn.prepare(
    "SELECT id_incident, id_chambre, date_incident, probleme, \
            action_prise, responsable, statut \
     FROM incident \
     ORDER BY date_incident",
  )?;

  let iter = stmt.query_map([], |row| {
    Ok(Incident {
      id_incident: row.get(0)?,
      id_chambre: row.get(1)?,
      date_incident: row.get(2)?,
      probleme: row.get(3)?,
      action_prise: row.get(4)?,
      responsable: row.get(5)?,
      statut: row.get(6)?,
    })
  })?;

  let mut items = Vec::new();
  for item in iter {
    items.push(item?);
  }

  Ok(items)
}

pub fn get_incident(id_incident: i64) -> AppResult<Incident> {
  let conn = get_connection()?;

  let incident = conn.query_row(
    "SELECT id_incident, id_chambre, date_incident, probleme, \
            action_prise, responsable, statut \
     FROM incident \
     WHERE id_incident = ?1",
    params![id_incident],
    |row| {
      Ok(Incident {
        id_incident: row.get(0)?,
        id_chambre: row.get(1)?,
        date_incident: row.get(2)?,
        probleme: row.get(3)?,
        action_prise: row.get(4)?,
        responsable: row.get(5)?,
        statut: row.get(6)?,
      })
    },
  )?;

  Ok(incident)
}

pub fn create_incident(
  id_chambre: i64,
  date_incident: String,
  probleme: String,
  action_prise: Option<String>,
  responsable: Option<String>,
  statut: String,
) -> AppResult<Incident> {
  let conn = get_connection()?;

  conn.execute(
    "INSERT INTO incident \
       (id_chambre, date_incident, probleme, action_prise, responsable, statut) \
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    params![
      id_chambre,
      date_incident,
      probleme,
      action_prise,
      responsable,
      statut,
    ],
  )?;

  let id = conn.last_insert_rowid();
  get_incident(id)
}

pub fn update_incident(
  id_incident: i64,
  id_chambre: i64,
  date_incident: String,
  probleme: String,
  action_prise: Option<String>,
  responsable: Option<String>,
  statut: String,
) -> AppResult<Incident> {
  let conn = get_connection()?;

  conn.execute(
    "UPDATE incident \
       SET id_chambre = ?1, date_incident = ?2, probleme = ?3, action_prise = ?4, \
           responsable = ?5, statut = ?6 \
     WHERE id_incident = ?7",
    params![
      id_chambre,
      date_incident,
      probleme,
      action_prise,
      responsable,
      statut,
      id_incident,
    ],
  )?;

  get_incident(id_incident)
}

pub fn delete_incident(id_incident: i64) -> AppResult<()> {
  let conn = get_connection()?;
  conn.execute("DELETE FROM incident WHERE id_incident = ?1", params![id_incident])?;
  Ok(())
}

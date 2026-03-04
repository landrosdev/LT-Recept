use rusqlite::{params, Connection};

use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::ChambreEquipement;

pub fn list_chambre_equipements() -> AppResult<Vec<ChambreEquipement>> {
  let conn = get_connection()?;

  let mut stmt = conn.prepare(
    "SELECT id_chambre, id_equipement FROM chambre_equipement",
  )?;

  let iter = stmt.query_map([], |row| {
    Ok(ChambreEquipement {
      id_chambre: row.get(0)?,
      id_equipement: row.get(1)?,
    })
  })?;

  let mut items = Vec::new();
  for item in iter {
    items.push(item?);
  }

  Ok(items)
}

pub fn assigner_equipement_a_chambre(
  id_chambre: i64,
  id_equipement: i64,
) -> AppResult<ChambreEquipement> {
  let conn = get_connection()?;

  conn.execute(
    "INSERT OR IGNORE INTO chambre_equipement (id_chambre, id_equipement) VALUES (?1, ?2)",
    params![id_chambre, id_equipement],
  )?;

  Ok(ChambreEquipement {
    id_chambre,
    id_equipement,
  })
}

/// Désassocie un équipement d'une chambre.
pub fn delete_chambre_equipement(id_chambre: i64, id_equipement: i64) -> AppResult<()> {
  let conn = get_connection()?;
  conn.execute(
    "DELETE FROM chambre_equipement WHERE id_chambre = ?1 AND id_equipement = ?2",
    params![id_chambre, id_equipement],
  )?;
  Ok(())
}

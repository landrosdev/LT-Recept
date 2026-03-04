use rusqlite::{params, Connection};

use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::{Facture, Sejour};

pub fn list_sejours() -> AppResult<Vec<Sejour>> {
  let conn = get_connection()?;

  let mut stmt = conn.prepare(
    "SELECT id_sejour, id_client, id_reservation, id_chambre, date_jour, \
            heure_arrivee, heure_depart_prevue, statut, remarques \
     FROM sejour \
     ORDER BY date_jour",
  )?;

  let iter = stmt.query_map([], |row| {
    Ok(Sejour {
      id_sejour: row.get(0)?,
      id_client: row.get(1)?,
      id_reservation: row.get(2)?,
      id_chambre: row.get(3)?,
      date_jour: row.get(4)?,
      heure_arrivee: row.get(5)?,
      heure_depart_prevue: row.get(6)?,
      statut: row.get(7)?,
      remarques: row.get(8)?,
    })
  })?;

  let mut items = Vec::new();
  for item in iter {
    items.push(item?);
  }

  Ok(items)
}

fn get_sejour_internal(conn: &Connection, id_sejour: i64) -> AppResult<Sejour> {
  let sejour = conn.query_row(
    "SELECT id_sejour, id_client, id_reservation, id_chambre, date_jour, \
            heure_arrivee, heure_depart_prevue, statut, remarques \
     FROM sejour \
     WHERE id_sejour = ?1",
    params![id_sejour],
    |row| {
      Ok(Sejour {
        id_sejour: row.get(0)?,
        id_client: row.get(1)?,
        id_reservation: row.get(2)?,
        id_chambre: row.get(3)?,
        date_jour: row.get(4)?,
        heure_arrivee: row.get(5)?,
        heure_depart_prevue: row.get(6)?,
        statut: row.get(7)?,
        remarques: row.get(8)?,
      })
    },
  )?;

  Ok(sejour)
}

pub fn get_sejour(id_sejour: i64) -> AppResult<Sejour> {
  let conn = get_connection()?;
  get_sejour_internal(&conn, id_sejour)
}

pub fn create_sejour(
  id_client: i64,
  id_reservation: Option<i64>,
  id_chambre: i64,
  date_jour: String,
  heure_arrivee: Option<String>,
  heure_depart_prevue: Option<String>,
  statut: String,
  remarques: Option<String>,
) -> AppResult<Sejour> {
  println!("DEBUG: create_sejour start. Client={}, Room={}, Date={}", id_client, id_chambre, date_jour);
  let mut conn = get_connection()?;
  let tx = conn.transaction()?;

  tx.execute(
    "INSERT INTO sejour \
       (id_client, id_reservation, id_chambre, date_jour, heure_arrivee, \
        heure_depart_prevue, statut, remarques) \
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
    params![
      id_client,
      id_reservation,
      id_chambre,
      date_jour,
      heure_arrivee,
      heure_depart_prevue,
      statut,
      remarques,
    ],
  )?;

  let id = tx.last_insert_rowid();
  println!("DEBUG: Sejour inserted with ID={}", id);
  
  let sejour = get_sejour_internal(&tx, id)?;

  // Automatisme : si le séjour est lié à une réservation
  if let Some(res_id) = sejour.id_reservation {
    let count: i64 = tx
      .query_row(
        "SELECT COUNT(*) FROM facture WHERE id_reservation = ?1",
        params![res_id],
        |row| row.get(0),
      )
      .unwrap_or(0);

    if count == 0 {
      println!("DEBUG: Creating automatic facture for reservation {}", res_id);
      tx.execute(
        "INSERT INTO facture \
           (id_client, id_chambre, id_reservation, date_facture, montant, \
            mode_paiement, paye, observations) \
         VALUES (?1, ?2, ?3, ?4, 0, NULL, 'NON', NULL)",
        params![
          sejour.id_client,
          sejour.id_chambre,
          res_id,
          sejour.date_jour.clone(),
        ],
      )?;
    } else {
      println!("DEBUG: Updating existing facture for reservation {} with room {}", res_id, sejour.id_chambre);
      // Mise à jour de la facture existante avec la chambre attribuée
      tx.execute(
        "UPDATE facture SET id_chambre = ?1 WHERE id_reservation = ?2",
        params![sejour.id_chambre, res_id],
      )?;
    }
  }

  tx.commit()?;
  println!("DEBUG: Transaction committed");

  Ok(sejour)
}

pub fn update_sejour(
  id_sejour: i64,
  id_client: i64,
  id_reservation: Option<i64>,
  id_chambre: i64,
  date_jour: String,
  heure_arrivee: Option<String>,
  heure_depart_prevue: Option<String>,
  statut: String,
  remarques: Option<String>,
) -> AppResult<Sejour> {
  let conn = get_connection()?;

  conn.execute(
    "UPDATE sejour \
       SET id_client = ?1, id_reservation = ?2, id_chambre = ?3, date_jour = ?4, \
           heure_arrivee = ?5, heure_depart_prevue = ?6, statut = ?7, remarques = ?8 \
     WHERE id_sejour = ?9",
    params![
      id_client,
      id_reservation,
      id_chambre,
      date_jour,
      heure_arrivee,
      heure_depart_prevue,
      statut,
      remarques,
      id_sejour,
    ],
  )?;

  get_sejour_internal(&conn, id_sejour)
}

pub fn delete_sejour(id_sejour: i64) -> AppResult<()> {
  let conn = get_connection()?;
  conn.execute("DELETE FROM sejour WHERE id_sejour = ?1", params![id_sejour])?;
  Ok(())
}

use rusqlite::{params, Connection};
use chrono::Local;

use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::Reservation;
use crate::services::facture_service;

pub fn list_reservations() -> AppResult<Vec<Reservation>> {
  let conn = get_connection()?;

  let mut stmt = conn.prepare(
    "SELECT id_reservation, id_client, type_chambre, date_arrivee, date_depart, \
            paiement, statut, created_at \
     FROM reservation \
     ORDER BY date_arrivee",
  )?;

  let iter = stmt.query_map([], |row| {
    Ok(Reservation {
      id_reservation: row.get(0)?,
      id_client: row.get(1)?,
      type_chambre: row.get(2)?,
      date_arrivee: row.get(3)?,
      date_depart: row.get(4)?,
      paiement: row.get(5)?,
      statut: row.get(6)?,
      created_at: row.get(7)?,
    })
  })?;

  let mut items = Vec::new();
  for item in iter {
    items.push(item?);
  }

  Ok(items)
}

pub fn get_reservation(id_reservation: i64) -> AppResult<Reservation> {
  let conn = get_connection()?;

  let reservation = conn.query_row(
    "SELECT id_reservation, id_client, type_chambre, date_arrivee, date_depart, \
            paiement, statut, created_at \
     FROM reservation \
     WHERE id_reservation = ?1",
    params![id_reservation],
    |row| {
      Ok(Reservation {
        id_reservation: row.get(0)?,
        id_client: row.get(1)?,
        type_chambre: row.get(2)?,
        date_arrivee: row.get(3)?,
        date_depart: row.get(4)?,
        paiement: row.get(5)?,
        statut: row.get(6)?,
        created_at: row.get(7)?,
      })
    },
  )?;

  Ok(reservation)
}

pub fn create_reservation(
  id_client: i64,
  type_chambre: String,
  date_arrivee: String,
  date_depart: String,
  paiement: Option<String>,
  statut: String,
) -> AppResult<Reservation> {
  println!("SERVICE: create_reservation started");
  let conn = get_connection()?;

  println!("SERVICE: Inserting reservation...");
  conn.execute(
    "INSERT INTO reservation \
       (id_client, type_chambre, date_arrivee, date_depart, paiement, statut) \
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
    params![
      id_client,
      type_chambre,
      date_arrivee,
      date_depart,
      paiement,
      statut,
    ],
  ).map_err(|e| {
    println!("SERVICE Error inserting reservation: {:?}", e);
    e
  })?;

  let id = conn.last_insert_rowid();
  println!("SERVICE: Reservation inserted with ID: {}", id);

  // Création automatique de la facture
  let date_facture = Local::now().format("%Y-%m-%d").to_string();
  println!("SERVICE: Creating automatic invoice...");
  
  if let Err(e) = facture_service::create_facture(
    id_client,
    None,
    Some(id),
    date_facture,
    0.0,
    None,
    "NON".to_string(),
    Some("Facture créée automatiquement avec la réservation".to_string()),
  ) {
     println!("SERVICE Error creating invoice: {:?}", e);
     // We might want to return this error or just log it. 
     // For now, let's bubble it up so the user sees it.
     return Err(e);
  }

  println!("SERVICE: Invoice created successfully. Fetching reservation...");
  get_reservation(id)
}

pub fn update_reservation(
  id_reservation: i64,
  id_client: i64,
  type_chambre: String,
  date_arrivee: String,
  date_depart: String,
  paiement: Option<String>,
  statut: String,
) -> AppResult<Reservation> {
  let conn = get_connection()?;

  conn.execute(
    "UPDATE reservation \
       SET id_client = ?1, type_chambre = ?2, date_arrivee = ?3, date_depart = ?4, \
           paiement = ?5, statut = ?6 \
     WHERE id_reservation = ?7",
    params![
      id_client,
      type_chambre,
      date_arrivee,
      date_depart,
      paiement,
      statut,
      id_reservation,
    ],
  )?;

  get_reservation(id_reservation)
}

pub fn delete_reservation(id_reservation: i64) -> AppResult<()> {
  let conn = get_connection()?;
  conn.execute(
    "DELETE FROM reservation WHERE id_reservation = ?1",
    params![id_reservation],
  )?;
  Ok(())
}

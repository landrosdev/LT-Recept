use rusqlite::{params, Connection};
use chrono::Local;

use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::Reservation;

pub fn list_reservations() -> AppResult<Vec<Reservation>> {
  let conn = get_connection()?;

  let mut stmt = conn.prepare(
    "SELECT id_reservation, id_client, id_categorie, date_debut, date_fin, \
            nombre_nuite, paiement, statut, created_at, chambres_ids, montant_total, avance, remise \
     FROM reservation \
     ORDER BY date_debut",
  )?;

  let iter = stmt.query_map([], |row| {
    Ok(Reservation {
      id_reservation: row.get(0)?,
      id_client: row.get(1)?,
      id_categorie: row.get(2)?,
      date_debut: row.get(3)?,
      date_fin: row.get(4)?,
      nombre_nuite: row.get(5)?,
      paiement: row.get(6)?,
      statut: row.get(7)?,
      created_at: row.get(8)?,
      chambres_ids: row.get(9)?,
      montant_total: row.get(10)?,
      avance: row.get(11)?,
      remise: row.get(12)?,
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
  get_reservation_internal(&conn, id_reservation)
}

pub fn create_reservation(
  id_client: i64,
  id_categorie: i64,
  date_debut: String,
  date_fin: Option<String>,
  nombre_nuite: i64,
  paiement: Option<String>,
  statut: String,
  chambres_ids: Option<String>,
  montant_total: f64,
  avance: f64,
  remise: f64,
) -> AppResult<Reservation> {
  let mut conn = get_connection()?;
  let tx = conn.transaction()?;

  tx.execute(
    "INSERT INTO reservation \
       (id_client, id_categorie, date_debut, date_fin, nombre_nuite, paiement, statut, chambres_ids, montant_total, avance, remise) \
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
    params![
      id_client,
      id_categorie,
      date_debut,
      date_fin,
      nombre_nuite,
      paiement,
      statut,
      chambres_ids,
      montant_total,
      avance,
      remise,
    ],
  )?;

  let id = tx.last_insert_rowid();

  // Création automatique de la facture
  let date_facture = Local::now().format("%Y-%m-%d").to_string();
  
  tx.execute(
    "INSERT INTO facture \
       (id_client, id_chambre, id_reservation, date_facture, montant, remise, \
        mode_paiement, statut, observations) \
     VALUES (?1, NULL, ?2, ?3, ?4, ?5, NULL, 'EN_ATTENTE', 'Facture créée automatiquement avec la réservation')",
    params![
      id_client,
      id,
      date_facture,
      montant_total,
      remise,
    ],
  )?;

  let facture_id = tx.last_insert_rowid();
  
  if avance > 0.0 {
    tx.execute(
      "INSERT INTO paiement (id_facture, montant, mode_paiement) VALUES (?1, ?2, ?3)",
      params![facture_id, avance, paiement.clone()],
    )?;
    
    let nouveau_statut = if avance >= (montant_total - remise) { "PAYE" } else { "PARTIEL" };
    tx.execute(
      "UPDATE facture SET statut = ?1 WHERE id_facture = ?2",
      params![nouveau_statut, facture_id],
    )?;
  }

  tx.commit()?;
  
  let conn = get_connection()?;
  get_reservation_internal(&conn, id)
}

fn get_reservation_internal(conn: &Connection, id_reservation: i64) -> AppResult<Reservation> {
  let reservation = conn.query_row(
    "SELECT id_reservation, id_client, id_categorie, date_debut, date_fin, \
            nombre_nuite, paiement, statut, created_at, chambres_ids, montant_total, avance, remise \
     FROM reservation \
     WHERE id_reservation = ?1",
    params![id_reservation],
    |row| {
      Ok(Reservation {
        id_reservation: row.get(0)?,
        id_client: row.get(1)?,
        id_categorie: row.get(2)?,
        date_debut: row.get(3)?,
        date_fin: row.get(4)?,
        nombre_nuite: row.get(5)?,
        paiement: row.get(6)?,
        statut: row.get(7)?,
        created_at: row.get(8)?,
        chambres_ids: row.get(9)?,
        montant_total: row.get(10)?,
        avance: row.get(11)?,
        remise: row.get(12)?,
      })
    },
  )?;

  Ok(reservation)
}

pub fn update_reservation(
  id_reservation: i64,
  id_client: i64,
  id_categorie: i64,
  date_debut: String,
  date_fin: Option<String>,
  nombre_nuite: i64,
  paiement: Option<String>,
  statut: String,
  chambres_ids: Option<String>,
  montant_total: f64,
  avance: f64,
  remise: f64,
) -> AppResult<Reservation> {
  let mut conn = get_connection()?;
  let tx = conn.transaction()?;

  tx.execute(
    "UPDATE reservation \
       SET id_client = ?1, id_categorie = ?2, date_debut = ?3, date_fin = ?4, \
           nombre_nuite = ?5, paiement = ?6, statut = ?7, chambres_ids = ?8, \
           montant_total = ?9, avance = ?10, remise = ?11 \
     WHERE id_reservation = ?12",
    params![
      id_client,
      id_categorie,
      date_debut,
      date_fin,
      nombre_nuite,
      paiement,
      statut,
      chambres_ids,
      montant_total,
      avance,
      remise,
      id_reservation,
    ],
  )?;

  // Update invoice amount and discount
  let _ = tx.execute(
    "UPDATE facture SET montant = ?1, remise = ?2 WHERE id_reservation = ?3",
    params![montant_total, remise, id_reservation],
  );

  if statut == "ANNULEE" {
    let _ = tx.execute(
      "UPDATE facture SET statut = 'ANNULEE', observations = observations || ' (Annulée suite à l''annulation de la réservation)' WHERE id_reservation = ?1",
      params![id_reservation],
    );
  }

  tx.commit()?;
  
  let conn = get_connection()?;
  get_reservation_internal(&conn, id_reservation)
}

pub fn delete_reservation(id_reservation: i64) -> AppResult<()> {
  let conn = get_connection()?;
  conn.execute(
    "DELETE FROM reservation WHERE id_reservation = ?1",
    params![id_reservation],
  )?;
  Ok(())
}

use rusqlite::{params, Connection};

use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::Facture;

pub fn list_factures() -> AppResult<Vec<Facture>> {
  let conn = get_connection()?;

  let mut stmt = conn.prepare(
    "SELECT id_facture, id_client, id_chambre, id_reservation, id_sejour, date_facture, \
            montant, remise, mode_paiement, statut, observations \
     FROM facture \
     ORDER BY date_facture DESC",
  )?;

  let iter = stmt.query_map([], |row| {
    Ok(Facture {
      id_facture: row.get(0)?,
      id_client: row.get(1)?,
      id_chambre: row.get(2)?,
      id_reservation: row.get(3)?,
      id_sejour: row.get(4)?,
      date_facture: row.get(5)?,
      montant: row.get(6)?,
      remise: row.get(7)?,
      mode_paiement: row.get(8)?,
      statut: row.get(9)?,
      observations: row.get(10)?,
    })
  })?;

  let mut items = Vec::new();
  for item in iter {
    items.push(item?);
  }

  Ok(items)
}

pub fn get_facture(id_facture: i64) -> AppResult<Facture> {
  let conn = get_connection()?;

  let facture = conn.query_row(
    "SELECT id_facture, id_client, id_chambre, id_reservation, id_sejour, date_facture, \
            montant, remise, mode_paiement, statut, observations \
     FROM facture \
     WHERE id_facture = ?1",
    params![id_facture],
    |row| {
      Ok(Facture {
        id_facture: row.get(0)?,
        id_client: row.get(1)?,
        id_chambre: row.get(2)?,
        id_reservation: row.get(3)?,
        id_sejour: row.get(4)?,
        date_facture: row.get(5)?,
        montant: row.get(6)?,
        remise: row.get(7)?,
        mode_paiement: row.get(8)?,
        statut: row.get(9)?,
        observations: row.get(10)?,
      })
    },
  )?;

  Ok(facture)
}

pub fn create_facture(
  id_client: i64,
  id_chambre: Option<i64>,
  id_reservation: Option<i64>,
  id_sejour: Option<i64>,
  date_facture: String,
  montant: f64,
  remise: f64,
  mode_paiement: Option<String>,
  statut: String,
  observations: Option<String>,
) -> AppResult<Facture> {
  let conn = get_connection()?;

  conn.execute(
    "INSERT INTO facture \
       (id_client, id_chambre, id_reservation, id_sejour, date_facture, montant, remise, \
        mode_paiement, statut, observations) \
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
    params![
      id_client,
      id_chambre,
      id_reservation,
      id_sejour,
      date_facture,
      montant,
      remise,
      mode_paiement,
      statut,
      observations,
    ],
  )?;

  let id = conn.last_insert_rowid();
  get_facture(id)
}

pub fn update_facture(
  id_facture: i64,
  id_client: i64,
  id_chambre: Option<i64>,
  id_reservation: Option<i64>,
  id_sejour: Option<i64>,
  date_facture: String,
  montant: f64,
  remise: f64,
  mode_paiement: Option<String>,
  statut: String,
  observations: Option<String>,
) -> AppResult<Facture> {
  let conn = get_connection()?;

  conn.execute(
    "UPDATE facture \
       SET id_client = ?1, id_chambre = ?2, id_reservation = ?3, id_sejour = ?4, date_facture = ?5, \
           montant = ?6, remise = ?7, mode_paiement = ?8, statut = ?9, observations = ?10 \
     WHERE id_facture = ?11",
    params![
      id_client,
      id_chambre,
      id_reservation,
      id_sejour,
      date_facture,
      montant,
      remise,
      mode_paiement,
      statut,
      observations,
      id_facture,
    ],
  )?;

  get_facture(id_facture)
}

pub fn delete_facture(id_facture: i64) -> AppResult<()> {
  let conn = get_connection()?;
  conn.execute("DELETE FROM facture WHERE id_facture = ?1", params![id_facture])?;
  Ok(())
}

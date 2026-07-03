use rusqlite::{params, Connection};
use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::Sejour;

pub fn list_sejours() -> AppResult<Vec<Sejour>> {
  let conn = get_connection()?;

  let mut stmt = conn.prepare(
    "SELECT id_sejour, id_client, id_reservation, chambres_ids, id_categorie, \
            date_debut, date_fin, nombre_nuite, paiement, statut, remarques, montant_total, avance, remise \
     FROM sejour \
     ORDER BY date_debut",
  )?;

  let iter = stmt.query_map([], |row| {
    Ok(Sejour {
      id_sejour: row.get(0)?,
      id_client: row.get(1)?,
      id_reservation: row.get(2)?,
      chambres_ids: row.get(3)?,
      id_categorie: row.get(4)?,
      date_debut: row.get(5)?,
      date_fin: row.get(6)?,
      nombre_nuite: row.get(7)?,
      paiement: row.get(8)?,
      statut: row.get(9)?,
      remarques: row.get(10)?,
      montant_total: row.get(11)?,
      avance: row.get(12)?,
      remise: row.get(13)?,
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
    "SELECT id_sejour, id_client, id_reservation, chambres_ids, id_categorie, \
            date_debut, date_fin, nombre_nuite, paiement, statut, remarques, montant_total, avance, remise \
     FROM sejour \
     WHERE id_sejour = ?1",
    params![id_sejour],
    |row| {
      Ok(Sejour {
        id_sejour: row.get(0)?,
        id_client: row.get(1)?,
        id_reservation: row.get(2)?,
        chambres_ids: row.get(3)?,
        id_categorie: row.get(4)?,
        date_debut: row.get(5)?,
        date_fin: row.get(6)?,
        nombre_nuite: row.get(7)?,
        paiement: row.get(8)?,
        statut: row.get(9)?,
        remarques: row.get(10)?,
        montant_total: row.get(11)?,
        avance: row.get(12)?,
        remise: row.get(13)?,
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
  chambres_ids: String,
  id_categorie: i64,
  date_debut: String,
  date_fin: Option<String>,
  nombre_nuite: i64,
  paiement: Option<String>,
  statut: String,
  remarques: Option<String>,
  avance: f64,
  montant_total: f64,
  remise: f64,
) -> AppResult<Sejour> {
  let mut conn = get_connection()?;
  let tx = conn.transaction()?;

  tx.execute(
    "INSERT INTO sejour \
       (id_client, id_reservation, chambres_ids, id_categorie, date_debut, \
        date_fin, nombre_nuite, paiement, statut, remarques, montant_total, avance, remise) \
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
    params![
      id_client,
      id_reservation,
      chambres_ids,
      id_categorie,
      date_debut,
      date_fin,
      nombre_nuite,
      paiement,
      statut,
      remarques,
      montant_total,
      avance,
      remise,
    ],
  )?;

  let id = tx.last_insert_rowid();
  
  let sejour = get_sejour_internal(&tx, id)?;

  if let Some(res_id) = sejour.id_reservation {
    // Le séjour provient d'une réservation. La facture et le paiement existent déjà.
    // On lie simplement la facture existante au nouveau séjour.
    tx.execute(
      "UPDATE facture SET id_sejour = ?1 WHERE id_reservation = ?2",
      params![sejour.id_sejour, res_id],
    )?;
  } else {
    // Séjour direct : Création d'une nouvelle facture
    tx.execute(
      "INSERT INTO facture \
         (id_client, id_chambre, id_reservation, id_sejour, date_facture, montant, remise, \
          mode_paiement, statut, observations) \
       VALUES (?1, NULL, ?2, ?3, ?4, ?5, ?6, NULL, 'EN_ATTENTE', 'Facture séjour')",
      params![
        sejour.id_client,
        sejour.id_reservation,
        sejour.id_sejour,
        sejour.date_debut.clone(),
        montant_total,
        remise,
      ],
    )?;

    let facture_id = tx.last_insert_rowid();

    if avance > 0.0 {
      tx.execute(
        "INSERT INTO paiement (id_facture, montant, mode_paiement) VALUES (?1, ?2, ?3)",
        params![facture_id, avance, sejour.paiement.clone()],
      )?;
      
      let nouveau_statut = if avance >= montant_total { "PAYE" } else { "PARTIEL" };
      tx.execute(
        "UPDATE facture SET statut = ?1 WHERE id_facture = ?2",
        params![nouveau_statut, facture_id],
      )?;
    }
  }

  tx.commit()?;

  Ok(sejour)
}

fn get_room_price_from_db(tx: &Connection, id_categorie: i64) -> f64 {
  let price: Result<f64, rusqlite::Error> = tx.query_row(
    "SELECT t.montant \
     FROM categorie_chambre cat \
     JOIN tarif t ON LOWER(t.nom) = LOWER(cat.libelle) AND t.type_tarif = 'CHAMBRE' \
     WHERE cat.id_categorie = ?1",
    params![id_categorie],
    |row| row.get(0),
  );
  
  price.unwrap_or(0.0)
}

pub fn update_sejour(
  id_sejour: i64,
  id_client: i64,
  id_reservation: Option<i64>,
  chambres_ids: String,
  id_categorie: i64,
  date_debut: String,
  date_fin: Option<String>,
  nombre_nuite: i64,
  paiement: Option<String>,
  statut: String,
  remarques: Option<String>,
  montant_total: f64,
  avance: f64,
  remise: f64,
) -> AppResult<Sejour> {
  let mut conn = get_connection()?;
  let tx = conn.transaction()?;

  tx.execute(
    "UPDATE sejour \
       SET id_client = ?1, id_reservation = ?2, chambres_ids = ?3, id_categorie = ?4, date_debut = ?5, \
           date_fin = ?6, nombre_nuite = ?7, paiement = ?8, statut = ?9, remarques = ?10, \
           montant_total = ?11, avance = ?12, remise = ?13 \
     WHERE id_sejour = ?14",
    params![
      id_client,
      id_reservation,
      chambres_ids,
      id_categorie,
      date_debut,
      date_fin,
      nombre_nuite,
      paiement,
      statut,
      remarques,
      montant_total,
      avance,
      remise,
      id_sejour,
    ],
  )?;

  if statut == "TERMINE" {
    if let Some(res_id) = id_reservation {
      tx.execute(
        "UPDATE reservation SET statut = 'TERMINEE' WHERE id_reservation = ?1",
        params![res_id]
      )?;
      tx.execute(
        "UPDATE facture SET montant = ?1 WHERE id_reservation = ?2",
        params![montant_total, res_id]
      )?;
    } else {
      // Direct sejour
      tx.execute(
        "UPDATE facture SET montant = ?1 WHERE id_sejour = ?2",
        params![montant_total, id_sejour]
      )?;
    }
  }

  let sejour = get_sejour_internal(&tx, id_sejour)?;
  tx.commit()?;
  Ok(sejour)
}

pub fn delete_sejour(id_sejour: i64) -> AppResult<()> {
  let conn = get_connection()?;
  conn.execute("DELETE FROM sejour WHERE id_sejour = ?1", params![id_sejour])?;
  Ok(())
}

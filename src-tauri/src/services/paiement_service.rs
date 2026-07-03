use rusqlite::params;
use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::Paiement;

pub fn list_paiements_by_facture(id_facture: i64) -> AppResult<Vec<Paiement>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare("SELECT id_paiement, id_facture, montant, date_paiement, mode_paiement FROM paiement WHERE id_facture = ?1")?;
    
    let iter = stmt.query_map(params![id_facture], |row| {
        Ok(Paiement {
            id_paiement: row.get(0)?,
            id_facture: row.get(1)?,
            montant: row.get(2)?,
            date_paiement: row.get(3)?,
            mode_paiement: row.get(4)?,
        })
    })?;

    let mut paiements = Vec::new();
    for p in iter {
        paiements.push(p?);
    }
    Ok(paiements)
}

pub fn list_all_paiements() -> AppResult<Vec<Paiement>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare("SELECT id_paiement, id_facture, montant, date_paiement, mode_paiement FROM paiement ORDER BY date_paiement DESC")?;
    
    let iter = stmt.query_map([], |row| {
        Ok(Paiement {
            id_paiement: row.get(0)?,
            id_facture: row.get(1)?,
            montant: row.get(2)?,
            date_paiement: row.get(3)?,
            mode_paiement: row.get(4)?,
        })
    })?;

    let mut paiements = Vec::new();
    for p in iter {
        paiements.push(p?);
    }
    Ok(paiements)
}

pub fn create_paiement(id_facture: i64, montant: f64, mode_paiement: Option<String>) -> AppResult<Paiement> {
    let mut conn = get_connection()?;
    let tx = conn.transaction()?;

    tx.execute(
        "INSERT INTO paiement (id_facture, montant, mode_paiement) VALUES (?1, ?2, ?3)",
        params![id_facture, montant, mode_paiement],
    )?;

    let id = tx.last_insert_rowid();

    // Mettre à jour le statut de la facture automatiquement
    let total_paid: f64 = tx.query_row(
        "SELECT COALESCE(SUM(montant), 0.0) FROM paiement WHERE id_facture = ?1",
        params![id_facture],
        |row| row.get(0),
    )?;

    let (montant_facture, remise_facture): (f64, f64) = tx.query_row(
        "SELECT montant, remise FROM facture WHERE id_facture = ?1",
        params![id_facture],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )?;

    let net_a_payer = montant_facture - remise_facture;
    let new_statut = if total_paid >= net_a_payer {
        "PAYE"
    } else if total_paid > 0.0 {
        "PARTIEL"
    } else {
        "EN_ATTENTE"
    };

    tx.execute(
        "UPDATE facture SET statut = ?1 WHERE id_facture = ?2 AND statut != 'ANNULEE'",
        params![new_statut, id_facture],
    )?;
    
    tx.commit()?;

    let conn = get_connection()?;
    let p = conn.query_row(
        "SELECT id_paiement, id_facture, montant, date_paiement, mode_paiement FROM paiement WHERE id_paiement = ?1",
        params![id],
        |row| {
            Ok(Paiement {
                id_paiement: row.get(0)?,
                id_facture: row.get(1)?,
                montant: row.get(2)?,
                date_paiement: row.get(3)?,
                mode_paiement: row.get(4)?,
            })
        },
    )?;

    Ok(p)
}

pub fn delete_paiement(id_paiement: i64) -> AppResult<()> {
    let mut conn = get_connection()?;
    let tx = conn.transaction()?;

    let id_facture: i64 = tx.query_row(
        "SELECT id_facture FROM paiement WHERE id_paiement = ?1",
        params![id_paiement],
        |row| row.get(0),
    )?;

    tx.execute("DELETE FROM paiement WHERE id_paiement = ?1", params![id_paiement])?;

    // Recalculer le statut
    let total_paid: f64 = tx.query_row(
        "SELECT COALESCE(SUM(montant), 0.0) FROM paiement WHERE id_facture = ?1",
        params![id_facture],
        |row| row.get(0),
    )?;

    let (montant_facture, remise_facture): (f64, f64) = tx.query_row(
        "SELECT montant, remise FROM facture WHERE id_facture = ?1",
        params![id_facture],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )?;

    let net_a_payer = montant_facture - remise_facture;
    let new_statut = if total_paid >= net_a_payer {
        "PAYE"
    } else if total_paid > 0.0 {
        "PARTIEL"
    } else {
        "EN_ATTENTE"
    };

    tx.execute(
        "UPDATE facture SET statut = ?1 WHERE id_facture = ?2 AND statut != 'ANNULEE'",
        params![new_statut, id_facture],
    )?;

    tx.commit()?;
    Ok(())
}

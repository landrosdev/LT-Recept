use rusqlite::params;
use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::Tarif;

pub fn list_tarifs() -> AppResult<Vec<Tarif>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare("SELECT id_tarif, nom, type_tarif, montant, est_pourcentage, description FROM tarif")?;
    
    let iter = stmt.query_map([], |row| {
        Ok(Tarif {
            id_tarif: row.get(0)?,
            nom: row.get(1)?,
            type_tarif: row.get(2)?,
            montant: row.get(3)?,
            est_pourcentage: row.get::<_, i64>(4)? == 1,
            description: row.get(5)?,
        })
    })?;

    let mut tarifs = Vec::new();
    for t in iter {
        tarifs.push(t?);
    }
    Ok(tarifs)
}

pub fn create_tarif(nom: String, type_tarif: String, montant: f64, est_pourcentage: bool, description: Option<String>) -> AppResult<Tarif> {
    let conn = get_connection()?;
    let is_percentage_int = if est_pourcentage { 1 } else { 0 };
    let trimmed_nom = nom.trim();

    conn.execute(
        "INSERT INTO tarif (nom, type_tarif, montant, est_pourcentage, description) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![trimmed_nom, type_tarif, montant, is_percentage_int, description],
    )?;

    let id = conn.last_insert_rowid();
    
    Ok(Tarif {
        id_tarif: id,
        nom: trimmed_nom.to_string(),
        type_tarif,
        montant,
        est_pourcentage,
        description,
    })
}

pub fn update_tarif(id_tarif: i64, nom: String, type_tarif: String, montant: f64, est_pourcentage: bool, description: Option<String>) -> AppResult<Tarif> {
    let conn = get_connection()?;
    let is_percentage_int = if est_pourcentage { 1 } else { 0 };
    let trimmed_nom = nom.trim();

    conn.execute(
        "UPDATE tarif SET nom = ?1, type_tarif = ?2, montant = ?3, est_pourcentage = ?4, description = ?5 WHERE id_tarif = ?6",
        params![trimmed_nom, type_tarif, montant, is_percentage_int, description, id_tarif],
    )?;

    Ok(Tarif {
        id_tarif,
        nom: trimmed_nom.to_string(),
        type_tarif,
        montant,
        est_pourcentage,
        description,
    })
}

pub fn delete_tarif(id_tarif: i64) -> AppResult<()> {
    let conn = get_connection()?;
    conn.execute("DELETE FROM tarif WHERE id_tarif = ?1", params![id_tarif])?;
    Ok(())
}

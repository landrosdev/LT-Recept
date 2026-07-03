use rusqlite::params;
use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::categorie_chambre_model::CategorieChambre;

pub fn list_categories() -> AppResult<Vec<CategorieChambre>> {
  let conn = get_connection()?;
  let mut stmt = conn.prepare("SELECT id_categorie, libelle, description FROM categorie_chambre ORDER BY libelle")?;
  let iter = stmt.query_map([], |row| {
    Ok(CategorieChambre {
      id_categorie: row.get(0)?,
      libelle: row.get(1)?,
      description: row.get(2)?,
    })
  })?;

  let mut items = Vec::new();
  for item in iter {
    items.push(item?);
  }
  Ok(items)
}

pub fn get_categorie(id_categorie: i64) -> AppResult<CategorieChambre> {
  let conn = get_connection()?;
  let item = conn.query_row(
    "SELECT id_categorie, libelle, description FROM categorie_chambre WHERE id_categorie = ?1",
    params![id_categorie],
    |row| {
      Ok(CategorieChambre {
        id_categorie: row.get(0)?,
        libelle: row.get(1)?,
        description: row.get(2)?,
      })
    },
  )?;
  Ok(item)
}

pub fn create_categorie(libelle: String, description: Option<String>) -> AppResult<CategorieChambre> {
  let conn = get_connection()?;
  let trimmed_libelle = libelle.trim();
  conn.execute(
    "INSERT INTO categorie_chambre (libelle, description) VALUES (?1, ?2)",
    params![trimmed_libelle, description],
  )?;
  let id = conn.last_insert_rowid();
  get_categorie(id)
}

pub fn update_categorie(id_categorie: i64, libelle: String, description: Option<String>) -> AppResult<CategorieChambre> {
  let conn = get_connection()?;
  let trimmed_libelle = libelle.trim();
  
  // Get old category to know if libelle changed
  let old_cat: CategorieChambre = conn.query_row(
    "SELECT id_categorie, libelle, description FROM categorie_chambre WHERE id_categorie = ?1",
    params![id_categorie],
    |row| {
      Ok(CategorieChambre {
        id_categorie: row.get(0)?,
        libelle: row.get(1)?,
        description: row.get(2)?,
      })
    },
  )?;

  conn.execute(
    "UPDATE categorie_chambre SET libelle = ?1, description = ?2 WHERE id_categorie = ?3",
    params![trimmed_libelle, &description, &id_categorie],
  )?;

  // Cascade update to tarif if the libelle changed
  if old_cat.libelle != trimmed_libelle {
    conn.execute(
      "UPDATE tarif SET nom = ?1 WHERE nom = ?2 AND type_tarif = 'CHAMBRE'",
      params![trimmed_libelle, &old_cat.libelle],
    )?;
  }

  get_categorie(id_categorie)
}

pub fn delete_categorie(id_categorie: i64) -> AppResult<()> {
  let conn = get_connection()?;
  
  // Get category to know its libelle for cascading delete
  let cat_result = conn.query_row(
    "SELECT libelle FROM categorie_chambre WHERE id_categorie = ?1",
    params![id_categorie],
    |row| row.get::<_, String>(0)
  );

  conn.execute("DELETE FROM categorie_chambre WHERE id_categorie = ?1", params![id_categorie])?;
  
  // Cascade delete tarif
  if let Ok(libelle) = cat_result {
    conn.execute("DELETE FROM tarif WHERE nom = ?1 AND type_tarif = 'CHAMBRE'", params![libelle])?;
  }

  Ok(())
}

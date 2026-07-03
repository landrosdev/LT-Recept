use rusqlite::params;

use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::Chambre;

/// Retourne la liste de toutes les chambres.
pub fn list_chambres() -> AppResult<Vec<Chambre>> {
  let conn = get_connection()?;

  let mut stmt = conn.prepare(
    "SELECT c.id_chambre, c.numero, c.id_categorie, c.description, cat.libelle \
     FROM chambre c \
     JOIN categorie_chambre cat ON c.id_categorie = cat.id_categorie \
     ORDER BY c.numero",
  )?;

  let iter = stmt.query_map([], |row| {
    Ok(Chambre {
      id_chambre: row.get(0)?,
      numero: row.get(1)?,
      id_categorie: row.get(2)?,
      description: row.get(3)?,
      type_chambre: Some(row.get(4)?),
    })
  })?;

  let mut chambres = Vec::new();
  for chambre in iter {
    chambres.push(chambre?);
  }

  Ok(chambres)
}

/// Retourne une chambre par son id.
pub fn get_chambre(id_chambre: i64) -> AppResult<Chambre> {
  let conn = get_connection()?;

  let chambre = conn.query_row(
    "SELECT c.id_chambre, c.numero, c.id_categorie, c.description, cat.libelle \
     FROM chambre c \
     JOIN categorie_chambre cat ON c.id_categorie = cat.id_categorie \
     WHERE c.id_chambre = ?1",
    params![id_chambre],
    |row| {
      Ok(Chambre {
        id_chambre: row.get(0)?,
        numero: row.get(1)?,
        id_categorie: row.get(2)?,
        description: row.get(3)?,
        type_chambre: Some(row.get(4)?),
      })
    },
  )?;

  Ok(chambre)
}

/// Crée une nouvelle chambre.
pub fn create_chambre(
  numero: String,
  id_categorie: i64,
  description: Option<String>,
) -> AppResult<Chambre> {
  let conn = get_connection()?;

  conn.execute(
    "INSERT INTO chambre (numero, id_categorie, description) VALUES (?1, ?2, ?3)",
    params![numero, id_categorie, description],
  )?;

  let id = conn.last_insert_rowid();
  get_chambre(id)
}

/// Met à jour une chambre et renvoie la version mise à jour.
pub fn update_chambre(
  id_chambre: i64,
  numero: String,
  id_categorie: i64,
  description: Option<String>,
) -> AppResult<Chambre> {
  let conn = get_connection()?;

  conn.execute(
    "UPDATE chambre SET numero = ?1, id_categorie = ?2, description = ?3 WHERE id_chambre = ?4",
    params![numero, id_categorie, description, id_chambre],
  )?;

  get_chambre(id_chambre)
}

/// Supprime une chambre.
pub fn delete_chambre(id_chambre: i64) -> AppResult<()> {
  let conn = get_connection()?;
  conn.execute("DELETE FROM chambre WHERE id_chambre = ?1", params![id_chambre])?;
  Ok(())
}

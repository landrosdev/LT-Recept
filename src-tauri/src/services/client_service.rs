use rusqlite::{params, Connection};

use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::Client;

/// Retourne la liste de tous les clients.
pub fn list_clients() -> AppResult<Vec<Client>> {
  let conn = get_connection()?;
  query_clients(&conn)
}

/// Retourne un client par son id.
pub fn get_client(id_client: i64) -> AppResult<Client> {
  let conn = get_connection()?;

  let client = conn.query_row(
    "SELECT id_client, nom, prenom, telephone, email FROM client WHERE id_client = ?1",
    params![id_client],
    |row| {
      Ok(Client {
        id_client: row.get(0)?,
        nom: row.get(1)?,
        prenom: row.get(2)?,
        telephone: row.get(3)?,
        email: row.get(4)?,
      })
    },
  )?;

  Ok(client)
}

/// Crée un nouveau client et le renvoie.
pub fn create_client(
  nom: String,
  prenom: Option<String>,
  telephone: Option<String>,
  email: Option<String>,
) -> AppResult<Client> {
  let conn = get_connection()?;

  conn.execute(
    "INSERT INTO client (nom, prenom, telephone, email) VALUES (?1, ?2, ?3, ?4)",
    params![nom, prenom, telephone, email],
  )?;

  let id = conn.last_insert_rowid();

  Ok(Client {
    id_client: id,
    nom,
    prenom,
    telephone,
    email,
  })
}

/// Met à jour un client et renvoie la version mise à jour.
pub fn update_client(
  id_client: i64,
  nom: String,
  prenom: Option<String>,
  telephone: Option<String>,
  email: Option<String>,
) -> AppResult<Client> {
  let conn = get_connection()?;

  conn.execute(
    "UPDATE client SET nom = ?1, prenom = ?2, telephone = ?3, email = ?4 WHERE id_client = ?5",
    params![nom, prenom, telephone, email, id_client],
  )?;

  get_client(id_client)
}

/// Supprime un client.
pub fn delete_client(id_client: i64) -> AppResult<()> {
  let conn = get_connection()?;
  conn.execute("DELETE FROM client WHERE id_client = ?1", params![id_client])?;
  Ok(())
}

fn query_clients(conn: &Connection) -> AppResult<Vec<Client>> {
  let mut stmt = conn.prepare(
    "SELECT id_client, nom, prenom, telephone, email FROM client ORDER BY nom",
  )?;

  let iter = stmt.query_map([], |row| {
    Ok(Client {
      id_client: row.get(0)?,
      nom: row.get(1)?,
      prenom: row.get(2)?,
      telephone: row.get(3)?,
      email: row.get(4)?,
    })
  })?;

  let mut clients = Vec::new();
  for client in iter {
    clients.push(client?);
  }

  Ok(clients)
}

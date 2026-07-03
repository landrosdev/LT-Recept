use rusqlite::params;
use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::Configuration;

pub fn get_configuration() -> AppResult<Configuration> {
  let conn = get_connection()?;
  
  let config = conn.query_row(
    "SELECT id, nom_hotel, logo_path, adresse, telephone, email, site_web, rc, patente, nif, stat, message_perso, facebook FROM configuration WHERE id = 1",
    [],
    |row| {
      Ok(Configuration {
        id: row.get(0)?,
        nom_hotel: row.get(1)?,
        logo_path: row.get(2)?,
        adresse: row.get(3)?,
        telephone: row.get(4)?,
        email: row.get(5)?,
        site_web: row.get(6)?,
        rc: row.get(7)?,
        patente: row.get(8)?,
        nif: row.get(9)?,
        stat: row.get(10)?,
        message_perso: row.get(11)?,
        facebook: row.get(12)?,
      })
    },
  )?;

  Ok(config)
}

pub fn update_configuration(config: Configuration) -> AppResult<Configuration> {
  let conn = get_connection()?;
  
  conn.execute(
    "UPDATE configuration SET \
     nom_hotel = ?1, logo_path = ?2, adresse = ?3, telephone = ?4, \
     email = ?5, site_web = ?6, rc = ?7, patente = ?8, nif = ?9, stat = ?10, message_perso = ?11, facebook = ?12 \
     WHERE id = 1",
    params![
      config.nom_hotel,
      config.logo_path,
      config.adresse,
      config.telephone,
      config.email,
      config.site_web,
      config.rc,
      config.patente,
      config.nif,
      config.stat,
      config.message_perso,
      config.facebook
    ],
  )?;

  get_configuration()
}

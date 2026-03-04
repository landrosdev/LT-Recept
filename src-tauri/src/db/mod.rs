//
pub mod connection;
pub mod migrate;
pub mod seed;

use crate::errors::AppResult;

/// Initialise la base de données : connexion, migrations et données initiales.
pub fn init() -> AppResult<()> {
  let conn = connection::get_connection()?;
  migrate::run_migrations(&conn)?;
  seed::seed_database(&conn)?;
  Ok(())
}
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Equipement {
  pub id_equipement: i64,
  pub nom: String,
}

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chambre {
  pub id_chambre: i64,
  pub numero: String,
  pub type_chambre: String,
  pub description: Option<String>,
}

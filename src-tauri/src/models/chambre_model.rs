use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chambre {
  pub id_chambre: i64,
  pub numero: String,
  pub id_categorie: i64,
  pub type_chambre: Option<String>,
  pub description: Option<String>,
}

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategorieChambre {
  pub id_categorie: i64,
  pub libelle: String,
  pub description: Option<String>,
}

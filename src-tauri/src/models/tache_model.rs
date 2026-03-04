use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tache {
  pub id_tache: i64,
  pub date_tache: String,
  pub description: String,
  pub priorite: String,
  pub responsable: Option<String>,
  pub statut: String,
}

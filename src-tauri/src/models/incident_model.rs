use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Incident {
  pub id_incident: i64,
  pub id_chambre: i64,
  pub date_incident: String,
  pub probleme: String,
  pub action_prise: Option<String>,
  pub responsable: Option<String>,
  pub statut: String,
}

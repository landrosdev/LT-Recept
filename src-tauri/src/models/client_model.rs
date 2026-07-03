use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Client {
  pub id_client: i64,
  pub nom: Option<String>,
  pub prenom: Option<String>,
  pub telephone: Option<String>,
  pub cin: Option<String>,
  pub email: Option<String>,
}

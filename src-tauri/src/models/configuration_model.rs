use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Configuration {
  pub id: i64,
  pub nom_hotel: String,
  pub logo_path: Option<String>,
  pub adresse: Option<String>,
  pub telephone: Option<String>,
  pub email: Option<String>,
  pub site_web: Option<String>,
  pub rc: Option<String>,
  pub patente: Option<String>,
  pub nif: Option<String>,
  pub stat: Option<String>,
  pub message_perso: Option<String>,
  pub facebook: Option<String>,
}

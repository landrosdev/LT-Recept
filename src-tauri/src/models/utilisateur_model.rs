use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Utilisateur {
  pub id_utilisateur: i64,
  pub nom_user: String,
  pub mot_de_passe: String,
  pub date_creation: String,
  pub statut: String,
  pub admin: i64,
}

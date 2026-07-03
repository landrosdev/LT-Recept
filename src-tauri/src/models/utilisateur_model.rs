use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Utilisateur {
  pub id_utilisateur: i64,
  pub nom: Option<String>,
  pub prenom: Option<String>,
  pub nom_user: String,
  pub mot_de_passe: String,
  pub role: String,
  pub permissions: String,
  pub is_active: i64, // 0 for false, 1 for true
  pub date_creation: String,
  pub date_modification: String,
}

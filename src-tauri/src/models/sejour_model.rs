use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sejour {
  pub id_sejour: i64,
  pub id_client: i64,
  pub id_reservation: Option<i64>,
  pub id_chambre: i64,
  pub date_jour: String,
  pub heure_arrivee: Option<String>,
  pub heure_depart_prevue: Option<String>,
  pub statut: String,
  pub remarques: Option<String>,
}

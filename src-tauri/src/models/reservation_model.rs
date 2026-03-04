use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reservation {
  pub id_reservation: i64,
  pub id_client: i64,
  pub type_chambre: String,
  pub date_arrivee: String,
  pub date_depart: String,
  pub paiement: Option<String>,
  pub statut: String,
  pub created_at: String,
}

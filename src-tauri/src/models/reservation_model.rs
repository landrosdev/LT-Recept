use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Reservation {
  pub id_reservation: i64,
  pub id_client: i64,
  pub id_categorie: i64,
  pub date_debut: String,
  pub date_fin: Option<String>,
  pub nombre_nuite: i64,
  pub paiement: Option<String>,
  pub statut: String,
  pub created_at: String,
  pub chambres_ids: Option<String>,
  pub montant_total: f64,
  pub avance: f64,
  pub remise: f64,
}

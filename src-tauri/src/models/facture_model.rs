use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Facture {
  pub id_facture: i64,
  pub id_client: i64,
  pub id_chambre: Option<i64>,
  pub id_reservation: Option<i64>,
  pub date_facture: String,
  pub montant: f64,
  pub mode_paiement: Option<String>,
  pub paye: String,
  pub observations: Option<String>,
}

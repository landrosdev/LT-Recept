use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Facture {
  pub id_facture: i64,
  pub id_client: i64,
  pub id_chambre: Option<i64>,
  pub id_reservation: Option<i64>,
  pub id_sejour: Option<i64>,
  pub date_facture: String,
  pub montant: f64,
  pub remise: f64,
  pub mode_paiement: Option<String>,
  pub statut: String, // EN_ATTENTE, PARTIEL, PAYE
  pub observations: Option<String>,
}


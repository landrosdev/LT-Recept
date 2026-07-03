use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Paiement {
    pub id_paiement: i64,
    pub id_facture: i64,
    pub montant: f64,
    pub date_paiement: String,
    pub mode_paiement: Option<String>,
}

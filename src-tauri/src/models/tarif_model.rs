use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tarif {
    pub id_tarif: i64,
    pub nom: String,
    pub type_tarif: String, // 'CHAMBRE', 'OPTION', 'REMISE'
    pub montant: f64,
    pub est_pourcentage: bool,
    pub description: Option<String>,
}

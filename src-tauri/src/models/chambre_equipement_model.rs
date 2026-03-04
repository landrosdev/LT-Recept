use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChambreEquipement {
  pub id_chambre: i64,
  pub id_equipement: i64,
}

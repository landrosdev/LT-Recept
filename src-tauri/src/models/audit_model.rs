use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AuditLog {
    pub id_audit: i64,
    pub id_utilisateur: Option<i64>,
    pub action: String,
    pub details: Option<String>,
    pub date_action: String,
    // Pour l'affichage frontend, on joint le nom de l'utilisateur
    pub nom_user: Option<String>,
}

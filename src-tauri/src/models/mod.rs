// point d entree

pub mod client_model;
pub mod chambre_model;
pub mod equipement_model;
pub mod chambre_equipement_model;
pub mod reservation_model;
pub mod sejour_model;
pub mod facture_model;
pub mod incident_model;
pub mod tache_model;
pub mod utilisateur_model;
pub mod configuration_model;
pub mod categorie_chambre_model;
pub mod paiement_model;
pub mod audit_model;
pub mod tarif_model;

pub use client_model::Client;
pub use chambre_model::Chambre;
pub use equipement_model::Equipement;
pub use chambre_equipement_model::ChambreEquipement;
pub use facture_model::Facture;
pub use incident_model::Incident;
pub use reservation_model::Reservation;
pub use sejour_model::Sejour;
pub use tache_model::Tache;
pub use utilisateur_model::Utilisateur;
pub use configuration_model::Configuration;
pub use categorie_chambre_model::CategorieChambre;
pub use paiement_model::Paiement;
pub use audit_model::AuditLog;
pub use tarif_model::Tarif;
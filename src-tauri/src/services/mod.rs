// Point d'entre de logique metier 

pub mod client_service;
pub mod chambre_service;
pub mod equipement_service;
pub mod chambre_equipement_service;
pub mod reservation_service;
pub mod facture_service;
pub mod incident_service;
pub mod utilisateur_service;
pub mod configuration_service;
pub mod categorie_chambre_service;
pub mod paiement_service;
pub mod audit_service;
pub mod export_service;
pub mod tarif_service;

pub use client_service::*;
pub use chambre_service::*;
pub use equipement_service::*;
pub use chambre_equipement_service::*;
pub use reservation_service::*;
pub use facture_service::*;
pub use incident_service::*;
pub use utilisateur_service::*;
pub use configuration_service::*;
pub use categorie_chambre_service::*;
pub use paiement_service::*;
pub use audit_service::*;
pub use export_service::*;
pub use tarif_service::*;
// Point d'entre de logique metier 

pub mod client_service;
pub mod chambre_service;
pub mod equipement_service;
pub mod chambre_equipement_service;
pub mod reservation_service;
pub mod sejour_service;
pub mod facture_service;
pub mod incident_service;
pub mod tache_service;
pub mod utilisateur_service;

pub use client_service::*;
pub use chambre_service::*;
pub use equipement_service::*;
pub use chambre_equipement_service::*;
pub use reservation_service::*;
pub use sejour_service::*;
pub use facture_service::*;
pub use incident_service::*;
pub use tache_service::*;
pub use utilisateur_service::*;
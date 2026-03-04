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
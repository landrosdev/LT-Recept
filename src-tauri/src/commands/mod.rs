// Point entre de module pour chaque fonction appeleee par react

pub mod client_commands;
pub mod chambre_commands;
pub mod equipement_commands;
pub mod chambre_equipement_commands;
pub mod reservation_commands;
pub mod sejour_commands;
pub mod facture_commands;
pub mod incident_commands;
pub mod tache_commands;
pub mod utilisateur_commands;

pub use client_commands::*;
pub use chambre_commands::*;
pub use equipement_commands::*;
pub use chambre_equipement_commands::*;
pub use reservation_commands::*;
pub use sejour_commands::*;
pub use facture_commands::*;
pub use incident_commands::*;
pub use tache_commands::*;
pub use utilisateur_commands::*;

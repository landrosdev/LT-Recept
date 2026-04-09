pub mod commands;
pub mod db;
pub mod errors;
pub mod models;
pub mod services;

use serde::Serialize;
use tauri::{Emitter, Manager};
use tauri::menu::{Menu, MenuItem, Submenu};

#[derive(Clone, Serialize)]
struct AppMenuEventPayload {
  id: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .menu(|app| {
      let fichier = Submenu::with_items(
        app,
        "Fichier",
        true,
        &[
          &MenuItem::with_id(app, "app.home", "Accueil", true, None::<&str>)?,
          &MenuItem::with_id(app, "app.logout", "Déconnexion", true, None::<&str>)?,
          &MenuItem::with_id(app, "app.quit", "Quitter", true, None::<&str>)?,
        ],
      )?;

      let affichage = Submenu::with_items(
        app,
        "Affichage",
        true,
        &[
          &MenuItem::with_id(app, "app.toggle_sidebar", "Afficher/Masquer le menu", true, None::<&str>)?,
          &Submenu::with_items(
            app,
            "Historique",
            true,
            &[
              &MenuItem::with_id(app, "app.historique.sejours", "Historique des séjours", true, None::<&str>)?,
              &MenuItem::with_id(app, "app.historique.reservations", "Historique des réservations", true, None::<&str>)?,
              &MenuItem::with_id(app, "app.historique.factures", "Historique des factures", true, None::<&str>)?,
            ],
          )?,
        ],
      )?;

      let parametres = Submenu::with_items(
        app,
        "Paramètres",
        true,
        &[
          &MenuItem::with_id(app, "app.utilisateurs", "Gestion des utilisateurs", true, None::<&str>)?,
          &MenuItem::with_id(app, "app.parametres", "Paramètres application", true, None::<&str>)?,
        ],
      )?;

      let aide = Submenu::with_items(
        app,
        "Aide",
        true,
        &[
          &MenuItem::with_id(app, "app.a_propos", "À propos de LT-Recep", true, None::<&str>)?,
        ],
      )?;

      Menu::with_items(app, &[&fichier, &affichage, &parametres, &aide])
    })
    .on_menu_event(|app, event| {
      let id = event.id().as_ref().to_string();

      if id == "app.quit" {
        app.exit(0);
        return;
      }

      let _ = app.emit(
        "app-menu",
        AppMenuEventPayload { id },
      );
    })
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Initialisation de la base de données (migrations + seed).
      db::init()?;

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::list_clients_command,
      commands::create_client_command,
      commands::get_client_command,
      commands::update_client_command,
      commands::delete_client_command,
      commands::list_chambres_command,
      commands::create_chambre_command,
      commands::get_chambre_command,
      commands::update_chambre_command,
      commands::delete_chambre_command,
      commands::list_equipements_command,
      commands::create_equipement_command,
      commands::get_equipement_command,
      commands::update_equipement_command,
      commands::delete_equipement_command,
      commands::list_chambre_equipements_command,
      commands::assigner_equipement_a_chambre_command,
      commands::delete_chambre_equipement_command,
      commands::list_reservations_command,
      commands::create_reservation_command,
      commands::get_reservation_command,
      commands::update_reservation_command,
      commands::delete_reservation_command,
      commands::list_sejours_command,
      commands::create_sejour_command,
      commands::get_sejour_command,
      commands::update_sejour_command,
      commands::delete_sejour_command,
      commands::list_factures_command,
      commands::create_facture_command,
      commands::get_facture_command,
      commands::update_facture_command,
      commands::delete_facture_command,
      commands::list_incidents_command,
      commands::create_incident_command,
      commands::get_incident_command,
      commands::update_incident_command,
      commands::delete_incident_command,
      commands::list_taches_command,
      commands::create_tache_command,
      commands::get_tache_command,
      commands::update_tache_command,
      commands::delete_tache_command,
      commands::list_utilisateurs_command,
      commands::get_utilisateur_command,
      commands::create_utilisateur_command,
      commands::update_utilisateur_command,
      commands::delete_utilisateur_command,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}


use crate::models::Reservation;
use crate::services::reservation_service;

#[tauri::command]
pub async fn list_reservations_command() -> Result<Vec<Reservation>, String> {
  reservation_service::list_reservations().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn create_reservation_command(
  id_client: i64,
  type_chambre: String,
  date_arrivee: String,
  date_depart: String,
  paiement: Option<String>,
  statut: String,
) -> Result<Reservation, String> {
  println!("CMD: create_reservation_command called");
  println!("Payload: id_client={}, type={}, dates={}-{}, statut={}", 
           id_client, type_chambre, date_arrivee, date_depart, statut);

  reservation_service::create_reservation(
    id_client,
    type_chambre,
    date_arrivee,
    date_depart,
    paiement,
    statut,
  )
  .map_err(|e| {
    println!("CMD Error: {:?}", e);
    e.to_string()
  })
}

#[tauri::command]
pub async fn get_reservation_command(id_reservation: i64) -> Result<Reservation, String> {
  reservation_service::get_reservation(id_reservation).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_reservation_command(
  id_reservation: i64,
  id_client: i64,
  type_chambre: String,
  date_arrivee: String,
  date_depart: String,
  paiement: Option<String>,
  statut: String,
) -> Result<Reservation, String> {
  reservation_service::update_reservation(
    id_reservation,
    id_client,
    type_chambre,
    date_arrivee,
    date_depart,
    paiement,
    statut,
  )
  .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_reservation_command(id_reservation: i64) -> Result<(), String> {
  reservation_service::delete_reservation(id_reservation).map_err(|e| e.to_string())
}

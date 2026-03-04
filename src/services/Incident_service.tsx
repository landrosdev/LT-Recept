import { invoke } from "@tauri-apps/api/core"

export interface Incident {
  id_incident: number
  id_chambre: number
  date_incident: string
  probleme: string
  action_prise: string | null
  responsable: string | null
  statut: "EN_COURS" | "RESOLU"
}

export type IncidentInput = Omit<Incident, "id_incident">

export async function listIncidents(): Promise<Incident[]> {
  return await invoke("list_incidents_command")
}

export async function getIncident(id_incident: number): Promise<Incident> {
  return await invoke("get_incident_command", { idIncident: id_incident })
}

export async function createIncident(data: IncidentInput): Promise<Incident> {
  return await invoke("create_incident_command", {
    idChambre: data.id_chambre,
    dateIncident: data.date_incident,
    probleme: data.probleme,
    actionPrise: data.action_prise,
    responsable: data.responsable,
    statut: data.statut,
  })
}

export async function updateIncident(id_incident: number, data: IncidentInput): Promise<Incident> {
  return await invoke("update_incident_command", {
    idIncident: id_incident,
    idChambre: data.id_chambre,
    dateIncident: data.date_incident,
    probleme: data.probleme,
    actionPrise: data.action_prise,
    responsable: data.responsable,
    statut: data.statut,
  })
}

export async function deleteIncident(id_incident: number): Promise<void> {
  return await invoke("delete_incident_command", { idIncident: id_incident })
}
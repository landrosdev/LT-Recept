import { invoke } from "@tauri-apps/api/core"

export interface Configuration {
  id: number
  nom_hotel: string
  logo_path: string | null
  adresse: string | null
  telephone: string | null
  email: string | null
  site_web: string | null
  rc: string | null
  patente: string | null
  nif: string | null
  stat: string | null
  message_perso: string | null
  facebook: string | null
}

export async function getConfiguration(): Promise<Configuration> {
  return await invoke("get_configuration_command")
}

export async function updateConfiguration(config: Configuration): Promise<Configuration> {
  return await invoke("update_configuration_command", { config })
}

import { invoke } from "@tauri-apps/api/core"

export type Client = {
  id_client: number
  nom: string
  prenom: string | null
  telephone: string | null
  email: string | null
}

export async function listClients(): Promise<Client[]> {
  return invoke<Client[]>("list_clients_command")
}

export async function getClient(id_client: number): Promise<Client> {
  return invoke<Client>("get_client_command", { idClient: id_client })
}

export async function createClient(params: {
  nom: string
  prenom?: string | null
  telephone?: string | null
  email?: string | null
}): Promise<Client> {
  const { nom, prenom, telephone, email } = params
  return invoke<Client>("create_client_command", {
    nom,
    prenom: prenom ?? null,
    telephone: telephone ?? null,
    email: email ?? null,
  })
}

export async function updateClient(params: {
  id_client: number
  nom: string
  prenom?: string | null
  telephone?: string | null
  email?: string | null
}): Promise<Client> {
  const { id_client, nom, prenom, telephone, email } = params
  return invoke<Client>("update_client_command", {
    idClient: id_client,
    nom,
    prenom: prenom ?? null,
    telephone: telephone ?? null,
    email: email ?? null,
  })
}

export async function deleteClient(id_client: number): Promise<void> {
  await invoke<void>("delete_client_command", { idClient: id_client })
}

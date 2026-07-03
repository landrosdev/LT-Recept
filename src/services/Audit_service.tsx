import { invoke } from "@tauri-apps/api/core"

export interface AuditLog {
  id_audit: number
  id_utilisateur: number | null
  action: string
  details: string | null
  date_action: string
  nom_user: string | null
}

export async function listAuditLogs(): Promise<AuditLog[]> {
  return await invoke<AuditLog[]>("list_audit_logs_command")
}

export async function logAction(id_utilisateur: number | null, action: string, details?: any): Promise<void> {
  await invoke("log_action_command", {
    idUtilisateur: id_utilisateur,
    action,
    details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null
  })
}

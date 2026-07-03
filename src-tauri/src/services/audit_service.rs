use rusqlite::{params};
use crate::db::connection::get_connection;
use crate::errors::AppResult;
use crate::models::AuditLog;

pub fn log_action(id_utilisateur: Option<i64>, action: &str, details: Option<&str>) -> AppResult<()> {
    let conn = get_connection()?;
    conn.execute(
        "INSERT INTO audit_log (id_utilisateur, action, details) VALUES (?1, ?2, ?3)",
        params![id_utilisateur, action, details],
    )?;
    Ok(())
}

pub fn list_audit_logs() -> AppResult<Vec<AuditLog>> {
    let conn = get_connection()?;
    let mut stmt = conn.prepare(
        "SELECT a.id_audit, a.id_utilisateur, a.action, a.details, a.date_action, u.nom_user \
         FROM audit_log a \
         LEFT JOIN utilisateur u ON a.id_utilisateur = u.id_utilisateur \
         ORDER BY a.date_action DESC"
    )?;

    let iter = stmt.query_map([], |row| {
        Ok(AuditLog {
            id_audit: row.get(0)?,
            id_utilisateur: row.get(1)?,
            action: row.get(2)?,
            details: row.get(3)?,
            date_action: row.get(4)?,
            nom_user: row.get(5)?,
        })
    })?;

    let mut logs = Vec::new();
    for log in iter {
        logs.push(log?);
    }
    Ok(logs)
}

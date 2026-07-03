use std::fs::File;
use std::io::Write;
use rusqlite::Connection;
use crate::db::connection::get_connection;
use crate::errors::AppResult;

pub fn export_all_to_csv(base_path: &str) -> AppResult<String> {
    let conn = get_connection()?;
    
    // On va exporter chaque table importante dans un dossier
    let tables = [
        "client", "chambre", "reservation", "sejour", "facture", "paiement", "incident", "tache", "utilisateur", "audit_log"
    ];

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
    let export_dir = format!("{}/export_ltrecept_{}", base_path, timestamp);
    std::fs::create_dir_all(&export_dir)?;

    for table in tables {
        export_table_to_csv(&conn, table, &format!("{}/{}.csv", export_dir, table))?;
    }

    Ok(export_dir)
}

fn export_table_to_csv(conn: &Connection, table_name: &str, file_path: &str) -> AppResult<()> {
    let mut stmt = conn.prepare(&format!("SELECT * FROM {}", table_name))?;
    let column_names: Vec<String> = stmt.column_names().into_iter().map(|s| s.to_string()).collect();
    
    let mut file = File::create(file_path)?;
    
    // Header
    writeln!(file, "{}", column_names.join(","))?;
    
    let column_count = column_names.len();
    let mut rows = stmt.query([])?;
    
    while let Some(row) = rows.next()? {
        let mut row_values = Vec::new();
        for i in 0..column_count {
            let val: rusqlite::types::Value = row.get(i)?;
            let str_val = match val {
                rusqlite::types::Value::Null => "".to_string(),
                rusqlite::types::Value::Integer(i) => i.to_string(),
                rusqlite::types::Value::Real(f) => f.to_string(),
                rusqlite::types::Value::Text(s) => format!("\"{}\"", s.replace("\"", "\"\"")),
                rusqlite::types::Value::Blob(_) => "<BLOB>".to_string(),
            };
            row_values.push(str_val);
        }
        writeln!(file, "{}", row_values.join(","))?;
    }

    Ok(())
}

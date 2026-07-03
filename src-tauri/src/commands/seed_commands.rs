use crate::db::connection::get_connection;
use crate::errors::AppResult;
use rusqlite::params;

#[tauri::command]
pub async fn seed_test_data_command() -> AppResult<String> {
    let mut conn = get_connection()?;
    let tx = conn.transaction()?;

    // 1. Categories et Tarifs
    let categories = [
        ("Standard", "Chambre standard confortable", 40000.0),
        ("Deluxe", "Chambre spacieuse avec vue", 65000.0),
        ("Suite", "Le luxe absolu", 120000.0),
        ("Familiale", "Parfait pour toute la famille", 85000.0),
    ];

    for (libelle, desc, prix) in categories.iter() {
        // Categorie
        let _ = tx.execute(
            "INSERT OR IGNORE INTO categorie_chambre (libelle, description) VALUES (?1, ?2)",
            params![libelle, desc],
        );
        
        // Tarif associé
        let _ = tx.execute(
            "INSERT OR REPLACE INTO tarif (nom, type_tarif, montant, description) VALUES (?1, 'CHAMBRE', ?2, ?3)",
            params![libelle, prix, format!("Tarif de base pour {}", libelle)],
        );
    }

    // 2. Chambres (50 total)
    // On recupere les IDs des categories
    let mut stmt = tx.prepare("SELECT id_categorie, libelle FROM categorie_chambre")?;
    let cat_map: Vec<(i64, String)> = stmt.query_map([], |row| {
        Ok((row.get(0)?, row.get(1)?))
    })?.filter_map(|r| r.ok()).collect();
    drop(stmt);

    for i in 1..=50 {
        let numero = format!("{:03}", i);
        // On alterne les categories
        let (id_cat, _) = cat_map[(i as usize - 1) % cat_map.len()];
        
        let _ = tx.execute(
            "INSERT OR IGNORE INTO chambre (numero, id_categorie, description) VALUES (?1, ?2, ?3)",
            params![numero, id_cat, format!("Description de la chambre {}", numero)],
        );
    }

    // 3. Clients (~20)
    let clients = [
        ("Ranaivo", "Jean", "0340000001", "101234567890", "jean@example.com"),
        ("Rakoto", "Marie", "0321111111", "101987654321", "marie@example.com"),
        ("Andria", "Solofo", "0332222222", "102000111222", "solofo@example.com"),
        ("Razafy", "Lala", "0343333333", "103333444555", "lala@example.com"),
        ("Randria", "Toky", "0324444444", "104444555666", "toky@example.com"),
        ("Mamy", "Luc", "0335555555", "105555666777", "luc@example.com"),
        ("Nomena", "Fano", "0346666666", "106666777888", "fano@example.com"),
        ("Sitraka", "Vero", "0327777777", "107777888999", "vero@example.com"),
        ("Hery", "Tiana", "0338888888", "108888999000", "hery@example.com"),
        ("Bako", "Tina", "0349999999", "109999000111", "bako@example.com"),
        ("Doda", "Eric", "0321010101", "110101010101", "eric@example.com"),
        ("Lova", "Nary", "0332020202", "120202020202", "nary@example.com"),
        ("Tovo", "Pasy", "0343030303", "130303030303", "pasy@example.com"),
        ("Koto", "Bema", "0324040404", "140404040404", "bema@example.com"),
        ("Samy", "Rivo", "0335050505", "150505050505", "rivo@example.com"),
        ("Faly", "Mino", "0346060606", "160606060606", "mino@example.com"),
        ("Zety", "Fara", "0327070707", "170707070707", "fara@example.com"),
        ("Vola", "Noro", "0338080808", "180808080808", "noro@example.com"),
        ("Njaka", "Misa", "0349090909", "190909090909", "misa@example.com"),
        ("Pety", "Dina", "0320102030", "202010203040", "dina@example.com"),
    ];

    for (nom, prenom, tel, cin, email) in clients.iter() {
        let _ = tx.execute(
            "INSERT OR IGNORE INTO client (nom, prenom, telephone, cin, email) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![nom, prenom, tel, cin, email],
        );
    }

    tx.commit()?;

    Ok("Données de test générées avec succès (50 chambres, 4 catégories, 20 clients)".into())
}

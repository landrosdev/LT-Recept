PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS client (
    id_client INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT,
    prenom TEXT,
    telephone TEXT,
    cin TEXT,
    email TEXT
);

CREATE TABLE IF NOT EXISTS categorie_chambre (
    id_categorie INTEGER PRIMARY KEY AUTOINCREMENT,
    libelle TEXT UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS chambre (
    id_chambre INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT UNIQUE NOT NULL,
    id_categorie INTEGER NOT NULL,
    description TEXT,
    FOREIGN KEY (id_categorie) REFERENCES categorie_chambre(id_categorie)
);

CREATE TABLE IF NOT EXISTS equipement (
    id_equipement INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chambre_equipement (
    id_chambre INTEGER NOT NULL,
    id_equipement INTEGER NOT NULL,
    PRIMARY KEY (id_chambre, id_equipement),
    FOREIGN KEY (id_chambre) REFERENCES chambre(id_chambre),
    FOREIGN KEY (id_equipement) REFERENCES equipement(id_equipement)
);

CREATE TABLE IF NOT EXISTS reservation (
    id_reservation INTEGER PRIMARY KEY AUTOINCREMENT,
    id_client INTEGER NOT NULL,
    id_categorie INTEGER NOT NULL,
    date_debut TEXT NOT NULL,
    date_fin TEXT,
    nombre_nuite INTEGER NOT NULL DEFAULT 1,
    paiement TEXT CHECK (paiement IN ('ESPECES','MOBILE_MONEY','CARTE')),
    statut TEXT CHECK (statut IN ('EN_ATTENTE','CONFIRMEE','ANNULEE','TERMINEE')) NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    chambres_ids TEXT,
    FOREIGN KEY (id_client) REFERENCES client(id_client),
    FOREIGN KEY (id_categorie) REFERENCES categorie_chambre(id_categorie)
);

CREATE TABLE IF NOT EXISTS sejour (
    id_sejour INTEGER PRIMARY KEY AUTOINCREMENT,
    id_client INTEGER NOT NULL,
    id_reservation INTEGER,
    chambres_ids TEXT NOT NULL,
    id_categorie INTEGER NOT NULL,
    date_debut TEXT NOT NULL,
    date_fin TEXT,
    nombre_nuite INTEGER NOT NULL DEFAULT 1,
    paiement TEXT CHECK (paiement IN ('ESPECES','MOBILE_MONEY','CARTE')),
    statut TEXT CHECK (statut IN ('EN_SEJOUR','TERMINE','ANNULE')) NOT NULL,
    remarques TEXT,
    FOREIGN KEY (id_client) REFERENCES client(id_client),
    FOREIGN KEY (id_reservation) REFERENCES reservation(id_reservation),
    FOREIGN KEY (id_categorie) REFERENCES categorie_chambre(id_categorie)
);

CREATE TABLE IF NOT EXISTS facture (
    id_facture INTEGER PRIMARY KEY AUTOINCREMENT,
    id_client INTEGER NOT NULL,
    id_chambre INTEGER,
    id_reservation INTEGER,
    id_sejour INTEGER,
    date_facture TEXT NOT NULL,
    montant REAL DEFAULT 0,
    remise REAL DEFAULT 0,
    mode_paiement TEXT CHECK (mode_paiement IN ('ESPECES','MOBILE_MONEY','CARTE')),
    statut TEXT CHECK (statut IN ('EN_ATTENTE','PARTIEL','PAYE','ANNULEE')) DEFAULT 'EN_ATTENTE',
    observations TEXT,
    FOREIGN KEY (id_client) REFERENCES client(id_client),
    FOREIGN KEY (id_chambre) REFERENCES chambre(id_chambre),
    FOREIGN KEY (id_reservation) REFERENCES reservation(id_reservation),
    FOREIGN KEY (id_sejour) REFERENCES sejour(id_sejour)
);

CREATE TABLE IF NOT EXISTS incident (
    id_incident INTEGER PRIMARY KEY AUTOINCREMENT,
    id_chambre INTEGER NOT NULL,
    date_incident TEXT NOT NULL,
    probleme TEXT NOT NULL,
    action_prise TEXT,
    responsable TEXT,
    statut TEXT CHECK (statut IN ('EN_COURS','RESOLU')) NOT NULL,
    FOREIGN KEY (id_chambre) REFERENCES chambre(id_chambre)
);

CREATE TABLE IF NOT EXISTS tache (
    id_tache INTEGER PRIMARY KEY AUTOINCREMENT,
    date_tache TEXT NOT NULL,
    description TEXT NOT NULL,
    priorite TEXT CHECK (priorite IN ('HAUTE','MOYENNE','BASSE')) NOT NULL,
    responsable TEXT,
    statut TEXT CHECK (statut IN ('A_FAIRE','EN_COURS','TERMINEE')) NOT NULL
);

CREATE TABLE IF NOT EXISTS utilisateur (
    id_utilisateur INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT,
    prenom TEXT,
    nom_user TEXT UNIQUE NOT NULL,
    mot_de_passe TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin','user')) DEFAULT 'user',
    permissions TEXT DEFAULT '*',
    is_active INTEGER CHECK (is_active IN (0,1)) DEFAULT 1,
    date_creation TEXT DEFAULT CURRENT_TIMESTAMP,
    date_modification TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuration (
    id INTEGER PRIMARY KEY CHECK (id = 1), -- Only one row allowed
    nom_hotel TEXT NOT NULL DEFAULT 'LT-Recept',
    logo_path TEXT,
    adresse TEXT,
    telephone TEXT,
    email TEXT,
    site_web TEXT,
    rc TEXT, -- Registre de Commerce
    patente TEXT,
    nif TEXT, -- Numéro d'Identification Fiscale
    stat TEXT, -- Numéro de Statistique
    message_perso TEXT -- Message personnalisé en bas de facture
);

-- Insert default config if not exists
INSERT OR IGNORE INTO configuration (id, nom_hotel) VALUES (1, 'LT-Recept');

-- Table pour la grille tarifaire
CREATE TABLE IF NOT EXISTS tarif (
    id_tarif INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT UNIQUE NOT NULL,
    type_tarif TEXT CHECK (type_tarif IN ('CHAMBRE', 'OPTION', 'REMISE')) NOT NULL,
    montant REAL NOT NULL,
    est_pourcentage INTEGER CHECK (est_pourcentage IN (0,1)) DEFAULT 0,
    description TEXT
);

-- Table pour les paiements partiels (flexibilité de paiement)
CREATE TABLE IF NOT EXISTS paiement (
    id_paiement INTEGER PRIMARY KEY AUTOINCREMENT,
    id_facture INTEGER NOT NULL,
    montant REAL NOT NULL,
    date_paiement TEXT DEFAULT CURRENT_TIMESTAMP,
    mode_paiement TEXT CHECK (mode_paiement IN ('ESPECES','MOBILE_MONEY','CARTE')),
    FOREIGN KEY (id_facture) REFERENCES facture(id_facture)
);

-- Table pour l'audit (suivi des actions utilisateurs)
CREATE TABLE IF NOT EXISTS audit_log (
    id_audit INTEGER PRIMARY KEY AUTOINCREMENT,
    id_utilisateur INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    date_action TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) ON DELETE SET NULL
);

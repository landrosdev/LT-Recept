PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS client (
    id_client INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    prenom TEXT,
    telephone TEXT,
    email TEXT
);

CREATE TABLE IF NOT EXISTS chambre (
    id_chambre INTEGER PRIMARY KEY AUTOINCREMENT,
    numero TEXT UNIQUE NOT NULL,
    type_chambre TEXT CHECK (type_chambre IN ('SIMPLE','DOUBLE','SUITE','FAMILIALE')) NOT NULL,
    description TEXT
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
    type_chambre TEXT CHECK (type_chambre IN ('SIMPLE','DOUBLE','SUITE','FAMILIALE')) NOT NULL,
    date_arrivee TEXT NOT NULL,
    date_depart TEXT NOT NULL,
    paiement TEXT CHECK (paiement IN ('ESPECES','MOBILE_MONEY','CARTE')),
    statut TEXT CHECK (statut IN ('EN_ATTENTE','CONFIRMEE','ANNULEE','TERMINEE')) NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_client) REFERENCES client(id_client)
);

CREATE TABLE IF NOT EXISTS sejour (
    id_sejour INTEGER PRIMARY KEY AUTOINCREMENT,
    id_client INTEGER NOT NULL,
    id_reservation INTEGER,
    id_chambre INTEGER NOT NULL,
    date_jour TEXT NOT NULL,
    heure_arrivee TEXT,
    heure_depart_prevue TEXT,
    statut TEXT CHECK (statut IN ('RESERVE','ARRIVE','EN_SEJOUR','PARTI')) NOT NULL,
    remarques TEXT,
    FOREIGN KEY (id_client) REFERENCES client(id_client),
    FOREIGN KEY (id_reservation) REFERENCES reservation(id_reservation),
    FOREIGN KEY (id_chambre) REFERENCES chambre(id_chambre)
);

CREATE TABLE IF NOT EXISTS facture (
    id_facture INTEGER PRIMARY KEY AUTOINCREMENT,
    id_client INTEGER NOT NULL,
    id_chambre INTEGER,
    id_reservation INTEGER,
    date_facture TEXT NOT NULL,
    montant REAL DEFAULT 0,
    mode_paiement TEXT CHECK (mode_paiement IN ('ESPECES','MOBILE_MONEY','CARTE')),
    paye TEXT CHECK (paye IN ('OUI','NON')) DEFAULT 'NON',
    observations TEXT,
    FOREIGN KEY (id_client) REFERENCES client(id_client),
    FOREIGN KEY (id_chambre) REFERENCES chambre(id_chambre),
    FOREIGN KEY (id_reservation) REFERENCES reservation(id_reservation)
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
    nom_user TEXT UNIQUE NOT NULL,
    mot_de_passe TEXT NOT NULL,
    date_creation TEXT DEFAULT CURRENT_TIMESTAMP,
    statut TEXT CHECK (statut IN ('ACTIF','INACTIF')) DEFAULT 'ACTIF',
    admin INTEGER CHECK (admin IN (0,1)) DEFAULT 0
);

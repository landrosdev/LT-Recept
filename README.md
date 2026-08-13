# 🏨 LT-Recept - Gestion de Réception Hôtelière

**LT-Recept** est une application desktop moderne et performante conçue pour les établissements hôteliers et de restauration. Elle permet de gérer de manière fluide le cycle complet du séjour client, de la réservation initiale jusqu'au check-out final.

---

## ✨ Fonctionnalités Clés

### 📅 Gestion des Réservations
- Création et modification de réservations avec suivi des types de chambres (Simple, Double, Suite, Familiale).
- Suivi des statuts (En attente, Confirmée, Annulée, Terminée).
- Attribution automatique de factures dès la réservation.

### 🔑 Arrivées & Départs (Check-in / Check-out)
- Gestion simplifiée des entrées et sorties des clients.
- **Remplissage automatique** : Associe instantanément une chambre disponible à une réservation existante.
- **Facturation intelligente** : Calcul automatique du montant total du séjour basé sur la durée réelle et le tarif de la chambre lors du départ.

### 🏨 État des Chambres en Temps Réel
- Visualisation immédiate des chambres Libres (vert) et Occupées (orange).
- Attribution dynamique des chambres lors de l'arrivée.

### 👤 Gestion Clientèle Intégrée
- Création de clients "à la volée" directement depuis le formulaire de séjour.
- Historique des passages par client.

### 🛠️ Maintenance & Incidents
- Signalement des problèmes techniques par chambre.
- Suivi des interventions (En cours, Résolu).

---

## 🛠️ Stack Technique

- **Frontend** : [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling** : [Tailwind CSS](https://tailwindcss.com/) + [Shadcn/UI](https://ui.shadcn.com/)
- **Core Desktop** : [Tauri v2](https://v2.tauri.app/) (Rust)
- **Base de données** : [SQLite](https://sqlite.org/) (via Rusqlite)
- **Langages** : TypeScript & Rust

---

## 🚀 Installation et Développement

### Prérequis
- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/) (via rustup)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (inclus par défaut sur Windows 10/11)

### Commandes utiles

**Lancer en mode développement :**
```powershell
# Sur Windows, si vous avez des soucis réseau Cargo
$env:CARGO_HTTP_IPV4_ONLY = "true"; npm run tauri dev
```

**Compiler l'application (Installation finale) :**
```powershell
npm run tauri build
```
Les fichiers d'installation (.msi ou .exe) seront générés dans le dossier `src-tauri/target/release/bundle`.

---

## 👨‍💻 Développeur
**RADIMSON Landrosse**  
[GitHub](https://github.com/landrosdev) | [Contact](mailto:landrosdev@gmail.com)

*"Besoin d'un ajustement spécifique pour votre hôtel ou restaurant ? N'hésitez pas à me contacter pour une personnalisation sur mesure."*

---
© 2026 LT-Recept. Tous droits réservés.



FACTURATION

Cas 1 — Client avec réservation

La facture est créée automatiquement à la réservation

paye = NON

Montant calculé plus tard (ou estimé)

La facture est liée à la réservation

Cas 2 — Client sans réservation (walk-in)

Pas de réservation

La facture est créée manuellement

La facture n’est liée qu’au séjour / chambre / client

👉 Conclusion :
✔ id_reservation doit être OPTIONNEL dans facture
✔ La table facture doit être flexible

Lorsqu’une réservation est créée →
➜ créer automatiquement une facture avec :

id_reservation

paye = 'NON'

montant = 0 (ou estimé)

Pour un client sans réservation →
➜ créer une facture sans id_reservation

ARIVEE/DEPART :
Cas A — Client avec réservation

Le client réserve une chambre → Réservation créée.

À la date d’arrivée :

Le réceptionniste attribue la chambre (souvent la même que la réservation)

Un séjour (sejour) est créé avec :

id_client

id_reservation (lié)

id_chambre (attribué)

date_jour = date actuelle

heure_arrivee = réel ou estimé

statut = ARRIVE ou EN_SEJOUR selon heure réelle

Le client séjourne → statut du séjour évolue :

ARRIVE → EN_SEJOUR

Départ du client :

heure_depart_prevue ou heure_depart_reelle

statut = PARTI

La facture associée (id_reservation) est générée automatiquement ou mise à jour.

Cas B — Client sans réservation (walk-in)

Le client arrive sans réservation → pas de réservation

Le réceptionniste crée directement un séjour (sejour) :

id_client

id_reservation = NULL

id_chambre attribué

date_jour = date actuelle

heure_arrivee

statut = ARRIVE ou EN_SEJOUR

Le client séjourne → statut évolue

Départ → statut = PARTI

La facture est créée manuellement pour ce client (flexibilité totale)

id_reservation = NULL

id_chambre = chambre occupée

montant, mode_paiement, paye définis par le réceptionniste
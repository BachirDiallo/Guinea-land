# Guinea Land Hub - Test Scenarios

Ce document présente des scénarios de test complets pour tester toutes les fonctionnalités de Guinea Land Hub.

## Comptes de Test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@guinealand.com | admin123 |
| Acheteur | buyer2@test.com | test123 |
| Vendeur | seller@test.com | test123 |
| Agent | agent@test.com | test123 |

---

## Scénario 1: Parcours Acheteur Complet

### 1.1 Inscription et Connexion
1. Aller sur la page d'accueil
2. Cliquer sur "Connexion" dans la barre de navigation
3. Se connecter avec `buyer2@test.com` / `test123`
4. **Vérifier**: Vous êtes redirigé vers le tableau de bord

### 1.2 Recherche de Terrain
1. Cliquer sur "Carte" dans le menu
2. Utiliser les filtres:
   - Région: "Conakry"
   - Type: "Résidentiel"
   - Prix max: 500 000 000 GNF
3. Cliquer sur "Appliquer"
4. **Vérifier**: La carte affiche les terrains correspondants

### 1.3 Consultation d'un Terrain
1. Cliquer sur un marqueur de terrain sur la carte
2. Cliquer sur "Voir détails" dans le popup
3. **Vérifier** les éléments suivants:
   - Photos du terrain
   - Prix et superficie
   - Localisation sur la carte
   - Badge de vérification (si vérifié)
   - Boutons WhatsApp et QR Code

### 1.4 Code QR
1. Sur la page de détail du terrain, cliquer sur "Code QR"
2. **Vérifier**: Un dialogue s'ouvre avec le QR code
3. Cliquer sur "Télécharger"
4. **Vérifier**: Un fichier PNG est téléchargé
5. Cliquer sur "Imprimer"
6. **Vérifier**: Une fenêtre d'impression s'ouvre

### 1.5 Comparaison de Prix
1. Sur la page de détail, regarder la section "Prix de référence"
2. **Vérifier**: Affichage du prix/m² du terrain vs prix de référence
3. Cliquer sur l'onglet "Ventes à proximité"
4. Ajuster le rayon avec le slider (essayer 1km, 5km, 10km)
5. **Vérifier**: Le nombre de terrains change selon le rayon
6. Cliquer sur "Carte"
7. **Vérifier**: Affichage d'une carte avec:
   - Cercle montrant le rayon sélectionné
   - Marqueurs numérotés pour chaque terrain vendu
8. Cliquer sur un marqueur
9. **Vérifier**: Popup avec détails du terrain

### 1.6 Comparaison de Terrains
1. Aller sur "Terrains" > "Comparer"
2. Sélectionner 2-3 terrains à comparer
3. **Vérifier**: Tableau comparatif avec:
   - Photos
   - Prix
   - Superficie
   - Prix/m²
   - Localisation

### 1.7 Alertes de Zone
1. Cliquer sur le menu utilisateur > "Alertes de zone"
2. Cliquer sur "Nouvelle"
3. Configurer une alerte:
   - Région: "Conakry"
   - Commune: "Ratoma"
   - Types: Résidentiel, Commercial
   - Prix max: 300 000 000 GNF
4. Activer "Par email"
5. Cliquer sur "Créer l'alerte"
6. **Vérifier**: Toast de succès + alerte visible dans la liste
7. Cliquer sur la coche verte pour désactiver
8. **Vérifier**: L'alerte passe à "Inactive"
9. Cliquer sur la corbeille pour supprimer
10. **Vérifier**: L'alerte est supprimée

### 1.8 Recherches Sauvegardées
1. Aller sur la carte
2. Configurer des filtres
3. Cliquer sur "Sauvegarder"
4. Nommer la recherche "Ma recherche Ratoma"
5. **Vérifier**: Succès de sauvegarde
6. Aller sur "Recherches sauvegardées"
7. **Vérifier**: La recherche est listée
8. Activer les notifications pour cette recherche

### 1.9 Contact Vendeur via WhatsApp
1. Sur un terrain avec numéro de téléphone
2. Cliquer sur "Contacter via WhatsApp"
3. **Vérifier**: WhatsApp s'ouvre avec message pré-rempli en français

### 1.10 Partage via WhatsApp
1. Cliquer sur "Partager" > icône WhatsApp
2. **Vérifier**: Message pré-rempli avec lien vers le terrain

---

## Scénario 2: Parcours Vendeur

### 2.1 Connexion Vendeur
1. Se connecter avec `seller@test.com` / `test123`

### 2.2 Publier un Terrain
1. Aller sur "Tableau de bord"
2. Cliquer sur "Ajouter un terrain"
3. Remplir le formulaire:
   - Titre: "Terrain résidentiel à Kipé"
   - Description: "Beau terrain plat avec vue sur mer..."
   - Prix: 150 000 000 GNF
   - Superficie: 500 m²
   - Type: Résidentiel
   - Région: Conakry
   - Commune: Ratoma
   - Quartier: Kipé
4. Ajouter des photos (cliquer sur la zone de téléchargement)
5. Définir la position sur la carte (cliquer pour placer le marqueur)
6. Dessiner les limites du terrain (utiliser l'outil polygone)
7. Cliquer sur "Publier"
8. **Vérifier**: Terrain créé, redirection vers la page du terrain

### 2.3 Modifier un Terrain
1. Aller sur "Tableau de bord" > "Mes terrains"
2. Cliquer sur "Modifier" sur un terrain
3. Changer le prix
4. Sauvegarder
5. **Vérifier**: Changements appliqués

### 2.4 Voir les Statistiques
1. Sur le tableau de bord
2. **Vérifier**: Nombre de terrains, vues, etc.

---

## Scénario 3: Parcours Agent

### 3.1 Connexion Agent
1. Se connecter avec `agent@test.com` / `test123`

### 3.2 Gérer Plusieurs Terrains
1. Publier plusieurs terrains pour différents clients
2. Suivre les transactions en cours

---

## Scénario 4: Parcours Administrateur

### 4.1 Connexion Admin
1. Se connecter avec `admin@guinealand.com` / `admin123`

### 4.2 Vérifier un Terrain
1. Aller sur "Tableau de bord"
2. Voir "Terrains en attente de vérification"
3. Cliquer sur un terrain
4. Examiner les documents
5. Cliquer sur "Vérifier"
6. **Vérifier**: Badge de vérification ajouté

### 4.3 Statistiques Plateforme
1. Sur le tableau de bord admin
2. **Vérifier**:
   - Nombre total de terrains
   - Transactions complétées
   - Utilisateurs inscrits

### 4.4 Gestion des Prix de Référence
1. Aller sur "Prix de référence"
2. Ajouter/modifier les prix par quartier
3. **Vérifier**: Les prix sont utilisés dans les comparaisons

### 4.5 Voir les Feedbacks
1. Aller sur "Suggestions & Feedback"
2. **Vérifier**: Liste des retours utilisateurs
3. Marquer un feedback comme résolu

---

## Scénario 5: Transaction Complète

### 5.1 Initier une Transaction
1. Connecté en tant qu'acheteur
2. Trouver un terrain disponible
3. Cliquer sur "Enregistrer une transaction"
4. Remplir les détails:
   - Prix négocié
   - Date de transaction
   - Notes
5. Soumettre
6. **Vérifier**: Transaction créée en statut "En attente"

### 5.2 Télécharger le Reçu PDF
1. Aller sur "Transactions"
2. Sélectionner une transaction complétée
3. Cliquer sur "Télécharger PDF"
4. **Vérifier**: PDF généré avec tous les détails

### 5.3 Email de Confirmation
1. Après création d'une transaction
2. **Vérifier**: Email envoyé aux parties (si configuré)

---

## Scénario 6: Tendances du Marché

### 6.1 Voir les Tendances
1. Aller sur "Tendances du Marché"
2. **Vérifier**:
   - Graphique d'évolution des prix
   - Statistiques par région
   - Volume de transactions
3. Filtrer par période (6 mois, 12 mois, 24 mois)
4. Filtrer par région
5. **Vérifier**: Les données se mettent à jour

---

## Scénario 7: Fonctionnalités Offline (PWA)

### 7.1 Installation PWA
1. Sur mobile, aller sur le site
2. **Vérifier**: Prompt "Ajouter à l'écran d'accueil" apparaît
3. Installer l'application
4. **Vérifier**: Icône sur l'écran d'accueil

### 7.2 Mode Hors Ligne
1. Désactiver le réseau (mode avion)
2. Ouvrir l'application
3. **Vérifier**: Page hors ligne s'affiche
4. Naviguer sur des pages déjà visitées
5. **Vérifier**: Contenu en cache est affiché
6. Regarder la carte
7. **Vérifier**: Tuiles en cache sont affichées

---

## Scénario 8: Multilingue

### 8.1 Changer de Langue
1. Cliquer sur le sélecteur de langue (icône globe)
2. Sélectionner "English"
3. **Vérifier**: Interface en anglais
4. Sélectionner "Français"
5. **Vérifier**: Interface en français
6. Sélectionner "Pular"
7. **Vérifier**: Interface en Pular (éléments traduits)

---

## Scénario 9: Tests de Sécurité

### 9.1 Accès Non Autorisé
1. Déconnecté, essayer d'accéder à `/dashboard`
2. **Vérifier**: Redirection vers login
3. Essayer d'accéder aux routes admin sans être admin
4. **Vérifier**: Accès refusé

### 9.2 Protection des Données
1. Un utilisateur ne peut pas modifier le terrain d'un autre
2. Un utilisateur ne peut voir que ses propres transactions
3. Seul l'admin peut vérifier les terrains

---

## Scénario 10: Tests API (pour développeurs)

```bash
# Variables
API="https://guinea-land-hub.preview.emergentagent.com/api"

# Test 1: Santé API
curl -s "$API/" | jq

# Test 2: Login
TOKEN=$(curl -s -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer2@test.com","password":"test123"}' \
  -c cookies.txt | jq -r '.token')

# Test 3: Lister les terrains
curl -s "$API/lands?limit=5" | jq

# Test 4: QR Code
curl -s "$API/lands/land_e48b96e18252/qrcode?size=256" -o qr.png

# Test 5: Terrains à proximité
curl -s "$API/prices/nearby/land_e48b96e18252?radius_km=10" | jq

# Test 6: Zone Alerts (avec auth)
curl -s "$API/zone-alerts" -b cookies.txt | jq

# Test 7: Créer Zone Alert
curl -s -X POST "$API/zone-alerts" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"region":"Conakry","commune":"Ratoma","land_types":["residential"],"notify_email":true}' | jq

# Test 8: Status SMS
curl -s "$API/sms/status" | jq
```

---

## Checklist de Test Rapide

### Fonctionnalités Critiques ✅
- [ ] Connexion/Déconnexion
- [ ] Affichage de la carte avec terrains
- [ ] Consultation d'un terrain
- [ ] Création d'un terrain
- [ ] Comparaison de prix (rayon ajustable)
- [ ] Comparaison sur carte
- [ ] Génération QR Code
- [ ] Alertes de zone
- [ ] Transaction + PDF
- [ ] Multilingue FR/EN

### Mobile ✅
- [ ] Responsive design
- [ ] PWA installable
- [ ] Touch-friendly

### Communication ✅
- [ ] WhatsApp contact
- [ ] WhatsApp partage
- [ ] Notifications (si configuré)

---

## Bugs Connus

1. **Email**: Le test Resend n'envoie qu'à l'email du développeur enregistré
2. **SMS**: Non configuré (nécessite clés Twilio)
3. **Mapbox**: Token démo peut avoir des limites

---

*Dernière mise à jour: Avril 2025*

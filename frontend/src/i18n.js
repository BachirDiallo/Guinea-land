import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      // Navigation
      "nav.home": "Accueil",
      "nav.map": "Carte",
      "nav.listings": "Terrains",
      "nav.dashboard": "Tableau de bord",
      "nav.transactions": "Transactions",
      "nav.profile": "Profil",
      "nav.settings": "Paramètres",
      "nav.login": "Connexion",
      "nav.register": "Inscription",
      "nav.logout": "Déconnexion",
      
      // Landing Page
      "landing.hero.title": "Transactions Foncières en Guinée",
      "landing.hero.subtitle": "Sécurisez, Tracez et Gérez vos Terrains",
      "landing.hero.description": "La plateforme de référence pour l'achat, la vente et la gestion des transactions foncières en Guinée. Transparence, sécurité et accessibilité.",
      "landing.hero.cta": "Explorer les Terrains",
      "landing.hero.secondary": "En savoir plus",
      
      // Features
      "landing.features.title": "Pourquoi Guinea Land Hub?",
      "landing.features.map.title": "Cartographie Interactive",
      "landing.features.map.desc": "Visualisez tous les terrains sur une carte interactive avec délimitations précises.",
      "landing.features.secure.title": "Transactions Sécurisées",
      "landing.features.secure.desc": "Chaque transaction est enregistrée et traçable pour une transparence totale.",
      "landing.features.track.title": "Historique Complet",
      "landing.features.track.desc": "Accédez à l'historique complet de chaque terrain et transaction.",
      "landing.features.access.title": "Accès Facile",
      "landing.features.access.desc": "Une plateforme accessible à tous, où que vous soyez en Guinée.",
      
      // Stats
      "landing.stats.lands": "Terrains Enregistrés",
      "landing.stats.transactions": "Transactions",
      "landing.stats.users": "Utilisateurs",
      "landing.stats.regions": "Régions Couvertes",
      
      // Auth
      "auth.login.title": "Connexion",
      "auth.login.email": "Adresse email",
      "auth.login.password": "Mot de passe",
      "auth.login.submit": "Se connecter",
      "auth.login.google": "Continuer avec Google",
      "auth.login.no_account": "Pas encore de compte?",
      "auth.login.register_link": "Créer un compte",
      
      "auth.register.title": "Créer un compte",
      "auth.register.name": "Nom complet",
      "auth.register.email": "Adresse email",
      "auth.register.password": "Mot de passe",
      "auth.register.phone": "Téléphone (optionnel)",
      "auth.register.role": "Type de compte",
      "auth.register.role.buyer": "Acheteur",
      "auth.register.role.seller": "Vendeur",
      "auth.register.role.agent": "Agent Immobilier",
      "auth.register.submit": "S'inscrire",
      "auth.register.google": "S'inscrire avec Google",
      "auth.register.has_account": "Déjà un compte?",
      "auth.register.login_link": "Se connecter",
      
      // Dashboard
      "dashboard.title": "Tableau de bord",
      "dashboard.welcome": "Bienvenue",
      "dashboard.overview": "Vue d'ensemble",
      "dashboard.my_lands": "Mes Terrains",
      "dashboard.my_transactions": "Mes Transactions",
      "dashboard.recent_activity": "Activité Récente",
      "dashboard.add_land": "Ajouter un Terrain",
      
      // Lands
      "lands.title": "Terrains Disponibles",
      "lands.search": "Rechercher un terrain...",
      "lands.filter.region": "Région",
      "lands.filter.type": "Type",
      "lands.filter.price": "Prix",
      "lands.filter.size": "Surface",
      "lands.filter.all": "Tous",
      "lands.filter.apply": "Appliquer",
      "lands.filter.clear": "Effacer",
      
      "lands.type.residential": "Résidentiel",
      "lands.type.commercial": "Commercial",
      "lands.type.agricultural": "Agricole",
      
      "lands.status.available": "Disponible",
      "lands.status.pending": "En cours",
      "lands.status.sold": "Vendu",
      
      "lands.card.size": "Surface",
      "lands.card.price": "Prix",
      "lands.card.location": "Localisation",
      "lands.card.view": "Voir les détails",
      
      // Land Detail
      "land.detail.title": "Détails du Terrain",
      "land.detail.description": "Description",
      "land.detail.location": "Localisation",
      "land.detail.size": "Surface",
      "land.detail.price": "Prix",
      "land.detail.type": "Type",
      "land.detail.status": "Statut",
      "land.detail.owner": "Propriétaire",
      "land.detail.verified": "Vérifié",
      "land.detail.not_verified": "Non vérifié",
      "land.detail.documents": "Documents",
      "land.detail.photos": "Photos",
      "land.detail.history": "Historique des Transactions",
      "land.detail.contact": "Contacter le propriétaire",
      "land.detail.record_transaction": "Enregistrer une Transaction",
      
      // Add/Edit Land
      "land.form.title": "Titre",
      "land.form.description": "Description",
      "land.form.price": "Prix (GNF)",
      "land.form.size": "Surface (m²)",
      "land.form.region": "Région",
      "land.form.commune": "Commune",
      "land.form.address": "Adresse",
      "land.form.type": "Type de terrain",
      "land.form.photos": "Photos",
      "land.form.documents": "Documents",
      "land.form.location": "Cliquez sur la carte pour définir l'emplacement",
      "land.form.submit": "Enregistrer",
      "land.form.cancel": "Annuler",
      
      // Transactions
      "transactions.title": "Transactions",
      "transactions.new": "Nouvelle Transaction",
      "transactions.buyer": "Acheteur",
      "transactions.seller": "Vendeur",
      "transactions.price": "Prix",
      "transactions.date": "Date",
      "transactions.land": "Terrain",
      "transactions.status": "Statut",
      "transactions.notes": "Notes",
      "transactions.documents": "Documents",
      
      // Profile
      "profile.title": "Mon Profil",
      "profile.edit": "Modifier",
      "profile.save": "Enregistrer",
      "profile.name": "Nom",
      "profile.email": "Email",
      "profile.phone": "Téléphone",
      "profile.address": "Adresse",
      "profile.role": "Type de compte",
      
      // Settings
      "settings.title": "Paramètres",
      "settings.language": "Langue",
      "settings.language.fr": "Français",
      "settings.language.en": "English",
      "settings.notifications": "Notifications",
      
      // Common
      "common.loading": "Chargement...",
      "common.error": "Une erreur s'est produite",
      "common.success": "Opération réussie",
      "common.confirm": "Confirmer",
      "common.cancel": "Annuler",
      "common.save": "Enregistrer",
      "common.delete": "Supprimer",
      "common.edit": "Modifier",
      "common.view": "Voir",
      "common.search": "Rechercher",
      "common.filter": "Filtrer",
      "common.sort": "Trier",
      "common.next": "Suivant",
      "common.previous": "Précédent",
      "common.no_results": "Aucun résultat",
      "common.m2": "m²",
      "common.gnf": "GNF",
      
      // Footer
      "footer.about": "À propos",
      "footer.contact": "Contact",
      "footer.terms": "Conditions d'utilisation",
      "footer.privacy": "Politique de confidentialité",
      "footer.copyright": "© 2024 Guinea Land Hub. Tous droits réservés."
    }
  },
  en: {
    translation: {
      // Navigation
      "nav.home": "Home",
      "nav.map": "Map",
      "nav.listings": "Listings",
      "nav.dashboard": "Dashboard",
      "nav.transactions": "Transactions",
      "nav.profile": "Profile",
      "nav.settings": "Settings",
      "nav.login": "Login",
      "nav.register": "Register",
      "nav.logout": "Logout",
      
      // Landing Page
      "landing.hero.title": "Land Transactions in Guinea",
      "landing.hero.subtitle": "Secure, Track and Manage Your Lands",
      "landing.hero.description": "The reference platform for buying, selling and managing land transactions in Guinea. Transparency, security and accessibility.",
      "landing.hero.cta": "Explore Lands",
      "landing.hero.secondary": "Learn More",
      
      // Features
      "landing.features.title": "Why Guinea Land Hub?",
      "landing.features.map.title": "Interactive Mapping",
      "landing.features.map.desc": "View all lands on an interactive map with precise boundaries.",
      "landing.features.secure.title": "Secure Transactions",
      "landing.features.secure.desc": "Every transaction is recorded and traceable for total transparency.",
      "landing.features.track.title": "Complete History",
      "landing.features.track.desc": "Access the complete history of each land and transaction.",
      "landing.features.access.title": "Easy Access",
      "landing.features.access.desc": "A platform accessible to everyone, wherever you are in Guinea.",
      
      // Stats
      "landing.stats.lands": "Registered Lands",
      "landing.stats.transactions": "Transactions",
      "landing.stats.users": "Users",
      "landing.stats.regions": "Regions Covered",
      
      // Auth
      "auth.login.title": "Login",
      "auth.login.email": "Email address",
      "auth.login.password": "Password",
      "auth.login.submit": "Sign in",
      "auth.login.google": "Continue with Google",
      "auth.login.no_account": "Don't have an account?",
      "auth.login.register_link": "Create account",
      
      "auth.register.title": "Create Account",
      "auth.register.name": "Full name",
      "auth.register.email": "Email address",
      "auth.register.password": "Password",
      "auth.register.phone": "Phone (optional)",
      "auth.register.role": "Account type",
      "auth.register.role.buyer": "Buyer",
      "auth.register.role.seller": "Seller",
      "auth.register.role.agent": "Real Estate Agent",
      "auth.register.submit": "Sign up",
      "auth.register.google": "Sign up with Google",
      "auth.register.has_account": "Already have an account?",
      "auth.register.login_link": "Sign in",
      
      // Dashboard
      "dashboard.title": "Dashboard",
      "dashboard.welcome": "Welcome",
      "dashboard.overview": "Overview",
      "dashboard.my_lands": "My Lands",
      "dashboard.my_transactions": "My Transactions",
      "dashboard.recent_activity": "Recent Activity",
      "dashboard.add_land": "Add Land",
      
      // Lands
      "lands.title": "Available Lands",
      "lands.search": "Search for land...",
      "lands.filter.region": "Region",
      "lands.filter.type": "Type",
      "lands.filter.price": "Price",
      "lands.filter.size": "Size",
      "lands.filter.all": "All",
      "lands.filter.apply": "Apply",
      "lands.filter.clear": "Clear",
      
      "lands.type.residential": "Residential",
      "lands.type.commercial": "Commercial",
      "lands.type.agricultural": "Agricultural",
      
      "lands.status.available": "Available",
      "lands.status.pending": "Pending",
      "lands.status.sold": "Sold",
      
      "lands.card.size": "Size",
      "lands.card.price": "Price",
      "lands.card.location": "Location",
      "lands.card.view": "View details",
      
      // Land Detail
      "land.detail.title": "Land Details",
      "land.detail.description": "Description",
      "land.detail.location": "Location",
      "land.detail.size": "Size",
      "land.detail.price": "Price",
      "land.detail.type": "Type",
      "land.detail.status": "Status",
      "land.detail.owner": "Owner",
      "land.detail.verified": "Verified",
      "land.detail.not_verified": "Not verified",
      "land.detail.documents": "Documents",
      "land.detail.photos": "Photos",
      "land.detail.history": "Transaction History",
      "land.detail.contact": "Contact Owner",
      "land.detail.record_transaction": "Record Transaction",
      
      // Add/Edit Land
      "land.form.title": "Title",
      "land.form.description": "Description",
      "land.form.price": "Price (GNF)",
      "land.form.size": "Size (m²)",
      "land.form.region": "Region",
      "land.form.commune": "Commune",
      "land.form.address": "Address",
      "land.form.type": "Land type",
      "land.form.photos": "Photos",
      "land.form.documents": "Documents",
      "land.form.location": "Click on the map to set location",
      "land.form.submit": "Save",
      "land.form.cancel": "Cancel",
      
      // Transactions
      "transactions.title": "Transactions",
      "transactions.new": "New Transaction",
      "transactions.buyer": "Buyer",
      "transactions.seller": "Seller",
      "transactions.price": "Price",
      "transactions.date": "Date",
      "transactions.land": "Land",
      "transactions.status": "Status",
      "transactions.notes": "Notes",
      "transactions.documents": "Documents",
      
      // Profile
      "profile.title": "My Profile",
      "profile.edit": "Edit",
      "profile.save": "Save",
      "profile.name": "Name",
      "profile.email": "Email",
      "profile.phone": "Phone",
      "profile.address": "Address",
      "profile.role": "Account type",
      
      // Settings
      "settings.title": "Settings",
      "settings.language": "Language",
      "settings.language.fr": "Français",
      "settings.language.en": "English",
      "settings.notifications": "Notifications",
      
      // Common
      "common.loading": "Loading...",
      "common.error": "An error occurred",
      "common.success": "Operation successful",
      "common.confirm": "Confirm",
      "common.cancel": "Cancel",
      "common.save": "Save",
      "common.delete": "Delete",
      "common.edit": "Edit",
      "common.view": "View",
      "common.search": "Search",
      "common.filter": "Filter",
      "common.sort": "Sort",
      "common.next": "Next",
      "common.previous": "Previous",
      "common.no_results": "No results",
      "common.m2": "m²",
      "common.gnf": "GNF",
      
      // Footer
      "footer.about": "About",
      "footer.contact": "Contact",
      "footer.terms": "Terms of Service",
      "footer.privacy": "Privacy Policy",
      "footer.copyright": "© 2024 Guinea Land Hub. All rights reserved."
    }
  },
  // Pular (Fulfulde) - Spoken in Fouta Djallon
  pu: {
    translation: {
      "nav.home": "Suudu",
      "nav.map": "Taariika",
      "nav.listings": "Leyɗe",
      "nav.dashboard": "Jokkondiral",
      "nav.login": "Naatugol",
      "nav.register": "Winndugol",
      "nav.logout": "Yaltugol",
      
      "landing.hero.title": "Jeyal Leyɗe e Gine",
      "landing.hero.subtitle": "Ɗaɓɓitu, Reenu, Toppitu Leyɗe Maa",
      "landing.hero.cta": "Yiiru Leyɗe",
      
      "lands.title": "Leyɗe Goodɗe",
      "lands.search": "Yiylo leydi...",
      "lands.type.residential": "Hoɗorde",
      "lands.type.commercial": "Njulaari",
      "lands.type.agricultural": "Ngesa",
      "lands.status.available": "Ina woodi",
      "lands.status.pending": "Ina jokkaa",
      "lands.status.sold": "Soodaama",
      
      "common.loading": "Ina loowa...",
      "common.save": "Danndu",
      "common.cancel": "Haɗu",
      "common.search": "Yiylo"
    }
  },
  // Maninka (Mandingo) - Spoken in Upper Guinea
  ma: {
    translation: {
      "nav.home": "So",
      "nav.map": "Dugukolo jatebla",
      "nav.listings": "Dugukolo",
      "nav.dashboard": "Kunnafonisebla",
      "nav.login": "Don",
      "nav.register": "Tɔgɔ sɛbɛn",
      "nav.logout": "Bɔ",
      
      "landing.hero.title": "Dugukolo Feere Gine",
      "landing.hero.subtitle": "Dugukolo Mara ni Feere",
      "landing.hero.cta": "Dugukolo Lajɛ",
      
      "lands.title": "Dugukolo Minnu Bɛ Yen",
      "lands.search": "Dugukolo ɲini...",
      "lands.type.residential": "Sigida",
      "lands.type.commercial": "Julaya",
      "lands.type.agricultural": "Sɛnɛ",
      "lands.status.available": "A bɛ yen",
      "lands.status.pending": "A bɛ senna",
      "lands.status.sold": "A feera",
      
      "common.loading": "A bɛ donna...",
      "common.save": "A mara",
      "common.cancel": "A dabila",
      "common.search": "Ɲini"
    }
  },
  // Soussou (Susu) - Spoken in Maritime Guinea/Conakry
  su: {
    translation: {
      "nav.home": "Banxi",
      "nav.map": "Bɔxi masenyi",
      "nav.listings": "Bɔxie",
      "nav.dashboard": "Kunfa yire",
      "nav.login": "So",
      "nav.register": "I xili sɛbɛ",
      "nav.logout": "Mini",
      
      "landing.hero.title": "Bɔxi Matinyi Gine",
      "landing.hero.subtitle": "Bɔxi Sɔtɔ, Mati, nun Maraya",
      "landing.hero.cta": "Bɔxie Mato",
      
      "lands.title": "Bɔxie Naxan Na",
      "lands.search": "Bɔxi fen...",
      "lands.type.residential": "Sabatide",
      "lands.type.commercial": "Yulaya",
      "lands.type.agricultural": "Xɛ",
      "lands.status.available": "A na",
      "lands.status.pending": "A matinfe",
      "lands.status.sold": "A matima",
      
      "common.loading": "A sofe...",
      "common.save": "A ratɛ",
      "common.cancel": "A lu",
      "common.search": "Fen"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr', // Default to French
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

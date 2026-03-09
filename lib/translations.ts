export type Lang = "de" | "fr" | "en";

export const t: Record<Lang, Record<string, string>> = {
  de: {
    // Navigation
    nav_bilder: "Bilder",
    nav_objekte: "Objekte",
    nav_serien: "Serien",
    nav_ausstellungen: "Ausstellungen",
    nav_vita: "Der Künstler",
    nav_kontakt: "Kontakt",
    nav_impressum: "Impressum",
    nav_home: "Home",
    nav_arbeiten_label: "Arbeiten",

    // Home page
    home_subtitle: "Bilder · Objekte · Serien",
    home_section_desc: "Anstehende und vergangene Ausstellungen und Veranstaltungen.",
    home_cta: "Mehr erfahren →",

    // Ausstellungen
    ausstellungen_past_divider: "vergangene Ausstellungen",
    ausstellungen_plakat_label: "Plakat",
    ausstellungen_plakat_urheber_label: "Plakat-Urheber",
    ausstellungen_badge_soon: "Demnächst",
    ausstellungen_badge_now: "Aktuell",
    ausstellungen_badge_recent: "Zuletzt gezeigt",

    // Vita
    vita_error_bio: "# Fehler\nDie Vita konnte nicht geladen werden.",
    vita_error_kunst: "# Fehler\nDer Inhalt konnte nicht geladen werden.",
    vita_img_atelier: "im Atelier",
    vita_img_profil: "Profil",

    // Kontakt
    kontakt_intro:
      "Für weitere Informationen zu Preisen, Verkauf, Versand etc. schriftlich oder per Email an",
    kontakt_direct: "oder Nachricht direkt senden:",
    kontakt_name_placeholder: "Ihr Name",
    kontakt_email_placeholder: "Ihre E-Mail-Adresse",
    kontakt_message_placeholder: "Ihre Nachricht",
    kontakt_send: "Senden",
    kontakt_sending: "Senden…",
    kontakt_success: "Nachricht erfolgreich gesendet ✨",
    kontakt_error: "Fehler beim Senden. Bitte später erneut versuchen.",

    // LiveBadge
    live_badge_title: "Läuft gerade",
    live_badge_text: "LIVE",

    // OverviewOverlay
    overview_close: "Schließen",
    overview_thumbnails: "Übersicht",

    // PressSlideshow
    press_label: "Pressestimmen",
    press_close: "Schließen",
    press_prev: "Zurück",
    press_next: "Weiter",
    press_image: "Bild",

    // Search
    search_placeholder: "Suchen …",
  },

  fr: {
    // Navigation
    nav_bilder: "Tableaux",
    nav_objekte: "Objets",
    nav_serien: "Séries",
    nav_ausstellungen: "Expositions",
    nav_vita: "L'artiste",
    nav_kontakt: "Contact",
    nav_impressum: "Impressum",
    nav_home: "Accueil",
    nav_arbeiten_label: "Œuvres",

    // Home page
    home_subtitle: "Tableaux · Objets · Séries",
    home_section_desc: "Expositions et événements à venir et passés.",
    home_cta: "En savoir plus →",

    // Ausstellungen
    ausstellungen_past_divider: "expositions passées",
    ausstellungen_plakat_label: "Affiche",
    ausstellungen_plakat_urheber_label: "Crédit affiche",
    ausstellungen_badge_soon: "Bientôt",
    ausstellungen_badge_now: "En ce moment",
    ausstellungen_badge_recent: "Dernièrement",

    // Vita
    vita_error_bio: "# Erreur\nLa biographie n'a pas pu être chargée.",
    vita_error_kunst: "# Erreur\nLe contenu n'a pas pu être chargé.",
    vita_img_atelier: "dans l'atelier",
    vita_img_profil: "Profil",

    // Kontakt
    kontakt_intro:
      "Pour toute information sur les prix, la vente, l'expédition etc., par courrier ou par email à",
    kontakt_direct: "ou envoyer un message directement :",
    kontakt_name_placeholder: "Votre nom",
    kontakt_email_placeholder: "Votre adresse e-mail",
    kontakt_message_placeholder: "Votre message",
    kontakt_send: "Envoyer",
    kontakt_sending: "Envoi…",
    kontakt_success: "Message envoyé avec succès ✨",
    kontakt_error: "Erreur lors de l'envoi. Veuillez réessayer plus tard.",

    // LiveBadge
    live_badge_title: "En cours",
    live_badge_text: "LIVE",

    // OverviewOverlay
    overview_close: "Fermer",
    overview_thumbnails: "Vue d'ensemble",

    // PressSlideshow
    press_label: "Revue de presse",
    press_close: "Fermer",
    press_prev: "Précédent",
    press_next: "Suivant",
    press_image: "Image",

    // Search
    search_placeholder: "Rechercher …",
  },

  en: {
    // Navigation
    nav_bilder: "Paintings",
    nav_objekte: "Objects",
    nav_serien: "Series",
    nav_ausstellungen: "Exhibitions",
    nav_vita: "The Artist",
    nav_kontakt: "Contact",
    nav_impressum: "Impressum",
    nav_home: "Home",
    nav_arbeiten_label: "Works",

    // Home page
    home_subtitle: "Paintings · Objects · Series",
    home_section_desc: "Upcoming and past exhibitions and events.",
    home_cta: "Learn more →",

    // Ausstellungen
    ausstellungen_past_divider: "past exhibitions",
    ausstellungen_plakat_label: "Poster",
    ausstellungen_plakat_urheber_label: "Poster credit",
    ausstellungen_badge_soon: "Coming Soon",
    ausstellungen_badge_now: "On Now",
    ausstellungen_badge_recent: "Most Recent",

    // Vita
    vita_error_bio: "# Error\nThe biography could not be loaded.",
    vita_error_kunst: "# Error\nThe content could not be loaded.",
    vita_img_atelier: "in the studio",
    vita_img_profil: "Profile",

    // Kontakt
    kontakt_intro:
      "For more information on prices, sales, shipping, etc., by mail or email to",
    kontakt_direct: "or send a message directly:",
    kontakt_name_placeholder: "Your name",
    kontakt_email_placeholder: "Your email address",
    kontakt_message_placeholder: "Your message",
    kontakt_send: "Send",
    kontakt_sending: "Sending…",
    kontakt_success: "Message sent successfully ✨",
    kontakt_error: "Error sending message. Please try again later.",

    // LiveBadge
    live_badge_title: "Currently running",
    live_badge_text: "LIVE",

    // OverviewOverlay
    overview_close: "Close",
    overview_thumbnails: "Overview",

    // PressSlideshow
    press_label: "Press",
    press_close: "Close",
    press_prev: "Previous",
    press_next: "Next",
    press_image: "Image",

    // Search
    search_placeholder: "Search …",
  },
};

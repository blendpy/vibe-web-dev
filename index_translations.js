/**
 * index_translations.js
 * Modular multi-language translation dictionary for index.html & languages.html
 */

window.INDEX_LANGUAGES = [
    { code: 'auto', name: 'Auto Detect', native: 'Auto Detect',       flag: '🧭', bcp47: 'en-US', speakers: 'Browser Default',            hello: 'Browser Default' },
    { code: 'en',   name: 'English',     native: 'English',           flag: '🇬🇧', bcp47: 'en-US', speakers: '400 million native speakers', hello: 'Hello World!' },
    { code: 'da',   name: 'Danish',      native: 'Dansk',             flag: '🇩🇰', bcp47: 'da-DK', speakers: '5 million native speakers',   hello: 'Hej Verden' },
    { code: 'nl',   name: 'Dutch',       native: 'Nederlands',        flag: '🇳🇱', bcp47: 'nl-NL', speakers: '25 million native speakers',  hello: 'Hallo, wereld!' },
    { code: 'fi',   name: 'Finnish',     native: 'Suomi',             flag: '🇫🇮', bcp47: 'fi-FI', speakers: '5 million native speakers',   hello: 'Hei maailma' },
    { code: 'fr',   name: 'French',      native: 'le français',       flag: '🇫🇷', bcp47: 'fr-FR', speakers: '75 million native speakers',  hello: 'Bonjour, Monde!' },
    { code: 'de',   name: 'German',      native: 'Deutsch',           flag: '🇩🇪', bcp47: 'de-DE', speakers: '75 million native speakers',  hello: 'Hallo, Welt!' },
    { code: 'hu',   name: 'Hungarian',   native: 'Magyar',            flag: '🇭🇺', bcp47: 'hu-HU', speakers: '13 million native speakers',  hello: 'Helló, világ!' },
    { code: 'it',   name: 'Italian',     native: 'Italiano',          flag: '🇮🇹', bcp47: 'it-IT', speakers: '65 million native speakers',  hello: 'Ciao, mondo!' },
    { code: 'no',   name: 'Norwegian',   native: 'Norsk',             flag: '🇳🇴', bcp47: 'nb-NO', speakers: '5 million native speakers',   hello: 'Hei, verden!' },
    { code: 'pl',   name: 'Polish',      native: 'Polski',            flag: '🇵🇱', bcp47: 'pl-PL', speakers: '45 million native speakers',  hello: 'Witaj, świecie!' },
    { code: 'ro',   name: 'Romanian',    native: 'Română',            flag: '🇷🇴', bcp47: 'ro-RO', speakers: '24 million native speakers',  hello: 'Salut, lume!' },
    { code: 'pt',   name: 'Portuguese',  native: 'Português',         flag: '🇵🇹', bcp47: 'pt-PT', speakers: '255 million native speakers', hello: 'Olá, mundo!' },
    { code: 'sv',   name: 'Swedish',     native: 'Svenska',           flag: '🇸🇪', bcp47: 'sv-SE', speakers: '10 million native speakers',  hello: 'Hej, världen!' },
    { code: 'es',   name: 'Spanish',     native: 'Español',           flag: '🇪🇸', bcp47: 'es-ES', speakers: '485 million native speakers', hello: '¡Hola, mundo!' },
    { code: 'tr',   name: 'Turkish',     native: 'Türkçe',            flag: '🇹🇷', bcp47: 'tr-TR', speakers: '85 million native speakers',  hello: 'Merhaba, dünya!' },
    { code: 'ar',   name: 'Arabic',      native: 'العربية',           flag: '🇸🇦', bcp47: 'ar-SA', speakers: '185 million native speakers', hello: 'مرحبا بالعالم (Marhaban bil-alam)' },
    { code: 'am',   name: 'Amharic',     native: 'አማርኛ',             flag: '🇪🇹', bcp47: 'am-ET', speakers: '35 million native speakers',  hello: 'ሰላም ለዓለም! (Selam le-alem!)' },
    { code: 'bn',   name: 'Bengali',     native: 'বাংলা',             flag: '🇧🇩', bcp47: 'bn-BD', speakers: '235 million native speakers', hello: 'হ্যালো, বিশ্ব (Hyālō bishwa)' },
    { code: 'my',   name: 'Burmese',     native: 'မြန်မာစာ',           flag: '🇲🇲', bcp47: 'my-MM', speakers: '33 million native speakers',  hello: 'မင်္ဂလာပါကမ္ဘာလောက' },
    { code: 'ca',   name: 'Catalan',     native: 'Català',            flag: '🇪🇸', bcp47: 'ca-ES', speakers: '10 million native speakers',  hello: 'Hola, món!' },
    { code: 'cs',   name: 'Czech',       native: 'Čeština',           flag: '🇨🇿', bcp47: 'cs-CZ', speakers: '11 million native speakers',  hello: 'Ahoj, světe!' },
    { code: 'zh',   name: 'Chinese',     native: '中文',              flag: '🇨🇳', bcp47: 'zh-CN', speakers: '1.2 billion native speakers', hello: '你好，世界！ (Nǐ hǎo, shìjiè!)' },
    { code: 'el',   name: 'Greek',       native: 'Ελληνικά',          flag: '🇬🇷', bcp47: 'el-GR', speakers: '13 million native speakers',  hello: 'Γεια σου, Κόσμε!' },
    { code: 'ha',   name: 'Hausa',       native: 'Harshen Hausa',     flag: '🇳🇬', bcp47: 'ha-NG', speakers: '70 million native speakers',  hello: 'Sannu da duniya!' },
    { code: 'he',   name: 'Hebrew',      native: 'עברית',             flag: '🇮🇱', bcp47: 'he-IL', speakers: '5 million native speakers',   hello: 'שלום, עולם (Shalom, olam)' },
    { code: 'id',   name: 'Indonesian',  native: 'Bahasa Indonesia',  flag: '🇮🇩', bcp47: 'id-ID', speakers: '155 million native speakers', hello: 'Halo, dunia!' },
    { code: 'ja',   name: 'Japanese',    native: '日本語',            flag: '🇯🇵', bcp47: 'ja-JP', speakers: '125 million native speakers', hello: 'こんにちは世界！ (Konnichiwa sekai!)' },
    { code: 'ko',   name: 'Korean',      native: '한국어',            flag: '🇰🇷', bcp47: 'ko-KR', speakers: '85 million native speakers',  hello: '안녕하세요, 세상! (Annyeonghaseyo, sesang!)' },
    { code: 'fa',   name: 'Persian',     native: 'فارسی',             flag: '🇮🇷', bcp47: 'fa-IR', speakers: '65 million native speakers',  hello: 'درود دنیا! (Dorood donya!)' },
    { code: 'th',   name: 'Thai',        native: 'ภาษาไทย',           flag: '🇹🇭', bcp47: 'th-TH', speakers: '60 million native speakers',  hello: 'สวัสดีโลก! (Sawatdee lok!)' },
    { code: 'ms',   name: 'Malay',       native: 'Bahasa Melayu',     flag: '🇲🇾', bcp47: 'ms-MY', speakers: '77 million native speakers',  hello: 'Helo, dunia!' },
    { code: 'ru',   name: 'Russian',     native: 'Русский',           flag: '🇷🇺', bcp47: 'ru-RU', speakers: '135 million native speakers', hello: 'Привет, мир! (Privet, mir!)' },
    { code: 'sr',   name: 'Serbian',     native: 'Српски',            flag: '🇷🇸', bcp47: 'sr-RS', speakers: '9 million native speakers',   hello: 'Поздрав свете! (Pozdrav svete!)' },
    { code: 'sk',   name: 'Slovak',      native: 'Slovenčina',        flag: '🇸🇰', bcp47: 'sk-SK', speakers: '5 million native speakers',   hello: 'Ahoj, svet!' },
    { code: 'sw',   name: 'Swahili',     native: 'Kiswahili',         flag: '🇰🇪', bcp47: 'sw-KE', speakers: '85 million native speakers',  hello: 'Salamu, Dunia!' },
    { code: 'tl',   name: 'Tagalog',     native: 'Filipino',          flag: '🇵🇭', bcp47: 'tl-PH', speakers: '80 million native speakers',  hello: 'Kumusta, mundo!' },
    { code: 'uk',   name: 'Ukrainian',   native: 'Українська',        flag: '🇺🇦', bcp47: 'uk-UA', speakers: '45 million native speakers',  hello: 'Привіт, світе! (Pree-veet, svit-eh!)' },
    { code: 'ur',   name: 'Urdu',        native: 'اُردُو',             flag: '🇵🇰', bcp47: 'ur-PK', speakers: '230 million native speakers', hello: 'ہیلو دنیا! (Hello duniya!)' },
    { code: 'vi',   name: 'Vietnamese',  native: 'Tiếng Việt',        flag: '🇻🇳', bcp47: 'vi-VN', speakers: '85 million native speakers',  hello: 'Xin chào, thế giới' },
    { code: 'yo',   name: 'Yoruba',      native: 'Yorùbá',            flag: '🇳🇬', bcp47: 'yo-NG', speakers: '45 million native speakers',  hello: 'Pẹlẹ o àgbáyé!' },
    { code: 'hi',   name: 'Hindi',       native: 'हिन्दी',             flag: '🇮🇳', bcp47: 'hi-IN', speakers: '345 million native speakers', hello: 'नमस्ते दुनिया (Namaste duniya)' },
    { code: 'gu',   name: 'Gujarati',    native: 'ગુજરાતી',           flag: '🇮🇳', bcp47: 'gu-IN', speakers: '55 million native speakers',  hello: 'નમસ્તે દુનિયા! (Namaste duniya!)' },
    { code: 'kn',   name: 'Kannada',     native: 'ಕನ್ನಡ',             flag: '🇮🇳', bcp47: 'kn-IN', speakers: '45 million native speakers',  hello: 'ನಮಸ್ಕಾರ ಪ್ರಪಂಚ! (Namaskāra prapañca!)' },
    { code: 'mr',   name: 'Marathi',     native: 'मराठी',             flag: '🇮🇳', bcp47: 'mr-IN', speakers: '95 million native speakers',  hello: 'नमस्कार जग! (Namaskar jag!)' },
    { code: 'pa',   name: 'Punjabi',     native: 'ਪੰਜਾਬੀ',            flag: '🇮🇳', bcp47: 'pa-IN', speakers: '115 million native speakers', hello: 'ਹੈਲੋ ਦੁਨੀਆ! (Hello duniya!)' },
    { code: 'ta',   name: 'Tamil',       native: 'தமிழ்',             flag: '🇮🇳', bcp47: 'ta-IN', speakers: '75 million native speakers',  hello: 'வணக்கம் உலகம்! (Vanakkam ulagam!)' },
    { code: 'te',   name: 'Telugu',      native: 'తెలుగు',            flag: '🇮🇳', bcp47: 'te-IN', speakers: '85 million native speakers',  hello: 'హలో ప్రపంచమా! (Halo prapanchama!)' }
];

window.INDEX_TRANSLATIONS = {
    en: {
        app_title: "Vibe Web Dev",
        nav_language: "Language",
        nav_brief: "Brief",
        nav_github_source: "GitHub Source Code",

        helio_title: "Helio Solar System",
        helio_desc: "Interactive 3D heliocentric solar system visualization featuring planetary orbits, comets, and eclipses.",
        helio_link_solar: "Solar System View",
        helio_link_eclipse: "2027 Solar Eclipse View",
        helio_link_earth: "Earth 3D View",
        helio_link_moon: "Moon 3D View",
        helio_link_saturn: "Saturn 3D View",
        badge_simulations: "Simulations",

        money_title: "Money & Tax Tools",
        money_desc: "Financial calculators, historical tax brackets, and budgetary simulators.",
        money_link_mortgage: "Mortgage Amortization",
        money_link_budget: "Federal Budget Simulator",
        money_link_taxes: "US Federal Tax Calculator",
        money_link_historical: "Historical Taxes Comparison",
        money_link_ss: "Social Security Calculator",
        tech_financial_modeling: "Financial Modeling",
        badge_tool_suite: "Tool Suite",

        image_title: "Image Processing",
        image_desc: "Interactive photo layout studios, grid generators, and browser-based media tools.",
        image_link_videostudio: "VideoStudio Media Editor",
        image_link_photocollage: "PhotoCollage Grid Studio",
        image_link_python_orig: "OLD PhotoCollage written Python",
        tech_layout_algorithms: "Layout Algorithms",
        badge_creative_studio: "Creative Studio",

        plants_title: "Plant Science Explorer",
        plants_desc: "Interactive botanical guide and explorer detailing plant species, characteristics, and habitats.",
        plants_link_explorer: "Botanical Explorer View",
        plants_link_metric: "Botanical Explorer (Gridview & Metric)",
        tech_interactive_ui: "Interactive UI",
        tech_botanical_data: "Botanical Data",
        badge_explorer: "Explorer",

        puzzles_title: "Logic & Word Puzzles",
        puzzles_desc: "Interactive logic grids, word puzzles, jigsaws, and emoji challenges with custom difficulty levels.",
        puzzles_link_linguistics: "Linguistic Word Mechanics Puzzle",
        puzzles_link_jigsaw: "Jigsaw Puzzle Studio",
        puzzles_link_emoji: "Emoji Match Game",
        puzzles_link_sudoku9: "Medium Sudoku (9x9)",
        puzzles_link_sudoku12: "Giant Hard Sudoku (12x12)",
        tech_game_logic: "Game Logic",
        badge_puzzle_game: "Puzzle Game",

        footer_text: "Hosted on GitHub Pages • blendpy/vibe-web-dev",
        lang_modal_title: "Select Language",
        lang_open_page: "Open Languages Page ↗",
        lang_missing_hint: "Missing translations fall back to English in red.",
        demo_modal_title: "Load Media & Slideshow Demos",
        btn_close: "Close",
        btn_cancel: "Cancel",
        btn_save: "Save"
    },

    es: {
        app_title: "Vibe Web Dev",
        nav_language: "Idioma",
        nav_brief: "Resumen",
        nav_github_source: "Código Fuente en GitHub",

        helio_title: "Sistema Solar Helio",
        helio_desc: "Visualización 3D interactiva del sistema solar heliocéntrico con órbitas planetarias, cometas y eclipses.",
        helio_link_solar: "Vista del Sistema Solar",
        helio_link_eclipse: "Vista del Eclipse Solar 2027",
        helio_link_earth: "Vista 3D de la Tierra",
        helio_link_moon: "Vista 3D de la Luna",
        helio_link_saturn: "Vista 3D de Saturno",
        badge_simulations: "Simulaciones",

        money_title: "Herramientas Fiscales y Financieras",
        money_desc: "Calculadoras financieras, tramos impositivos históricos y simuladores presupuestarios.",
        money_link_mortgage: "Amortización Hipotecaria",
        money_link_budget: "Simulador de Presupuesto Federal",
        money_link_taxes: "Calculadora de Impuestos Federales EE. UU.",
        money_link_historical: "Comparación Histórica de Impuestos",
        money_link_ss: "Calculadora del Seguro Social",
        tech_financial_modeling: "Modelado Financiero",
        badge_tool_suite: "Suite de Herramientas",

        image_title: "Procesamiento de Imágenes",
        image_desc: "Estudios interactivos de diseño fotográfico, generadores de cuadrículas y herramientas multimedia.",
        image_link_videostudio: "Editor Multimedia VideoStudio",
        image_link_photocollage: "Estudio de Cuadrículas PhotoCollage",
        image_link_python_orig: "ANTIGUO PhotoCollage escrito en Python",
        tech_layout_algorithms: "Algoritmos de Diseño",
        badge_creative_studio: "Estudio Creativo",

        plants_title: "Explorador de Ciencias Botánicas",
        plants_desc: "Guía botánica interactiva que detalla especies de plantas, características y hábitats.",
        plants_link_explorer: "Vista del Explorador Botánico",
        plants_link_metric: "Explorador Botánico (Cuadrícula y Métrico)",
        tech_interactive_ui: "Interfaz Interactiva",
        tech_botanical_data: "Datos Botánicos",
        badge_explorer: "Explorador",

        puzzles_title: "Rompecabezas de Lógica y Palabras",
        puzzles_desc: "Cuadrículas lógicas interactivas, juegos de palabras, rompecabezas y desafíos de emojis.",
        puzzles_link_linguistics: "Rompecabezas de Mecánica Lingüística",
        puzzles_link_jigsaw: "Estudio de Rompecabezas Jigsaw",
        puzzles_link_emoji: "Juego de Emparejar Emojis",
        puzzles_link_sudoku9: "Sudoku Medio (9x9)",
        puzzles_link_sudoku12: "Sudoku Gigante Difícil (12x12)",
        tech_game_logic: "Lógica de Juegos",
        badge_puzzle_game: "Juego de Ingenio",

        footer_text: "Alojado en GitHub Pages • blendpy/vibe-web-dev",
        lang_modal_title: "Seleccionar Idioma",
        lang_open_page: "Abrir Página de Idiomas ↗",
        lang_missing_hint: "Las traducciones faltantes se muestran en inglés en rojo.",
        demo_modal_title: "Cargar Demos Multimedia y Presentaciones",
        btn_close: "Cerrar",
        btn_cancel: "Cancelar",
        btn_save: "Guardar"
    },

    fr: {
        app_title: "Vibe Web Dev",
        nav_language: "Langue",
        nav_brief: "Compact",
        nav_github_source: "Code Source GitHub",

        helio_title: "Système Solaire Helio",
        helio_desc: "Visualisation 3D interactive du système solaire héliocentrique avec orbites planétaires, comètes et éclipses.",
        helio_link_solar: "Vue du Système Solaire",
        helio_link_eclipse: "Vue de l'Éclipse Solaire 2027",
        helio_link_earth: "Vue 3D de la Terre",
        helio_link_moon: "Vue 3D de la Lune",
        helio_link_saturn: "Vue 3D de Saturne",
        badge_simulations: "Simulations",

        money_title: "Outils Financiers et Fiscaux",
        money_desc: "Calculatrices financières, tranches d'imposition historiques et simulateurs budgétaires.",
        money_link_mortgage: "Amortissement Hypothécaire",
        money_link_budget: "Simulateur du Budget Fédéral",
        money_link_taxes: "Calculateur d'Impôt Fédéral US",
        money_link_historical: "Comparaison Historique des Impôts",
        money_link_ss: "Calculateur de Sécurité Sociale",
        tech_financial_modeling: "Modélisation Financière",
        badge_tool_suite: "Suite d'Outils",

        image_title: "Traitement d'Images",
        image_desc: "Studios de mise en page photo interactifs, générateurs de grilles et outils multimédias.",
        image_link_videostudio: "Éditeur Multimédia VideoStudio",
        image_link_photocollage: "Studio de Grilles PhotoCollage",
        image_link_python_orig: "ANCIEN PhotoCollage écrit en Python",
        tech_layout_algorithms: "Algorithmes de Mise en Page",
        badge_creative_studio: "Studio Créatif",

        plants_title: "Explorateur Botanique",
        plants_desc: "Guide botanique interactif détaillant les espèces végétales, leurs caractéristiques et habitats.",
        plants_link_explorer: "Vue de l'Explorateur Botanique",
        plants_link_metric: "Explorateur Botanique (Grille et Métrique)",
        tech_interactive_ui: "Interface Interactive",
        tech_botanical_data: "Données Botaniques",
        badge_explorer: "Explorateur",

        puzzles_title: "Puzzles Logiques et Mots",
        puzzles_desc: "Grilles logiques interactives, jeux de mots, puzzles et défis d'émojis avec niveaux personnalisés.",
        puzzles_link_linguistics: "Puzzle de Mécanique Linguistique",
        puzzles_link_jigsaw: "Studio de Puzzle Jigsaw",
        puzzles_link_emoji: "Jeu de Paires d'Émojis",
        puzzles_link_sudoku9: "Sudoku Moyen (9x9)",
        puzzles_link_sudoku12: "Sudoku Géant Difficile (12x12)",
        tech_game_logic: "Logique de Jeu",
        badge_puzzle_game: "Jeu de Réflexion",

        footer_text: "Hébergé sur GitHub Pages • blendpy/vibe-web-dev",
        lang_modal_title: "Choisir la Langue",
        lang_open_page: "Ouvrir la Page des Langues ↗",
        lang_missing_hint: "Les traductions manquantes s'affichent en anglais en rouge.",
        demo_modal_title: "Charger des Démos Multimédias",
        btn_close: "Fermer",
        btn_cancel: "Annuler",
        btn_save: "Enregistrer"
    },

    de: {
        app_title: "Vibe Web Dev",
        nav_language: "Sprache",
        nav_brief: "Kompakt",
        nav_github_source: "GitHub-Quellcode",

        helio_title: "Helio Sonnensystem",
        helio_desc: "Interaktive 3D-Visualisierung des heliozentrischen Sonnensystems mit Planetenbahnen, Kometen und Finsternissen.",
        helio_link_solar: "Sonnensystem-Ansicht",
        helio_link_eclipse: "Sonnenfinsternis 2027 Ansicht",
        helio_link_earth: "Erde 3D-Ansicht",
        helio_link_moon: "Mond 3D-Ansicht",
        helio_link_saturn: "Saturn 3D-Ansicht",
        badge_simulations: "Simulationen",

        money_title: "Finanz- & Steuer-Tools",
        money_desc: "Finanzrechner, historische Steuertarife und Haushaltssimulatoren.",
        money_link_mortgage: "Hypothekentilgung",
        money_link_budget: "Bundeshaushalts-Simulator",
        money_link_taxes: "US-Bundessteuerrechner",
        money_link_historical: "Historischer Steuervergleich",
        money_link_ss: "Sozialversicherungsrechner",
        tech_financial_modeling: "Finanzmodellierung",
        badge_tool_suite: "Tool-Suite",

        image_title: "Bildverarbeitung",
        image_desc: "Interaktive Fotolayout-Studios, Rastergeneratoren und browserbasierte Medientools.",
        image_link_videostudio: "VideoStudio Medieneditor",
        image_link_photocollage: "PhotoCollage Raster-Studio",
        image_link_python_orig: "ALTES in Python geschriebenes PhotoCollage",
        tech_layout_algorithms: "Layout-Algorithmen",
        badge_creative_studio: "Kreativstudio",

        plants_title: "Pflanzenkunde-Explorer",
        plants_desc: "Interaktiver botanischer Führer über Pflanzenarten, Eigenschaften und Lebensräume.",
        plants_link_explorer: "Botanischer Explorer",
        plants_link_metric: "Botanischer Explorer (Raster & Metrisch)",
        tech_interactive_ui: "Interaktive UI",
        tech_botanical_data: "Botanische Daten",
        badge_explorer: "Explorer",

        puzzles_title: "Logik- & Worträtsel",
        puzzles_desc: "Interaktive Logikgitter, Worträtsel, Puzzles und Emoji-Herausforderungen.",
        puzzles_link_linguistics: "Linguistisches Wortmechanik-Rätsel",
        puzzles_link_jigsaw: "Puzzle-Studio",
        puzzles_link_emoji: "Emoji-Memory-Spiel",
        puzzles_link_sudoku9: "Mittleres Sudoku (9x9)",
        puzzles_link_sudoku12: "Riesiges Schweres Sudoku (12x12)",
        tech_game_logic: "Spiellogik",
        badge_puzzle_game: "Denkspiel",

        footer_text: "Gehostet auf GitHub Pages • blendpy/vibe-web-dev",
        lang_modal_title: "Sprache auswählen",
        lang_open_page: "Sprachen-Seite öffnen ↗",
        lang_missing_hint: "Fehlende Übersetzungen werden rot auf Englisch angezeigt.",
        demo_modal_title: "Medien- & Diashow-Demos laden",
        btn_close: "Schließen",
        btn_cancel: "Abbrechen",
        btn_save: "Speichern"
    },

    pt: {
        app_title: "Vibe Web Dev",
        nav_language: "Idioma",
        nav_brief: "Resumo",
        nav_github_source: "Código-Fonte no GitHub",

        helio_title: "Sistema Solar Helio",
        helio_desc: "Visualização 3D interativa do sistema solar heliocêntrico com órbitas planetárias, cometas e eclipses.",
        helio_link_solar: "Visão do Sistema Solar",
        helio_link_eclipse: "Eclipse Solar de 2027",
        helio_link_earth: "Visão 3D da Terra",
        helio_link_moon: "Visão 3D da Lua",
        helio_link_saturn: "Visão 3D de Saturno",
        badge_simulations: "Simulações",

        money_title: "Ferramentas Financeiras e Fiscais",
        money_desc: "Calculadoras financeiras, faixas de impostos históricas e simuladores orçamentários.",
        money_link_mortgage: "Amortização de Hipoteca",
        money_link_budget: "Simulador do Orçamento Federal",
        money_link_taxes: "Calculadora de Imposto Federal dos EUA",
        money_link_historical: "Comparação Histórica de Impostos",
        money_link_ss: "Calculadora da Previdência Social",
        tech_financial_modeling: "Modelagem Financeira",
        badge_tool_suite: "Suíte de Ferramentas",

        image_title: "Processamento de Imagem",
        image_desc: "Estúdios interativos de layout de fotos, geradores de grade e ferramentas de mídia no navegador.",
        image_link_videostudio: "Editor de Mídia VideoStudio",
        image_link_photocollage: "Estúdio de Grade PhotoCollage",
        image_link_python_orig: "ANTIGO PhotoCollage escrito em Python",
        tech_layout_algorithms: "Algoritmos de Layout",
        badge_creative_studio: "Estúdio Criativo",

        plants_title: "Explorador de Ciências Botânicas",
        plants_desc: "Guia botânico interativo detalhando espécies de plantas, características e habitats.",
        plants_link_explorer: "Visão do Explorador Botânico",
        plants_link_metric: "Explorador Botânico (Grade e Métrico)",
        tech_interactive_ui: "UI Interativa",
        tech_botanical_data: "Dados Botânicos",
        badge_explorer: "Explorador",

        puzzles_title: "Quebra-Cabeças de Lógica e Palavras",
        puzzles_desc: "Grades lógicas interativas, jogos de palavras, quebra-cabeças e desafios de emojis.",
        puzzles_link_linguistics: "Quebra-Cabeça de Mecânica Linguística",
        puzzles_link_jigsaw: "Estúdio de Quebra-Cabeça Jigsaw",
        puzzles_link_emoji: "Jogo de Combinar Emojis",
        puzzles_link_sudoku9: "Sudoku Médio (9x9)",
        puzzles_link_sudoku12: "Sudoku Gigante Difícil (12x12)",
        tech_game_logic: "Lógica de Jogo",
        badge_puzzle_game: "Jogo de Quebra-Cabeça",

        footer_text: "Hospedado no GitHub Pages • blendpy/vibe-web-dev",
        lang_modal_title: "Selecionar Idioma",
        lang_open_page: "Abrir Página de Idiomas ↗",
        lang_missing_hint: "Traduções ausentes aparecem em inglês em vermelho.",
        demo_modal_title: "Carregar Demos de Mídia",
        btn_close: "Fechar",
        btn_cancel: "Cancelar",
        btn_save: "Salvar"
    },

    it: {
        app_title: "Vibe Web Dev",
        nav_language: "Lingua",
        nav_brief: "Compatto",
        nav_github_source: "Codice Sorgente GitHub",

        helio_title: "Sistema Solare Helio",
        helio_desc: "Visualizzazione 3D interattiva del sistema solare eliocentrico con orbite planetarie, comete ed eclissi.",
        helio_link_solar: "Vista Sistema Solare",
        helio_link_eclipse: "Vista Eclissi Solare 2027",
        helio_link_earth: "Vista 3D della Terra",
        helio_link_moon: "Vista 3D della Luna",
        helio_link_saturn: "Vista 3D di Saturno",
        badge_simulations: "Simulazioni",

        money_title: "Strumenti Finanziari e Fiscali",
        money_desc: "Calcolatori finanziari, scaglioni fiscali storici e simulatori di bilancio.",
        money_link_mortgage: "Ammortamento Mutuo",
        money_link_budget: "Simulatore Bilancio Federale",
        money_link_taxes: "Calcolatore Tasse Federali USA",
        money_link_historical: "Confronto Storico delle Tasse",
        money_link_ss: "Calcolatore Previdenza Sociale",
        tech_financial_modeling: "Modellazione Finanziaria",
        badge_tool_suite: "Suite di Strumenti",

        image_title: "Elaborazione Immagini",
        image_desc: "Studi interattivi di layout fotografico, generatori di griglie e strumenti multimediali.",
        image_link_videostudio: "Editor Multimediale VideoStudio",
        image_link_photocollage: "Studio Griglia PhotoCollage",
        image_link_python_orig: "VECCHIO PhotoCollage scritto in Python",
        tech_layout_algorithms: "Algoritmi di Layout",
        badge_creative_studio: "Studio Creativo",

        plants_title: "Esploratore Botanico",
        plants_desc: "Guida botanica interattiva con dettagli su specie vegetali, caratteristiche e habitat.",
        plants_link_explorer: "Vista Esploratore Botanico",
        plants_link_metric: "Esploratore Botanico (Griglia e Metrico)",
        tech_interactive_ui: "UI Interattiva",
        tech_botanical_data: "Dati Botanici",
        badge_explorer: "Esploratore",

        puzzles_title: "Rompicapi di Logica e Parole",
        puzzles_desc: "Griglie logiche interattive, giochi di parole, puzzle e sfide con emoji.",
        puzzles_link_linguistics: "Puzzle di Meccanica Linguistica",
        puzzles_link_jigsaw: "Studio Puzzle Jigsaw",
        puzzles_link_emoji: "Gioco di Abbinamento Emoji",
        puzzles_link_sudoku9: "Sudoku Medio (9x9)",
        puzzles_link_sudoku12: "Sudoku Gigante Difficile (12x12)",
        tech_game_logic: "Logica di Gioco",
        badge_puzzle_game: "Gioco Rompicapo",

        footer_text: "Ospitato su GitHub Pages • blendpy/vibe-web-dev",
        lang_modal_title: "Seleziona Lingua",
        lang_open_page: "Apri Pagina Lingue ↗",
        lang_missing_hint: "Le traduzioni mancanti sono mostrate in inglese in rosso.",
        demo_modal_title: "Carica Demo Multimediali",
        btn_close: "Chiudi",
        btn_cancel: "Annulla",
        btn_save: "Salva"
    },

    zh: {
        app_title: "Vibe 网页开发",
        nav_language: "语言",
        nav_brief: "简略视图",
        nav_github_source: "GitHub 源代码",

        helio_title: "Helio 太阳系模拟器",
        helio_desc: "交互式 3D 日心太阳系可视化，包含行星轨道、彗星和日食模拟。",
        helio_link_solar: "太阳系全景视图",
        helio_link_eclipse: "2027 年日食视图",
        helio_link_earth: "地球 3D 视图",
        helio_link_moon: "月球 3D 视图",
        helio_link_saturn: "土星 3D 视图",
        badge_simulations: "科学模拟",

        money_title: "金融与税务工具",
        money_desc: "金融计算器、历史税率档次与联邦预算模拟器。",
        money_link_mortgage: "房贷摊销计算器",
        money_link_budget: "联邦预算模拟器",
        money_link_taxes: "美国联邦税计算器",
        money_link_historical: "历史税率对比工具",
        money_link_ss: "社保福利计算器",
        tech_financial_modeling: "金融建模",
        badge_tool_suite: "工具套件",

        image_title: "图像与媒体处理",
        image_desc: "交互式照片排版工作室、网格拼图生成器及浏览器端媒体工具。",
        image_link_videostudio: "VideoStudio 媒体编辑器",
        image_link_photocollage: "PhotoCollage 网格拼图室",
        image_link_python_orig: "旧版 Python 编写的 PhotoCollage",
        tech_layout_algorithms: "排版算法",
        badge_creative_studio: "创意工坊",

        plants_title: "植物科学探索器",
        plants_desc: "交互式植物学指南，详述植物物种、生长习性与栖息地。",
        plants_link_explorer: "植物学探索视图",
        plants_link_metric: "植物学探索（网格与公制）",
        tech_interactive_ui: "交互界面",
        tech_botanical_data: "植物学数据",
        badge_explorer: "科学探索",

        puzzles_title: "逻辑与文字益智游戏",
        puzzles_desc: "交互式逻辑方格、词汇解谜、拼图游戏以及多难度表情符号挑战。",
        puzzles_link_linguistics: "语言词汇力学解谜",
        puzzles_link_jigsaw: "Jigsaw 拼图工作室",
        puzzles_link_emoji: "Emoji 记忆配对游戏",
        puzzles_link_sudoku9: "中等数独 (9x9)",
        puzzles_link_sudoku12: "巨型困难数独 (12x12)",
        tech_game_logic: "游戏逻辑",
        badge_puzzle_game: "益智游戏",

        footer_text: "托管于 GitHub Pages • blendpy/vibe-web-dev",
        lang_modal_title: "选择语言",
        lang_open_page: "打开语言专页 ↗",
        lang_missing_hint: "缺失的翻译将以红色英文显示。",
        demo_modal_title: "加载媒体与幻灯片演示",
        btn_close: "关闭",
        btn_cancel: "取消",
        btn_save: "保存"
    },

    ja: {
        app_title: "Vibe Web Dev",
        nav_language: "言語",
        nav_brief: "コンパクト表示",
        nav_github_source: "GitHub ソースコード",

        helio_title: "Helio 太陽系シミュレーター",
        helio_desc: "惑星の軌道、彗星、日食を再現したインタラクティブな3D太陽系ビジュアライゼーション。",
        helio_link_solar: "太陽系ビュー",
        helio_link_eclipse: "2027年 日食ビュー",
        helio_link_earth: "地球 3Dビュー",
        helio_link_moon: "月 3Dビュー",
        helio_link_saturn: "土星 3Dビュー",
        badge_simulations: "シミュレーション",

        money_title: "金融・税務ツール",
        money_desc: "金融計算機、歴代の税率ブラケット、および連邦予算シミュレーター。",
        money_link_mortgage: "住宅ローン償却スケジュール",
        money_link_budget: "連邦予算シミュレーター",
        money_link_taxes: "米国連邦税計算機",
        money_link_historical: "歴代税率の比較",
        money_link_ss: "社会保障年金計算機",
        tech_financial_modeling: "金融モデリング",
        badge_tool_suite: "ツールスイート",

        image_title: "画像・メディア処理",
        image_desc: "インタラクティブな写真レイアウトスタジオ、グリッド生成、ブラウザメディアツール。",
        image_link_videostudio: "VideoStudio メディアエディター",
        image_link_photocollage: "PhotoCollage グリッドスタジオ",
        image_link_python_orig: "Pythonで書かれた旧PhotoCollage",
        tech_layout_algorithms: "レイアウトアルゴリズム",
        badge_creative_studio: "クリエイティブ",

        plants_title: "植物科学エクスプローラー",
        plants_desc: "植物の種、特徴、生息地を詳しく解説するインタラクティブな植物図鑑。",
        plants_link_explorer: "植物エクスプローラー表示",
        plants_link_metric: "植物エクスプローラー（グリッド＆メートル法）",
        tech_interactive_ui: "インタラクティブ UI",
        tech_botanical_data: "植物データ",
        badge_explorer: "エクスプローラー",

        puzzles_title: "ロジック＆ワードパズル",
        puzzles_desc: "難易度調整が可能なロジックグリッド、単語パズル、ジグソーパズル、絵文字チャレンジ。",
        puzzles_link_linguistics: "言語メカニクス単語パズル",
        puzzles_link_jigsaw: "ジグソーパズルスタジオ",
        puzzles_link_emoji: "絵文字マッチゲーム",
        puzzles_link_sudoku9: "中級数独 (9x9)",
        puzzles_link_sudoku12: "特大ハード数独 (12x12)",
        tech_game_logic: "ゲームロジック",
        badge_puzzle_game: "パズルゲーム",

        footer_text: "GitHub Pages でホスト • blendpy/vibe-web-dev",
        lang_modal_title: "言語を選択",
        lang_open_page: "言語ページを開く ↗",
        lang_missing_hint: "未翻訳の項目は赤色の英語で表示されます。",
        demo_modal_title: "メディア＆スライドショーデモの読み込み",
        btn_close: "閉じる",
        btn_cancel: "キャンセル",
        btn_save: "保存"
    },

    ko: {
        app_title: "Vibe 웹 개발",
        nav_language: "언어",
        nav_brief: "간략 보기",
        nav_github_source: "GitHub 소스 코드",

        helio_title: "Helio 태양계 시뮬레이터",
        helio_desc: "행성 궤도, 혜성 및 일식을 포함한 대화형 3D 태양계 시각화 도구입니다.",
        helio_link_solar: "태양계 전체 보기",
        helio_link_eclipse: "2027년 개기일식 보기",
        helio_link_earth: "지구 3D 보기",
        helio_link_moon: "달 3D 보기",
        helio_link_saturn: "토성 3D 보기",
        badge_simulations: "시뮬레이션",

        money_title: "금융 및 세금 도구",
        money_desc: "금융 계산기, 연도별 세율표 및 연방 예산 시뮬레이터.",
        money_link_mortgage: "모기지 상환 스케줄러",
        money_link_budget: "연방 예산 시뮬레이터",
        money_link_taxes: "미국 연방세 계산기",
        money_link_historical: "역대 세율 비교",
        money_link_ss: "사회보장연금 계산기",
        tech_financial_modeling: "금융 모델링",
        badge_tool_suite: "도구 모음",

        image_title: "이미지 및 미디어 처리",
        image_desc: "대화형 사진 레이아웃 스튜디오, 그리드 생성기 및 브라우저 미디어 도구.",
        image_link_videostudio: "VideoStudio 미디어 편집기",
        image_link_photocollage: "PhotoCollage 그리드 스튜디오",
        image_link_python_orig: "Python으로 작성된 구버전 PhotoCollage",
        tech_layout_algorithms: "레이아웃 알고리즘",
        badge_creative_studio: "크리에이티브 스튜디오",

        plants_title: "식물 과학 탐색기",
        plants_desc: "식물 종, 특성 및 서식지를 자세히 다루는 대화형 식물 가이드.",
        plants_link_explorer: "식물 탐색기 보기",
        plants_link_metric: "식물 탐색기 (그리드 및 미터법)",
        tech_interactive_ui: "대화형 UI",
        tech_botanical_data: "식물 데이터",
        badge_explorer: "탐색기",

        puzzles_title: "논리 및 단어 퍼즐",
        puzzles_desc: "맞춤형 난이도를 갖춘 논리 그리드, 단어 퍼즐, 직소 퍼즐 및 이모지 챌린지.",
        puzzles_link_linguistics: "언어 역학 단어 퍼즐",
        puzzles_link_jigsaw: "직소 퍼즐 스튜디오",
        puzzles_link_emoji: "이모지 매치 게임",
        puzzles_link_sudoku9: "중급 스도쿠 (9x9)",
        puzzles_link_sudoku12: "초대형 고급 스도쿠 (12x12)",
        tech_game_logic: "게임 로직",
        badge_puzzle_game: "퍼즐 게임",

        footer_text: "GitHub Pages에서 호스팅됨 • blendpy/vibe-web-dev",
        lang_modal_title: "언어 선택",
        lang_open_page: "언어 페이지 열기 ↗",
        lang_missing_hint: "누락된 번역은 빨간색 영어로 표시됩니다.",
        demo_modal_title: "미디어 및 슬라이드쇼 데모 불러오기",
        btn_close: "닫기",
        btn_cancel: "취소",
        btn_save: "저장"
    },

    ru: {
        app_title: "Vibe Web Dev",
        nav_language: "Язык",
        nav_brief: "Кратко",
        nav_github_source: "Исходный код GitHub",

        helio_title: "Солнечная система Helio",
        helio_desc: "Интерактивная 3D-визуализация гелиоцентрической Солнечной системы с орбитами планет, кометами и затмениями.",
        helio_link_solar: "Вид Солнечной системы",
        helio_link_eclipse: "Солнечное затмение 2027",
        helio_link_earth: "3D-вид Земли",
        helio_link_moon: "3D-вид Луны",
        helio_link_saturn: "3D-вид Сатурна",
        badge_simulations: "Симуляции",

        money_title: "Финансы и налоги",
        money_desc: "Финансовые калькуляторы, исторические налоговые шкалы и симуляторы бюджета.",
        money_link_mortgage: "Амортизация ипотеки",
        money_link_budget: "Симулятор федерального бюджета",
        money_link_taxes: "Налоговый калькулятор США",
        money_link_historical: "Историческое сравнение налогов",
        money_link_ss: "Калькулятор соцобеспечения",
        tech_financial_modeling: "Финансовое моделирование",
        badge_tool_suite: "Набор инструментов",

        image_title: "Обработка изображений",
        image_desc: "Интерактивные фотостудии, генераторы сеток и браузерные медиа-инструменты.",
        image_link_videostudio: "Медиаредактор VideoStudio",
        image_link_photocollage: "Фотоколлаж-студия",
        image_link_python_orig: "СТАРЫЙ PhotoCollage, написанный на Python",
        tech_layout_algorithms: "Алгоритмы компоновки",
        badge_creative_studio: "Творческая студия",

        plants_title: "Ботанический исследователь",
        plants_desc: "Интерактивный ботанический справочник с описанием видов растений, их характеристик и среды обитания.",
        plants_link_explorer: "Ботанический обзор",
        plants_link_metric: "Ботанический обзор (сетка и метрика)",
        tech_interactive_ui: "Интерактивный UI",
        tech_botanical_data: "Ботанические данные",
        badge_explorer: "Исследователь",

        puzzles_title: "Логические и словесные игры",
        puzzles_desc: "Интерактивные логические сетки, словесные головоломки, пазлы и эмодзи-игры.",
        puzzles_link_linguistics: "Лингвистическая головоломка",
        puzzles_link_jigsaw: "Студия пазлов Jigsaw",
        puzzles_link_emoji: "Игра «Найди пару эмодзи»",
        puzzles_link_sudoku9: "Среднее судоку (9x9)",
        puzzles_link_sudoku12: "Гигантское сложное судоку (12x12)",
        tech_game_logic: "Игровая логика",
        badge_puzzle_game: "Головоломка",

        footer_text: "Размещено на GitHub Pages • blendpy/vibe-web-dev",
        lang_modal_title: "Выберите язык",
        lang_open_page: "Открыть страницу языков ↗",
        lang_missing_hint: "Отсутствующие переводы отображаются на английском красным цветом.",
        demo_modal_title: "Загрузить медиа-демо",
        btn_close: "Закрыть",
        btn_cancel: "Отмена",
        btn_save: "Сохранить"
    }
};

window.initIndexTranslations = function () {
    // Share the same localStorage key as languages.html
    const STORAGE_KEY = 'photocollage_lang';

    // 1. Check if ?lang= was passed in the URL query string from languages.html
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');

    let selectedLangCode = 'auto';
    try {
        if (urlLang) {
            selectedLangCode = urlLang.toLowerCase();
            if (selectedLangCode === 'auto') {
                localStorage.removeItem(STORAGE_KEY);
            } else {
                localStorage.setItem(STORAGE_KEY, selectedLangCode);
            }
        } else {
            selectedLangCode = localStorage.getItem(STORAGE_KEY) || 'auto';
        }
    } catch (_) {
        if (urlLang) selectedLangCode = urlLang.toLowerCase();
    }

    function resolveLanguageCode(code) {
        if (code && code !== 'auto') {
            return window.INDEX_TRANSLATIONS[code] ? code : 'en';
        }
        const navLang = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en')
            .slice(0, 2)
            .toLowerCase();
        return window.INDEX_TRANSLATIONS[navLang] ? navLang : 'en';
    }

    function applyTranslations(langChoice) {
        selectedLangCode = langChoice;
        const activeLang = resolveLanguageCode(langChoice);
        const hasTranslation = Boolean(
            langChoice === 'auto' ||
            langChoice === 'en' ||
            window.INDEX_TRANSLATIONS[langChoice]
        );

        const dict = (hasTranslation && window.INDEX_TRANSLATIONS[activeLang]) || {};
        const fallbackDict = window.INDEX_TRANSLATIONS.en;

        document.documentElement.lang = activeLang;

        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (hasTranslation && dict[key] !== undefined && dict[key] !== '') {
                el.textContent = dict[key];
                el.classList.remove('i18n-missing');
                el.removeAttribute('title');
            } else if (fallbackDict[key] !== undefined) {
                // English fallback with red styling if an untranslated language was chosen in languages.html
                el.textContent = fallbackDict[key];
                if (!hasTranslation) {
                    el.classList.add('i18n-missing');
                    el.setAttribute('title', `No [${langChoice}] translation available — showing English`);
                } else {
                    el.classList.remove('i18n-missing');
                }
            }
        });

        // Update the Language button label and ensure all Language links carry ?from=index&lang=...
        const langLabel = document.getElementById('current-lang-label');
        if (langLabel) {
            const baseText = (hasTranslation && dict.nav_language) ? dict.nav_language : fallbackDict.nav_language;
            const codeBadge = langChoice === 'auto' ? `AUTO (${activeLang.toUpperCase()})` : langChoice.toUpperCase();
            langLabel.textContent = `${baseText}: ${codeBadge}`;
        }

        const langLinks = document.querySelectorAll('.lang-page-link');
        langLinks.forEach(link => {
            link.href = `./languages.html?from=index&lang=${encodeURIComponent(langChoice)}`;
        });
    }

    // Wire up #btn-language-modal if present so clicking it also navigates directly to languages.html
    const btnLangModal = document.getElementById('btn-language-modal');
    if (btnLangModal) {
        btnLangModal.addEventListener('click', () => {
            window.location.href = `./languages.html?from=index&lang=${encodeURIComponent(selectedLangCode)}`;
        });
    }

    applyTranslations(selectedLangCode);
};

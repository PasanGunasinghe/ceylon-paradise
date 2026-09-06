import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const ThemeContext = createContext(null);

export const dictionaries = {
  en: {
    home: 'Home', destinations: 'Destinations', destinationsTours: 'Destinations & Tours', tours: 'Tours', mapPlanner: 'Map Planner', gallery: 'Gallery', about: 'About', contact: 'Contact', categories: 'Categories', signIn: 'Sign In', register: 'Register', adminLogin: 'Admin Login', adminPanel: 'Admin Panel', dashboard: 'Dashboard', logout: 'Logout', discoverCeylon: 'Discover the soul of Sri Lanka.', exploreTours: 'Explore tours', viewDestinations: 'View destinations', premiumEscapes: 'Premium escapes', travelMoments: 'Travel moments', routePlanner: 'Route planner', buildItinerary: 'Build your Ceylon itinerary', routeSubtitle: 'Map your ideal route through heritage trails, scenic highlands, and coastal charms.', browseAll: 'Browse all destinations', noMemories: 'No pinned memories available yet.', noInquiries: 'No incoming inquiries yet.', mapPinEditor: 'Map Pinning Editor',
  },
  de: {
    home: 'Startseite', destinations: 'Reiseziele', tours: 'Touren', mapPlanner: 'Routenplaner', gallery: 'Galerie', about: 'Über uns', contact: 'Kontakt', categories: 'Kategorien', signIn: 'Anmelden', register: 'Registrieren', adminLogin: 'Admin-Anmeldung', adminPanel: 'Admin-Bereich', dashboard: 'Dashboard', logout: 'Abmelden', discoverCeylon: 'Entdecke die Seele Sri Lankas.', exploreTours: 'Touren entdecken', viewDestinations: 'Ziele ansehen', premiumEscapes: 'Premium-Ausflüge', travelMoments: 'Reiseerlebnisse', routePlanner: 'Routenplaner', buildItinerary: 'Baue deine Ceylon-Reiseroute', routeSubtitle: 'Plane deine perfekte Route durch Kulturerbe, Berglandschaften und Küstenidyllen.', browseAll: 'Alle Ziele anzeigen', noMemories: 'Noch keine gespeicherten Erinnerungen.', noInquiries: 'Noch keine Anfragen vorhanden.', mapPinEditor: 'Karten-Pin-Editor',
  },
  fr: {
    home: 'Accueil', destinations: 'Destinations', tours: 'Séjours', mapPlanner: 'Plan de voyage', gallery: 'Galerie', about: 'À propos', contact: 'Contact', categories: 'Catégories', signIn: 'Connexion', register: 'Créer un compte', adminLogin: 'Connexion admin', adminPanel: 'Panneau admin', dashboard: 'Tableau de bord', logout: 'Déconnexion', discoverCeylon: 'Découvrez l’âme du Sri Lanka.', exploreTours: 'Découvrir les voyages', viewDestinations: 'Voir les destinations', premiumEscapes: 'Escapes premium', travelMoments: 'Souvenirs de voyage', routePlanner: 'Planificateur de route', buildItinerary: 'Créez votre itinéraire à Ceylan', routeSubtitle: 'Construisez votre itinéraire idéal entre sites historiques, montagnes et plages.', browseAll: 'Voir toutes les destinations', noMemories: 'Aucune histoire épinglée pour le moment.', noInquiries: 'Aucune demande reçue pour le moment.', mapPinEditor: 'Éditeur de points de carte',
  },
  ru: {
    home: 'Главная', destinations: 'Направления', tours: 'Туры', mapPlanner: 'Планировщик маршрута', gallery: 'Галерея', about: 'О нас', contact: 'Контакты', categories: 'Категории', signIn: 'Войти', register: 'Регистрация', adminLogin: 'Вход администратора', adminPanel: 'Панель администратора', dashboard: 'Панель', logout: 'Выйти', discoverCeylon: 'Откройте душу Шри-Ланки.', exploreTours: 'Исследовать туры', viewDestinations: 'Смотреть направления', premiumEscapes: 'Премиальные маршруты', travelMoments: 'Путешествия', routePlanner: 'Планировщик маршрута', buildItinerary: 'Составьте маршрут по Шри-Ланке', routeSubtitle: 'Планируйте идеальный маршрут через исторические места, горы и побережье.', browseAll: 'Все направления', noMemories: 'Записей пока нет.', noInquiries: 'Пока нет входящих запросов.', mapPinEditor: 'Редактор меток карты',
  },
  ja: {
    home: 'ホーム', destinations: '目的地', tours: 'ツアー', mapPlanner: 'マッププランナー', gallery: 'ギャラリー', about: '紹介', contact: 'お問い合わせ', categories: 'カテゴリ', signIn: 'サインイン', register: '登録', adminLogin: '管理者ログイン', adminPanel: '管理者パネル', dashboard: 'ダッシュボード', logout: 'ログアウト', discoverCeylon: 'スリランカの魅力を発見しよう。', exploreTours: 'ツアーを見る', viewDestinations: '目的地を見る', premiumEscapes: 'プレミアム体験', travelMoments: '旅行の思い出', routePlanner: 'ルートプランナー', buildItinerary: 'セイロンの旅程を組み立てる', routeSubtitle: '歴史的な街、山々、海辺を巡る理想のルートを作成できます。', browseAll: 'すべての目的地を見る', noMemories: 'まだピン留めされた思い出はありません。', noInquiries: '新しい問い合わせはまだありません。', mapPinEditor: '地図ピン編集',
  },
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('cp-theme') || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('cp-language') || 'en');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('cp-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('cp-language', language);
  }, [language]);

  const value = useMemo(() => ({ theme, setTheme, language, setLanguage, t: dictionaries[language] || dictionaries.en }), [theme, language]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
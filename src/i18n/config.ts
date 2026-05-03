import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import your locale files
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import zh from './locales/zh.json';
import hi from './locales/hi.json';
import ja from './locales/ja.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  zh: { translation: zh },
  hi: { translation: hi },
  ja: { translation: ja },
};

// 🌍 Native Language Detection (No localStorage/navigator)
const getDeviceLanguage = (): string => {
  try {
    const locales = Localization.getLocales();
    const deviceLang = (locales && locales.length > 0) ? locales[0].languageCode : 'en';

    if (deviceLang && Object.keys(resources).includes(deviceLang)) {
      return deviceLang;
    }
    return 'en';
  } catch (error) {
    return 'en';
  }
};

// 🚀 i18next Initialization
i18n
  .use(initReactI18next)
  .init({
    // ✅ FIX: Setting this to 'v4' resolves the TS2769 error
    compatibilityJSON: 'v4', 
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, 
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;

// ✅ Nothing Missing: Your original language metadata
export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];
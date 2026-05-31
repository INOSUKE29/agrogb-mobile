import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

// Dicionários
import ptBR from './pt-BR.json';
import enUS from './en-US.json';

const resources = {
  'pt-BR': { translation: ptBR },
  'pt-PT': { translation: ptBR },
  'pt': { translation: ptBR },
  'en-US': { translation: enUS },
  'en': { translation: enUS }
};

// Detecção do idioma do aparelho
const deviceLanguage = getLocales()[0]?.languageTag || 'pt-BR';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: deviceLanguage,
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false // React already safes from xss
    }
  });

export default i18n;

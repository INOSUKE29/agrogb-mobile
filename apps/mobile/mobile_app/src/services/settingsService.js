import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
export const STORAGE_KEYS = {
    THEME: '@agrogb:theme',
    FARM_NAME: '@agrogb:farm_name',
    FARM_AREA: '@agrogb:farm_area',
    CURRENT_SEASON: '@agrogb:current_season',
    DEFAULT_UNIT: '@agrogb:default_unit',
    CURRENCY: '@agrogb:currency',
    LOSS_UNIT: '@agrogb:loss_unit',
    SALES_UNIT: '@agrogb:sales_unit',
    SHOW_CHARTS: '@agrogb:show_charts',
    AUTO_PDF: '@agrogb:auto_pdf',
    NOTIFY_LOW_STOCK: '@agrogb:notify_low_stock',
    NOTIFY_LOSS: '@agrogb:notify_loss',
    NOTIFY_APPLICATION: '@agrogb:notify_application',
    NOTIFY_HARVEST: '@agrogb:notify_harvest',
    GOOGLE_AUTH: '@agrogb:google_auth',
    BIOMETRIC_AUTH: '@agrogb:biometric_auth',
    WEATHER_API_KEY: '@agrogb:weather_api_key',
    WEATHER_CITY: '@agrogb:weather_city',
    WEATHER_USE_GPS: '@agrogb:weather_use_gps'
};

// Default Values
const DEFAULTS = {
    farm_name: '',
    farm_area: '',
    current_season: '2025/2026',
    default_unit: 'KG',
    currency: 'R$',
    loss_unit: 'KG',
    sales_unit: 'CX',
    show_charts: true,
    auto_pdf: false,
    notify_low_stock: true,
    notify_loss: true,
    notify_application: true,
    notify_harvest: true,
    google_auth: false,
    biometric_auth: false,
    weather_api_key: '5a6875971488c5d20775d7b8764b85c8',
    weather_city: '',
    weather_use_gps: true
};

// Save Setting
export const saveSetting = async (key, value) => {
    try {
        const storageKey = STORAGE_KEYS[key.toUpperCase()];
        if (!storageKey) {
            console.warn(`Unknown setting key: ${key}`);
            return false;
        }

        const stringValue = typeof value === 'boolean' ? JSON.stringify(value) : String(value);
        await AsyncStorage.setItem(storageKey, stringValue);
        return true;
    } catch (e) {
        console.error('Error saving setting:', e);
        return false;
    }
};

// Load Setting
export const loadSetting = async (key) => {
    try {
        const storageKey = STORAGE_KEYS[key.toUpperCase()];
        if (!storageKey) {
            return DEFAULTS[key] ?? null;
        }

        const value = await AsyncStorage.getItem(storageKey);

        if (value === null) {
            return DEFAULTS[key] ?? null;
        }

        // Try to parse as JSON (for booleans)
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    } catch (e) {
        console.error('Error loading setting:', e);
        return DEFAULTS[key] ?? null;
    }
};

// Load All Settings
export const loadAllSettings = async () => {
    const settings = {};

    for (const key of Object.keys(DEFAULTS)) {
        settings[key] = await loadSetting(key);
    }

    return settings;
};

// Reset All Settings
export const resetAllSettings = async () => {
    try {
        const keys = Object.values(STORAGE_KEYS);
        await AsyncStorage.multiRemove(keys);
        return true;
    } catch (e) {
        console.error('Error resetting settings:', e);
        return false;
    }
};

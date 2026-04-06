import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

/**
 * StorageHelper — Cross-platform persistent storage
 * v1.2.0: Automatically switches between SecureStore (Native) and AsyncStorage (Web)
 */
export const StorageHelper = {
    async save(key, value) {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            if (isWeb) {
                await AsyncStorage.setItem(key, stringValue);
            } else {
                // Correct SecureStore method
                await SecureStore.setItemAsync(key, stringValue);
            }
            return true;
        } catch (e) {
            console.error(`[StorageHelper] SAVE_ERROR (${key}):`, e.message);
            return false;
        }
    },

    async get(key) {
        try {
            let data = null;
            if (isWeb) {
                data = await AsyncStorage.getItem(key);
            } else {
                // Correct SecureStore method
                data = await SecureStore.getItemAsync(key);
            }
            
            if (!data) return null;
            
            try {
                return JSON.parse(data);
            } catch {
                return data; // Return as string if not JSON
            }
        } catch (e) {
            console.error(`[StorageHelper] GET_ERROR (${key}):`, e.message);
            return null;
        }
    },

    async remove(key) {
        try {
            if (isWeb) {
                await AsyncStorage.removeItem(key);
            } else {
                await SecureStore.deleteItemAsync(key);
            }
            return true;
        } catch (e) {
            console.error(`[StorageHelper] REMOVE_ERROR (${key}):`, e.message);
            return false;
        }
    }
};

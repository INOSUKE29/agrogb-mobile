import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * StorageHelper - Auxiliar de Armazenamento Local 📦💾
 * Abstrai operações comuns do AsyncStorage com tratamento de erros integrado
 * e resiliência a falhas de serialização.
 */
export const StorageHelper = {
    /**
     * Recupera um valor do armazenamento
     */
    get: async (key) => {
        try {
            return await AsyncStorage.getItem(key);
        } catch (error) {
            console.error(`[StorageHelper] Erro ao buscar chave ${key}:`, error);
            return null;
        }
    },

    /**
     * Salva um valor no armazenamento
     */
    save: async (key, value) => {
        try {
            await AsyncStorage.setItem(key, String(value));
            return true;
        } catch (error) {
            console.error(`[StorageHelper] Erro ao salvar chave ${key}:`, error);
            return false;
        }
    },

    /**
     * Remove uma chave do armazenamento
     */
    remove: async (key) => {
        try {
            await AsyncStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`[StorageHelper] Erro ao remover chave ${key}:`, error);
            return false;
        }
    }
};

import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";
import { checkLogin as checkDbLogin, insertUsuario } from '../database/database';

const SECRET_KEY = "AGROGB_SECURE_KEY_V1";

// --- STORAGE HELPERS ---
const safeSave = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error("SECURE_STORAGE_SAVE_ERROR:", e);
    }
};

const safeGet = async (key) => {
    try {
        const data = await AsyncStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("SECURE_STORAGE_GET_ERROR:", e);
        return null;
    }
};

const safeRemove = async (key) => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (e) {
        console.error("SECURE_STORAGE_REMOVE_ERROR:", e);
    }
};

const generateRecoveryCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// --- AUTH FUNCTIONS ---

export const register = async (userData) => {
    try {
        console.log('[AuthService] Registering user:', userData.user);

        // 1. Prepare Data for SQLite
        const newUser = {
            usuario: userData.user,
            senha: userData.password,
            nivel: 'USUARIO',
            nome_completo: userData.nome || userData.user,
            telefone: userData.telefone || '',
            endereco: '',
            provider: 'local'
        };

        // 2. Insert into SQLite
        await insertUsuario(newUser);

        // 3. Generate Recovery Code
        return generateRecoveryCode();

    } catch (e) {
        console.error("REGISTER_ERROR:", e);
        throw e;
    }
};

export const login = async (user, password) => {
    try {
        console.log(`[AuthService] Attempting login for: ${user}`);

        // 1. ADMIN BYPASS (Emergency)
        if (user.toUpperCase() === 'ADMIN' && password === '1234') {
            await safeSave("session", { user: 'ADMIN', role: 'ADMIN' });
            return { success: true };
        }

        // 2. CHECK SQLITE DATABASE (Primary)
        try {
            const dbUser = await checkDbLogin(user, password);
            if (dbUser) {
                await safeSave("session", {
                    user: dbUser.usuario,
                    role: dbUser.nivel,
                    userId: dbUser.id
                });
                await safeSave("agro_user", { user: dbUser.usuario, locked: false, attempts: 0 }); // Offline Cache
                return { success: true };
            }
        } catch (dbError) {
            console.error('[AuthService] Database check failed:', dbError);
        }

        // 3. FALLBACK: LOCAL STORAGE (Legacy)
        const data = await safeGet("agro_user");
        if (data && data.user === user) {
            const bytes = CryptoJS.AES.decrypt(data.password, SECRET_KEY);
            const original = bytes.toString(CryptoJS.enc.Utf8);
            if (original === password) {
                await safeSave("session", { user });
                return { success: true };
            }
        }

        return { success: false, message: "Usuário ou senha incorretos." };

    } catch (e) {
        console.error("LOGIN_ERROR:", e);
        return { success: false, message: "Erro interno no Login." };
    }
};

export const logout = async () => {
    await safeRemove("session");
};

export const checkSession = async () => {
    return await safeGet("session");
};

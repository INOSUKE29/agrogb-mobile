import CryptoJS from "crypto-js";
import { save, get, remove } from "../storage/secureStorage";

const SECRET_KEY = "AGROGB_SECURE_KEY_V1";
const MAX_ATTEMPTS = 5;

export const register = async (user, password) => {
    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();

    const encrypted = CryptoJS.AES.encrypt(password, SECRET_KEY).toString();

    const payload = {
        user,
        password: encrypted,
        recoveryCode,
        attempts: 0,
        locked: false,
        createdAt: new Date()
    };

    await save("agro_user", payload);

    return recoveryCode;
};

export const login = async (user, password) => {
    // 1. ADMIN BYPASS
    if (user.toUpperCase() === 'ADMIN' && password === '1234') {
        await save("session", { user: 'ADMIN', role: 'ADMIN' });
        return { success: true };
    }

    const data = await get("agro_user");
    if (!data) return { success: false, message: "Usuário não encontrado" };

    if (data.locked)
        return { success: false, message: "Conta bloqueada" };

    const bytes = CryptoJS.AES.decrypt(data.password, SECRET_KEY);
    const original = bytes.toString(CryptoJS.enc.Utf8);

    if (data.user === user && original === password) {
        data.attempts = 0;
        await save("agro_user", data);
        await save("session", { user });
        return { success: true };
    }

    data.attempts++;

    if (data.attempts >= MAX_ATTEMPTS) {
        data.locked = true;
    }

    await save("agro_user", data);

    return {
        success: false,
        message:
            data.attempts >= MAX_ATTEMPTS
                ? "Conta bloqueada por segurança"
                : `Tentativa ${data.attempts}/${MAX_ATTEMPTS}`
    };
};

export const logout = async () => {
    await remove("session");
};

export const checkSession = async () => {
    return await get("session");
};

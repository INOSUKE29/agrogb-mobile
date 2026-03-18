import { executeQuery } from '../database/database';

const log = (msg) => {
    if (__DEV__) console.log(`[AgroGB] ${msg}`);
};

export const Logger = {
    info: (msg) => log(msg),
    warn: (msg) => {
        if (__DEV__) console.warn(`[AgroGB WARN] ${msg}`);
    },
    error: async (msg, stack = '') => {
        console.error(`[AgroGB ERROR] ${msg}`);
        try {
            const timestamp = new Date().toISOString();
            await executeQuery(
                `INSERT INTO error_logs (data, created_at, tela, erro, stack, sync_status) VALUES (?, ?, ?, ?, ?, ?)`,
                [timestamp, timestamp, 'Global', msg, stack, 0]
            );
        } catch {
            log('Falha ao persistir log de erro');
        }
    },
    debug: (msg) => {
        if (__DEV__) log(`DEBUG: ${msg}`);
    }
};

export default Logger;

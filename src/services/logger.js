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
            await executeQuery(
                `INSERT INTO error_logs (data, tela, erro, stack, sync_status) VALUES (?, ?, ?, ?, ?)`,
                [new Date().toISOString(), 'Global', msg, stack, 0]
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

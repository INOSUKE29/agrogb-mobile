import * as SQLite from 'expo-sqlite';

let db = null;

export const initConnection = async () => {
    try {
        db = SQLite.openDatabase('agrogb_mobile.db');
        console.log('✅ [Core] Banco de dados conectado (SDK 50)');
        return db;
    } catch (error) {
        console.error('❌ [Core] Erro ao conectar banco:', error);
        throw error;
    }
};

export const getConnection = () => {
    if (!db) {
        throw new Error('Banco de dados não inicializado. Chame initConnection() primeiro.');
    }
    return db;
};

export const executeQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        if (!db) {
            console.error('❌ [Core] Banco não inicializado para query');
            reject(new Error('Banco não inicializado'));
            return;
        }
        db.transaction(tx => {
            tx.executeSql(
                sql,
                params,
                (_, result) => resolve(result),
                (_, error) => {
                    console.error('❌ [Core] Erro SQL:', sql, error);
                    reject(error);
                }
            );
        });
    });
};

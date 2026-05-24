import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import SyncService from '../services/SyncService';

const SyncContext = createContext();

export const SyncProvider = ({ children }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState(null);
    const [syncLogs, setSyncLogs] = useState([]);
    const [error, setError] = useState(null);

    const addLog = useCallback((msg) => {
        const timestamp = new Date().toLocaleTimeString();
        setSyncLogs(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 50));
    }, []);

    useEffect(() => {
        // Subscrever ao status do SyncService
        const unsubscribe = SyncService.subscribe((status) => {
            setIsSyncing(status);
            if (status === false) {
                setLastSync(new Date().toISOString());
                addLog('Sincronização concluída.');
            } else {
                addLog('Iniciando sincronização automática...');
                setError(null);
            }
        });

        // Iniciar o serviço
        const stopAutoSync = SyncService.startAutoSync();

        return () => {
            unsubscribe();
            if (stopAutoSync) stopAutoSync();
        };
    }, [addLog]);

    const performManualSync = async () => {
        if (isSyncing) return;
        addLog('Disparando sincronização manual...');
        try {
            await SyncService.performSync();
        } catch (err) {
            setError(err.message);
            addLog(`Erro: ${err.message}`);
        }
    };

    return (
        <SyncContext.Provider value={{ 
            isSyncing, 
            lastSync, 
            syncLogs, 
            error, 
            performManualSync 
        }}>
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => {
    const context = useContext(SyncContext);
    if (!context) {
        throw new Error('useSync deve ser usado dentro de um SyncProvider');
    }
    return context;
};

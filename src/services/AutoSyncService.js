/**
 * AutoSyncService — Sincronização automática em background
 *
 * Funciona com 3 gatilhos:
 * 1. Ao abrir o app (imediato)
 * 2. A cada 2 minutos enquanto o app estiver aberto (polling)
 * 3. Ao salvar qualquer dado (chamado pelas telas via triggerSync)
 *
 * Uso:
 *   import AutoSyncService from '../services/AutoSyncService';
 *   AutoSyncService.start();   // no App.js
 *   AutoSyncService.stop();    // opcional
 *   AutoSyncService.trigger(); // após salvar dados
 */

import { syncAll } from './supabase';
import NetInfo from '@react-native-community/netinfo';

const SYNC_INTERVAL_MS = 2 * 60 * 1000; // 2 minutos
const DEBOUNCE_MS = 3000; // aguarda 3s após último trigger para evitar spam

class AutoSyncService {
    constructor() {
        this._interval = null;
        this._debounceTimer = null;
        this._isSyncing = false;
        this._listeners = [];
        this._lastSync = null;
    }

    // Inicia o serviço de auto-sync
    start() {
        if (this._interval) return; // já iniciado

        console.log('🔁 AutoSyncService: iniciado');

        // Sync imediato ao iniciar
        this._runSync();

        // Sync a cada 2 minutos
        this._interval = setInterval(() => {
            this._runSync();
        }, SYNC_INTERVAL_MS);
    }

    // Para o serviço
    stop() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
        }
        console.log('⏹ AutoSyncService: parado');
    }

    // Gatilho manual — chame após salvar dados
    // Usa debounce para evitar múltiplos syncs em sequência rápida
    trigger() {
        if (this._debounceTimer) clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => {
            this._runSync();
        }, DEBOUNCE_MS);
    }

    // Retorna há quantos segundos foi o último sync bem-sucedido
    getLastSyncAge() {
        if (!this._lastSync) return null;
        return Math.round((Date.now() - this._lastSync) / 1000);
    }

    // Registra listener para ser notificado sobre status do sync
    // callback(status: 'syncing' | 'done' | 'offline' | 'error')
    addListener(callback) {
        this._listeners.push(callback);
        return () => {
            this._listeners = this._listeners.filter(l => l !== callback);
        };
    }

    _notify(status) {
        this._listeners.forEach(fn => {
            try { fn(status); } catch (e) { }
        });
    }

    async _runSync() {
        if (this._isSyncing) return; // evita execuções paralelas

        // Verifica conectividade primeiro
        try {
            const net = await NetInfo.fetch();
            if (!net.isConnected) {
                console.log('📴 AutoSync: sem internet, pulando...');
                this._notify('offline');
                return;
            }
        } catch (e) { /* se NetInfo falhar, tenta mesmo assim */ }

        this._isSyncing = true;
        this._notify('syncing');

        try {
            await syncAll();
            this._lastSync = Date.now();
            this._notify('done');
            console.log('✅ AutoSync: concluído');
        } catch (e) {
            console.log('❌ AutoSync: erro -', e.message || e);
            this._notify('error');
        } finally {
            this._isSyncing = false;
        }
    }
}

// Singleton global
export default new AutoSyncService();

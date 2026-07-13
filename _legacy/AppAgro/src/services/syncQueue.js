import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@agrogb_sync_queue';

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export const addToQueue = async (operationData) => {
    try {
        const queueString = await AsyncStorage.getItem(QUEUE_KEY);
        const queue = queueString ? JSON.parse(queueString) : [];
        
        const newEvent = {
            id: generateUUID(),
            timestamp: new Date().toISOString(),
            status: 'PENDING', // ☁️ PENDING, 🔄 SYNCING, ✅ DONE
            payload: operationData
        };
        
        queue.unshift(newEvent); // Adiciona no topo para a lista de recentes ficar correta
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        return newEvent;
    } catch (e) {
        console.error("Erro ao salvar no AsyncStorage (Offline)", e);
        return null;
    }
};

export const getQueue = async () => {
    try {
        const queueString = await AsyncStorage.getItem(QUEUE_KEY);
        return queueString ? JSON.parse(queueString) : [];
    } catch (e) {
        return [];
    }
};

export const getPendingCount = async () => {
    const q = await getQueue();
    return q.filter(item => item.status === 'PENDING').length;
};

// Motor simulado de Sincronização em Background
export const processSyncEngine = async (onUpdateCallback) => {
    const queue = await getQueue();
    if (queue.length === 0) return;

    let hasChanges = false;
    
    for (let i = 0; i < queue.length; i++) {
        if (queue[i].status === 'PENDING') {
            queue[i].status = 'SYNCING';
            hasChanges = true;
        }
    }

    if (hasChanges) {
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
        if (onUpdateCallback) onUpdateCallback(queue);
        
        // Simula o tempo de upload na nuvem (Supabase) via 4G instável (1.5 segundos)
        setTimeout(async () => {
            const currentQueue = await getQueue();
            for (let i = 0; i < currentQueue.length; i++) {
                if (currentQueue[i].status === 'SYNCING') {
                    currentQueue[i].status = 'DONE';
                }
            }
            await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(currentQueue));
            if (onUpdateCallback) onUpdateCallback(currentQueue);
        }, 1500);
    }
};

export const clearSyncQueue = async () => {
    await AsyncStorage.removeItem(QUEUE_KEY);
};

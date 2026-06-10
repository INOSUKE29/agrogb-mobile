import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { executeQuery } from '../../database/database';
import { SyncWorker } from '../../services/SyncWorker';

export default function SyncStatusWidget() {
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const checkQueue = async () => {
            try {
                const res = await executeQuery("SELECT count(*) as total FROM sync_outbox WHERE status = 'PENDENTE' OR status = 'FALHA'");
                if (res && res.rows && res.rows.length > 0) {
                    setPendingCount(res.rows.item(0).total);
                }
            } catch (e) { }
        };
        
        checkQueue();
        const interval = setInterval(checkQueue, 3000);
        return () => clearInterval(interval);
    }, []);

    if (pendingCount === 0) return null;

    return (
        <TouchableOpacity 
            style={styles.container}
            onPress={() => {
                console.log('Forçando sincronização manual...');
                SyncWorker.run();
            }}
        >
            <Ionicons name="cloud-offline" size={24} color="#FFF" />
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        right: 20,
        backgroundColor: 'rgba(239, 68, 68, 0.9)', // Red alert for offline data
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        zIndex: 9999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#111827',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#EF4444',
        paddingHorizontal: 4
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900'
    }
});

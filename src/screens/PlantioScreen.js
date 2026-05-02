import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, StatusBar, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getCulturas, getLavourasAtivas } from '../database/database';

export default function PlantioScreen({ navigation }) {
    const [view, setView] = useState('LIST');
    const [lavouras, setLavouras] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadLavouras = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getLavourasAtivas();
            setLavouras(data || []);
        } catch { setLavouras([]); }
        finally { setLoading(false); }
    }, []);

    useFocusEffect(useCallback(() => { loadLavouras(); }, [loadLavouras]));

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#065F46', '#047857', '#F3F4F6', '#FFFFFF']} style={StyleSheet.absoluteFill} />
            <StatusBar barStyle="light-content" translucent />

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
                    <Text style={styles.headerTitle}>MANEJO DE PLANTIO</Text>
                    <View style={{width: 24}} />
                </View>

                {loading ? <ActivityIndicator color="#10B981" /> : (
                    lavouras.map(item => (
                        <View key={item.id} style={styles.card}>
                            <View style={styles.iconCircle}><Ionicons name="leaf" size={20} color="#10B981" /></View>
                            <View style={{flex: 1, marginLeft: 12}}>
                                <Text style={styles.hTitle}>{item.cultura_nome || 'Lavoura'}</Text>
                                <Text style={styles.hSub}>{item.talhao || 'Área Principal'} • {item.area_ha} ha</Text>
                            </View>
                            <View style={styles.statusBadge}><Text style={styles.statusText}>ATIVO</Text></View>
                        </View>
                    ))
                )}

                <TouchableOpacity style={styles.fab} onPress={() => Alert.alert('Novo Plantio', 'Funcionalidade em desenvolvimento para o novo design.')}>
                    <LinearGradient colors={['#10B981', '#059669']} style={styles.fabGrad}>
                        <Ionicons name="add" size={32} color="#FFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    scroll: { padding: 20, paddingTop: 55, paddingBottom: 100 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
    iconCircle: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
    hTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
    hSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    statusBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusText: { color: '#059669', fontSize: 10, fontWeight: '900' },

    fab: { position: 'absolute', right: 20, bottom: 40, shadowColor: '#10B981', shadowOpacity: 0.3, shadowRadius: 15, elevation: 12 },
    fabGrad: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' }
});

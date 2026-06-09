import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { executeQuery } from '../database/database';
import SafeBlurView from '../components/ui/SafeBlurView';
import { useAuth } from '../context/AuthContext';

const RURAL_BG = require('../../assets/farm_bg.png');

export default function AnalisesSoloScreen({ navigation }) {
    const { role } = useAuth();
    const [loading, setLoading] = useState(true);
    const [analises, setAnalises] = useState([]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadAnalises();
        });
        return unsubscribe;
    }, [navigation]);

    const loadAnalises = async () => {
        setLoading(true);
        try {
            const query = `
                SELECT a.*, t.nome as talhao_nome, f.nome as fazenda_nome
                FROM v2_analise_solo a
                JOIN v2_talhoes t ON t.id = a.talhao_id
                JOIN v2_fazendas f ON f.id = t.fazenda_id
                ORDER BY a.data_analise DESC
            `;
            const result = await executeQuery(query);
            const loaded = [];
            for (let i = 0; i < result.rows.length; i++) {
                loaded.push(result.rows.item(i));
            }
            setAnalises(loaded);
        } catch (error) {
            console.error('Erro ao buscar análises:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderCard = ({ item }) => (
        <SafeBlurView intensity={20} tint="dark" style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.badge}>
                    <Ionicons name="flask-outline" size={14} color="#FFF" />
                    <Text style={styles.badgeText}>Solo / Foliar</Text>
                </View>
                <Text style={styles.dateText}>{item.data_analise}</Text>
            </View>

            <Text style={styles.title}>{item.fazenda_nome} • {item.talhao_nome}</Text>
            {item.laboratorio ? <Text style={styles.labText}>Laboratório: {item.laboratorio}</Text> : null}

            <View style={styles.metricsGrid}>
                {item.ph ? <View style={styles.metricBox}><Text style={styles.metricLabel}>pH</Text><Text style={styles.metricValue}>{item.ph}</Text></View> : null}
                {item.ctc ? <View style={styles.metricBox}><Text style={styles.metricLabel}>CTC</Text><Text style={styles.metricValue}>{item.ctc}</Text></View> : null}
                {item.saturacao_bases ? <View style={styles.metricBox}><Text style={styles.metricLabel}>V%</Text><Text style={styles.metricValue}>{item.saturacao_bases}</Text></View> : null}
                {item.materia_organica ? <View style={styles.metricBox}><Text style={styles.metricLabel}>M.O.</Text><Text style={styles.metricValue}>{item.materia_organica}</Text></View> : null}
            </View>
        </SafeBlurView>
    );

    return (
        <ImageBackground source={RURAL_BG} style={styles.container} resizeMode="cover">
            <View style={styles.overlay} />
            
            <SafeBlurView intensity={30} tint="dark" style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Análise de Solo</Text>
            </SafeBlurView>

            {loading ? (
                <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={analises}
                    keyExtractor={item =
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                    > item.id}
                    contentContainerStyle={styles.list}
                    renderItem={renderCard}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="document-text-outline" size={60} color="#9CA3AF" />
                            <Text style={styles.emptyText}>Nenhum laudo de solo cadastrado.</Text>
                        </View>
                    }
                />
            )}

            {(role === 'agronomo' || role === 'admin') && (
                <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AnaliseSoloForm')}>
                    <Ionicons name="add" size={30} color="#FFF" />
                </TouchableOpacity>
            )}
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(17, 24, 39, 0.85)' },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20 },
    backBtn: { marginRight: 15 },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    list: { padding: 20, paddingBottom: 100 },
    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { color: '#9CA3AF', fontSize: 16, marginTop: 15, fontWeight: 'bold' },
    card: { padding: 15, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#3B82F6' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F680', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', marginLeft: 5 },
    dateText: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold' },
    title: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
    labText: { color: '#D1FAE5', fontSize: 12, marginBottom: 15 },
    metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 10 },
    metricBox: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 8, minWidth: 60, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    metricLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: 'bold' },
    metricValue: { color: '#FFF', fontSize: 14, fontWeight: '900', marginTop: 2 },
    fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 5 }
});

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getPlanosAdubacao, deletePlanoAdubacao } from '../database/database';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

// Design System
import Card from '../components/common/Card';
import MetricCard from '../components/common/MetricCard';

export default function AdubacaoListScreen({ navigation }) {
    const { theme } = useTheme();
    const [planos, setPlanos] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadPlanos = async () => {
        setLoading(true);
        try {
            const data = await getPlanosAdubacao();
            setPlanos(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => {
        loadPlanos();
    }, []));

    const handleDelete = (plano) => {
        Alert.alert(
            'Excluir Plano',
            `Deseja excluir "${plano.nome_plano}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        await deletePlanoAdubacao(plano.uuid);
                        loadPlanos();
                    }
                }
            ]
        );
    };

    const appliedCount = planos.filter(p => p.status === 'APLICADO').length;

    const renderItem = ({ item }) => {
        const isApplied = item.status === 'APLICADO';

        return (
            <Card 
                style={[styles.card, isApplied && styles.cardApplied]} 
                noPadding
                onPress={() => navigation.navigate('AdubacaoDetail', { plano: item })}
                onLongPress={() => handleDelete(item)}
            >
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: isApplied ? '#F0FDF4' : '#FFFBEB' }]}>
                            <FontAwesome5
                                name={item.tipo_aplicacao === 'GOTEJO' ? 'faucet' : 'spray-can'}
                                size={18}
                                color={isApplied ? '#10B981' : '#F59E0B'}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.cardTitle}>{item.nome_plano}</Text>
                            <Text style={styles.cardSubtitle}>
                                {item.cultura} • {item.tipo_aplicacao}
                            </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: isApplied ? '#F0FDF4' : '#FFFBEB' }]}>
                            <Text style={[styles.statusText, { color: isApplied ? '#10B981' : '#F59E0B' }]}>
                                {item.status}
                            </Text>
                        </View>
                    </View>

                    {item.area_local && (
                        <View style={styles.localRow}>
                            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                            <Text style={styles.localText}>{item.area_local}</Text>
                        </View>
                    )}
                </View>
            </Card>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', '#059669']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>ADUBAÇÃO</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('AdubacaoForm')}>
                        <Ionicons name="add-circle" size={28} color="#FFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.summaryRow}>
                    <MetricCard 
                        title="Total Planos" 
                        value={planos.length.toString()} 
                        icon="list" 
                        color="#FFF"
                        style={styles.summaryCard}
                    />
                    <MetricCard 
                        title="Realizados" 
                        value={appliedCount.toString()} 
                        icon="checkmark-done" 
                        color="#FFF"
                        style={styles.summaryCard}
                    />
                </View>
            </LinearGradient>

            <FlatList
                data={planos}
                keyExtractor={(item) => item.uuid}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPlanos} colors={[theme?.colors?.primary]} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="flask-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Nenhum plano criado.</Text>
                        <Text style={styles.emptySub}>Comece criando uma nova receita.</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme?.colors?.primary || '#10B981' }]}
                onPress={() => navigation.navigate('AdubacaoForm')}
            >
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    summaryRow: { flexDirection: 'row', gap: 10 },
    summaryCard: { flex: 1, height: 90, marginHorizontal: 0 },
    listContent: { padding: 20, paddingBottom: 100 },
    card: { marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
    cardApplied: { borderLeftColor: '#10B981' },
    cardContent: { padding: 15 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
    cardSubtitle: { fontSize: 11, color: '#9CA3AF', fontWeight: 'bold', marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    localRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8 },
    localText: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginLeft: 5 },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { marginTop: 20, fontSize: 16, fontWeight: 'bold', color: '#4B5563' },
    emptySub: { marginTop: 5, fontSize: 14, color: '#9CA3AF', textAlign: 'center' }
});

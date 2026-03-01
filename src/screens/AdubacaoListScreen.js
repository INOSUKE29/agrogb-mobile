import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getPlanosAdubacao, deletePlanoAdubacao } from '../database/database';
import { useIsFocused } from '@react-navigation/native';

export default function AdubacaoListScreen({ navigation }) {
    const [planos, setPlanos] = useState([]);
    const [loading, setLoading] = useState(false);
    const isFocused = useIsFocused(); // Recarrega ao voltar

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

    useEffect(() => {
        if (isFocused) loadPlanos();
    }, [isFocused]);

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

    const renderItem = ({ item }) => {
        const isApplied = item.status === 'APLICADO';

        return (
            <TouchableOpacity
                style={[styles.card, isApplied && styles.cardApplied]}
                onPress={() => navigation.navigate('AdubacaoDetail', { plano: item })}
                onLongPress={() => handleDelete(item)}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <FontAwesome5
                            name={item.tipo_aplicacao === 'GOTEJO' ? 'faucet' : 'spray-can'}
                            size={20}
                            color={isApplied ? '#059669' : '#F59E0B'}
                        />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{item.nome_plano}</Text>
                        <Text style={styles.cardSubtitle}>
                            {item.cultura} • {item.tipo_aplicacao}
                        </Text>
                    </View>
                    <View style={styles.statusBadge}>
                        <Text style={[styles.statusText, isApplied ? styles.textApplied : styles.textPlanned]}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                {item.area_local ? (
                    <Text style={styles.localText}>📍 {item.area_local}</Text>
                ) : null}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={planos}
                keyExtractor={(item) => item.uuid}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPlanos} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="flask-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>Nenhum plano de adubação criado.</Text>
                        <Text style={styles.emptySub}>Toque no + para criar uma receita.</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AdubacaoForm')}
            >
                <Ionicons name="add" size={30} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0B1220' },
    listContent: { padding: 15, paddingBottom: 100 },
    card: {
        backgroundColor: '#1F2937',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#334155',
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B'
    },
    cardApplied: {
        borderLeftColor: '#22C55E',
        opacity: 0.9
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#111827',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 12
    },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#F9FAFB' },
    cardSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#111827', borderWidth: 1, borderColor: '#334155' },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    textPlanned: { color: '#F59E0B' },
    textApplied: { color: '#22C55E' },
    localText: { marginTop: 10, fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' },
    fab: {
        position: 'absolute', bottom: 22, right: 22,
        width: 62, height: 62, borderRadius: 31,
        backgroundColor: '#22C55E',
        alignItems: 'center', justifyContent: 'center',
        elevation: 10, shadowColor: '#22C55E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12
    },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { marginTop: 20, fontSize: 16, fontWeight: 'bold', color: '#9CA3AF' },
    emptySub: { marginTop: 5, fontSize: 14, color: '#334155' }
});

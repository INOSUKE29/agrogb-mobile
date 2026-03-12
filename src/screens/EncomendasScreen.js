import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { executeQuery } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient'; // Added this import based on usage

export default function EncomendasScreen() {
    const navigation = useNavigation();
    const { colors, isDark } = useTheme();
    const [encomendas, setEncomendas] = useState([]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadEncomendas();
        });
        return unsubscribe;
    }, [navigation]);

    const loadEncomendas = async () => {
        try {
            const query = `
                SELECT o.*, c.nome as cliente_nome, p.nome as produto_nome
                FROM orders o
                LEFT JOIN clientes c ON o.cliente_id = c.uuid
                LEFT JOIN cadastro p ON o.produto_id = p.uuid
                WHERE o.is_deleted = 0
                ORDER BY 
                    CASE o.status
                        WHEN 'PENDENTE' THEN 1
                        WHEN 'PARCIAL' THEN 2
                        WHEN 'CONCLUIDA' THEN 3
                        ELSE 4
                    END,
                    o.data_prevista ASC
            `;
            const result = await executeQuery(query);
            const data = [];
            for (let i = 0; i < result.rows.length; i++) {
                data.push(result.rows.item(i));
            }
            setEncomendas(data);
        } catch {
            Alert.alert('Erro', 'Não foi possível carregar as listas.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDENTE': return '#F59E0B';
            case 'PARCIAL': return '#3B82F6';
            case 'CONCLUIDA': return '#10B981';
            case 'CANCELADA': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const getProgress = (restante, total) => {
        if (!total || total <= 0) return 0;
        const p = ((total - restante) / total) * 100;
        return p > 100 ? 100 : (p < 0 ? 0 : p);
    };

    const renderItem = ({ item }) => {
        const progress = getProgress(item.quantidade_restante, item.quantidade_total);
        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    { 
                        backgroundColor: colors.surface || colors.card,
                        shadowColor: isDark ? 'transparent' : '#000',
                        shadowOpacity: 0.10,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 4 },
                        elevation: 4,
                        borderWidth: isDark ? 1 : 0,
                        borderColor: colors.border
                    }
                ]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('NovaEncomenda', { encomenda: item })}
            >
                <View style={styles.cardHeader}>
                    <Text style={[styles.clientName, { color: colors.textPrimary }]}>{item.cliente_nome || 'Cliente Desconhecido'}</Text>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                        <Text style={styles.badgeText}>{item.status}</Text>
                    </View>
                </View>
                <View style={styles.cardBody}>
                    <Text style={[styles.productName, { color: colors.textPrimary }]}><Ionicons name="cube-outline" size={16} /> {item.produto_nome || 'Produto Desconhecido'}</Text>
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>Previsto: {item.data_prevista || 'Sem data'}</Text>

                    <View style={[styles.progressContainer, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F4F6F5' }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.progressText, { color: colors.textPrimary }]}>
                                Restante: <Text style={{ fontWeight: 'bold' }}>{item.quantidade_restante} {item.unidade}</Text> / {item.quantidade_total} {item.unidade}
                            </Text>
                            <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#1E293B' : '#D9D9D9' }]}>
                                <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: getStatusColor(item.status) }]} />
                            </View>
                        </View>
                        {item.valor_unitario ? (
                            <Text style={[styles.valueText, { color: isDark ? colors.primary : '#1F8A5B' }]}>
                                Total: R$ {(item.quantidade_total * item.valor_unitario).toFixed(2)}
                            </Text>
                        ) : null}
                    </View>

                    {(item.status === 'PENDENTE' || item.status === 'PARCIAL') && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('Vendas', {
                                autoFill: true,
                                cliente: item.cliente_nome,
                                produto: item.produto_nome,
                                quantidade: item.quantidade_restante.toString(),
                                order_id: item.id
                            })}
                        >
                            <Ionicons name="cart-outline" size={18} color="#FFF" style={{ marginRight: 5 }} />
                            <Text style={styles.actionButtonText}>Registrar Venda</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <FlatList
                data={encomendas}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="clipboard-outline" size={60} color="#CBD5E1" />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhuma encomenda registrada.</Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
            />
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('NovaEncomenda')}
            >
                <LinearGradient
                    colors={['#66BB6A', '#2E7D32']}
                    style={styles.fabGradient}
                >
                    <Ionicons name="add" size={24} color="#FFF" />
                    <Text style={styles.fabText}>Nova Encomenda</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 14 },
    card: {
        borderRadius: 18, padding: 16, marginBottom: 14,
    },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    clientName: { fontSize: 16, fontWeight: '800', flex: 1 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    badgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
    cardBody: { marginTop: 4 },
    productName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
    detailText: { fontSize: 13, marginBottom: 8 },
    progressContainer: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        padding: 10, borderRadius: 10, marginTop: 6,
    },
    progressText: { fontSize: 13 },
    valueText: { fontSize: 13, fontWeight: 'bold' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
    emptyText: { marginTop: 10, fontSize: 15 },
    fab: {
        position: 'absolute', right: 20, bottom: 24, borderRadius: 30, elevation: 8,
        shadowColor: '#176E46', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12,
    },
    fabGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 56, borderRadius: 28 },
    fabText: { color: '#FFF', fontWeight: '700', fontSize: 15, marginLeft: 8 },
    progressBarBg: { height: 6, borderRadius: 3, marginTop: 8, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    actionButton: {
        flexDirection: 'row', backgroundColor: '#1F8A5B', paddingVertical: 10, paddingHorizontal: 14,
        borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 14, alignSelf: 'flex-start',
    },
    actionButtonText: { color: '#FFF', fontWeight: '700', fontSize: 13 }
});

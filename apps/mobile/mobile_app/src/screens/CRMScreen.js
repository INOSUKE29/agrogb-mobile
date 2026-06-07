import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { executeQuery } from '../database/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CRMScreen({ navigation }) {
    const { colors } = useTheme();
    const [vendas, setVendas] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadVendas = async () => {
        try {
            // Buscando as vendas no SQLite local
            const res = await executeQuery(`SELECT * FROM v2_vendas ORDER BY created_at DESC`);
            const items = [];
            for (let i = 0; i < res.rows.length; i++) {
                items.push(res.rows.item(i));
            }
            setVendas(items);
        } catch (error) {
            console.error("Erro ao carregar vendas", error);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            loadVendas();
        });
        loadVendas();
        return unsubscribe;
    }, [navigation]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadVendas();
        setRefreshing(false);
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    // Calculando totais
    const totalFaturado = vendas.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
    const sacasVendidas = vendas.reduce((acc, curr) => acc + (curr.quantidade || 0), 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>CRM Comercial</Text>
                <TouchableOpacity onPress={() => navigation.navigate('VendaForm')} style={styles.addButton}>
                    <Ionicons name="add" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* Resumo Financeiro */}
                <View style={styles.kpiContainer}>
                    <View style={[styles.kpiCard, { backgroundColor: colors.primary, width: '100%' }]}>
                        <View style={styles.kpiHeader}>
                            <Ionicons name="cash" size={24} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.kpiLabel}>Total Faturado</Text>
                        </View>
                        <Text style={styles.kpiValueBig}>{formatCurrency(totalFaturado)}</Text>
                    </View>
                </View>

                {/* Funil visual simples */}
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Histórico de Negociações</Text>

                {vendas.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
                            <Ionicons name="briefcase-outline" size={40} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Nenhuma venda registrada</Text>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            Clique no botão + para registrar a venda da sua safra para cooperativas ou frigoríficos.
                        </Text>
                    </View>
                ) : (
                    vendas.map(venda => (
                        <View key={venda.id} style={[styles.vendaCard, { backgroundColor: colors.surface }]}>
                            <View style={styles.vendaRow}>
                                <View style={[styles.iconBox, { backgroundColor: (colors.primary || '#10B981') + '20' }]}>
                                    <Ionicons name="leaf" size={20} color={colors.primary} />
                                </View>
                                <View style={styles.vendaInfo}>
                                    <Text style={[styles.vendaProduto, { color: colors.textPrimary }]}>{venda.produto_nome || 'Produto não especificado'}</Text>
                                    <Text style={[styles.vendaCliente, { color: colors.textSecondary }]}>{venda.cliente_nome || 'Cliente não especificado'}</Text>
                                </View>
                                <View style={styles.vendaValores}>
                                    <Text style={[styles.vendaTotal, { color: colors.primary }]}>{formatCurrency(venda.valor_total)}</Text>
                                    <Text style={[styles.vendaQtd, { color: colors.textSecondary }]}>{venda.quantidade} unid.</Text>
                                </View>
                            </View>
                            <View style={[styles.vendaFooter, { borderTopColor: colors.border }]}>
                                <Text style={[styles.vendaData, { color: colors.textSecondary }]}>
                                    Vendida em {format(new Date(venda.data_venda || venda.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                </Text>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>Concluído</Text>
                                </View>
                            </View>
                        </View>
                    ))
                )}
                
                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 15,
        elevation: 2,
    },
    backButton: {
        padding: 5,
    },
    addButton: {
        padding: 5,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
    },
    kpiContainer: {
        marginBottom: 25,
    },
    kpiCard: {
        borderRadius: 20,
        padding: 20,
        elevation: 5,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    kpiHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    kpiLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    kpiValueBig: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: '900',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    vendaCard: {
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        elevation: 1,
    },
    vendaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    vendaInfo: {
        flex: 1,
    },
    vendaProduto: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    vendaCliente: {
        fontSize: 13,
    },
    vendaValores: {
        alignItems: 'flex-end',
    },
    vendaTotal: {
        fontSize: 16,
        fontWeight: '900',
        marginBottom: 4,
    },
    vendaQtd: {
        fontSize: 12,
        fontWeight: '600',
    },
    vendaFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
    },
    vendaData: {
        fontSize: 12,
    },
    statusBadge: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    statusText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    }
});

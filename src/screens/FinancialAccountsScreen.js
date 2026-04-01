import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import { FinanceService } from '../modules/finance/services/FinanceService';

export default function FinancialAccountsScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [filter, setFilter] = useState('ALL'); 

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await FinanceService.getAccounts(filter === 'ALL' ? null : filter);
            setAccounts(data);
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Falha ao carregar dados financeiros.');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useFocusEffect(useCallback(() => {
        loadData();
    }, [loadData]));

    const stats = useMemo(() => {
        const toPay = accounts.filter(a => a.type === 'PAGAR' && a.status !== 'pago').reduce((sum, a) => sum + (a.total_amount || 0), 0);
        const toReceive = accounts.filter(a => a.type === 'RECEBER' && a.status !== 'pago').reduce((sum, a) => sum + (a.total_amount || 0), 0);
        return { toPay, toReceive };
    }, [accounts]);

    const renderItem = ({ item }) => {
        const isPay = item.type === 'PAGAR';
        const isPaid = item.status === 'pago';
        const isOverdue = item.status === 'vencido';
        
        const statusColor = isPaid ? '#10B981' : isOverdue ? '#EF4444' : '#F59E0B';

        return (
            <GlowCard style={[styles.card, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#FFFFFF' }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: isPay ? '#EF444420' : '#3B82F620' }]}>
                        <Ionicons 
                            name={isPay ? "arrow-down-circle" : "arrow-up-circle"} 
                            size={scale(28)} 
                            color={isPay ? '#EF4444' : '#3B82F6'} 
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.accountTitle, { color: isDark ? '#FFF' : colors.textPrimary }]}>{item.description}</Text>
                        <Text style={[styles.accountSub, { color: isDark ? 'rgba(255,255,255,0.5)' : colors.textSecondary }]}>
                            {new Date(item.due_date).toLocaleDateString()} • {item.payment_method || 'A Definir'}
                        </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
                         <Text style={[styles.statusText, { color: statusColor }]}>
                            {item.status?.toUpperCase()}
                         </Text>
                    </View>
                </View>
                
                <View style={styles.cardFooter}>
                    <View>
                        <Text style={[styles.valLabel, { color: isDark ? 'rgba(255,255,255,0.4)' : '#666' }]}>VALOR TOTAL</Text>
                        <Text style={[styles.valueText, { color: isDark ? '#FFF' : '#333' }]}>
                            R$ {(item.total_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                    {!isPaid && (
                        <TouchableOpacity 
                            style={[styles.payBtn, { backgroundColor: isPay ? '#EF4444' : '#10B981' }]}
                            onPress={() => Alert.alert('Dar Baixa', 'Deseja marcar esta conta como PAGA?', [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Sim, Confirmar', onPress: () => {} }
                            ])}
                        >
                            <Text style={styles.payBtnText}>BAIXAR</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </GlowCard>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
            <StatusBar barStyle="light-content" />
            <ScreenHeader title="FINANCEIRO" onBack={() => navigation.goBack()} />
            
            <View style={styles.summaryContainer}>
                <View style={[styles.summaryBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#E1F8ED' }]}>
                    <Text style={[styles.summaryLabel, { color: '#10B981' }]}>RECEBER</Text>
                    <Text style={[styles.summaryValue, { color: isDark ? '#FFF' : '#065F46' }]}>R$ {stats.toReceive.toLocaleString('pt-BR')}</Text>
                </View>
                <View style={[styles.summaryBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2' }]}>
                    <Text style={[styles.summaryLabel, { color: '#EF4444' }]}>PAGAR</Text>
                    <Text style={[styles.summaryValue, { color: isDark ? '#FFF' : '#991B1B' }]}>R$ {stats.toPay.toLocaleString('pt-BR')}</Text>
                </View>
            </View>

            <View style={styles.filterContainer}>
                {[
                    { id: 'ALL', label: 'TUDO' },
                    { id: 'PAGAR', label: 'PAGAR' },
                    { id: 'RECEBER', label: 'RECEBER' }
                ].map(f => (
                    <TouchableOpacity 
                        key={f.id}
                        onPress={() => setFilter(f.id)}
                        style={[
                            styles.filterBtn, 
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFF' },
                            filter === f.id && { backgroundColor: '#3B82F6' }
                        ]}
                    >
                        <Text style={[styles.filterText, { color: isDark ? '#94A3B8' : '#64748B' }, filter === f.id && { color: '#FFF' }]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                </View>
            ) : (
                <FlatList
                    data={accounts}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="finance" size={64} color={isDark ? '#334155' : '#CBD5E1'} />
                            <Text style={[styles.emptyText, { color: isDark ? '#475569' : '#94A3B8' }]}>Nenhum registro encontrado.</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const scale = (size) => size;

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    summaryContainer: { flexDirection: 'row', padding: 20, gap: 12 },
    summaryBox: { flex: 1, padding: 16, borderRadius: 24, alignItems: 'center' },
    summaryLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    summaryValue: { fontSize: 18, fontWeight: '900' },
    
    filterContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20, gap: 10 },
    filterBtn: { flex: 1, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    filterText: { fontSize: 12, fontWeight: '900' },
    
    list: { padding: 20, paddingBottom: 100 },
    card: { marginBottom: 16, padding: 18, borderRadius: 28, borderWidth: 0 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    iconBox: { width: 52, height: 52, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    accountTitle: { fontSize: 15, fontWeight: '900' },
    accountSub: { fontSize: 12, marginTop: 4, fontWeight: '500' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
    statusText: { fontSize: 10, fontWeight: '900' },
    
    cardFooter: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 20, 
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)'
    },
    valLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, marginBottom: 2 },
    valueText: { fontSize: 20, fontWeight: '900' },
    payBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, shadowOpacity: 0.2, elevation: 4 },
    payBtnText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
    
    emptyContainer: { alignItems: 'center', marginTop: scale(100) },
    emptyText: { marginTop: 16, fontSize: scale(14), fontWeight: '900' }
});
;

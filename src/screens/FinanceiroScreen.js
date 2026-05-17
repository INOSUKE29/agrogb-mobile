import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function FinanceiroScreen({ navigation }) {
    const { isDarkMode } = useTheme();
    const [activeTab, setActiveTab] = useState('Resumo');

    const chartData = {
        labels: ['01/05', '08/05', '15/05', '22/05', '29/05'],
        datasets: [{
            data: [2, 4, 3, 6, 8, 9],
            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, 
            strokeWidth: 3
        }]
    };

    const SummaryCard = ({ label, value, type, trend }) => (
        <View style={[styles.sumCard, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF' }]}>
            <Text style={styles.sumLabel}>{label}</Text>
            <Text style={[styles.sumValue, { color: type === 'receita' ? '#10B981' : type === 'despesa' ? '#EF4444' : '#3B82F6' }]}>
                R$ {value}
            </Text>
            <View style={styles.trendRow}>
                <Ionicons name={trend > 0 ? "trending-up" : "trending-down"} size={14} color={trend > 0 ? "#10B981" : "#EF4444"} />
                <Text style={[styles.trendText, { color: trend > 0 ? "#10B981" : "#EF4444" }]}>{Math.abs(trend)}%</Text>
            </View>
        </View>
    );

    const TransactionItem = ({ title, date, amount, type }) => (
        <View style={styles.transItem}>
            <View style={[styles.transIcon, { backgroundColor: type === 'in' ? '#DCFCE7' : '#FEE2E2' }]}>
                <Ionicons name={type === 'in' ? "arrow-up" : "arrow-down"} size={20} color={type === 'in' ? "#10B981" : "#EF4444"} />
            </View>
            <View style={styles.transInfo}>
                <Text style={[styles.transTitle, { color: isDarkMode ? '#FFF' : '#333' }]}>{title}</Text>
                <Text style={styles.transDate}>{date}</Text>
            </View>
            <Text style={[styles.transAmount, { color: type === 'in' ? '#10B981' : '#EF4444' }]}>
                {type === 'in' ? '+' : '-'} R$ {amount}
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#0D0D0D' : '#F8F9FA' }]}>
            {/* HEADER */}
            <View style={[styles.header, { backgroundColor: isDarkMode ? '#111' : '#FFF' }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={28} color={isDarkMode ? '#FFF' : '#333'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDarkMode ? '#FFF' : '#000' }]}>Financeiro</Text>
                <View style={styles.headerIcons}>
                    <Ionicons name="funnel-outline" size={24} color="#999" style={{ marginRight: 15 }} />
                    <Ionicons name="calendar-outline" size={24} color="#999" />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                
                {/* TABS SEGMENTED */}
                <View style={[styles.tabBar, { backgroundColor: isDarkMode ? '#1E1E1E' : '#F0F0F0' }]}>
                    {['Resumo', 'Receitas', 'Despesas'].map(tab => (
                        <TouchableOpacity 
                            key={tab} 
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.secRow}>
                    <Text style={[styles.secTitle, { color: isDarkMode ? '#FFF' : '#333' }]}>Resumo geral</Text>
                    <Text style={styles.monthLabel}>Este mês ▼</Text>
                </View>

                <View style={styles.summaryGrid}>
                    <SummaryCard label="Receitas" value="12.450" type="receita" trend={18.6} />
                    <SummaryCard label="Despesas" value="4.230" type="despesa" trend={-8.4} />
                    <SummaryCard label="Saldo" value="8.220" type="saldo" trend={24.1} />
                </View>

                <View style={styles.chartContainer}>
                    <Text style={[styles.secTitle, { color: isDarkMode ? '#FFF' : '#333', marginBottom: 15 }]}>Evolução do saldo</Text>
                    <LineChart
                        data={chartData}
                        width={width - 32}
                        height={180}
                        chartConfig={{
                            backgroundColor: isDarkMode ? '#111' : '#FFF',
                            backgroundGradientFrom: isDarkMode ? '#111' : '#FFF',
                            backgroundGradientTo: isDarkMode ? '#111' : '#FFF',
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(153, 153, 153, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: { r: "4", strokeWidth: "2", stroke: "#10B981" }
                        }}
                        bezier
                        style={{ borderRadius: 16 }}
                    />
                </View>

                <View style={styles.transSection}>
                    <View style={styles.secRow}>
                        <Text style={[styles.secTitle, { color: isDarkMode ? '#FFF' : '#333' }]}>Transações recentes</Text>
                        <TouchableOpacity><Text style={styles.seeAll}>Ver todas ></Text></TouchableOpacity>
                    </View>
                    
                    <TransactionItem title="Venda de Soja" date="Entrada" amount="2.450,00" type="in" />
                    <TransactionItem title="Compra de Adubo" date="Despesa • 27/05/2034" amount="850,00" type="out" />
                    <TransactionItem title="Venda de Milho" date="Entrada" amount="1.950,00" type="in" />
                    <TransactionItem title="Frete" date="Despesa • 24/05/2034" amount="320,00" type="out" />
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { height: 100, paddingTop: 50, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    headerIcons: { flexDirection: 'row' },
    scroll: { padding: 16, paddingBottom: 50 },
    tabBar: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 25 },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: '#166534', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    tabText: { color: '#999', fontWeight: 'bold', fontSize: 13 },
    tabTextActive: { color: '#FFF' },
    secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    secTitle: { fontSize: 15, fontWeight: 'bold' },
    monthLabel: { fontSize: 12, color: '#999' },
    summaryGrid: { flexDirection: 'row', gap: 10, marginBottom: 30 },
    sumCard: { flex: 1, padding: 15, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    sumLabel: { fontSize: 10, color: '#999', fontWeight: 'bold', marginBottom: 5 },
    sumValue: { fontSize: 14, fontWeight: '900', marginBottom: 5 },
    trendRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    trendText: { fontSize: 10, fontWeight: 'bold' },
    chartContainer: { marginBottom: 30 },
    transSection: { marginBottom: 20 },
    seeAll: { color: '#166534', fontSize: 12, fontWeight: 'bold' },
    transItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    transIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    transInfo: { flex: 1, marginLeft: 12 },
    transTitle: { fontSize: 14, fontWeight: 'bold' },
    transDate: { fontSize: 11, color: '#999', marginTop: 2 },
    transAmount: { fontSize: 14, fontWeight: 'bold' }
});

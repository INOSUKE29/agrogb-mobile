import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, Alert, Dimensions, StatusBar, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

const { width } = Dimensions.get('window');

export default function IntelligenceScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const isDark = theme?.theme_mode === 'dark';

    const [activeTab, setActiveTab] = useState('DASHBOARD'); // 'DASHBOARD' | 'CONSULTOR'
    const [loading, setLoading] = useState(false);

    // Soil Analysis Input States for IA Consultant
    const [soilPH, setSoilPH] = useState('5.2');
    const [soilP, setSoilP] = useState('12'); // Fósforo (mg/dm³)
    const [soilK, setSoilK] = useState('0.18'); // Potássio (cmolc/dm³)
    const [plantPhase, setPlantPhase] = useState('FRUTIFICAÇÃO'); // 'VEGETATIVA' | 'FLORAÇÃO' | 'FRUTIFICAÇÃO'
    
    // IA Output Recommendations
    const [recommendation, setRecommendation] = useState(null);

    // Mock dashboard metrics based on real database analytics concept
    const biMetrics = {
        totalProduction: 1240, // kg
        revenue: 18200, // R$
        bestField: 'Talhão 4',
        efficiency: '87%',
        fields: [
            { id: '1', name: 'Talhão 1', area: 0.5, production: 320, efficiency: '78%' },
            { id: '2', name: 'Talhão 2', area: 0.3, production: 180, efficiency: '65%' },
            { id: '3', name: 'Talhão 3', area: 0.4, production: 240, efficiency: '82%' },
            { id: '4', name: 'Talhão 4', area: 0.2, production: 500, efficiency: '95%' }
        ]
    };

    const runAgronomicConsultant = () => {
        setLoading(true);
        setTimeout(() => {
            const ph = parseFloat(soilPH) || 7.0;
            const p = parseFloat(soilP) || 20;
            const k = parseFloat(soilK) || 0.3;

            let result = {
                title: 'Solo Equilibrado',
                status: 'ESTÁVEL',
                color: '#10B981',
                rec: 'Nenhuma ação corretiva crítica necessária no solo. Continue com o manejo padrão de fertirrigação.',
                suggestedProduct: 'Nenhum',
                dose: 'Apenas manutenção habitual'
            };

            if (ph < 5.5) {
                result = {
                    title: 'Acidez Excessiva do Solo (pH Baixo)',
                    status: 'CRÍTICO',
                    color: '#EF4444',
                    rec: 'O solo apresenta acidez prejudicial. Recomenda-se a aplicação de calcário para neutralizar o alumínio tóxico e elevar a saturação de bases.',
                    suggestedProduct: 'Calcário Dolomítico (PRNT 80%)',
                    dose: '2.5 Ton/ha (Incorporado a 20cm)'
                };
            } else if (plantPhase === 'FRUTIFICAÇÃO' && k < 0.25) {
                result = {
                    title: 'Deficiência Crítica de Potássio na Frutificação',
                    status: 'ALERTA',
                    color: '#F59E0B',
                    rec: 'A fase de frutificação possui altíssima demanda de Potássio. O valor de K no solo está abaixo do ideal para o enchimento de frutos.',
                    suggestedProduct: 'Power Brix (Adubação Foliar) ou Cloreto de Potássio',
                    dose: '2 L/ha (Power Brix) via pulverização'
                };
            } else if (p < 15) {
                result = {
                    title: 'Baixo Nível de Fósforo (P)',
                    status: 'ALERTA',
                    color: '#F59E0B',
                    rec: 'Deficiência de Fósforo detectada. O fósforo é essencial para o desenvolvimento radicular inicial e vigor do plantio.',
                    suggestedProduct: 'MAP (Monoamônio Fosfato) ou Superfosfato Simples',
                    dose: '150 kg/ha via solo'
                };
            }

            setRecommendation(result);
            setLoading(false);
        }, 800);
    };

    // Auto-calculate on initial load
    useEffect(() => {
        runAgronomicConsultant();
    }, []);

    const textColor = activeColors.text || '#1E293B';
    const textMutedColor = activeColors.textMuted || '#64748B';
    const cardBg = activeColors.card || '#FFFFFF';
    const borderCol = activeColors.border || 'rgba(0,0,0,0.1)';

    const renderHeader = () => (
        <LinearGradient 
            colors={[activeColors.primary || '#10B981', activeColors.primaryDeep || '#064E3B']} 
            style={styles.header}
        >
            <View style={styles.headerTop}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={22} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>INTELIGÊNCIA AGTECH</Text>
                <View style={{ width: 38 }} />
            </View>

            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'DASHBOARD' && styles.tabItemActive]} 
                    onPress={() => setActiveTab('DASHBOARD')}
                >
                    <Text style={[styles.tabText, activeTab === 'DASHBOARD' && styles.tabTextActive]}>📊 DASHBOARD BI</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'CONSULTOR' && styles.tabItemActive]} 
                    onPress={() => setActiveTab('CONSULTOR')}
                >
                    <Text style={[styles.tabText, activeTab === 'CONSULTOR' && styles.tabTextActive]}>🧠 CONSULTOR IA</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );

    const renderDashboard = () => (
        <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ paddingBottom: 50 }}>
            {/* KPI Cards Grid */}
            <View style={styles.kpiGrid}>
                <View style={[styles.kpiCard, { backgroundColor: cardBg }]}>
                    <Ionicons name="leaf-outline" size={20} color="#10B981" />
                    <Text style={[styles.kpiLabel, { color: textMutedColor }]}>Produção do Mês</Text>
                    <Text style={[styles.kpiValue, { color: textColor }]}>{biMetrics.totalProduction} kg</Text>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: cardBg }]}>
                    <Ionicons name="cash-outline" size={20} color="#3B82F6" />
                    <Text style={[styles.kpiLabel, { color: textMutedColor }]}>Receita Líquida</Text>
                    <Text style={[styles.kpiValue, { color: textColor }]}>R$ {biMetrics.revenue.toLocaleString()}</Text>
                </View>
            </View>

            <View style={styles.kpiGrid}>
                <View style={[styles.kpiCard, { backgroundColor: cardBg }]}>
                    <Ionicons name="trophy-outline" size={20} color="#F59E0B" />
                    <Text style={[styles.kpiLabel, { color: textMutedColor }]}>Mais Produtivo</Text>
                    <Text style={[styles.kpiValue, { color: textColor }]}>{biMetrics.bestField}</Text>
                </View>
                <View style={[styles.kpiCard, { backgroundColor: cardBg }]}>
                    <Ionicons name="speedometer-outline" size={20} color="#8B5CF6" />
                    <Text style={[styles.kpiLabel, { color: textMutedColor }]}>Eficiência Geral</Text>
                    <Text style={[styles.kpiValue, { color: textColor }]}>{biMetrics.efficiency}</Text>
                </View>
            </View>

            {/* Simulated PowerBI Charts */}
            <Card style={{ marginTop: 15, marginBottom: 20 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: textMutedColor, letterSpacing: 1, marginBottom: 15 }}>PRODUTIVIDADE COMPARATIVA POR TALHÃO</Text>
                {biMetrics.fields.map(field => {
                    const prodPerHa = Math.round(field.production / field.area);
                    const percent = Math.min(100, (field.production / 500) * 100);
                    return (
                        <View key={field.id} style={{ marginBottom: 15 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{field.name}</Text>
                                <Text style={{ fontSize: 12, fontWeight: '800', color: activeColors.primary || '#10B981' }}>{prodPerHa.toLocaleString()} kg/ha</Text>
                            </View>
                            <View style={{ height: 10, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden' }}>
                                <View style={{ width: `${percent}%`, height: '100%', backgroundColor: activeColors.primary || '#10B981', borderRadius: 5 }} />
                            </View>
                        </View>
                    );
                })}
            </Card>

            {/* Dynamic Insights Alert Banner */}
            <Card style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <Ionicons name="alert-circle" size={20} color="#EF4444" />
                    <Text style={{ fontSize: 13, fontWeight: '900', color: '#EF4444' }}>DIVERGÊNCIA OPERACIONAL</Text>
                </View>
                <Text style={{ fontSize: 13, color: '#374151', lineHeight: 18 }}>
                    Talhão 2 registrou uma queda repentina de 18% em relação à colheita anterior. Recomendamos executar diagnóstico agronômico de solo imediato.
                </Text>
            </Card>
        </ScrollView>
    );

    const renderConsultor = () => (
        <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ paddingBottom: 50 }}>
            <Card style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: textMutedColor, letterSpacing: 1, marginBottom: 15 }}>INFORME OS DADOS DE SOLO & MANEJO</Text>
                
                <Text style={{ fontSize: 11, fontWeight: '800', color: textMutedColor, marginBottom: 8 }}>Fase Fenológica da Cultura *</Text>
                <View style={styles.phaseSelector}>
                    {['VEGETATIVA', 'FLORAÇÃO', 'FRUTIFICAÇÃO'].map(phase => (
                        <TouchableOpacity 
                            key={phase} 
                            style={[styles.phaseBtn, plantPhase === phase && { backgroundColor: activeColors.primary || '#10B981' }]}
                            onPress={() => setPlantPhase(phase)}
                        >
                            <Text style={[styles.phaseBtnText, plantPhase === phase && { color: '#FFF' }]}>{phase}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                        <AgroInput label="pH do Solo" value={soilPH} onChangeText={setSoilPH} keyboardType="decimal-pad" placeholder="5.5" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <AgroInput label="Fósforo (mg/dm³)" value={soilP} onChangeText={setSoilP} keyboardType="decimal-pad" placeholder="15" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <AgroInput label="Potássio (cmolc/dm³)" value={soilK} onChangeText={setSoilK} keyboardType="decimal-pad" placeholder="0.2" />
                    </View>
                </View>

                <AgroButton 
                    title="CALCULAR RECOMENDAÇÃO TÉCNICA" 
                    icon="sparkles" 
                    onPress={runAgronomicConsultant} 
                    loading={loading}
                    style={{ marginTop: 15 }}
                />
            </Card>

            {/* Recommendation Result Card */}
            {recommendation && (
                <Card style={{ borderColor: recommendation.color, borderLeftWidth: 5 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: recommendation.color }}>{recommendation.status}</Text>
                        <MaterialCommunityIcons name="robot" size={20} color={recommendation.color} />
                    </View>
                    <Text style={[styles.recTitle, { color: textColor }]}>{recommendation.title}</Text>
                    
                    <Text style={[styles.recLabel, { color: textMutedColor }]}>RECOMENDAÇÃO TÉCNICA</Text>
                    <Text style={[styles.recDesc, { color: textColor }]}>{recommendation.rec}</Text>
                    
                    <View style={styles.recItemBox}>
                        <View>
                            <Text style={{ fontSize: 9, fontWeight: '900', color: textMutedColor }}>PRODUTO INDICADO</Text>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: textColor }}>{recommendation.suggestedProduct}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 9, fontWeight: '900', color: textMutedColor }}>DOSE INDICADA</Text>
                            <Text style={{ fontSize: 13, fontWeight: '800', color: activeColors.primary || '#10B981' }}>{recommendation.dose}</Text>
                        </View>
                    </View>
                </Card>
            )}
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <SafeAreaView style={{ flex: 1 }}>
                {renderHeader()}
                {activeTab === 'DASHBOARD' ? renderDashboard() : renderConsultor()}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabBar: { flexDirection: 'row', marginTop: 20, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 15, padding: 5 },
    tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabItemActive: { backgroundColor: '#FFF' },
    tabText: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
    tabTextActive: { color: '#065F46' },

    // Dashboard CSS
    kpiGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    kpiCard: { flex: 1, padding: 15, borderRadius: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
    kpiLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, marginTop: 10, marginBottom: 4 },
    kpiValue: { fontSize: 16, fontWeight: '900' },

    // Consultor CSS
    phaseSelector: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    phaseBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#E5E7EB', alignItems: 'center' },
    phaseBtnText: { fontSize: 10, fontWeight: '900', color: '#4B5563' },
    recTitle: { fontSize: 15, fontWeight: '900', marginBottom: 12 },
    recLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    recDesc: { fontSize: 13, lineHeight: 18, marginBottom: 15 },
    recItemBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12, marginTop: 10 }
});

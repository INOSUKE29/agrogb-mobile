import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, SafeAreaView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { getCadastro, getDashboardStats } from '../database/database';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';
import SyncStatusWidget from '../components/common/SyncStatusWidget';

const { width } = Dimensions.get('window');

export default function IntelligenceScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const isDark = theme?.theme_mode === 'dark';
    const borderCol = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    const [activeTab, setActiveTab] = useState('AUDITORIA'); // 'DASHBOARD' | 'AUDITORIA' | 'CONSULTOR'
    const [loading, setLoading] = useState(false);
    
    // IA Auditoria States
    const [catalogProducts, setCatalogProducts] = useState([]);
    const [auditAlerts, setAuditAlerts] = useState([]);

    // Soil Analysis Input States for IA Consultant
    const [soilPH, setSoilPH] = useState('5.2');
    const [soilP, setSoilP] = useState('12'); 
    const [soilK, setSoilK] = useState('0.18'); 
    const [plantPhase, setPlantPhase] = useState('FRUTIFICAÇÃO'); 
    const [recommendation, setRecommendation] = useState(null);

    // Real dashboard metrics state
    const [biMetricsReal, setBiMetricsReal] = useState({
        totalProduction: 0, revenue: 0, saldo: 0
    });

    useEffect(() => {
        loadCatalogAndRunAudit();
    }, []);

    const loadCatalogAndRunAudit = async () => {
        setLoading(true);
        try {
            const dbItems = await getCadastro();
            const richItems = dbItems.filter(item => item.bula_texto || item.dose_padrao || item.nutrientes);
            setCatalogProducts(richItems);

            const dbStats = await getDashboardStats();
            setBiMetricsReal({
                totalProduction: dbStats.colheitaHoje,
                revenue: dbStats.vendasHoje,
                saldo: dbStats.saldo
            });

            // MOCK: Aplicações recentes no campo para cruzamento com a Bula real do DB
            const mockRecentApplications = [
                { id: 1, talhao: 'Talhão 1', appliedDose: 3.5, unit: 'L/ha', productName: richItems[0]?.nome || 'Produto Genérico A' },
                { id: 2, talhao: 'Talhão 2', appliedDose: 1.0, unit: 'Kg/ha', productName: richItems[1]?.nome || 'Produto Genérico B' }
            ];

            const alerts = [];
            
            if (richItems.length > 0) {
                // Motor de Análise Preditiva
                mockRecentApplications.forEach(app => {
                    const catalogMatch = richItems.find(r => r.nome === app.productName);
                    if (catalogMatch && catalogMatch.dose_padrao) {
                        // Extrai número da dose padrão (Ex: "2L/ha" -> 2)
                        const standardDose = parseFloat(catalogMatch.dose_padrao.replace(/[^\d.]/g, ''));
                        if (!isNaN(standardDose)) {
                            if (app.appliedDose > standardDose * 1.2) {
                                alerts.push({
                                    id: `alert_${app.id}`,
                                    type: 'CRÍTICO',
                                    color: '#EF4444',
                                    title: `Superdosagem Detectada no ${app.talhao}`,
                                    message: `A dose aplicada de ${app.appliedDose}${app.unit} do produto ${catalogMatch.nome} excede a recomendação da bula oficial (${catalogMatch.dose_padrao}).`,
                                    bulaInfo: catalogMatch.bula_texto || 'Consulte o agrônomo.',
                                    fabricante: catalogMatch.fabricante || 'Desconhecido'
                                });
                            } else if (app.appliedDose < standardDose * 0.8) {
                                alerts.push({
                                    id: `alert_${app.id}`,
                                    type: 'ALERTA',
                                    color: '#F59E0B',
                                    title: `Subdosagem no ${app.talhao}`,
                                    message: `A dose de ${app.appliedDose}${app.unit} de ${catalogMatch.nome} está abaixo da bula (${catalogMatch.dose_padrao}). Isso pode causar resistência de pragas.`,
                                    bulaInfo: catalogMatch.bula_texto || 'Sem mais indicações na bula.',
                                    fabricante: catalogMatch.fabricante || 'Desconhecido'
                                });
                            } else {
                                alerts.push({
                                    id: `alert_${app.id}`,
                                    type: 'OK',
                                    color: '#10B981',
                                    title: `Manejo Excelente no ${app.talhao}`,
                                    message: `A aplicação de ${catalogMatch.nome} seguiu exatamente a recomendação da bula (${catalogMatch.dose_padrao}).`,
                                    bulaInfo: 'Em conformidade com as Boas Práticas Agrícolas.',
                                    fabricante: catalogMatch.fabricante || '-'
                                });
                            }
                        }
                    }
                });
            }
            
            setAuditAlerts(alerts);
            
        } catch (e) {
            console.error("Erro ao rodar auditoria IA:", e);
        } finally {
            setLoading(false);
        }
    };

    const runAgronomicConsultant = () => {
        setLoading(true);
        setTimeout(() => {
            const ph = parseFloat(soilPH) || 7.0;
            const p = parseFloat(soilP) || 20;
            const k = parseFloat(soilK) || 0.3;

            let result = { title: 'Solo Equilibrado', status: 'ESTÁVEL', color: '#10B981', rec: 'Nenhuma ação corretiva crítica necessária no solo. Continue com o manejo padrão.', suggestedProduct: 'Nenhum', dose: '-' };

            if (ph < 5.5) {
                result = { title: 'Acidez Excessiva (pH Baixo)', status: 'CRÍTICO', color: '#EF4444', rec: 'O solo apresenta acidez prejudicial. Recomenda-se a aplicação de calcário para elevar a saturação de bases.', suggestedProduct: 'Calcário Dolomítico', dose: '2.5 Ton/ha' };
            } else if (plantPhase === 'FRUTIFICAÇÃO' && k < 0.25) {
                result = { title: 'Deficiência Crítica de Potássio', status: 'ALERTA', color: '#F59E0B', rec: 'A fase de frutificação possui altíssima demanda de Potássio. O valor atual não suportará o enchimento dos frutos.', suggestedProduct: 'Cloreto de Potássio', dose: '2 L/ha' };
            }
            
            setRecommendation(result);
            setLoading(false);
        }, 800);
    };

    const textColor = activeColors.text || '#1E293B';
    const textMutedColor = activeColors.textMuted || '#64748B';
    const cardBg = activeColors.card || '#FFFFFF';

    const renderHeader = () => (
        <LinearGradient colors={isDark ? ['#111827', '#0F172A'] : [activeColors.primary || '#10B981', activeColors.primaryDeep || '#064E3B']} style={styles.header}>
            <View style={styles.headerTop}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={22} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>CÉREBRO AGROGB IA</Text>
                <TouchableOpacity onPress={loadCatalogAndRunAudit} style={styles.iconBtn}>
                    <Ionicons name="refresh" size={22} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.tabBar}>
                <TouchableOpacity style={[styles.tabItem, activeTab === 'AUDITORIA' && styles.tabItemActive]} onPress={() => setActiveTab('AUDITORIA')}>
                    <Text style={[styles.tabText, activeTab === 'AUDITORIA' && styles.tabTextActive]}>🛡️ AUDITORIA BULA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabItem, activeTab === 'CONSULTOR' && styles.tabItemActive]} onPress={() => setActiveTab('CONSULTOR')}>
                    <Text style={[styles.tabText, activeTab === 'CONSULTOR' && styles.tabTextActive]}>🧠 SOLO</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabItem, activeTab === 'DASHBOARD' && styles.tabItemActive]} onPress={() => setActiveTab('DASHBOARD')}>
                    <Text style={[styles.tabText, activeTab === 'DASHBOARD' && styles.tabTextActive]}>📊 KPI</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );

    const renderAuditoria = () => (
        <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ paddingBottom: 50 }}>
            <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: textColor, marginBottom: 5 }}>Auditoria Inteligente de Manejo</Text>
                <Text style={{ fontSize: 11, color: textMutedColor, lineHeight: 16 }}>
                    A Inteligência Artificial cruza os dados do seu campo com as Bulas e Fichas Técnicas recém cadastradas no seu Catálogo Rico.
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={activeColors.primary} style={{ marginTop: 50 }} />
            ) : auditAlerts.length === 0 ? (
                <Card style={{ alignItems: 'center', padding: 30, borderStyle: 'dashed', backgroundColor: 'transparent' }}>
                    <Ionicons name="document-text-outline" size={40} color={textMutedColor} />
                    <Text style={{ marginTop: 10, fontSize: 13, fontWeight: '800', color: textColor, textAlign: 'center' }}>Nenhum Dado Rico Encontrado</Text>
                    <Text style={{ marginTop: 5, fontSize: 11, color: textMutedColor, textAlign: 'center' }}>
                        Cadastre produtos no "Estoque" informando a Ficha Técnica (Dose e Bula) para que a IA possa auditar seus manejos.
                    </Text>
                    <AgroButton title="Ir para Catálogo" variant="secondary" style={{ marginTop: 15 }} onPress={() => navigation.navigate('Cadastro')} />
                </Card>
            ) : (
                auditAlerts.map(alert => (
                    <Card key={alert.id} style={{ borderColor: alert.color, borderLeftWidth: 4, marginBottom: 15 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                            <Ionicons name={alert.type === 'OK' ? "checkmark-circle" : "alert-circle"} size={20} color={alert.color} />
                            <Text style={{ fontSize: 11, fontWeight: '900', color: alert.color }}>{alert.type}</Text>
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '900', color: textColor, marginBottom: 8 }}>{alert.title}</Text>
                        <Text style={{ fontSize: 13, color: textColor, lineHeight: 18, marginBottom: 12 }}>{alert.message}</Text>
                        
                        <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: borderCol }}>
                            <Text style={{ fontSize: 9, fontWeight: '900', color: textMutedColor, letterSpacing: 1, marginBottom: 4 }}>PARECER DA BULA OFICIAL</Text>
                            <Text style={{ fontSize: 12, color: textMutedColor, fontStyle: 'italic' }}>"{alert.bulaInfo}"</Text>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: activeColors.primary, marginTop: 8 }}>Fonte: {alert.fabricante}</Text>
                        </View>
                    </Card>
                ))
            )}
        </ScrollView>
    );

    const renderConsultor = () => (
        <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ paddingBottom: 50 }}>
            <Card style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: textMutedColor, letterSpacing: 1, marginBottom: 15 }}>INFORME OS DADOS DE SOLO & MANEJO</Text>
                
                <Text style={{ fontSize: 11, fontWeight: '800', color: textMutedColor, marginBottom: 8 }}>Fase Fenológica da Cultura *</Text>
                <View style={styles.phaseSelector}>
                    {['VEGETATIVA', 'FLORAÇÃO', 'FRUTIFICAÇÃO'].map(phase => (
                        <TouchableOpacity key={phase} style={[styles.phaseBtn, plantPhase === phase && { backgroundColor: activeColors.primary || '#10B981' }]} onPress={() => setPlantPhase(phase)}>
                            <Text style={[styles.phaseBtnText, plantPhase === phase && { color: '#FFF' }]}>{phase}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <View style={{ flex: 1 }}><AgroInput label="pH do Solo" value={soilPH} onChangeText={setSoilPH} keyboardType="decimal-pad" /></View>
                    <View style={{ flex: 1 }}><AgroInput label="Fósforo (P)" value={soilP} onChangeText={setSoilP} keyboardType="decimal-pad" /></View>
                    <View style={{ flex: 1 }}><AgroInput label="Potássio (K)" value={soilK} onChangeText={setSoilK} keyboardType="decimal-pad" /></View>
                </View>

                <AgroButton title="GERAR DIAGNÓSTICO" icon="sparkles" onPress={runAgronomicConsultant} loading={loading} style={{ marginTop: 15 }} />
            </Card>

            {recommendation && (
                <Card style={{ borderColor: recommendation.color, borderLeftWidth: 5 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: recommendation.color }}>{recommendation.status}</Text>
                        <MaterialCommunityIcons name="robot" size={20} color={recommendation.color} />
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: textColor, marginBottom: 12 }}>{recommendation.title}</Text>
                    <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 1, color: textMutedColor, marginBottom: 4 }}>RECOMENDAÇÃO TÉCNICA</Text>
                    <Text style={{ fontSize: 13, lineHeight: 18, color: textColor, marginBottom: 15 }}>{recommendation.rec}</Text>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: borderCol }}>
                        <View>
                            <Text style={{ fontSize: 9, fontWeight: '900', color: textMutedColor }}>PRODUTO INDICADO</Text>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: textColor }}>{recommendation.suggestedProduct}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 9, fontWeight: '900', color: textMutedColor }}>DOSE INDICADA</Text>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: activeColors.primary || '#10B981' }}>{recommendation.dose}</Text>
                        </View>
                    </View>
                </Card>
            )}
        </ScrollView>
    );

    const renderDashboard = () => (
        <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ paddingBottom: 50 }}>
            <View style={styles.kpiGrid}>
                <View style={[styles.kpiCard, { backgroundColor: cardBg }]}><Ionicons name="leaf-outline" size={20} color="#10B981" /><Text style={[styles.kpiLabel, { color: textMutedColor }]}>Produção (Hoje)</Text><Text style={[styles.kpiValue, { color: textColor }]}>{biMetricsReal.totalProduction} kg</Text></View>
                <View style={[styles.kpiCard, { backgroundColor: cardBg }]}><Ionicons name="cash-outline" size={20} color="#3B82F6" /><Text style={[styles.kpiLabel, { color: textMutedColor }]}>Receita (Hoje)</Text><Text style={[styles.kpiValue, { color: textColor }]}>R$ {biMetricsReal.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text></View>
                <View style={[styles.kpiCard, { backgroundColor: cardBg, width: '100%' }]}><Ionicons name="trending-up-outline" size={20} color={biMetricsReal.saldo >= 0 ? "#10B981" : "#EF4444"} /><Text style={[styles.kpiLabel, { color: textMutedColor }]}>Resultado (Margem)</Text><Text style={[styles.kpiValue, { color: biMetricsReal.saldo >= 0 ? "#10B981" : "#EF4444" }]}>R$ {biMetricsReal.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text></View>
            </View>
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <SafeAreaView style={{ flex: 1 }}>
                {renderHeader()}
                {activeTab === 'AUDITORIA' && renderAuditoria()}
                {activeTab === 'CONSULTOR' && renderConsultor()}
                {activeTab === 'DASHBOARD' && renderDashboard()}
            </SafeAreaView>
            <SyncStatusWidget />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
    iconBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)', justifyContent: 'center', alignItems: 'center' },
    tabBar: { flexDirection: 'row', marginTop: 20, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 15, padding: 5 },
    tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabItemActive: { backgroundColor: '#FFF' },
    tabText: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
    tabTextActive: { color: '#065F46' },
    kpiGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    kpiCard: { flex: 1, padding: 15, borderRadius: 16, elevation: 1 },
    kpiLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5, marginTop: 10, marginBottom: 4 },
    kpiValue: { fontSize: 16, fontWeight: '900' },
    phaseSelector: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    phaseBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    phaseBtnText: { fontSize: 9, fontWeight: '900', color: '#9CA3AF' }
});

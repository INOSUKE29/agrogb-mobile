import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import PlanoAdubacaoScreen from '../PlanoAdubacaoScreen';
import FertirrigacaoScreen from '../FertirrigacaoScreen';
import AplicacoesScreen from '../AplicacoesScreen';
import ClimaScreen from '../ClimaScreen';
import RecommendationsListScreen from '../RecommendationsListScreen';

const { width } = Dimensions.get('window');

const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'stats-chart' },
    { id: 'adubacao', label: 'Adubação', icon: 'leaf' },
    { id: 'fertirrigacao', label: 'Fertirrigação', icon: 'water' },
    { id: 'aplicacoes', label: 'Aplicações', icon: 'flask' },
    { id: 'clima', label: 'Clima', icon: 'partly-sunny' },
    { id: 'recomendacoes', label: 'Receitas', icon: 'document-text' },
];

export default function ManejoLavouraScreen({ navigation }) {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState('dashboard');

    // Mapeamento de cores da fundação "Dark Slate"
    const THEME = {
        bg: theme?.colors?.bg ?? '#0F172A',
        headerBg: [theme?.colors?.primaryDeep ?? '#064E3B', theme?.colors?.bg ?? '#0F172A'],
        cardBg: theme?.colors?.cardBg ?? '#1E293B',
        textMain: theme?.colors?.textMain ?? '#F8FAFC',
        textSub: theme?.colors?.textSub ?? '#94A3B8',
        primary: theme?.colors?.primary ?? '#10B981',
        accent: theme?.colors?.accent ?? '#34D399',
    };

    // Renderizador preguiçoso de conteúdo baseado na aba
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                        <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20 }}>
                            <View style={[styles.statCard, { backgroundColor: THEME.cardBg }]}>
                                <Ionicons name="water-outline" size={24} color="#3B82F6" />
                                <Text style={[styles.statValue, { color: THEME.textMain }]}>45 mm</Text>
                                <Text style={[styles.statLabel, { color: THEME.textSub }]}>Chuva Acumulada</Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: THEME.cardBg }]}>
                                <Ionicons name="thermometer-outline" size={24} color="#EF4444" />
                                <Text style={[styles.statValue, { color: THEME.textMain }]}>28°C</Text>
                                <Text style={[styles.statLabel, { color: THEME.textSub }]}>Temperatura Média</Text>
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { color: THEME.textMain }]}>ATIVIDADES PENDENTES</Text>
                        
                        <TouchableOpacity style={[styles.actionCard, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]} onPress={() => setActiveTab('aplicacoes')}>
                            <View style={[styles.actionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.2)' }]}>
                                <Ionicons name="warning-outline" size={20} color="#F59E0B" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.actionTitle, { color: '#F59E0B' }]}>Atraso: Aplicação de Fungicida</Text>
                                <Text style={[styles.actionSub, { color: THEME.textSub }]}>Talhão 3 • Necessário até Ontem</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionCard, { backgroundColor: THEME.cardBg }]} onPress={() => setActiveTab('adubacao')}>
                            <View style={[styles.actionIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                                <Ionicons name="leaf-outline" size={20} color={THEME.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.actionTitle, { color: THEME.textMain }]}>Cobertura Nitrogenada</Text>
                                <Text style={[styles.actionSub, { color: THEME.textSub }]}>Talhão 1 • Planejado para Amanhã</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={THEME.textSub} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={[styles.actionCard, { backgroundColor: THEME.cardBg }]} onPress={() => setActiveTab('fertirrigacao')}>
                            <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                                <Ionicons name="water-outline" size={20} color="#3B82F6" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.actionTitle, { color: THEME.textMain }]}>Turno de Rega</Text>
                                <Text style={[styles.actionSub, { color: THEME.textSub }]}>Gotejo Setor A • Agendado Hoje</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={THEME.textSub} />
                        </TouchableOpacity>
                    </ScrollView>
                );
            case 'adubacao':
                return (
                    <View style={{ flex: 1, marginTop: -20, marginHorizontal: -20 }}>
                        <PlanoAdubacaoScreen navigation={navigation} isTabbed={true} />
                    </View>
                );
            case 'fertirrigacao':
                return (
                    <View style={{ flex: 1, marginTop: -20, marginHorizontal: -20 }}>
                        <FertirrigacaoScreen navigation={navigation} isTabbed={true} />
                    </View>
                );
            case 'aplicacoes':
                return (
                    <View style={{ flex: 1, marginTop: -20, marginHorizontal: -20 }}>
                        <AplicacoesScreen navigation={navigation} isTabbed={true} />
                    </View>
                );
            case 'clima':
                return (
                    <View style={{ flex: 1, marginTop: -20, marginHorizontal: -20 }}>
                        <ClimaScreen navigation={navigation} isTabbed={true} />
                    </View>
                );
            case 'recomendacoes':
                return (
                    <View style={{ flex: 1, marginTop: -20, marginHorizontal: -20 }}>
                        <RecommendationsListScreen navigation={navigation} isTabbed={true} />
                    </View>
                );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: THEME.bg }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            {/* Header Esmeralda com Dark Slate */}
            <LinearGradient colors={THEME.headerBg} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>MANEJO DA LAVOURA</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>

                {/* Top Tabs Customizadas (Horizontal Scroll) */}
                <View style={styles.tabsWrapper}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tabsContainer}
                    >
                        {TABS.map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <TouchableOpacity 
                                    key={tab.id} 
                                    onPress={() => setActiveTab(tab.id)}
                                    style={[
                                        styles.tabButton, 
                                        { backgroundColor: isActive ? THEME.primary : 'rgba(255,255,255,0.05)' }
                                    ]}
                                >
                                    <Ionicons 
                                        name={tab.icon} 
                                        size={18} 
                                        color={isActive ? '#FFF' : THEME.textSub} 
                                        style={{ marginRight: 6 }} 
                                    />
                                    <Text style={[
                                        styles.tabText, 
                                        { color: isActive ? '#FFF' : THEME.textSub, fontWeight: isActive ? 'bold' : '600' }
                                    ]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </LinearGradient>

            {/* Conteúdo Dinâmico */}
            <View style={styles.contentArea}>
                {renderContent()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 40, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' },
    
    tabsWrapper: { marginTop: 10 },
    tabsContainer: { paddingHorizontal: 15, paddingBottom: 10 },
    tabButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 10 },
    tabText: { fontSize: 13, letterSpacing: 0.5 },

    contentArea: { flex: 1, padding: 20 },
    
    placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    placeholderTitle: { fontSize: 20, fontWeight: '800', marginTop: 15, marginBottom: 8 },
    placeholderSub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
    
    statCard: { flex: 1, padding: 15, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    statValue: { fontSize: 20, fontWeight: '900', marginTop: 10, marginBottom: 2 },
    statLabel: { fontSize: 11, fontWeight: '600' },
    
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15, marginTop: 10 },
    actionCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 15, marginBottom: 10 },
    actionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    actionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
    actionSub: { fontSize: 11, fontWeight: '500' }
});

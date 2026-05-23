import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar as RNStatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SafeBlurView from '../ui/SafeBlurView';

export default function MenuFinanceiroScreen({ navigation }) {
    // AÇÕES RÁPIDAS (Atalhos diretos para transações)
    const QUICK_ACTIONS = [
        {
            title: "Nova Venda",
            icon: "cash",
            route: "Vendas",
            color: "#10B981" 
        },
        {
            title: "Reg. Compra",
            icon: "cart",
            route: "Compras",
            color: "#3B82F6"
        },
        {
            title: "Lançar Custo",
            icon: "wallet",
            route: "Custos",
            color: "#EF4444"
        }
    ];

    // GERENCIAMENTO (Finanças e Suprimentos)
    const MENU_ITEMS = [
        {
            title: "ESTOQUE & ARMAZÉM",
            subtitle: "Controle de saldo diário",
            icon: "cube-outline",
            description: "Auditoria de insumos, sementes e maquinário.",
            route: "Estoque",
            color: "#A3E635" 
        },
        {
            title: "ENCOMENDAS & CARGAS",
            subtitle: "Logística e Pedidos",
            icon: "car-outline",
            description: "Lista de pedidos e status de entrega de carga.",
            route: "Encomendas",
            color: "#3B82F6" 
        },
        {
            title: "CATEGORIAS DE DESPESA",
            subtitle: "Classificação Financeira",
            icon: "options-outline",
            description: "Organize as categorias de custos e gastos.",
            route: "CategoriasDespesa",
            color: "#F59E0B" 
        },
        {
            title: "CONTAS FINANCEIRAS",
            subtitle: "Gestão Bancária",
            icon: "wallet-outline",
            description: "Gerencie suas contas e saldos bancários.",
            route: "FinancialAccounts",
            color: "#10B981" 
        },
        {
            title: "SCANNER OCR DE NOTAS",
            subtitle: "Digitalização Inteligente",
            icon: "scan-outline",
            description: "Capture notas fiscais e transforme em registros.",
            route: "Ocr",
            color: "#EC4899" 
        }
    ];

    return (
        <View style={styles.root}>
            {/* BACKGROUND ORBS */}
            <View style={[styles.ambientOrb, { top: -100, right: -100, backgroundColor: '#D4AF37', opacity: 0.1 }]} />
            <View style={[styles.ambientOrb, { bottom: -50, left: -100, backgroundColor: '#10B981', opacity: 0.08 }]} />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Central Financeira</Text>
                    <Text style={styles.headerSub}>CAIXA, ESTOQUE & LOGÍSTICA</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* AÇÕES RÁPIDAS DE CRIAÇÃO */}
                <Text style={styles.sectionHeader}>NOVA TRANSAÇÃO</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsContainer}>
                    {QUICK_ACTIONS.map((action, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={styles.quickCardWrapper}
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate(action.route)}
                        >
                            <SafeBlurView intensity={20} style={styles.quickCard}>
                                <View style={[styles.quickIconBox, { backgroundColor: action.color + '15' }]}>
                                    <Ionicons name={action.icon} size={28} color={action.color} />
                                </View>
                                <Text style={styles.quickTitle}>{action.title}</Text>
                            </SafeBlurView>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* LISTA DE GERENCIAMENTO */}
                <Text style={[styles.sectionHeader, { marginTop: 20 }]}>GERENCIAR RECURSOS</Text>
                {MENU_ITEMS.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.cardWrapper}
                        onPress={() => navigation.navigate(item.route)}
                        activeOpacity={0.8}
                    >
                        <SafeBlurView intensity={15} style={styles.card}>
                            <View style={[styles.iconBox, { backgroundColor: `${item.color}10` }]}>
                                <Ionicons name={item.icon} size={26} color={item.color} />
                            </View>
                            
                            <View style={styles.textContainer}>
                                <Text style={[styles.cardTitle, { color: item.color }]}>{item.title}</Text>
                                <Text style={styles.cardSub}>{item.subtitle}</Text>
                                <Text style={styles.cardDesc}>{item.description}</Text>
                            </View>
                            
                            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                        </SafeBlurView>
                    </TouchableOpacity>
                ))}
            </ScrollView>

        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#040914' },
    ambientOrb: { position: 'absolute', width: 300, height: 300, borderRadius: 150, zIndex: -1 },

    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 20 : 30, paddingBottom: 15 },
    backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 15 },
    headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
    headerSub: { color: '#D4AF37', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

    content: { padding: 20, paddingBottom: 50 },

    sectionHeader: { color: '#94A3B8', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },

    // Quick Actions
    quickActionsContainer: { gap: 15, paddingBottom: 20 },
    quickCardWrapper: { width: 140, borderRadius: 20, overflow: 'hidden' },
    quickCard: { padding: 20, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    quickIconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    quickTitle: { color: '#E2E8F0', fontSize: 13, fontWeight: '800', textAlign: 'center' },

    // List Cards
    cardWrapper: { marginBottom: 12, borderRadius: 20, overflow: 'hidden' },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconBox: { 
        width: 50, height: 50, 
        borderRadius: 16, 
        justifyContent: 'center', alignItems: 'center', 
        marginRight: 16,
    },
    textContainer: { flex: 1 },
    cardTitle: { fontSize: 12, fontWeight: '900', marginBottom: 4, letterSpacing: 1 },
    cardSub: { fontSize: 14, fontWeight: '800', color: '#F8FAFC', marginBottom: 2 },
    cardDesc: { fontSize: 11, color: '#64748B', fontWeight: '600' },
});


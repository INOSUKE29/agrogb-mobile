import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar as RNStatusBar, Vibration, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
            title: "CATEGORIAS & CONTAS",
            subtitle: "Configuração Financeira",
            icon: "options-outline",
            description: "Organize categorias de despesas e contas bancárias.",
            route: "CategoriasDespesa",
            color: "#F59E0B" 
        }
    ];

    return (
        <View style={styles.root}>
            <LinearGradient colors={['#040914', '#0A1220']} style={StyleSheet.absoluteFill} />
            <RNStatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Central Financeira</Text>
                    <Text style={styles.headerSub}>Caixa, Estoque & Logística</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* AÇÕES RÁPIDAS DE CRIAÇÃO */}
                <Text style={styles.sectionHeader}>NOVA TRANSAÇÃO</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsContainer}>
                    {QUICK_ACTIONS.map((action, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={styles.quickCard}
                            activeOpacity={0.8}
                            onPress={() => {
                                if (Platform.OS !== 'web') Vibration.vibrate(20);
                                navigation.navigate(action.route);
                            }}
                        >
                            <View style={[styles.quickIconBox, { backgroundColor: action.color + '15', borderWidth: 1, borderColor: action.color + '30' }]}>
                                <Ionicons name={action.icon} size={28} color={action.color} />
                            </View>
                            <Text style={styles.quickTitle}>{action.title}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* LISTA DE GERENCIAMENTO */}
                <Text style={[styles.sectionHeader, { marginTop: 20 }]}>GERENCIAR RECURSOS</Text>
                {MENU_ITEMS.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.card}
                        onPress={() => {
                            if (Platform.OS !== 'web') Vibration.vibrate(20);
                            navigation.navigate(item.route);
                        }}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }]}>
                            <Ionicons name={item.icon} size={26} color={item.color} />
                        </View>
                        
                        <View style={styles.textContainer}>
                            <Text style={[styles.cardTitle, { color: item.color }]}>{item.title}</Text>
                            <Text style={styles.cardSub}>{item.subtitle}</Text>
                            <Text style={styles.cardDesc}>{item.description}</Text>
                        </View>
                        
                        <View style={styles.chevronBox}>
                            <Ionicons name="chevron-forward" size={18} color="#64748B" />
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },

    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 20 : 30, paddingBottom: 15 },
    backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 15 },
    headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
    headerSub: { color: '#FCD34D', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

    content: { padding: 20, paddingBottom: 50 },

    sectionHeader: { color: '#94A3B8', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },

    // Quick Actions
    quickActionsContainer: { gap: 15, paddingBottom: 20 },
    quickCard: { backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, alignItems: 'center', width: 140 },
    quickIconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    quickTitle: { color: '#E2E8F0', fontSize: 13, fontWeight: '800', textAlign: 'center' },

    // List Cards
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    iconBox: { 
        width: 50, height: 50, 
        borderRadius: 16, 
        justifyContent: 'center', alignItems: 'center', 
        marginRight: 16,
        borderWidth: 1,
    },
    textContainer: { flex: 1 },
    cardTitle: { fontSize: 12, fontWeight: '900', marginBottom: 4, letterSpacing: 1 },
    cardSub: { fontSize: 14, fontWeight: '800', color: '#F8FAFC', marginBottom: 2 },
    cardDesc: { fontSize: 11, color: '#64748B', fontWeight: '600' },
    
    chevronBox: {
        marginLeft: 10,
        height: '100%',
        justifyContent: 'center'
    }
});

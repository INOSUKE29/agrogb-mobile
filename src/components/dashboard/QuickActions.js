import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 50) / 2;

const OPERATIONAL_ACTIONS = [
    { title: 'Caderno', icon: 'book-outline', color: '#10B981', screen: 'CadernoCampo', desc: 'Caderno de Campo' },
    { title: 'Colheita', icon: 'leaf-outline', color: '#EF4444', screen: 'Colheita', desc: 'Registro de Colheita' },
    { title: 'Plantio', icon: 'nutrition-outline', color: '#2563EB', screen: 'Plantio', desc: 'Controle de Plantios' },
    { title: 'Monitorar', icon: 'eye-outline', color: '#8B5CF6', screen: 'Monitoramento', desc: 'Monitorar Pragas' },
    { title: 'Estoque', icon: 'cube-outline', color: '#CA8A04', screen: 'Estoque', desc: 'Prateleiras Digitais' },
    { title: 'Cadastros', icon: 'construct-outline', color: '#4B5563', screen: 'Cadastro', desc: 'Catálogo Rural' },
    { title: 'Adubação', icon: 'flask-outline', color: '#0EA5E9', screen: 'AdubacaoList', desc: 'Plano de Nutrição' },
];

const COMMERCIAL_ACTIONS = [
    { title: 'Vendas', icon: 'cash-outline', color: '#10B981', screen: 'Vendas', desc: 'Faturamento de Vendas' },
    { title: 'Compras', icon: 'cart-outline', color: '#3B82F6', screen: 'Compras', desc: 'Compras de Insumos' },
    { title: 'Custos', icon: 'stats-chart-outline', color: '#F59E0B', screen: 'Custos', desc: 'Centro de Custos' },
    { title: 'Clientes', icon: 'people-outline', color: '#8B5CF6', screen: 'Clientes', desc: 'Carteira de Clientes' },
    { title: 'Encomendas', icon: 'mail-open-outline', color: '#EC4899', screen: 'Encomendas', desc: 'Pedidos Pendentes' },
    { title: 'Relatórios', icon: 'document-text-outline', color: '#6B7280', screen: 'Relatorios', desc: 'Exportar Relatórios' },
];

const SYSTEM_ACTIONS = [
    { title: 'Frota', icon: 'car-outline', color: '#0EA5E9', screen: 'Frota', desc: 'Frota & Máquinas' },
    { title: 'Scanner', icon: 'scan-outline', color: '#10B981', screen: 'Scanner', desc: 'Escanear Insumos' },
    { title: 'Culturas', icon: 'flower-outline', color: '#CA8A04', screen: 'Culturas', desc: 'Tipos de Culturas' },
    { title: 'Equipe', icon: 'people-circle-outline', color: '#F59E0B', screen: 'Equipes', desc: 'Gerenciar Usuários' },
    { title: 'Sincronizar', icon: 'sync-outline', color: '#3B82F6', screen: 'Sync', desc: 'Sincronizar Supabase' },
    { title: 'Ajustes', icon: 'settings-outline', color: '#6B7280', screen: 'Settings', desc: 'Configurar Sistema' },
];

export default function QuickActions({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const isDark = theme?.theme_mode === 'dark';

    const renderSection = (title, actions) => (
        <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: activeColors.textMuted || '#6B7280' }]}>
                {title.toUpperCase()}
            </Text>
            <View style={styles.grid}>
                {actions.map((action, idx) => (
                    <TouchableOpacity 
                        key={idx} 
                        style={[
                            styles.actionCard, 
                            { 
                                backgroundColor: activeColors.card || '#FFFFFF',
                                borderColor: activeColors.border || '#E5E7EB',
                                borderWidth: isDark ? 1 : 0.5
                            }
                        ]}
                        onPress={() => navigation.navigate(action.screen)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: action.color + '15' }]}>
                            <Ionicons name={action.icon} size={22} color={action.color} />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={[styles.actionTitle, { color: activeColors.text || '#1F2937' }]}>
                                {action.title}
                            </Text>
                            <Text style={[styles.actionDesc, { color: activeColors.textMuted || '#9CA3AF' }]} numberOfLines={1}>
                                {action.desc}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {renderSection('Gestão Operacional', OPERATIONAL_ACTIONS)}
            {renderSection('Comercial & Vendas', COMMERCIAL_ACTIONS)}
            {renderSection('Sistema & Frota', SYSTEM_ACTIONS)}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    sectionContainer: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 12,
        marginLeft: 5,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    actionCard: {
        width: CARD_WIDTH,
        height: 68,
        borderRadius: 16,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
    },
    iconCircle: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    actionTitle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.2,
    },
    actionDesc: {
        fontSize: 9,
        fontWeight: '600',
        marginTop: 2,
    }
});

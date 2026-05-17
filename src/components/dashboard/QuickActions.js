import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const ACTIONS = [
    { id: '1', title: 'Adubação', icon: 'flask-outline', color: '#10B981', screen: 'AdubacaoList' },
    { id: '2', title: 'Vendas', icon: 'cash-outline', color: '#3B82F6', screen: 'Vendas' },
    { id: '3', title: 'Aplicações', icon: 'shield-checkmark-outline', color: '#F59E0B', screen: 'Aplicacoes' },
    { id: '4', title: 'Ferti', icon: 'water-outline', color: '#0EA5E9', screen: 'Fertirrigacao' },
    { id: '5', title: 'Monitorar', icon: 'eye-outline', color: '#8B5CF6', screen: 'Monitoramento' },
    { id: '6', title: 'Colheita', icon: 'leaf-outline', color: '#EF4444', screen: 'Colheita' },
    { id: '7', title: 'Estoque', icon: 'cube-outline', color: '#10B981', screen: 'Estoque' },
];

export default function QuickActions({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: activeColors.textMuted || '#6B7280' }]}>AÇÕES RÁPIDAS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {ACTIONS.map((action) => (
                    <TouchableOpacity 
                        key={action.id} 
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate(action.screen)}
                    >
                        <View style={[
                            styles.iconCircle, 
                            { 
                                backgroundColor: activeColors.card || '#FFFFFF',
                                borderColor: activeColors.border || '#E2E8F0',
                                borderWidth: theme?.theme_mode === 'dark' ? 1 : 0
                            }
                        ]}>
                            <Ionicons name={action.icon} size={24} color={action.color} />
                        </View>
                        <Text style={[styles.actionText, { color: activeColors.text || '#4B5563' }]}>
                            {action.title.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
        marginBottom: 15,
        marginLeft: 25,
    },
    scroll: {
        paddingHorizontal: 20,
        gap: 5
    },
    actionBtn: {
        alignItems: 'center',
        width: 85,
    },
    iconCircle: {
        width: 64,
        height: 64,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        marginBottom: 12,
    },
    actionText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5
    }
});

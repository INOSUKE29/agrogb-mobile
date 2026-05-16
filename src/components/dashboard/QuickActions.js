import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const ACTIONS = [
    { id: '1', title: 'Adubação', icon: 'flask-outline', type: 'ionicon', color: '#10B981', screen: 'AdubacaoList' },
    { id: '2', title: 'Vendas', icon: 'cash-outline', type: 'ionicon', color: '#3B82F6', screen: 'Vendas' },
    { id: '3', title: 'Aplicações', icon: 'shield-checkmark-outline', type: 'ionicon', color: '#F59E0B', screen: 'Aplicacoes' },
    { id: '4', title: 'Ferti', icon: 'water-outline', type: 'ionicon', color: '#0EA5E9', screen: 'Fertirrigacao' },
    { id: '5', title: 'Monitorar', icon: 'eye-outline', type: 'ionicon', color: '#8B5CF6', screen: 'Monitoramento' },
    { id: '6', title: 'Colheita', icon: 'leaf-outline', type: 'ionicon', color: '#EF4444', screen: 'Colheita' },
    { id: '7', title: 'Estoque', icon: 'cube-outline', type: 'ionicon', color: '#6B7280', screen: 'Estoque' },
];

export default function QuickActions({ navigation }) {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>AÇÕES RÁPIDAS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {ACTIONS.map((action) => (
                    <TouchableOpacity 
                        key={action.id} 
                        style={styles.actionBtn}
                        onPress={() => navigation.navigate(action.screen)}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: '#FFF' }]}>
                            <Ionicons name={action.icon} size={26} color={action.color} />
                        </View>
                        <Text style={styles.actionText}>{action.title.toUpperCase()}</Text>
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
        color: '#6B7280',
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
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginBottom: 12,
    },
    actionText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#4B5563',
        letterSpacing: 0.5
    }
});

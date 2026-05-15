import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../styles/theme';

const ACTIONS = [
    { id: '1', title: 'Lançamento', icon: 'add-circle', color: '#10B981', screen: 'Custos' },
    { id: '2', title: 'Operação', icon: 'construct', color: '#3B82F6', screen: 'Monitoramento' },
    { id: '3', title: 'Cliente', icon: 'people', color: '#F59E0B', screen: 'Clientes' },
    { id: '4', title: 'Colheita', icon: 'leaf', color: '#8B5CF6', screen: 'Colheita' },
];

export default function QuickActions({ navigation }) {
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
                        <View style={[styles.iconCircle, { backgroundColor: `${action.color}15` }]}>
                            <Ionicons name={action.icon} size={24} color={action.color} />
                        </View>
                        <Text style={styles.actionText}>{action.title}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 15,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        color: '#6B7280',
        letterSpacing: 1,
        marginBottom: 15,
        marginLeft: 20,
    },
    scroll: {
        paddingHorizontal: 15,
    },
    actionBtn: {
        alignItems: 'center',
        marginHorizontal: 5,
        width: 85,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        marginBottom: 10,
    },
    actionText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#4B5563',
    }
});

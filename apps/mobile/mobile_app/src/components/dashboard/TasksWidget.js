import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { executeQuery } from '../../database/database';
import { useTheme } from '../../theme/ThemeContext';

export default function TasksWidget() {
    const navigation = useNavigation();
    const { theme } = useTheme();
    const isDark = theme?.theme_mode === 'dark';
    
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        loadPendingTasks();
        // Um timer para atualizar o widget
        const interval = setInterval(loadPendingTasks, 15000);
        return () => clearInterval(interval);
    }, []);

    const loadPendingTasks = async () => {
        try {
            const result = await executeQuery(`SELECT count(*) as total FROM v2_tarefas WHERE status = 'PENDENTE'`);
            if (result.rows.length > 0) {
                setPendingCount(result.rows.item(0).total);
            }
        } catch (e) {
            // Ignorar erros caso a tabela ainda não exista (ex: primeira carga)
        }
    };

    if (pendingCount === 0) return null;

    return (
        <TouchableOpacity 
            style={[styles.container, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2', borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5' }]} 
            onPress={() => navigation.navigate('Tasks')}
            activeOpacity={0.8}
        >
            <View style={styles.iconBox}>
                <Ionicons name="alert-circle" size={24} color="#EF4444" />
            </View>
            <View style={styles.textBox}>
                <Text style={[styles.title, { color: isDark ? '#FCA5A5' : '#991B1B' }]}>Atenção!</Text>
                <Text style={[styles.subtitle, { color: isDark ? '#FECACA' : '#B91C1C' }]}>
                    Você tem {pendingCount} {pendingCount === 1 ? 'tarefa pendente' : 'tarefas pendentes'}.
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
    },
    iconBox: {
        marginRight: 15,
    },
    textBox: {
        flex: 1,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 12,
    }
});

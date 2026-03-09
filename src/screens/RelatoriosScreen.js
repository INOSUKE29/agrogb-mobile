import React, { useState, useCallback } from 'react';
import { Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { Card } from '../ui/components/Card';
import { Ionicons } from '@expo/vector-icons';

export default function RelatoriosScreen({ navigation }) {
    const { colors } = useTheme();
    const [data] = useState({ summary: { total: 0, pending: 0 }, history: [] });

    useFocusEffect(useCallback(() => { }, []));

    return (
        <AppContainer>
            <ScreenHeader title="RELATÓRIOS" onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.content}>
                <Card style={styles.card}>
                    <Text style={{ color: colors.textPrimary, fontWeight: 'bold' }}>RESUMO GERAL</Text>
                    <Text style={{ color: colors.primary, fontSize: 24, fontWeight: 'bold' }}>R$ {data.summary.total.toFixed(2)}</Text>
                </Card>
                <TouchableOpacity style={styles.btn}>
                    <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                    <Text style={{ color: colors.textPrimary, marginLeft: 10 }}>EXPORTAR PDF</Text>
                </TouchableOpacity>
            </ScrollView>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    content: { padding: 20 },
    card: { padding: 20, marginBottom: 20 },
    btn: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#FFF', borderRadius: 15 }
});

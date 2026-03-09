import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { executeQuery } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { Card } from '../ui/components/Card';
import AgroFAB from '../ui/components/AgroFAB';

export default function FrotaScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [veiculos, setVeiculos] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadVeiculos = async () => {
        setLoading(true);
        try {
            const res = await executeQuery('SELECT * FROM frota WHERE status != "EXCLUIDO" ORDER BY nome ASC');
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setVeiculos(rows);
        } catch { } finally { setLoading(false); }
    };

    useFocusEffect(useCallback(() => { loadVeiculos(); }, []));

    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <View style={styles.info}>
                <Text style={[styles.nome, { color: colors.textPrimary }]}>{item.nome}</Text>
                <Text style={{ color: colors.textSecondary }}>{item.placa || 'SEM PLACA'} • {item.tipo}</Text>
            </View>
            <TouchableOpacity onPress={() => Alert.alert('Info', 'Detalhes em breve.')}><Ionicons name="chevron-forward" size={20} color={colors.textMuted} /></TouchableOpacity>
        </Card>
    );

    return (
        <AppContainer>
            <ScreenHeader title="FROTA & MÁQUINAS" onBack={() => navigation.goBack()} />
            {loading ? <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} /> :
                <FlatList
                    data={veiculos}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 50, color: colors.textMuted }}>Nenhum veículo cadastrado.</Text>}
                />}
            <AgroFAB icon="add" onPress={() => Alert.alert('Em breve', 'Funcionalidade de cadastro em desenvolvimento.')} />
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    card: { padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    info: { flex: 1 },
    nome: { fontSize: 16, fontWeight: 'bold' }
});

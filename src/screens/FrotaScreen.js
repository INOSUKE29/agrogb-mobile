import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getMaquinas, deleteMaquina } from '../database/database';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { Card } from '../ui/components/Card';
import AgroFAB from '../ui/components/AgroFAB';
import ConfirmModal from '../ui/ConfirmModal';
import { showToast } from '../ui/Toast';

export default function FrotaScreen() {
    const navigation = useNavigation();
    const { colors, isDark } = useTheme();
    const [veiculos, setVeiculos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const loadVeiculos = async () => {
        setLoading(true);
        try {
            const data = await getMaquinas();
            setVeiculos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { 
        loadVeiculos(); 
    }, []));

    const handleDelete = (item) => {
        setItemToDelete(item);
        setConfirmVisible(true);
    };

    const confirmDelete = async () => {
        if (itemToDelete) {
            await deleteMaquina(itemToDelete.uuid);
            setConfirmVisible(false);
            setItemToDelete(null);
            showToast('Veículo removido com sucesso!');
            loadVeiculos();
        }
    };

    const renderItem = ({ item }) => {
        const needsRevision = item.horimetro_atual >= item.intervalo_revisao && item.intervalo_revisao > 0;
        
        return (
            <Card style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderColor: colors.border }]}>
                    <MaterialCommunityIcons 
                        name={item.tipo === 'TRATOR' ? 'tractor' : item.tipo === 'CAMINHAO' ? 'truck-outline' : 'car-outline'} 
                        size={24} 
                        color={colors.primary} 
                    />
                </View>
                <View style={styles.info}>
                    <View style={styles.headerRow}>
                        <Text style={[styles.nome, { color: colors.textPrimary }]}>{item.nome}</Text>
                        {needsRevision && (
                            <View style={[styles.alertBadge, { backgroundColor: colors.danger + '20' }]}>
                                <Text style={[styles.alertText, { color: colors.danger }]}>REVISÃO</Text>
                            </View>
                        )}
                    </View>
                    <Text style={[styles.subText, { color: colors.textSecondary }]}>
                        {item.placa || 'SEM PLACA'} • {item.tipo}
                    </Text>
                    <View style={styles.statRow}>
                        <View style={styles.stat}>
                            <Ionicons name="speedometer-outline" size={12} color={colors.textMuted} />
                            <Text style={[styles.statVal, { color: colors.textPrimary }]}>{item.horimetro_atual} h</Text>
                        </View>
                        <View style={styles.stat}>
                            <Ionicons name="build-outline" size={12} color={colors.textMuted} />
                            <Text style={[styles.statVal, { color: colors.textPrimary }]}>{item.intervalo_revisao} h (Rev)</Text>
                        </View>
                    </View>
                </View>
                
                <View style={styles.actions}>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('MaquinaForm', { editItem: item })}
                        style={[styles.actionBtn, { borderColor: colors.border }]}
                    >
                        <Ionicons name="create-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => handleDelete(item)}
                        style={[styles.actionBtn, { borderColor: colors.border }]}
                    >
                        <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                </View>
            </Card>
        );
    };

    return (
        <AppContainer>
            <ScreenHeader title="FROTA & MÁQUINAS" onBack={() => navigation.goBack()} />
            
            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={veiculos}
                    renderItem={renderItem}
                    keyExtractor={item => item.uuid}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="tractor-variant" size={64} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                Nenhuma máquina cadastrada.
                            </Text>
                        </View>
                    }
                />
            )}

            <AgroFAB icon="add" onPress={() => navigation.navigate('MaquinaForm')} />

            <ConfirmModal
                visible={confirmVisible}
                title="EXCLUIR VEÍCULO"
                message={`Deseja realmente remover ${itemToDelete?.nome} da frota?`}
                onConfirm={confirmDelete}
                onCancel={() => setConfirmVisible(false)}
            />
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    card: { padding: 15, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 50, height: 50, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    info: { flex: 1 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    nome: { fontSize: 15, fontWeight: 'bold' },
    subText: { fontSize: 12, marginTop: 2, marginBottom: 6 },
    statRow: { flexDirection: 'row', gap: 15 },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statVal: { fontSize: 11, fontWeight: '800' },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { alignItems: 'center', marginTop: 80, opacity: 0.5 },
    emptyText: { textAlign: 'center', marginTop: 15, fontWeight: 'bold' },
    alertBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    alertText: { fontSize: 8, fontWeight: '900' }
});


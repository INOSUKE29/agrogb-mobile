import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { getPlanosAdubacao, deletePlanoAdubacao } from '../database/database';
import { useIsFocused } from '@react-navigation/native';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowFAB from '../ui/GlowFAB';
import { DARK } from '../styles/darkTheme';

export default function AdubacaoListScreen({ navigation }) {
    const [planos, setPlanos] = useState([]);
    const [loading, setLoading] = useState(false);
    const isFocused = useIsFocused();

    const loadPlanos = async () => {
        setLoading(true);
        try { const data = await getPlanosAdubacao(); setPlanos(data); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { if (isFocused) loadPlanos(); }, [isFocused]);

    const handleDelete = (plano) => {
        Alert.alert('Excluir Plano', `Deseja excluir "${plano.nome_plano}"?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Excluir', style: 'destructive', onPress: async () => { await deletePlanoAdubacao(plano.uuid); loadPlanos(); } }
        ]);
    };

    const renderItem = ({ item }) => {
        const isApplied = item.status === 'APLICADO';
        const accentColor = isApplied ? DARK.glow : DARK.warning;

        return (
            <TouchableOpacity
                onPress={() => navigation.navigate('AdubacaoDetail', { plano: item })}
                onLongPress={() => handleDelete(item)}
                activeOpacity={0.85}
            >
                <GlowCard style={[styles.card, { borderLeftColor: accentColor, borderLeftWidth: 3 }]}>
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconBox, { backgroundColor: accentColor + '18' }]}>
                            <FontAwesome5
                                name={item.tipo_aplicacao === 'GOTEJO' ? 'faucet' : 'spray-can'}
                                size={18}
                                color={accentColor}
                            />
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>{item.nome_plano}</Text>
                            <Text style={styles.cardSubtitle}>{item.cultura} • {item.tipo_aplicacao}</Text>
                        </View>
                        <View style={[styles.statusBadge, { borderColor: accentColor + '50' }]}>
                            <Text style={[styles.statusText, { color: accentColor }]}>{item.status}</Text>
                        </View>
                    </View>
                    {item.area_local ? (
                        <Text style={styles.localText}>📍 {item.area_local}</Text>
                    ) : null}
                </GlowCard>
            </TouchableOpacity>
        );
    };

    return (
        <AppContainer>
            <ScreenHeader title="Planos de Adubação" onBack={navigation?.goBack ? () => navigation.goBack() : null} />
            <FlatList
                data={planos}
                keyExtractor={item => item.uuid}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={loadPlanos} tintColor={DARK.glow} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="flask-outline" size={64} color={DARK.glowBorder} />
                        <Text style={styles.emptyText}>Nenhum plano de adubação criado.</Text>
                        <Text style={styles.emptySub}>Toque no + para criar uma receita.</Text>
                    </View>
                }
            />
            <GlowFAB onPress={() => navigation.navigate('AdubacaoForm')} icon="add" />
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    listContent: { padding: 16, paddingBottom: 100 },
    card: { marginBottom: 12 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    cardContent: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: DARK.textPrimary },
    cardSubtitle: { fontSize: 12, color: DARK.textSecondary, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
    statusText: { fontSize: 10, fontWeight: 'bold' },
    localText: { marginTop: 10, fontSize: 12, color: DARK.textMuted, fontStyle: 'italic' },
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { marginTop: 20, fontSize: 16, fontWeight: 'bold', color: DARK.textSecondary },
    emptySub: { marginTop: 5, fontSize: 14, color: DARK.textMuted },
});

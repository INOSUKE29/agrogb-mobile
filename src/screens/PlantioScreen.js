import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCadastro } from '../database/database';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { showToast } from '../ui/Toast';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';
import { usePlantio } from '../modules/production/hooks/usePlantio';
import { useInventory } from '../modules/inventory/hooks/useInventory';

export default function PlantioScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const { history, loading: loadingPlantio, loadHistory, registerPlanting, removePlanting } = usePlantio();
    const { items: stockItems, fetchStock: loadStock } = useInventory();

    const [talhao, setTalhao] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [variedade, setVariedade] = useState('');
    const [previsao, setPrevisao] = useState('');
    const [observacao, setObservacao] = useState('');
    
    const [selectedSeed, setSelectedSeed] = useState(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState('PÉS');

    useFocusEffect(useCallback(() => { 
        loadHistory(); 
        loadStock();
    }, [loadHistory, loadStock]));

    const openSelector = useCallback(async (type) => {
        setModalType(type);
        setLoading(true);
        setModalVisible(true);
        try {
            if (type === 'SEMENTE') {
                setItems(stockItems.filter(i => i.quantidade > 0));
            } else {
                const all = await getCadastro();
                const filtered = all.filter(i => i.tipo === type);
                setItems(filtered);
            }
        } catch { } finally { setLoading(false); }
    }, [stockItems]);

    const handleSelect = useCallback((item) => {
        if (modalType === 'AREA') {
            setTalhao(item.nome);
        } else if (modalType === 'SEMENTE') {
            setSelectedSeed(item);
            setVariedade(item.produto);
            setSelectedUnit(item.unidade || 'KG');
        } else {
            setVariedade(item.nome);
            setSelectedUnit(item.unidade || 'PÉS');
            setSelectedSeed(null);
        }
        setModalVisible(false);
    }, [modalType]);

    const salvar = useCallback(async () => {
        if (!talhao || !quantidade || !variedade) {
            Alert.alert('Atenção', 'Área, Cultura e Quantidade são obrigatórios.');
            return;
        }

        const dados = {
            cultura: variedade.toUpperCase(),
            tipo_plantio: talhao.toUpperCase(),
            quantidade_pes: parseInt(quantidade) || 0,
            observacao: `PREV: ${previsao} | ${observacao}`.toUpperCase()
        };

        try {
            await registerPlanting(dados, selectedSeed);
            setTalhao(''); setQuantidade(''); setVariedade(''); setPrevisao(''); setObservacao(''); setSelectedSeed(null);
            showToast('🌱 Plantio registrado com sucesso!');
        } catch (err) {
            console.error(err);
            Alert.alert('Erro', 'Falha ao registrar plantio.');
        }
    }, [talhao, quantidade, variedade, previsao, observacao, selectedSeed, registerPlanting]);

    const handleLongPress = useCallback((item) => {
        Alert.alert('Gerenciar Plantio', `Ação para: ${item.cultura} em ${item.tipo_plantio}`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'EXCLUIR',
                style: 'destructive',
                onPress: async () => {
                    await removePlanting(item.uuid);
                    showToast('Registro removido.');
                }
            }
        ]);
    }, [removePlanting]);

    const renderItem = useCallback(({ item }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onLongPress={() => handleLongPress(item)}
            style={styles.histItemContainer}
        >
            <GlowCard style={styles.histCard}>
                <View style={styles.histHeader}>
                    <View style={[styles.iconBox, { backgroundColor: (colors.primary || '#1E8E5A') + '15', borderColor: (colors.primary || '#1E8E5A') + '30', borderWidth: 1 }]}>
                        <MaterialCommunityIcons name="sprout" size={24} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.histCultura, { color: colors.textPrimary }]}>{item.cultura}</Text>
                        <Text style={[styles.histLocal, { color: colors.textSecondary }]}>{item.tipo_plantio}</Text>
                    </View>
                    <View style={styles.dateBadge}>
                        <Text style={[styles.dateText, { color: colors.textMuted }]}>
                            {item.data.split('-').reverse().slice(0, 2).join('/')}
                        </Text>
                    </View>
                </View>

                <View style={[styles.histFooter, { borderTopColor: colors.border }]}>
                    <View style={styles.statItem}>
                        <Ionicons name="apps-outline" size={14} color={colors.primary} />
                        <Text style={[styles.statText, { color: colors.textPrimary }]}>{item.quantidade_pes} {item.unidade || 'PÉS'}</Text>
                    </View>
                    {item.observacao ? (
                        <Text style={[styles.obsText, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.observacao}
                        </Text>
                    ) : null}
                </View>
            </GlowCard>
        </TouchableOpacity>
    ), [colors, handleLongPress]);

    const memoHistory = useMemo(() => history, [history]);

    return (
        <AppContainer>
            <ScreenHeader title="PLANTIO & CULTURAS" onBack={() => navigation.goBack()} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <GlowCard style={styles.mainCard}>
                    <Text style={[styles.cardTitle, { color: colors.primary }]}>NOVO CICLO DE PLANTIO</Text>

                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>ÁREA DE PLANTIO</Text>
                    <TouchableOpacity
                        style={[styles.selectorBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', borderColor: colors.border }]}
                        onPress={() => openSelector('AREA')}
                    >
                        <Text style={[styles.selectorText, { color: talhao ? colors.textPrimary : colors.placeholder }]}>
                            {talhao || 'SELECIONAR ÁREA...'}
                        </Text>
                        <Ionicons name="map-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>

                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>CULTURA / VARIEDADE</Text>
                    <View style={styles.pillContainer}>
                        <TouchableOpacity
                            style={[styles.pill, { borderColor: modalType === 'CULTURA' ? colors.primary : colors.border, backgroundColor: modalType === 'CULTURA' ? colors.primary + '10' : 'transparent' }]}
                            onPress={() => openSelector('CULTURA')}
                        >
                            <Ionicons name="leaf-outline" size={16} color={colors.primary} />
                            <Text style={[styles.pillText, { color: colors.textPrimary }]}>CATÁLOGO</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.pill, { borderColor: modalType === 'SEMENTE' ? colors.primary : colors.border, backgroundColor: modalType === 'SEMENTE' ? colors.primary + '10' : 'transparent' }]}
                            onPress={() => openSelector('SEMENTE')}
                        >
                            <Ionicons name="cube-outline" size={16} color={colors.primary} />
                            <Text style={[styles.pillText, { color: colors.textPrimary }]}>DO ESTOQUE</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.selectorBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', borderColor: colors.border }]}
                        onPress={() => openSelector(selectedSeed ? 'SEMENTE' : 'CULTURA')}
                    >
                        <Text style={[styles.selectorText, { color: variedade ? colors.textPrimary : colors.placeholder }]}>
                            {variedade || 'SELECIONAR...'}
                        </Text>
                        <Ionicons name={selectedSeed ? "cube-outline" : "leaf-outline"} size={18} color={colors.primary} />
                    </TouchableOpacity>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>QUANTIDADE ({selectedUnit})</Text>
                            <GlowInput
                                placeholder="0"
                                value={quantidade}
                                onChangeText={setQuantidade}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>PREVISÃO COLHEITA</Text>
                            <GlowInput
                                placeholder="MÊS/ANO"
                                value={previsao}
                                onChangeText={t => setPrevisao(t.toUpperCase())}
                            />
                        </View>
                    </View>

                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>OBSERVAÇÕES ADICIONAIS</Text>
                    <GlowInput
                        placeholder="Detalhes opcionais..."
                        value={observacao}
                        onChangeText={t => setObservacao(t.toUpperCase())}
                        multiline
                        style={{ height: 100, textAlignVertical: 'top' }}
                    />

                    <PrimaryButton
                        title="CONFIRMAR PLANTIO"
                        onPress={salvar}
                        loading={loadingPlantio}
                        style={{ marginTop: 15 }}
                    />
                </GlowCard>

                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>REGISTROS RECENTES</Text>

                <FlatList
                    data={memoHistory}
                    keyExtractor={item => item.uuid}
                    renderItem={renderItem}
                    scrollEnabled={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={5}
                    windowSize={5}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="sprout-off" size={48} color={colors.border} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum plantio registrado.</Text>
                        </View>
                    }
                />
            </ScrollView>

            <Modal visible={modalVisible} animationType="slide" transparent={false}>
                <AppContainer>
                    <ScreenHeader title={`SELECIONAR ${modalType}`} onBack={() => setModalVisible(false)} />

                    <View style={{ padding: 20, flex: 1 }}>
                        {loading ? <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 40 }} /> :
                            <FlatList
                                data={items}
                                keyExtractor={i => i.uuid || (i.id ? i.id.toString() : Math.random().toString())}
                                initialNumToRender={15}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.itemRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <View>
                                            <Text style={[styles.itemText, { color: colors.textPrimary }]}>{item.nome || item.produto}</Text>
                                            <Text style={[styles.itemSub, { color: colors.textSecondary }]}>
                                                {item.unidade || 'UN'} {item.quantidade !== undefined ? `(Disp: ${item.quantidade})` : ''}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                                    </TouchableOpacity>
                                )}
                            />
                        }
                    </View>
                </AppContainer>
            </Modal>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scrollContent: { padding: 20, paddingBottom: 100 },
    mainCard: { padding: 20 },
    cardTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 20 },
    fieldLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8, marginTop: 5 },

    selectorBtn: { height: 54, borderRadius: 16, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 15 },
    selectorText: { fontSize: 14, fontWeight: '700' },

    row: { flexDirection: 'row', gap: 12 },
    pillContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    pill: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    pillText: { fontSize: 11, fontWeight: '800' },

    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginTop: 30, marginBottom: 15, marginLeft: 5 },
    histItemContainer: { marginBottom: 12 },
    histCard: { padding: 16 },
    histHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    histCultura: { fontSize: 15, fontWeight: 'bold' },
    histLocal: { fontSize: 11, marginTop: 2 },
    dateBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    dateText: { fontSize: 11, fontWeight: '800' },

    histFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, borderTopWidth: 1.5, paddingTop: 12 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statText: { fontSize: 12, fontWeight: '800' },
    obsText: { fontSize: 10, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 15 },

    emptyBox: { alignItems: 'center', marginTop: 40, opacity: 0.5 },
    emptyText: { marginTop: 15, fontSize: 14, fontWeight: 'bold' },

    itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1.5 },
    itemText: { fontSize: 15, fontWeight: 'bold' },
    itemSub: { fontSize: 11, marginTop: 2 }
});

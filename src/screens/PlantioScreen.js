import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator, Animated } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useFocusEffect } from '@react-navigation/native';
import { insertPlantio, getCadastro, updatePlantio, deletePlantio, executeQuery } from '../database/database';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { showToast } from '../ui/Toast';
import { useTheme } from '../context/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowFAB from '../ui/GlowFAB';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';

export default function PlantioScreen({ navigation }) {
    const { colors } = useTheme();
    const [talhao, setTalhao] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [variedade, setVariedade] = useState('');
    const [previsao, setPrevisao] = useState('');
    const [observacao, setObservacao] = useState('');
    const [history, setHistory] = useState([]);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUnit, setSelectedUnit] = useState('PÉS');

    useFocusEffect(useCallback(() => { loadHistory(); }, []));

    const loadHistory = async () => {
        try {
            const res = await executeQuery('SELECT * FROM plantio ORDER BY data DESC LIMIT 20');
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setHistory(rows);
        } catch (e) { console.error(e); }
    };

    const openSelector = async (type) => {
        setModalType(type);
        setLoading(true);
        setModalVisible(true);
        try {
            const all = await getCadastro();
            const filtered = all.filter(i => i.tipo === type);
            setItems(filtered);
        } catch (e) { } finally { setLoading(false); }
    };

    const handleSelect = (item) => {
        if (modalType === 'AREA') {
            setTalhao(item.nome);
        } else {
            setVariedade(item.nome);
            setSelectedUnit(item.unidade || 'PÉS');
        }
        setModalVisible(false);
    };

    const salvar = async () => {
        if (!talhao || !quantidade || !variedade) {
            Alert.alert('Atenção', 'Área, Cultura e Quantidade são obrigatórios.');
            return;
        }

        const dados = {
            uuid: uuidv4(),
            cultura: variedade.toUpperCase(),
            tipo_plantio: talhao.toUpperCase(),
            quantidade_pes: parseInt(quantidade) || 0,
            data: new Date().toISOString().split('T')[0],
            observacao: `PREV: ${previsao} | ${observacao}`.toUpperCase()
        };

        try {
            await insertPlantio(dados);
            showToast('Plantio registrado com sucesso!');
            setTalhao(''); setQuantidade(''); setVariedade(''); setPrevisao(''); setObservacao('');
            loadHistory();
        } catch (error) {
            Alert.alert('Erro', 'Falha ao registrar.');
        }
    };

    const handleLongPress = (item) => {
        Alert.alert('Gerenciar Plantio', `Ação para: ${item.cultura} em ${item.tipo_plantio}`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'EXCLUIR',
                style: 'destructive',
                onPress: async () => {
                    await executeQuery('DELETE FROM plantio WHERE uuid = ?', [item.uuid]);
                    loadHistory();
                }
            }
        ]);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            activeOpacity={0.7}
            onLongPress={() => handleLongPress(item)}
            style={styles.histItemContainer}
        >
            <GlowCard style={[styles.histCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
                <View style={styles.histHeader}>
                    <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
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

                <View style={styles.histFooter}>
                    <View style={styles.statItem}>
                        <Ionicons name="apps-outline" size={14} color={colors.primary} />
                        <Text style={[styles.statText, { color: colors.textPrimary }]}>{item.quantidade_pes} {selectedUnit}</Text>
                    </View>
                    {item.observacao ? (
                        <Text style={[styles.obsText, { color: colors.textMuted }]} numberOfLines={1}>
                            {item.observacao}
                        </Text>
                    ) : null}
                </View>
            </GlowCard>
        </TouchableOpacity>
    );

    return (
        <AppContainer>
            <ScreenHeader title="Plantio & Culturas" onBack={() => navigation.goBack()} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <GlowCard style={[styles.mainCard, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
                    <Text style={[styles.cardTitle, { color: colors.primary }]}>NOVO CICLO</Text>

                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>ÁREA DE PLANTIO</Text>
                    <TouchableOpacity
                        style={[styles.selectorBtn, { backgroundColor: colors.background, borderColor: colors.glassBorder }]}
                        onPress={() => openSelector('AREA')}
                    >
                        <Text style={[styles.selectorText, { color: talhao ? colors.textPrimary : colors.placeholder }]}>
                            {talhao || 'SELECIONAR ÁREA...'}
                        </Text>
                        <Ionicons name="map-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>

                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>CULTURA / VARIEDADE</Text>
                    <TouchableOpacity
                        style={[styles.selectorBtn, { backgroundColor: colors.background, borderColor: colors.glassBorder }]}
                        onPress={() => openSelector('CULTURA')}
                    >
                        <Text style={[styles.selectorText, { color: variedade ? colors.textPrimary : colors.placeholder }]}>
                            {variedade || 'SELECIONAR CULTURA...'}
                        </Text>
                        <Ionicons name="leaf-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>QTD ({selectedUnit})</Text>
                            <GlowInput
                                placeholder="0"
                                value={quantidade}
                                onChangeText={setQuantidade}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>PREVISÃO COLHEITA</Text>
                            <GlowInput
                                placeholder="MÊS/ANO"
                                value={previsao}
                                onChangeText={t => setPrevisao(t.toUpperCase())}
                            />
                        </View>
                    </View>

                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>OBSERVAÇÕES</Text>
                    <TextInput
                        style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.glassBorder, color: colors.textPrimary }]}
                        placeholder="Detalhes opcionais..."
                        placeholderTextColor={colors.placeholder}
                        value={observacao}
                        onChangeText={t => setObservacao(t.toUpperCase())}
                        multiline
                    />

                    <PrimaryButton
                        label="CONFIRMAR PLANTIO"
                        icon="leaf"
                        onPress={salvar}
                        style={{ marginTop: 10 }}
                    />
                </GlowCard>

                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>PLANTIOS RECENTES</Text>

                <FlatList
                    data={history}
                    keyExtractor={item => item.uuid}
                    renderItem={renderItem}
                    scrollEnabled={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="sprout-off" size={48} color={colors.glassBorder} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum plantio registrado.</Text>
                        </View>
                    }
                />
            </ScrollView>

            <Modal visible={modalVisible} animationType="slide" transparent={false}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <ScreenHeader title={`SELECIONAR ${modalType}`} onBack={() => setModalVisible(false)} />

                    <View style={{ padding: 20, flex: 1 }}>
                        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> :
                            <FlatList
                                data={items}
                                keyExtractor={i => i.uuid || i.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.itemRow, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <View>
                                            <Text style={[styles.itemText, { color: colors.textPrimary }]}>{item.nome}</Text>
                                            <Text style={[styles.itemSub, { color: colors.textSecondary }]}>{item.unidade || 'UN'}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                                    </TouchableOpacity>
                                )}
                            />
                        }
                    </View>
                </View>
            </Modal>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scrollContent: { padding: 20, paddingBottom: 100 },
    mainCard: { padding: 22, borderRadius: 28, borderWidth: 1 },
    cardTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 20 },
    fieldLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8, marginTop: 5 },

    selectorBtn: { height: 56, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 15 },
    selectorText: { fontSize: 15, fontWeight: '600' },

    row: { flexDirection: 'row', gap: 15 },
    textArea: { height: 80, borderRadius: 16, borderWidth: 1, padding: 15, fontSize: 14, textAlignVertical: 'top', marginBottom: 15 },

    sectionTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 30, marginBottom: 15, marginLeft: 5 },
    histItemContainer: { marginBottom: 12 },
    histCard: { padding: 18, borderRadius: 24, borderWidth: 1 },
    histHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    histCultura: { fontSize: 16, fontWeight: 'bold' },
    histLocal: { fontSize: 12, marginTop: 2 },
    dateBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    dateText: { fontSize: 11, fontWeight: 'bold' },

    histFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 12 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statText: { fontSize: 12, fontWeight: 'bold' },
    obsText: { fontSize: 11, fontStyle: 'italic', flex: 1, textAlign: 'right', marginLeft: 15 },

    emptyBox: { alignItems: 'center', marginTop: 40 },
    emptyText: { marginTop: 10, fontSize: 14, fontWeight: 'bold' },

    modalContent: { flex: 1 },
    itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderRadius: 16, marginBottom: 10, borderWidth: 1 },
    itemText: { fontSize: 16, fontWeight: 'bold' },
    itemSub: { fontSize: 12, marginTop: 2 }
});

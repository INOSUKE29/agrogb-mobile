import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useFocusEffect } from '@react-navigation/native';
import { insertPlantio, getCadastro, executeQuery } from '../database/database';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { showToast } from '../ui/Toast';
import { useTheme } from '../theme/ThemeContext';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import { Card } from '../ui/components/Card';
import AgroInput from '../ui/components/AgroInput';
import AgroButton from '../ui/components/AgroButton';

export default function PlantioScreen({ navigation }) {
    const { colors, isDark } = useTheme();
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
        } catch { } finally { setLoading(false); }
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
        } catch {
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
            <Card style={styles.histCard}>
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
                        <Text style={[styles.statText, { color: colors.textPrimary }]}>{item.quantidade_pes} {selectedUnit}</Text>
                    </View>
                    {item.observacao ? (
                        <Text style={[styles.obsText, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.observacao}
                        </Text>
                    ) : null}
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <AppContainer>
            <ScreenHeader title="PLANTIO & CULTURAS" onBack={() => navigation.goBack()} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Card style={styles.mainCard}>
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
                    <TouchableOpacity
                        style={[styles.selectorBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', borderColor: colors.border }]}
                        onPress={() => openSelector('CULTURA')}
                    >
                        <Text style={[styles.selectorText, { color: variedade ? colors.textPrimary : colors.placeholder }]}>
                            {variedade || 'SELECIONAR CULTURA...'}
                        </Text>
                        <Ionicons name="leaf-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>

                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <AgroInput
                                label={`QTD(${selectedUnit})`}
                                placeholder="0"
                                value={quantidade}
                                onChangeText={setQuantidade}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AgroInput
                                label="PREVISÃO COLHEITA"
                                placeholder="MÊS/ANO"
                                value={previsao}
                                onChangeText={t => setPrevisao(t.toUpperCase())}
                            />
                        </View>
                    </View>

                    <AgroInput
                        label="OBSERVAÇÕES ADICIONAIS"
                        placeholder="Detalhes opcionais..."
                        value={observacao}
                        onChangeText={t => setObservacao(t.toUpperCase())}
                        multiline
                        style={{ height: 100 }}
                    />

                    <AgroButton
                        title="CONFIRMAR PLANTIO"
                        icon="leaf"
                        onPress={salvar}
                        style={{ marginTop: 15 }}
                    />
                </Card>

                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>REGISTROS RECENTES</Text>

                <FlatList
                    data={history}
                    keyExtractor={item => item.uuid}
                    renderItem={renderItem}
                    scrollEnabled={false}
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
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.itemRow, { backgroundColor: colors.card, borderColor: colors.border }]}
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

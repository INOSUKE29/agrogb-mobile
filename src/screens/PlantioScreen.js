import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator, Animated } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useFocusEffect } from '@react-navigation/native';
import { insertPlantio, getCadastro, updatePlantio, deletePlantio, executeQuery } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DARK } from '../styles/darkTheme';

const up = (t, setter) => setter(t.toUpperCase());

export default function PlantioScreen({ navigation }) {
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

    const scaleAnim = new Animated.Value(1);
    const pressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
    const pressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

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
            Alert.alert('Sucesso', 'Plantio registrado!');
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

    return (
        <LinearGradient colors={['#0F3D2E', '#145C43']} style={{ flex: 1 }}>
            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>REGISTRO DE PLANTIO</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>NOVO CICLO DE PLANTIO</Text>

                    <Text style={styles.label}>ÁREA DE PLANTIO (ONDE?)</Text>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => openSelector('AREA')}>
                        <Text style={[styles.selectText, !talhao && { color: '#6B7280' }]}>
                            {talhao || 'SELECIONAR ÁREA...'}
                        </Text>
                        <Ionicons name="map-outline" size={18} color="#34D399" />
                    </TouchableOpacity>

                    <Text style={styles.label}>CULTURA (O QUE?)</Text>
                    <TouchableOpacity style={styles.selectBtn} onPress={() => openSelector('CULTURA')}>
                        <Text style={[styles.selectText, !variedade && { color: '#6B7280' }]}>
                            {variedade || 'SELECIONAR CULTURA...'}
                        </Text>
                        <Ionicons name="leaf-outline" size={18} color="#34D399" />
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>QTD ({selectedUnit})</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0"
                                placeholderTextColor="#6B7280"
                                value={quantidade}
                                onChangeText={setQuantidade}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.label}>PREVISÃO COLHEITA</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="MÊS/ANO"
                                placeholderTextColor="#6B7280"
                                value={previsao}
                                onChangeText={(t) => up(t, setPrevisao)}
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>OBSERVAÇÕES</Text>
                    <TextInput
                        style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                        placeholder="Detalhes do plantio..."
                        placeholderTextColor="#6B7280"
                        value={observacao}
                        onChangeText={(t) => up(t, setObservacao)}
                        multiline
                    />

                    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginTop: 6 }}>
                        <TouchableOpacity style={styles.btn} onPress={salvar} onPressIn={pressIn} onPressOut={pressOut}>
                            <Ionicons name="leaf" size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.btnText}>CONFIRMAR PLANTIO</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>

                {/* HISTÓRICO */}
                <Text style={styles.histTitle}>PLANTIOS RECENTES (TOQUE LONGO P/ OPÇÕES)</Text>
                {history.map(item => (
                    <TouchableOpacity key={item.uuid} style={styles.histCard} onLongPress={() => handleLongPress(item)}>
                        <View style={styles.histIcon}>
                            <Ionicons name="leaf" size={22} color="#FFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.histCultura}>{item.cultura}</Text>
                            <Text style={styles.histLocal}>{item.tipo_plantio} • {item.quantidade_pes} mudas</Text>
                        </View>
                        <Text style={styles.histDate}>{item.data.split('-').reverse().slice(0, 2).join('/')}</Text>
                    </TouchableOpacity>
                ))}

                <Modal visible={modalVisible} animationType="slide" transparent>
                    <View style={styles.overlay}>
                        <View style={styles.modalBg}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>SELECIONAR {modalType}</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <Ionicons name="close" size={24} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            {loading ? <ActivityIndicator color={DARK.glow} style={{ marginTop: 20 }} /> :
                                <FlatList
                                    data={items}
                                    keyExtractor={i => i.uuid || i.id.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity style={styles.itemRow} onPress={() => handleSelect(item)}>
                                            <Text style={styles.itemText}>{item.nome}</Text>
                                            <Text style={styles.itemSub}>{item.unidade || 'UN'}</Text>
                                        </TouchableOpacity>
                                    )}
                                    ListEmptyComponent={
                                        <Text style={styles.empty}>
                                            Nenhum item cadastrado como {modalType}.{'\n'}Vá em CADASTROS para adicionar.
                                        </Text>
                                    }
                                />
                            }
                        </View>
                    </View>
                </Modal>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    header: { paddingTop: 55, paddingBottom: 18, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 16, fontWeight: '700', color: DARK.textPrimary, letterSpacing: 0.5 },

    card: { backgroundColor: DARK.card, borderRadius: 22, padding: 22, borderWidth: 1, borderColor: DARK.glowBorder, marginBottom: 28, elevation: 5, shadowColor: '#00FF9C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10 },
    cardLabel: { fontSize: 11, fontWeight: '900', color: DARK.glow, letterSpacing: 1.5, marginBottom: 18 },

    label: { fontSize: 10, fontWeight: '900', color: DARK.textMuted, letterSpacing: 1.2, marginBottom: 8, marginTop: 4 },
    input: { backgroundColor: DARK.card, borderWidth: 1, borderColor: DARK.glowBorderStrong, borderRadius: 14, padding: 15, fontSize: 15, color: DARK.textPrimary, marginBottom: 16 },
    selectBtn: { backgroundColor: DARK.card, borderWidth: 1, borderColor: DARK.glowBorderStrong, borderRadius: 14, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    selectText: { fontSize: 14, fontWeight: '600', color: DARK.textPrimary },

    btn: { backgroundColor: DARK.glow, paddingVertical: 17, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', elevation: 4, shadowColor: '#00FF9C', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.45, shadowRadius: 8 },
    btnText: { color: '#061E1A', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

    histTitle: { fontSize: 11, fontWeight: '900', color: DARK.textMuted, letterSpacing: 1.2, marginBottom: 14, paddingLeft: 4 },
    histCard: { backgroundColor: DARK.card, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: DARK.glowBorder },
    histIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,255,156,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    histCultura: { fontSize: 15, fontWeight: '800', color: DARK.textPrimary },
    histLocal: { fontSize: 12, color: DARK.textSecondary, fontWeight: 'bold', marginTop: 2 },
    histDate: { fontSize: 12, fontWeight: '900', color: DARK.glow },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalBg: { backgroundColor: DARK.modal, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%', padding: 22, borderWidth: 1, borderColor: DARK.glowBorder },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: DARK.textPrimary },
    itemRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    itemText: { fontSize: 15, fontWeight: 'bold', color: DARK.textPrimary },
    itemSub: { fontSize: 11, color: DARK.textMuted, marginTop: 2 },
    empty: { textAlign: 'center', marginTop: 50, color: DARK.textMuted, paddingHorizontal: 40 }
});

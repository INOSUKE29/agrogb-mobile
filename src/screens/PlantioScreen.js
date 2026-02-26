import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator, StatusBar as RNStatusBar } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useFocusEffect } from '@react-navigation/native';
import { insertPlantio, getCadastro, executeQuery } from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../styles/theme'; // NEW THEME
import { AppCard } from '../ui/components/AppCard';
import { AppInput } from '../ui/components/AppInput';
import { AppButton } from '../ui/components/AppButton';

export default function PlantioScreen({ navigation }) {
    // State Logic (Preserved - DO NOT CHANGE)
    const [talhao, setTalhao] = useState(''); // Stores Name of Area
    const [quantidade, setQuantidade] = useState('');
    const [variedade, setVariedade] = useState('');
    const [previsao, setPrevisao] = useState('');
    const [history, setHistory] = useState([]);

    // Selection Modal State (Preserved)
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null); // 'AREA' or 'CULTURA'
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useFocusEffect(useCallback(() => { loadHistory(); }, []));

    const loadHistory = async () => {
        try {
            const res = await executeQuery('SELECT * FROM plantio ORDER BY data DESC LIMIT 10');
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
        }
        setModalVisible(false);
    };

    const salvar = async () => {
        if (!talhao || !quantidade || !variedade) {
            Alert.alert('Faltam dados', 'Preencha Área, Cultura e Quantidade.');
            return;
        }

        const dados = {
            uuid: uuidv4(),
            cultura: variedade.toUpperCase(),
            tipo_plantio: talhao.toUpperCase(),
            quantidade_pes: parseInt(quantidade) || 0,
            data: new Date().toISOString().split('T')[0],
            observacao: `PREV: ${previsao}`.toUpperCase()
        };

        try {
            await insertPlantio(dados);
            Alert.alert('Sucesso!', 'Plantio registrado com sucesso. 🌱');
            setQuantidade(''); setVariedade('');
            setPrevisao('');
            loadHistory();
        } catch (error) {
            Alert.alert('Erro', 'Falha ao registrar.');
        }
    };

    const handleLongPress = (item) => {
        Alert.alert('Opções', `Apagar registro de ${item.cultura}?`, [
            { text: 'Não', style: 'cancel' },
            {
                text: 'SIM, APAGAR',
                style: 'destructive',
                onPress: async () => {
                    await executeQuery('DELETE FROM plantio WHERE uuid = ?', [item.uuid]);
                    loadHistory();
                }
            }
        ]);
    };

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />
            <LinearGradient colors={[COLORS.backgroundDark, '#052e22']} style={StyleSheet.absoluteFill} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* 1. HEADER SIMPLIFICADO C/ VOLTAR */}
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.screenTitle}>CADASTRO DE PLANTIO</Text>
                        <Text style={styles.screenSub}>Preencha para alimentar o sistema</Text>
                    </View>
                </View>

                {/* 2. CARD ONDE (ÁREA) */}
                <AppCard>
                    <Text style={styles.sectionLabel}>📍 ÁREA DE PLANTIO (ONDE?)</Text>
                    <TouchableOpacity style={styles.inputCard} onPress={() => openSelector('AREA')}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(220, 38, 38, 0.2)' }]}>
                            <Ionicons name="map-outline" size={22} color="#EF4444" />
                        </View>
                        <Text style={[styles.inputText, !talhao && styles.placeholder]}>
                            {talhao || "Selecionar Área..."}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
                    </TouchableOpacity>
                </AppCard>

                {/* 3. CARD O QUE (CULTURA) */}
                <AppCard>
                    <Text style={styles.sectionLabel}>🌱 CULTURA (O QUE VAI PLANTAR?)</Text>
                    <TouchableOpacity style={styles.inputCard} onPress={() => openSelector('CULTURA')}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(22, 163, 74, 0.2)' }]}>
                            <MaterialCommunityIcons name="sprout-outline" size={22} color="#22C55E" />
                        </View>
                        <Text style={[styles.inputText, !variedade && styles.placeholder]}>
                            {variedade || "Selecionar Cultura..."}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color={COLORS.gray500} />
                    </TouchableOpacity>
                </AppCard>

                {/* 4. CARD QUANTIDADE (PÉS) */}
                <AppCard>
                    <Text style={styles.sectionLabel}>🔢 QUANTIDADE DE PÉS</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(37, 99, 235, 0.2)', marginRight: 12 }]}>
                            <Ionicons name="layers-outline" size={22} color="#3B82F6" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppInput
                                placeholder="0"
                                value={quantidade}
                                onChangeText={setQuantidade}
                                keyboardType="numeric"
                                style={{ marginBottom: 0 }}
                                variant="glass"
                            />
                        </View>
                        <Text style={styles.suffix}>Unidades</Text>
                    </View>
                </AppCard>

                {/* 5. CARD MISTO (DATAS / PREVISÃO / OBS) */}
                <AppCard>
                    <Text style={styles.sectionLabel}>📅 PREVISÃO / DETALHES</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <View style={[styles.iconBox, { backgroundColor: 'rgba(217, 119, 6, 0.2)', marginRight: 12 }]}>
                            <Ionicons name="calendar-outline" size={22} color="#F59E0B" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppInput
                                placeholder="Ex: Colheita em Setembro..."
                                value={previsao}
                                onChangeText={setPrevisao}
                                style={{ marginBottom: 0 }}
                                variant="glass"
                            />
                        </View>
                    </View>
                    <Text style={styles.helperText}>* Data de plantio será salva como HOJE automaticamente.</Text>
                </AppCard>

                {/* LISTA RECENTES */}
                {history.length > 0 && (
                    <Text style={styles.historyHeader}>ÚLTIMOS PLANTIOS</Text>
                )}
                {history.map(item => (
                    <TouchableOpacity key={item.uuid} style={styles.historyItem} onLongPress={() => handleLongPress(item)}>
                        <View style={styles.historyIconBox}>
                            <MaterialCommunityIcons name="seed-outline" size={24} color={COLORS.primaryLight} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.hTitle}>{item.cultura}</Text>
                            <Text style={styles.hSub}>{item.tipo_plantio} • {item.quantidade_pes} pés</Text>
                        </View>
                        <Ionicons name="ellipsis-vertical" size={16} color={COLORS.gray500} />
                    </TouchableOpacity>
                ))}

            </ScrollView>

            {/* BOTÃO FLUTUANTE DE AÇÃO */}
            <View style={styles.footerContainer}>
                <AppButton
                    title="SALVAR CADASTRO"
                    onPress={salvar}
                    style={{ marginBottom: 0 }}
                />
            </View>

            {/* MODAL */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SELECIONAR {modalType}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}><Ionicons name="close" size={24} color={COLORS.gray200} /></TouchableOpacity>
                        </View>
                        {loading ? <ActivityIndicator color={COLORS.primary} size="large" /> :
                            <FlatList
                                data={items}
                                keyExtractor={i => i.uuid || i.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.itemRow} onPress={() => handleSelect(item)}>
                                        <View style={[styles.miniIcon, { backgroundColor: modalType === 'AREA' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(22, 163, 74, 0.2)' }]}>
                                            <Ionicons name={modalType === 'AREA' ? "location-outline" : "leaf-outline"} size={16} color={modalType === 'AREA' ? "#EF4444" : "#22C55E"} />
                                        </View>
                                        <Text style={styles.itemText}>{item.nome}</Text>
                                        <Ionicons name="chevron-forward" size={18} color={COLORS.glassBorder} />
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>Nada encontrado. Cadastre primeiro.</Text>
                                }
                            />
                        }
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundDark },

    // HEADER
    headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },
    backButton: { marginRight: 15, padding: 5 },
    screenTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
    screenSub: { fontSize: 13, color: COLORS.gray500, marginTop: 2 },

    sectionLabel: { fontSize: 11, fontWeight: '800', color: COLORS.primaryLight, marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },

    // INPUTS Custom Style for Selector
    inputCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 12, marginBottom: 0, borderWidth: 1, borderColor: COLORS.glassBorder },
    iconBox: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    inputText: { flex: 1, fontSize: 16, color: COLORS.white, fontWeight: '600' },
    placeholder: { color: COLORS.gray500, fontWeight: 'normal' },
    suffix: { fontSize: 12, fontWeight: 'bold', color: COLORS.gray500, marginLeft: 10 },
    helperText: { fontSize: 11, color: COLORS.primaryLight, marginTop: 8, fontStyle: 'italic' },

    // HISTORY
    historyHeader: { marginLeft: 25, fontSize: 11, fontWeight: 'bold', color: COLORS.gray500, marginBottom: 10, marginTop: 5 },
    historyItem: { backgroundColor: COLORS.surface, marginHorizontal: 20, marginBottom: 8, borderRadius: 18, padding: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
    historyIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    hTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.white },
    hSub: { fontSize: 12, color: COLORS.gray500 },

    // FOOTER
    footerContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 30, backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 20, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },

    // MODAL
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalBg: { backgroundColor: COLORS.backgroundDark, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%', padding: 25, borderWidth: 1, borderColor: COLORS.glassBorder },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
    modalTitle: { fontWeight: 'bold', fontSize: 16, color: COLORS.white },
    itemRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.glassBorder, flexDirection: 'row', alignItems: 'center' },
    miniIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    itemText: { flex: 1, fontWeight: '600', color: COLORS.white, fontSize: 15 },
    emptyText: { textAlign: 'center', color: COLORS.gray500, marginTop: 20 }
});

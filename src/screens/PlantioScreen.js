import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList, ActivityIndicator } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useFocusEffect } from '@react-navigation/native';
import { insertPlantio, getCadastro, executeQuery } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';

export default function PlantioScreen({ navigation }) {
    const { theme } = useTheme();
    const [talhao, setTalhao] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [variedade, setVariedade] = useState('');
    const [previsao, setPrevisao] = useState('');
    const [observacao, setObservacao] = useState('');
    const [history, setHistory] = useState([]);

    // Selection Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null); // 'AREA' or 'CULTURA'
    const [items, setItems] = useState([]);
    const [loadingModal, setLoadingModal] = useState(false);
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
        setLoadingModal(true);
        setModalVisible(true);
        try {
            if (type === 'AREA') {
                const res = await executeQuery('SELECT * FROM talhoes WHERE is_deleted = 0 ORDER BY nome ASC');
                const rows = [];
                for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
                setItems(rows);
            } else {
                const all = await getCadastro();
                const filtered = all.filter(i => i.tipo === type);
                setItems(filtered);
            }
        } catch (e) { } finally { setLoadingModal(false); }
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
        Alert.alert('Gerenciar Plantio', `Deseja excluir: ${item.cultura} em ${item.tipo_plantio}?`, [
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
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', '#059669']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>CICLO DE PLANTIO</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={styles.headerSub}>Registro e controle de novas culturas em campo</Text>
            </LinearGradient>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <Card style={styles.formCard}>
                        <View style={styles.field}>
                            <Text style={styles.label}>ÁREA DE PLANTIO (ONDE?)</Text>
                            <TouchableOpacity 
                                style={[styles.selectBtn, { borderColor: talhao ? theme?.colors?.primary : '#E5E7EB' }]} 
                                onPress={() => openSelector('AREA')}
                            >
                                <Text style={[styles.selectText, !talhao && { color: '#9CA3AF' }]}>
                                    {talhao || "SELECIONAR ÁREA..."}
                                </Text>
                                <Ionicons name="map-outline" size={20} color={talhao ? theme?.colors?.primary : "#6B7280"} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.field}>
                            <Text style={styles.label}>CULTURA (O QUE?)</Text>
                            <TouchableOpacity 
                                style={[styles.selectBtn, { borderColor: variedade ? theme?.colors?.primary : '#E5E7EB' }]} 
                                onPress={() => openSelector('CULTURA')}
                            >
                                <Text style={[styles.selectText, !variedade && { color: '#9CA3AF' }]}>
                                    {variedade || "SELECIONAR CULTURA..."}
                                </Text>
                                <Ionicons name="leaf-outline" size={20} color={variedade ? theme?.colors?.primary : "#6B7280"} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <Text style={styles.label}>QTD ({selectedUnit})</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="0"
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
                                    value={previsao}
                                    onChangeText={(t) => setPrevisao(t.toUpperCase())}
                                />
                            </View>
                        </View>

                        <AgroButton 
                            title="REGISTRAR PLANTIO" 
                            onPress={salvar} 
                            style={{ marginTop: 20 }}
                        />
                    </Card>

                    <Text style={styles.histTitle}>HISTÓRICO RECENTE</Text>
                    {history.map(item => (
                        <Card 
                            key={item.uuid} 
                            style={styles.histCard} 
                            noPadding 
                            onLongPress={() => handleLongPress(item)}
                        >
                            <View style={styles.histContent}>
                                <View style={[styles.histIcon, { backgroundColor: theme?.colors?.primary + '20' }]}>
                                    <Ionicons name="leaf" size={22} color={theme?.colors?.primary} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 15 }}>
                                    <Text style={styles.histCultura}>{item.cultura}</Text>
                                    <Text style={styles.histLocal}>{item.tipo_plantio} • {item.quantidade_pes} mudas</Text>
                                </View>
                                <View style={styles.dateBadge}>
                                    <Text style={styles.histDate}>{item.data.split('-').reverse().slice(0, 2).join('/')}</Text>
                                </View>
                            </View>
                        </Card>
                    ))}
                </View>
            </ScrollView>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalBg}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>SELECIONAR {modalType}</Text>
                                <Text style={styles.modalSub}>Escolha um item cadastrado</Text>
                            </View>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        {loadingModal ? (
                            <ActivityIndicator color={theme?.colors?.primary} style={{ marginTop: 50 }} />
                        ) : (
                            <FlatList
                                data={items}
                                keyExtractor={i => i.uuid || i.id.toString()}
                                contentContainerStyle={{ paddingBottom: 50 }}
                                renderItem={({ item }) => (
                                    <TouchableOpacity style={styles.itemRow} onPress={() => handleSelect(item)}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemText}>{item.nome}</Text>
                                            <Text style={styles.itemSub}>{item.tipo || 'CADASTRO'}</Text>
                                        </View>
                                        <Text style={styles.unitBadge}>{item.unidade || 'UN'}</Text>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={
                                    <View style={styles.emptyState}>
                                        <Ionicons name="search-outline" size={48} color="#D1D5DB" />
                                        <Text style={styles.emptyText}>Nenhum {modalType} encontrado.</Text>
                                        <Text style={styles.emptySubText}>Vá em Cadastros para adicionar novos itens.</Text>
                                    </View>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },
    scroll: { flex: 1 },
    content: { padding: 20 },
    formCard: { padding: 20, marginBottom: 25 },
    field: { marginBottom: 15 },
    label: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 8, letterSpacing: 1 },
    selectBtn: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1 },
    selectText: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
    row: { flexDirection: 'row' },
    input: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, fontSize: 14, fontWeight: '700', color: '#1F2937', borderWidth: 1, borderColor: '#E5E7EB' },
    histTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 15, letterSpacing: 1.5 },
    histCard: { marginBottom: 12 },
    histContent: { padding: 15, flexDirection: 'row', alignItems: 'center' },
    histIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    histCultura: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
    histLocal: { fontSize: 11, color: '#6B7280', fontWeight: 'bold', marginTop: 2 },
    dateBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    histDate: { fontSize: 10, fontWeight: '900', color: '#9CA3AF' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalBg: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '75%', padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1F2937', letterSpacing: 0.5 },
    modalSub: { fontSize: 11, color: '#9CA3AF', fontWeight: 'bold', marginTop: 2 },
    closeBtn: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 12 },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    itemText: { fontSize: 15, fontWeight: '800', color: '#374151' },
    itemSub: { fontSize: 11, color: '#9CA3AF', fontWeight: 'bold', marginTop: 2 },
    unitBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 10, fontWeight: '900', color: '#6B7280' },
    emptyState: { alignItems: 'center', marginTop: 50 },
    emptyText: { marginTop: 15, fontSize: 15, fontWeight: '800', color: '#4B5563' },
    emptySubText: { marginTop: 5, fontSize: 13, color: '#9CA3AF', textAlign: 'center' }
});

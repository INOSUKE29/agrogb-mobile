import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useFocusEffect } from '@react-navigation/native';
import { insertPlantio, executeQuery } from '../database/database';
import SmartAutocomplete from '../components/common/SmartAutocomplete';
import { TalhaoLibraryService, CropLibraryService } from '../services/LibraryServices';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

// Design System
import AgroButton from '../components/common/AgroButton';

export default function PlantioScreen({ navigation }) {
    const { theme } = useTheme();
    const [talhao, setTalhao] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [variedade, setVariedade] = useState('');
    const [previsao, setPrevisao] = useState('');
    const [observacao, setObservacao] = useState('');
    const [history, setHistory] = useState([]);

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
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#0B121E' }]}>
            <LinearGradient colors={['#111827', '#0F172A']} style={styles.header}>
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
                    <LinearGradient colors={['#1F2937', '#111827']} style={styles.formCard}>
                                                <SmartAutocomplete
                            label="ÁREA DE PLANTIO (ONDE?) *"
                            value={talhao}
                            onSelect={val => setTalhao(val ? val.nome : '')}
                            service={TalhaoLibraryService}
                            title="SELECIONAR ÁREA/TALHÃO"
                            placeholder="SELECIONAR ÁREA..."
                            icon="map-outline"
                            quickAddFields={[
                                { key: 'nome', label: 'NOME DO TALHÃO', placeholder: 'Ex: Talhão Leste 1' },
                                { key: 'area_ha', label: 'ÁREA (HA)', placeholder: 'Ex: 10.5', keyboardType: 'decimal-pad' }
                            ]}
                        />

                        <SmartAutocomplete
                            label="CULTURA (O QUE?) *"
                            value={variedade}
                            onSelect={val => {
                                setVariedade(val ? val.nome : '');
                                if (val?.unidade) setSelectedUnit(val.unidade);
                            }}
                            service={CropLibraryService}
                            title="SELECIONAR CULTURA"
                            placeholder="SELECIONAR CULTURA..."
                            icon="leaf-outline"
                            quickAddFields={[
                                { key: 'nome', label: 'NOME DA CULTURA', placeholder: 'Ex: Café Robusta' }
                            ]}
                        />

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
                    </LinearGradient>

                    <Text style={styles.histTitle}>HISTÓRICO RECENTE</Text>
                    {history.map(item => (
                        <TouchableOpacity key={item.uuid} activeOpacity={0.8} onLongPress={() => handleLongPress(item)}>
                            <LinearGradient colors={['#1F2937', '#111827']} style={styles.histCard}>
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
                            </LinearGradient>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            
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
    content: { padding: 20, paddingBottom: 100 },
    formCard: { padding: 20, marginBottom: 25, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    field: { marginBottom: 15 },
    label: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 8, letterSpacing: 1 },
    selectBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    selectText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
    row: { flexDirection: 'row' },
    input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14, fontSize: 14, fontWeight: '700', color: '#FFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    histTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 15, letterSpacing: 1.5 },
    histCard: { marginBottom: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    histContent: { padding: 15, flexDirection: 'row', alignItems: 'center' },
    histIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    histCultura: { fontSize: 15, fontWeight: '800', color: '#FFF' },
    histLocal: { fontSize: 11, color: '#9CA3AF', fontWeight: 'bold', marginTop: 2 },
    dateBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    histDate: { fontSize: 10, fontWeight: '900', color: '#9CA3AF' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalBg: { backgroundColor: '#1F2937', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '75%', padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
    modalSub: { fontSize: 11, color: '#9CA3AF', fontWeight: 'bold', marginTop: 2 },
    closeBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 12 },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    itemText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
    itemSub: { fontSize: 11, color: '#9CA3AF', fontWeight: 'bold', marginTop: 2 },
    unitBadge: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, fontSize: 10, fontWeight: '900', color: '#9CA3AF' },
    emptyState: { alignItems: 'center', marginTop: 50 },
    emptyText: { marginTop: 15, fontSize: 15, fontWeight: '800', color: '#9CA3AF' },
    emptySubText: { marginTop: 5, fontSize: 13, color: '#6B7280', textAlign: 'center' }
});

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { useFocusEffect } from '@react-navigation/native';
import { insertPlantio, getCadastro, executeQuery } from '../../database/database';

export default function CadastroPlantios() {
    const [talhao, setTalhao] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [variedade, setVariedade] = useState('');
    const [history, setHistory] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [items, setItems] = useState([]);

    useFocusEffect(useCallback(() => { loadHistory(); }, []));

    const loadHistory = async () => {
        try {
            const res = await executeQuery('SELECT * FROM plantio ORDER BY data DESC LIMIT 20');
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setHistory(rows);
        } catch { }
    };

    const openSelector = async (type) => {
        setModalType(type); setModalVisible(true);
        try {
            const all = await getCadastro();
            setItems(all.filter(i => i.tipo === type));
        } catch { }
    };

    const handleSelect = (item) => {
        if (modalType === 'AREA') { setTalhao(item.nome); }
        else { setVariedade(item.nome); }
        setModalVisible(false);
    };

    const salvar = async () => {
        if (!talhao || !quantidade || !variedade) return Alert.alert('Atenção', 'Preencha tudo.');
        try {
            await insertPlantio({
                uuid: uuidv4(),
                cultura: variedade.toUpperCase(),
                tipo_plantio: talhao.toUpperCase(),
                quantidade_pes: parseInt(quantidade) || 0,
                data: new Date().toISOString().split('T')[0]
            });
            Alert.alert('Sucesso', 'Plantio salvo!'); setTalhao(''); setQuantidade(''); setVariedade(''); loadHistory();
        } catch { Alert.alert('Erro', 'Falha.'); }
    };

    return (
        <ScrollView style={styles.container}>
            <TouchableOpacity style={styles.selectBtn} onPress={() => openSelector('AREA')}><Text>{talhao || "SELECIONAR ÁREA"}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.selectBtn} onPress={() => openSelector('CULTURA')}><Text>{variedade || "SELECIONAR CULTURA"}</Text></TouchableOpacity>
            <TextInput style={styles.input} placeholder="QTD DE PÉS" value={quantidade} onChangeText={setQuantidade} keyboardType="numeric" />
            <TouchableOpacity style={styles.btn} onPress={salvar}><Text style={{ color: '#FFF' }}>SALVAR</Text></TouchableOpacity>
            {history.map(item => (
                <View key={item.uuid} style={styles.card}><Text>{item.cultura} em {item.tipo_plantio}</Text></View>
            ))}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.overlay}><View style={styles.modal}>
                    <FlatList data={items} keyExtractor={i => i.uuid} renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => handleSelect(item)} style={styles.item}><Text>{item.nome}</Text></TouchableOpacity>
                    )} />
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 10, alignItems: 'center' }}><Text style={{ color: 'red' }}>FECHAR</Text></TouchableOpacity>
                </View></View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#F9FAFB' },
    selectBtn: { padding: 15, backgroundColor: '#FFF', marginBottom: 10, borderRadius: 10, borderWidth: 1, borderColor: '#DDD' },
    input: { padding: 15, backgroundColor: '#FFF', marginBottom: 10, borderRadius: 10, borderWidth: 1, borderColor: '#DDD' },
    btn: { backgroundColor: '#15803D', padding: 15, borderRadius: 10, alignItems: 'center' },
    card: { padding: 15, backgroundColor: '#FFF', marginTop: 10, borderRadius: 10, elevation: 2 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modal: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, maxHeight: '80%' },
    item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' }
});

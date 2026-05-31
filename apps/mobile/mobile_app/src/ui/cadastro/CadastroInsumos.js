import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCadastro, executeQuery } from '../../database/database';
import { useTheme } from '../../theme/ThemeContext';

export default function CadastroInsumos() {
    useTheme();
    const [history, setHistory] = useState([]);
    const [items, setItems] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);

    const loadData = async () => {
        try {
            const all = await getCadastro();
            setItems(all.filter(i => i.tipo === 'INSUMO'));
            const res = await executeQuery('SELECT * FROM plantio ORDER BY data DESC LIMIT 10');
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setHistory(rows);
        } catch { }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const handleSelect = (item) => {
        setModalVisible(false);
        Alert.alert('Insumo', `Selecionado: ${item.nome}`);
    };

    return (
        <View style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
                <TouchableOpacity style={styles.btn} onPress={() => setModalVisible(true)}><Text style={{ color: '#FFF' }}>SELECIONAR INSUMO</Text></TouchableOpacity>
                {history.map(h => <View key={h.uuid} style={styles.card}><Text>{h.cultura}</Text></View>)}
                <Modal visible={modalVisible} transparent animationType="fade">
                    <View style={styles.overlay}><View style={styles.modal}>
                        <FlatList data={items} keyExtractor={i => i.uuid} renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => handleSelect(item)} style={styles.item}><Text>{item.nome}</Text></TouchableOpacity>
                        )} />
                        <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: 'red', textAlign: 'center', marginTop: 10 }}>FECHAR</Text></TouchableOpacity>
                    </View></View>
                </Modal>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    btn: { backgroundColor: '#15803D', padding: 15, borderRadius: 10, alignItems: 'center' },
    card: { padding: 15, backgroundColor: '#FFF', marginTop: 10, borderRadius: 10 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modal: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, maxHeight: '80%' },
    item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#EEE' }
});

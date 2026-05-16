import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { executeQuery } from '../database/database';
import { v4 as uuidv4 } from 'uuid';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

export default function EquipesScreen({ navigation }) {
    const { theme } = useTheme();
    const [equipe, setEquipe] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState({ nome: '', cargo: 'OPERADOR', documento: '' });

    useFocusEffect(useCallback(() => {
        loadData();
    }, []));

    const loadData = async () => {
        try {
            const res = await executeQuery('SELECT * FROM equipes WHERE is_deleted = 0 ORDER BY nome ASC');
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setEquipe(rows);
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        if (!form.nome) return Alert.alert('Aviso', 'Nome é obrigatório');
        try {
            const now = new Date().toISOString();
            await executeQuery(
                'INSERT INTO equipes (uuid, nome, cargo, documento, last_updated) VALUES (?, ?, ?, ?, ?)',
                [uuidv4(), form.nome.toUpperCase(), form.cargo, form.documento, now]
            );
            setModalVisible(false);
            setForm({ nome: '', cargo: 'OPERADOR', documento: '' });
            loadData();
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar colaborador'); }
    };

    const renderItem = ({ item }) => (
        <Card style={styles.itemCard}>
            <View style={styles.itemHeader}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{item.nome.substring(0, 2)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.nome}</Text>
                    <View style={styles.badgeRow}>
                        <View style={[styles.badge, { backgroundColor: item.cargo === 'GERENTE' ? '#EEF2FF' : '#F3F4F6' }]}>
                            <Text style={[styles.badgeText, { color: item.cargo === 'GERENTE' ? '#4F46E5' : '#6B7280' }]}>{item.cargo}</Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity onPress={() => Alert.alert('Ações', 'Deseja editar ou remover?', [{ text: 'Editar' }, { text: 'Remover', style: 'destructive' }])}>
                    <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={['#4F46E5', '#3730A3']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>GESTÃO DE EQUIPES</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Ionicons name="person-add" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSub}>Hierarquia e controle de acesso</Text>
            </LinearGradient>

            <FlatList
                data={equipe}
                renderItem={renderItem}
                keyExtractor={item => item.uuid}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>Nenhum colaborador cadastrado.</Text>}
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>NOVO COLABORADOR</Text>
                        <AgroInput label="NOME COMPLETO" value={form.nome} onChangeText={t => setForm({...form, nome: t})} />
                        <AgroInput label="DOCUMENTO (CPF/RG)" value={form.documento} onChangeText={t => setForm({...form, documento: t})} />
                        
                        <Text style={styles.label}>CARGO / NÍVEL</Text>
                        <View style={styles.cargoRow}>
                            {['GERENTE', 'CAPATAZ', 'OPERADOR'].map(c => (
                                <TouchableOpacity 
                                    key={c} 
                                    style={[styles.cargoBtn, form.cargo === c && styles.cargoBtnActive]}
                                    onPress={() => setForm({...form, cargo: c})}
                                >
                                    <Text style={[styles.cargoText, form.cargo === c && styles.cargoTextActive]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalButtons}>
                            <AgroButton title="CANCELAR" variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 10 }} />
                            <AgroButton title="SALVAR" onPress={handleSave} style={{ flex: 1 }} />
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', textAlign: 'center' },
    list: { padding: 20 },
    itemCard: { marginBottom: 12, padding: 15 },
    itemHeader: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    itemName: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
    badgeRow: { flexDirection: 'row', marginTop: 4 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeText: { fontSize: 9, fontWeight: '900' },
    empty: { textAlign: 'center', marginTop: 50, color: '#9CA3AF', fontWeight: 'bold' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
    modal: { backgroundColor: '#FFF', borderRadius: 25, padding: 25 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1F2937', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 10, letterSpacing: 1 },
    cargoRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
    cargoBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: '#F3F4F6' },
    cargoBtnActive: { backgroundColor: '#4F46E5' },
    cargoText: { fontSize: 9, fontWeight: '900', color: '#6B7280' },
    cargoTextActive: { color: '#FFF' },
    modalButtons: { flexDirection: 'row', marginTop: 10 }
});

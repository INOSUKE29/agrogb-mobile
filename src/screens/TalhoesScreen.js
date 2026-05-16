import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Modal, 
    TextInput, 
    Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { executeQuery } from '../database/database';
import { v4 as uuidv4 } from 'uuid';
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

export default function TalhoesScreen({ navigation }) {
    const { theme } = useTheme();
    const [talhoes, setTalhoes] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ nome: '', area_ha: '', observacao: '' });

    useEffect(() => {
        loadTalhoes();
    }, []);

    const loadTalhoes = async () => {
        try {
            const res = await executeQuery('SELECT * FROM talhoes WHERE is_deleted = 0 ORDER BY nome ASC');
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setTalhoes(rows);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async () => {
        if (!form.nome) return Alert.alert('Aviso', 'Nome é obrigatório');
        try {
            if (editItem) {
                await executeQuery(
                    'UPDATE talhoes SET nome = ?, area_ha = ?, observacao = ?, last_updated = ? WHERE uuid = ?',
                    [form.nome.toUpperCase(), parseFloat(form.area_ha) || 0, form.observacao.toUpperCase(), new Date().toISOString(), editItem.uuid]
                );
            } else {
                await executeQuery(
                    'INSERT INTO talhoes (uuid, nome, area_ha, observacao, last_updated) VALUES (?, ?, ?, ?, ?)',
                    [uuidv4(), form.nome.toUpperCase(), parseFloat(form.area_ha) || 0, form.observacao.toUpperCase(), new Date().toISOString()]
                );
            }
            setModalVisible(false);
            setEditItem(null);
            setForm({ nome: '', area_ha: '', observacao: '' });
            loadTalhoes();
        } catch (e) {
            Alert.alert('Erro', 'Falha ao salvar talhão');
        }
    };

    const handleDelete = (item) => {
        Alert.alert('Excluir', `Deseja excluir o talhão ${item.nome}?`, [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'EXCLUIR', 
                style: 'destructive',
                onPress: async () => {
                    await executeQuery('UPDATE talhoes SET is_deleted = 1 WHERE uuid = ?', [item.uuid]);
                    loadTalhoes();
                }
            }
        ]);
    };

    const renderItem = ({ item }) => (
        <Card style={styles.itemCard}>
            <View style={styles.itemHeader}>
                <View style={styles.iconContainer}>
                    <Ionicons name="map-outline" size={24} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.nome}</Text>
                    <Text style={styles.itemSub}>{item.area_ha} ha • {item.status}</Text>
                </View>
                <TouchableOpacity onPress={() => { setEditItem(item); setForm({ ...item, area_ha: String(item.area_ha) }); setModalVisible(true); }}>
                    <Ionicons name="create-outline" size={20} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={{ marginLeft: 15 }}>
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={['#059669', '#10B981']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>GESTÃO DE TALHÕES</Text>
                    <TouchableOpacity onPress={() => { setEditItem(null); setForm({ nome: '', area_ha: '', observacao: '' }); setModalVisible(true); }}>
                        <Ionicons name="add-circle" size={32} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <FlatList
                data={talhoes}
                renderItem={renderItem}
                keyExtractor={item => item.uuid}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>Nenhum talhão cadastrado.</Text>}
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>{editItem ? 'EDITAR TALHÃO' : 'NOVO TALHÃO'}</Text>
                        <AgroInput label="NOME DO TALHÃO" value={form.nome} onChangeText={t => setForm({...form, nome: t})} />
                        <AgroInput label="ÁREA (HA)" value={form.area_ha} keyboardType="numeric" onChangeText={t => setForm({...form, area_ha: t})} />
                        <AgroInput label="OBSERVAÇÕES" value={form.observacao} multiline numberOfLines={3} onChangeText={t => setForm({...form, observacao: t})} />
                        
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
    header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    list: { padding: 20 },
    itemCard: { marginBottom: 12, padding: 15 },
    itemHeader: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    itemName: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
    itemSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    empty: { textAlign: 'center', marginTop: 50, color: '#9CA3AF', fontWeight: '600' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
    modal: { backgroundColor: '#FFF', borderRadius: 25, padding: 25 },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#1F2937', marginBottom: 20, textAlign: 'center' },
    modalButtons: { flexDirection: 'row', marginTop: 20 }
});

import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Modal, 
    Alert,
    StatusBar,
    SafeAreaView,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { executeQuery } from '../database/database';
import { v4 as uuidv4 } from 'uuid';
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

export default function FornecedoresScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    
    const [fornecedores, setFornecedores] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ nome: '', contato: '', telefone: '', email: '', observacao: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await executeQuery('SELECT * FROM fornecedores WHERE is_deleted = 0 ORDER BY nome ASC');
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setFornecedores(rows);
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        if (!form.nome) return Alert.alert('Aviso', 'Nome é obrigatório');
        try {
            const now = new Date().toISOString();
            if (editItem) {
                await executeQuery(
                    'UPDATE fornecedores SET nome = ?, contato = ?, telefone = ?, email = ?, observacao = ?, last_updated = ? WHERE uuid = ?',
                    [form.nome.toUpperCase(), form.contato.toUpperCase(), form.telefone, form.email.toLowerCase(), form.observacao.toUpperCase(), now, editItem.uuid]
                );
            } else {
                await executeQuery(
                    'INSERT INTO fornecedores (uuid, nome, contato, telefone, email, observacao, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [uuidv4(), form.nome.toUpperCase(), form.contato.toUpperCase(), form.telefone, form.email.toLowerCase(), form.observacao.toUpperCase(), now]
                );
            }
            setModalVisible(false);
            setEditItem(null);
            setForm({ nome: '', contato: '', telefone: '', email: '', observacao: '' });
            loadData();
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar fornecedor'); }
    };

    const handleDelete = (item) => {
        Alert.alert('Excluir', `Deseja excluir o fornecedor ${item.nome}?`, [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'EXCLUIR', 
                style: 'destructive',
                onPress: async () => {
                    await executeQuery('UPDATE fornecedores SET is_deleted = 1 WHERE uuid = ?', [item.uuid]);
                    loadData();
                }
            }
        ]);
    };

    const isDark = theme?.theme_mode === 'dark';
    const textColor = activeColors.text || '#1E293B';
    const textMutedColor = activeColors.textMuted || '#64748B';
    const cardBg = activeColors.card || '#FFFFFF';
    const borderCol = activeColors.border || 'rgba(0,0,0,0.1)';

    const renderItem = ({ item }) => (
        <Card style={styles.itemCard}>
            <View style={styles.itemHeader}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.08)' }]}>
                    <Ionicons name="business-outline" size={24} color={activeColors.primary || '#10B981'} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: textColor }]}>{item.nome}</Text>
                    <Text style={[styles.itemSub, { color: textMutedColor }]}>{item.contato || 'Sem contato'} • {item.telefone || 'Sem fone'}</Text>
                </View>
                <TouchableOpacity onPress={() => { setEditItem(item); setForm(item); setModalVisible(true); }}>
                    <Ionicons name="create-outline" size={20} color={textMutedColor} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={{ marginLeft: 15 }}>
                    <Ionicons name="trash-outline" size={20} color={activeColors.error || '#EF4444'} />
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={[activeColors.primary || '#10B981', activeColors.primaryDeep || '#064E3B']} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>FORNECEDORES</Text>
                        <TouchableOpacity onPress={() => { setEditItem(null); setForm({ nome: '', contato: '', telefone: '', email: '', observacao: '' }); setModalVisible(true); }}>
                            <Ionicons name="add-circle" size={32} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <FlatList
                data={fornecedores}
                renderItem={renderItem}
                keyExtractor={item => item.uuid}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={[styles.empty, { color: textMutedColor }]}>Nenhum fornecedor cadastrado.</Text>}
            />

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modal, { backgroundColor: cardBg }]}>
                        <Text style={[styles.modalTitle, { color: textColor }]}>{editItem ? 'EDITAR FORNECEDOR' : 'NOVO FORNECEDOR'}</Text>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <AgroInput label="NOME / RAZÃO SOCIAL" value={form.nome} onChangeText={t => setForm({...form, nome: t})} />
                            <AgroInput label="NOME DO CONTATO" value={form.contato} onChangeText={t => setForm({...form, contato: t})} />
                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <AgroInput label="TELEFONE" value={form.telefone} keyboardType="phone-pad" onChangeText={t => setForm({...form, telefone: t})} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <AgroInput label="EMAIL" value={form.email} keyboardType="email-address" autoCapitalize="none" onChangeText={t => setForm({...form, email: t})} />
                                </View>
                            </View>
                            <AgroInput label="OBSERVAÇÕES" value={form.observacao} multiline numberOfLines={3} onChangeText={t => setForm({...form, observacao: t})} />
                            
                            <View style={styles.modalButtons}>
                                <AgroButton title="CANCELAR" variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 10 }} />
                                <AgroButton title="SALVAR" onPress={handleSave} style={{ flex: 1 }} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 40, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: { padding: 20 },
    itemCard: { marginBottom: 12, padding: 15 },
    itemHeader: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    itemName: { fontSize: 15, fontWeight: '800' },
    itemSub: { fontSize: 11, marginTop: 2, fontWeight: '600' },
    empty: { textAlign: 'center', marginTop: 50, fontWeight: '600' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 25 },
    modal: { borderRadius: 25, padding: 25, maxHeight: '80%' },
    modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
    modalButtons: { flexDirection: 'row', marginTop: 20, marginBottom: 10 },
    row: { flexDirection: 'row' }
});

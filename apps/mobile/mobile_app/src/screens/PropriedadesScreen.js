import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { executeQuery } from '../database/database';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';
import AgroOptionsModal from '../components/common/AgroOptionsModal';
import AgroStateOverlay from '../components/common/AgroStateOverlay';
import SearchableSelect from '../components/common/SearchableSelect';

export default function PropriedadesScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const isDark = theme?.theme_mode === 'dark';

    const [propriedades, setPropriedades] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ nome: '', cidade: '', estado: '', area_total: '', owner_id: '' });
    const [selectedItemActions, setSelectedItemActions] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Load Farms joined with Clientes
            const resFarms = await executeQuery(`
                SELECT f.*, c.nome as proprietario_nome 
                FROM farms f 
                LEFT JOIN clientes c ON f.owner_id = c.uuid 
                WHERE f.is_deleted = 0 
                ORDER BY f.nome ASC
            `);
            const rowsFarms = [];
            for (let i = 0; i < resFarms.rows.length; i++) rowsFarms.push(resFarms.rows.item(i));
            setPropriedades(rowsFarms);

            // Load Clientes for the dropdown
            const resClientes = await executeQuery('SELECT uuid as id, nome as name FROM clientes WHERE is_deleted = 0 ORDER BY nome ASC');
            const rowsClientes = [];
            for (let i = 0; i < resClientes.rows.length; i++) rowsClientes.push(resClientes.rows.item(i));
            setClientes(rowsClientes);
        } catch (e) {
            console.error(e);
        }
    };

    const handleEdit = (item) => {
        setEditItem(item);
        setForm({ 
            nome: item.nome, 
            cidade: item.cidade || '', 
            estado: item.estado || '', 
            area_total: String(item.area_total || ''),
            owner_id: item.owner_id || ''
        });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.nome || !form.owner_id) {
            return Alert.alert('Aviso', 'Nome e Proprietário são obrigatórios');
        }

        try {
            const json = await AsyncStorage.getItem('user_session');
            const session = json ? JSON.parse(json) : { id: 'unknown' };
            const now = new Date().toISOString();

            if (editItem) {
                // Update existing
                await executeQuery(
                    `UPDATE farms 
                     SET nome = ?, cidade = ?, estado = ?, area_total = ?, owner_id = ?, updated_by = ?, last_updated = ?, sync_status = 0 
                     WHERE uuid = ?`,
                    [(form.nome || '').trim(), (form.cidade || '').trim(), (form.estado || '').trim(), parseFloat(form.area_total) || 0, form.owner_id, session.id, now, editItem.uuid]
                );

                const payload = JSON.stringify({
                    uuid: editItem.uuid,
                    nome: (form.nome || '').trim(),
                    cidade: (form.cidade || '').trim(),
                    estado: (form.estado || '').trim(),
                    area_total: parseFloat(form.area_total) || 0,
                    owner_id: form.owner_id,
                    updated_by: session.id
                });

                await executeQuery(
                    `INSERT INTO sync_outbox (uuid, tabela, registro_uuid, acao, payload_json, status, criado_em) VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)`,
                    [uuidv4(), 'farms', editItem.uuid, 'UPDATE', payload, now]
                );

            } else {
                // Insert new
                const farmUuid = uuidv4();
                await executeQuery(
                    `INSERT INTO farms (uuid, owner_id, nome, cidade, estado, area_total, source_platform, created_by, last_updated, sync_status) 
                     VALUES (?, ?, ?, ?, ?, ?, 'mobile', ?, ?, 0)`,
                    [farmUuid, form.owner_id, (form.nome || '').trim(), (form.cidade || '').trim(), (form.estado || '').trim(), parseFloat(form.area_total) || 0, session.id, now]
                );

                const payload = JSON.stringify({
                    uuid: farmUuid,
                    owner_id: form.owner_id,
                    nome: (form.nome || '').trim(),
                    cidade: (form.cidade || '').trim(),
                    estado: (form.estado || '').trim(),
                    area_total: parseFloat(form.area_total) || 0,
                    source_platform: 'mobile',
                    created_by: session.id
                });

                await executeQuery(
                    `INSERT INTO sync_outbox (uuid, tabela, registro_uuid, acao, payload_json, status, criado_em) VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)`,
                    [uuidv4(), 'farms', farmUuid, 'INSERT', payload, now]
                );
            }
            
            setModalVisible(false);
            setEditItem(null);
            setForm({ nome: '', cidade: '', estado: '', area_total: '', owner_id: '' });
            loadData();
        } catch (e) {
            Alert.alert('Erro', 'Falha ao salvar propriedade');
        }
    };

    const handleDelete = (item) => {
        Alert.alert('Excluir', `Deseja excluir a propriedade ${item.nome}?`, [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'EXCLUIR', 
                style: 'destructive',
                onPress: async () => {
                    const now = new Date().toISOString();
                    await executeQuery('UPDATE farms SET is_deleted = 1, sync_status = 0, last_updated = ? WHERE uuid = ?', [now, item.uuid]);
                    
                    const payload = JSON.stringify({ uuid: item.uuid, is_deleted: 1 });
                    await executeQuery(
                        `INSERT INTO sync_outbox (uuid, tabela, registro_uuid, acao, payload_json, status, criado_em) VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)`,
                        [uuidv4(), 'farms', item.uuid, 'UPDATE', payload, now]
                    );

                    loadData();
                }
            }
        ]);
    };

    const navigateToAreas = (farm) => {
        navigation.navigate('Areas', { farmId: farm.uuid, farmName: farm.nome });
    };

    const renderItem = ({ item }) => (
        <Card 
            style={styles.itemCard}
            onPress={() => navigateToAreas(item)}
            onLongPress={() => setSelectedItemActions(item)}
        >
            <View style={styles.itemHeader}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1F2937' : '#D1FAE5' }]}>
                    <Ionicons name="home-outline" size={22} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: activeColors.text || '#1F2937' }]}>{item.nome}</Text>
                    <Text style={[styles.itemSub, { color: activeColors.textSub || '#6B7280' }]}>
                        {item.proprietario_nome ? `Cliente: ${item.proprietario_nome}` : 'Cliente não informado'}
                    </Text>
                    <Text style={[styles.itemSub, { color: activeColors.textSub || '#6B7280', fontSize: 11 }]}>
                        {item.cidade ? `${item.cidade}-${item.estado}` : 'Local não informado'} • {item.area_total} ha
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={activeColors.textSub || '#9CA3AF'} />
            </View>
        </Card>
    );

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <LinearGradient colors={['#059669', '#10B981']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>PROPRIEDADES</Text>
                    <TouchableOpacity onPress={() => { setEditItem(null); setForm({ nome: '', cidade: '', estado: '', area_total: '', owner_id: '' }); setModalVisible(true); }}>
                        <Ionicons name="add-circle" size={32} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <FlatList
                data={propriedades}
                renderItem={renderItem}
                keyExtractor={item => item.uuid}
                contentContainerStyle={propriedades.length === 0 ? {flex: 1} : styles.list}
                ListEmptyComponent={
                    <AgroStateOverlay 
                        state="empty" 
                        message="Você não gerencia nenhuma fazenda ainda. Adicione uma propriedade para começar."
                        icon="home-outline"
                        onRetry={() => { setEditItem(null); setForm({ nome: '', cidade: '', estado: '', area_total: '', owner_id: '' }); setModalVisible(true); }}
                    />
                }
            />

            <TouchableOpacity style={[styles.fab, { backgroundColor: '#10B981' }]} onPress={() => { setEditItem(null); setForm({ nome: '', cidade: '', estado: '', area_total: '', owner_id: '' }); setModalVisible(true); }}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center' }}>
                        <View style={[styles.modal, { backgroundColor: activeColors.cardBg || '#FFFFFF' }]}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={[styles.modalTitle, { color: activeColors.text || '#1F2937' }]}>{editItem ? 'EDITAR PROPRIEDADE' : 'NOVA PROPRIEDADE'}</Text>
                                
                                <SearchableSelect 
                                    label="CLIENTE (PROPRIETÁRIO) *"
                                    value={form.owner_id}
                                    options={clientes}
                                    onSelect={(id) => setForm({...form, owner_id: id})}
                                    icon="person-outline"
                                    allowCustom={false} // Force FK
                                />

                                <AgroInput label="NOME DA FAZENDA *" value={form.nome} onChangeText={t => setForm({...form, nome: t})} icon="home-outline" />
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 2 }}>
                                        <AgroInput label="CIDADE" value={form.cidade} onChangeText={t => setForm({...form, cidade: t})} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AgroInput label="UF" value={form.estado} onChangeText={t => setForm({...form, estado: t})} maxLength={2} />
                                    </View>
                                </View>
                                <AgroInput label="ÁREA TOTAL (HA)" value={form.area_total} keyboardType="numeric" onChangeText={t => setForm({...form, area_total: t})} icon="scan-outline" />
                                
                                <View style={styles.modalButtons}>
                                    <AgroButton title="CANCELAR" variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1, marginRight: 10 }} />
                                    <AgroButton title="SALVAR" onPress={handleSave} style={{ flex: 1 }} color="#10B981" />
                                </View>
                            </ScrollView>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* OPTIONS MODAL DE TOQUE LONGO */}
            <AgroOptionsModal
                visible={!!selectedItemActions}
                onClose={() => setSelectedItemActions(null)}
                title={selectedItemActions?.nome || ''}
                subtitle={`${selectedItemActions?.area_total || 0} ha`}
                onEdit={() => handleEdit(selectedItemActions)}
                onDelete={() => handleDelete(selectedItemActions)}
                editLabel="Editar Fazenda"
                deleteLabel="Excluir Fazenda"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    list: { padding: 20, paddingBottom: 100 },
    itemCard: { marginBottom: 12, padding: 15 },
    itemHeader: { flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    itemName: { fontSize: 16, fontWeight: '800' },
    itemSub: { fontSize: 13, marginTop: 2 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
    modal: { borderRadius: 20, padding: 20, maxHeight: '90%' },
    modalTitle: { fontSize: 16, fontWeight: '900', marginBottom: 20, textAlign: 'center', letterSpacing: 0.5 },
    modalButtons: { flexDirection: 'row', marginTop: 20 },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#10B981', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8 }
});

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

export default function AreasScreen({ route, navigation }) {
    const { farmId, farmName } = route.params || {};
    
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const isDark = theme?.theme_mode === 'dark';

    const [areas, setAreas] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ nome: '', area: '', plant_count: '' });
    const [selectedItemActions, setSelectedItemActions] = useState(null);

    useEffect(() => {
        if (!farmId) {
            Alert.alert('Erro', 'Fazenda não identificada.');
            navigation.goBack();
            return;
        }
        loadData();
    }, [farmId]);

    const loadData = async () => {
        try {
            const res = await executeQuery(`
                SELECT * FROM fields 
                WHERE is_deleted = 0 AND farm_uuid = ? 
                ORDER BY nome ASC
            `, [farmId]);
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setAreas(rows);
        } catch (e) {
            console.error(e);
        }
    };

    const handleEdit = (item) => {
        setEditItem(item);
        setForm({ 
            nome: item.nome, 
            area: String(item.area || ''), 
            plant_count: String(item.plant_count || '')
        });
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!form.nome) {
            return Alert.alert('Aviso', 'O nome da área é obrigatório.');
        }

        try {
            const json = await AsyncStorage.getItem('user_session');
            const session = json ? JSON.parse(json) : { id: 'unknown' };
            const now = new Date().toISOString();

            if (editItem) {
                // Update
                await executeQuery(
                    `UPDATE fields 
                     SET nome = ?, area = ?, plant_count = ?, updated_by = ?, last_updated = ?, sync_status = 0 
                     WHERE uuid = ?`,
                    [(form.nome || '').trim(), parseFloat(form.area) || 0, parseInt(form.plant_count) || 0, session.id, now, editItem.uuid]
                );

                const payload = JSON.stringify({
                    uuid: editItem.uuid,
                    nome: (form.nome || '').trim(),
                    area: parseFloat(form.area) || 0,
                    plant_count: parseInt(form.plant_count) || 0,
                    updated_by: session.id
                });

                await executeQuery(
                    `INSERT INTO sync_outbox (uuid, tabela, registro_uuid, acao, payload_json, status, criado_em) VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)`,
                    [uuidv4(), 'fields', editItem.uuid, 'UPDATE', payload, now]
                );
            } else {
                // Insert
                const fieldUuid = uuidv4();
                await executeQuery(
                    `INSERT INTO fields (uuid, farm_uuid, nome, area, plant_count, source_platform, created_by, last_updated, sync_status) 
                     VALUES (?, ?, ?, ?, ?, 'mobile', ?, ?, 0)`,
                    [fieldUuid, farmId, (form.nome || '').trim(), parseFloat(form.area) || 0, parseInt(form.plant_count) || 0, session.id, now]
                );

                const payload = JSON.stringify({
                    uuid: fieldUuid,
                    farm_uuid: farmId,
                    nome: (form.nome || '').trim(),
                    area: parseFloat(form.area) || 0,
                    plant_count: parseInt(form.plant_count) || 0,
                    source_platform: 'mobile',
                    created_by: session.id
                });

                await executeQuery(
                    `INSERT INTO sync_outbox (uuid, tabela, registro_uuid, acao, payload_json, status, criado_em) VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)`,
                    [uuidv4(), 'fields', fieldUuid, 'INSERT', payload, now]
                );
            }
            
            setModalVisible(false);
            setEditItem(null);
            setForm({ nome: '', area: '', plant_count: '' });
            loadData();
        } catch (e) {
            Alert.alert('Erro', 'Falha ao salvar a área');
        }
    };

    const handleDelete = (item) => {
        Alert.alert('Excluir', `Deseja excluir a área ${item.nome}?`, [
            { text: 'Cancelar', style: 'cancel' },
            { 
                text: 'EXCLUIR', 
                style: 'destructive',
                onPress: async () => {
                    const now = new Date().toISOString();
                    await executeQuery('UPDATE fields SET is_deleted = 1, sync_status = 0, last_updated = ? WHERE uuid = ?', [now, item.uuid]);
                    
                    const payload = JSON.stringify({ uuid: item.uuid, is_deleted: 1 });
                    await executeQuery(
                        `INSERT INTO sync_outbox (uuid, tabela, registro_uuid, acao, payload_json, status, criado_em) VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)`,
                        [uuidv4(), 'fields', item.uuid, 'UPDATE', payload, now]
                    );

                    loadData();
                }
            }
        ]);
    };

    const renderItem = ({ item }) => (
        <Card 
            style={styles.itemCard}
            onPress={() => handleEdit(item)}
            onLongPress={() => setSelectedItemActions(item)}
        >
            <View style={styles.itemHeader}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? '#1F2937' : '#D1FAE5' }]}>
                    <Ionicons name="leaf-outline" size={22} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.itemName, { color: activeColors.text || '#1F2937' }]}>{item.nome}</Text>
                    <Text style={[styles.itemSub, { color: activeColors.textSub || '#6B7280' }]}>
                        {item.area ? `${item.area} hectares` : 'Área não informada'}
                    </Text>
                    {item.plant_count > 0 && (
                        <Text style={[styles.itemSub, { color: activeColors.textSub || '#6B7280', fontSize: 11 }]}>
                            {item.plant_count} plantas
                        </Text>
                    )}
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
                    <View style={{ flex: 1, paddingHorizontal: 15 }}>
                        <Text style={styles.headerTitle} numberOfLines={1}>{farmName?.toUpperCase()}</Text>
                        <Text style={styles.headerSubtitle}>Gestão de Áreas</Text>
                    </View>
                    <TouchableOpacity onPress={() => { setEditItem(null); setForm({ nome: '', area: '', plant_count: '' }); setModalVisible(true); }}>
                        <Ionicons name="add-circle" size={32} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <FlatList
                data={areas}
                renderItem={renderItem}
                keyExtractor={item => item.uuid}
                contentContainerStyle={areas.length === 0 ? {flex: 1} : styles.list}
                ListEmptyComponent={
                    <AgroStateOverlay 
                        state="empty" 
                        message={`Nenhum talhão cadastrado na ${farmName}. Adicione a primeira área para começar.`}
                        icon="leaf-outline"
                        onRetry={() => { setEditItem(null); setForm({ nome: '', area: '', plant_count: '' }); setModalVisible(true); }}
                    />
                }
            />

            <TouchableOpacity style={[styles.fab, { backgroundColor: '#10B981' }]} onPress={() => { setEditItem(null); setForm({ nome: '', area: '', plant_count: '' }); setModalVisible(true); }}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center' }}>
                        <View style={[styles.modal, { backgroundColor: activeColors.cardBg || '#FFFFFF' }]}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={[styles.modalTitle, { color: activeColors.text || '#1F2937' }]}>{editItem ? 'EDITAR ÁREA' : 'NOVA ÁREA'}</Text>
                                
                                <AgroInput label="NOME DO TALHÃO *" value={form.nome} onChangeText={t => setForm({...form, nome: t})} icon="leaf-outline" />
                                
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <View style={{ flex: 1 }}>
                                        <AgroInput label="ÁREA (HA)" value={form.area} keyboardType="numeric" onChangeText={t => setForm({...form, area: t})} icon="scan-outline" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AgroInput label="Nº PLANTAS" value={form.plant_count} keyboardType="numeric" onChangeText={t => setForm({...form, plant_count: t})} icon="analytics-outline" />
                                    </View>
                                </View>
                                
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
                subtitle={`${selectedItemActions?.area || 0} ha`}
                onEdit={() => handleEdit(selectedItemActions)}
                onDelete={() => handleDelete(selectedItemActions)}
                editLabel="Editar Área"
                deleteLabel="Excluir Área"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 55, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
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

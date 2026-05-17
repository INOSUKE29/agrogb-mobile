import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, Modal, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { insertPlanoAdubacao, updatePlanoAdubacao, getEstoque, executeQuery } from '../database/database';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';

// Design System
import Card from '../components/common/Card';
import AgroInput from '../components/common/AgroInput';
import AgroButton from '../components/common/AgroButton';

export default function AdubacaoFormScreen({ route, navigation }) {
    const { theme } = useTheme();
    const editMode = !!route.params?.plano;
    const plano = route.params?.plano || {};

    const [nome, setNome] = useState(plano.nome_plano || '');
    const [cultura, setCultura] = useState(plano.cultura || '');
    const [tipo, setTipo] = useState(plano.tipo_aplicacao || 'GOTEJO');
    const [area, setArea] = useState(plano.area_local || '');
    const [descricao, setDescricao] = useState(plano.descricao_tecnica || '');
    const [imageUri, setImageUri] = useState(plano.anexos_uri || null);
    const [loading, setLoading] = useState(false);

    // Dynamic Recipe State
    const [itensAdicao, setItensAdicao] = useState([]);
    const [stockItems, setStockItems] = useState([]);
    const [itemSelectorVisible, setItemSelectorVisible] = useState(false);
    const [selectedStockItem, setSelectedStockItem] = useState(null);
    const [itemQty, setItemQty] = useState('');

    const fetchStock = async () => {
        try {
            const data = await getEstoque();
            setStockItems(data);
        } catch (e) {
            console.error('Erro ao buscar estoque:', e);
        }
    };

    useEffect(() => {
        fetchStock();
    }, []);

    useEffect(() => {
        if (editMode && plano.uuid) {
            const fetchExistingItens = async () => {
                try {
                    const res = await executeQuery(`SELECT * FROM production_fertilization_items WHERE plano_uuid = ?`, [plano.uuid]);
                    const list = [];
                    for (let i = 0; i < res.rows.length; i++) {
                        const item = res.rows.item(i);
                        list.push({
                            tempId: item.id || uuidv4(),
                            produto_id: item.produto_id,
                            quantidade: item.quantidade,
                            unidade: item.unidade || 'KG'
                        });
                    }
                    setItensAdicao(list);
                } catch (e) {
                    console.error('Erro ao carregar insumos existentes:', e);
                }
            };
            fetchExistingItens();
        }
    }, [editMode, plano.uuid]);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.granted === false) {
            Alert.alert("Erro", "É necessário acesso à câmera!");
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleAddInsumo = () => {
        if (!selectedStockItem || !itemQty || isNaN(itemQty) || parseFloat(itemQty) <= 0) {
            Alert.alert('Atenção', 'Selecione um insumo e digite uma quantidade válida.');
            return;
        }
        setItensAdicao([
            ...itensAdicao,
            {
                tempId: uuidv4(),
                produto_id: selectedStockItem.produto,
                quantidade: parseFloat(itemQty),
                unidade: selectedStockItem.unidade || 'KG'
            }
        ]);
        setItemSelectorVisible(false);
        setSelectedStockItem(null);
        setItemQty('');
    };

    const handleRemoveInsumo = (tempId) => {
        setItensAdicao(itensAdicao.filter(it => it.tempId !== tempId));
    };

    const handleSave = async () => {
        if (!nome || !cultura) {
            Alert.alert('Campos Obrigatórios', 'Preencha o Nome do Plano e a Cultura.');
            return;
        }

        setLoading(true);
        try {
            const planoUuid = editMode ? plano.uuid : uuidv4();
            const data = {
                uuid: planoUuid,
                nome_plano: nome,
                cultura,
                tipo_aplicacao: tipo,
                area_local: area,
                descricao_tecnica: descricao || 'APLICAÇÃO DIRETA',
                status: editMode ? plano.status : 'PLANEJADO',
                data_criacao: editMode ? plano.data_criacao : new Date().toISOString(),
                data_aplicacao: editMode ? plano.data_aplicacao : null,
                anexos_uri: imageUri
            };

            if (editMode) {
                await updatePlanoAdubacao(plano.uuid, data);
                // Limpar itens anteriores do plano
                await executeQuery(`DELETE FROM production_fertilization_items WHERE plano_uuid = ?`, [plano.uuid]);
            } else {
                await insertPlanoAdubacao(data);
            }

            // Inserir os novos itens da receita no banco
            for (const it of itensAdicao) {
                await executeQuery(
                    `INSERT INTO production_fertilization_items (id, plano_uuid, produto_id, quantidade, unidade) VALUES (?, ?, ?, ?, ?)`,
                    [uuidv4(), planoUuid, it.produto_id, it.quantidade, it.unidade]
                );
            }

            Alert.alert('Sucesso', 'Plano nutricional salvo com sucesso!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Erro', 'Falha ao salvar plano e receita.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}
        >
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', '#059669']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{editMode ? 'EDITAR PLANO' : 'NOVO PLANO'}</Text>
                    <View style={{ width: 24 }} />
                </View>
                <Text style={styles.headerSub}>Defina a receita e os insumos do estoque</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Card style={styles.formCard}>
                    <AgroInput 
                        label="NOME DO PLANO" 
                        value={nome} 
                        onChangeText={(t) => setNome(t.toUpperCase())} 
                        placeholder="EX: ADUBAÇÃO TOMATE SEM. 4"
                    />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <AgroInput 
                                label="CULTURA" 
                                value={cultura} 
                                onChangeText={(t) => setCultura(t.toUpperCase())} 
                                placeholder="EX: TOMATE"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AgroInput 
                                label="ÁREA / LOCAL" 
                                value={area} 
                                onChangeText={(t) => setArea(t.toUpperCase())} 
                                placeholder="OPCIONAL" 
                            />
                        </View>
                    </View>

                    <Text style={styles.label}>TIPO DE APLICAÇÃO</Text>
                    <View style={styles.pillContainer}>
                        <TouchableOpacity
                            style={[styles.pill, tipo === 'GOTEJO' && { backgroundColor: theme?.colors?.primary + '20', borderColor: theme?.colors?.primary }]}
                            onPress={() => setTipo('GOTEJO')}
                        >
                            <Text style={[styles.pillText, tipo === 'GOTEJO' && { color: theme?.colors?.primary }]}>💧 GOTEJO</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.pill, tipo === 'PULVERIZACAO' && { backgroundColor: theme?.colors?.primary + '20', borderColor: theme?.colors?.primary }]}
                            onPress={() => setTipo('PULVERIZACAO')}
                        >
                            <Text style={[styles.pillText, tipo === 'PULVERIZACAO' && { color: theme?.colors?.primary }]}>🌫️ PULVERIZAÇÃO</Text>
                        </TouchableOpacity>
                    </View>
                </Card>

                {/* CARRINHO DE INSUMOS DO ESTOQUE (INTEGRAÇÃO COMPLETA) */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionLabel}>RECEITA / INSUMOS DEDUTÍVEIS</Text>
                        <TouchableOpacity 
                            style={styles.btnAddInsumo} 
                            onPress={() => setItemSelectorVisible(true)}
                        >
                            <Ionicons name="add-circle" size={24} color={theme?.colors?.primary || '#10B981'} />
                            <Text style={[styles.btnAddText, { color: theme?.colors?.primary || '#10B981' }]}>ADD INSUMO</Text>
                        </TouchableOpacity>
                    </View>

                    <Card noPadding>
                        {itensAdicao.length === 0 ? (
                            <View style={{ padding: 25, alignItems: 'center' }}>
                                <MaterialCommunityIcons name="flask-empty-outline" size={32} color="#9CA3AF" />
                                <Text style={{ color: '#9CA3AF', fontSize: 13, marginTop: 8, fontStyle: 'italic', textAlign: 'center' }}>
                                    Nenhum insumo do estoque vinculado a esta aplicação.
                                </Text>
                            </View>
                        ) : (
                            itensAdicao.map((item, idx) => (
                                <View key={item.tempId} style={[styles.insumoRow, idx !== itensAdicao.length - 1 && styles.borderBottom]}>
                                    <View style={styles.insumoIconBox}>
                                        <MaterialCommunityIcons name="flask-outline" size={18} color="#10B981" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.insumoName}>{item.produto_id}</Text>
                                        <Text style={styles.insumoQty}>{item.quantidade} {item.unidade}</Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.btnRemove}
                                        onPress={() => handleRemoveInsumo(item.tempId)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </Card>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>RECEITA TÉCNICA / INSTRUÇÕES ADICIONAIS</Text>
                    <Card noPadding>
                        <AgroInput
                            value={descricao}
                            onChangeText={setDescricao}
                            style={styles.textArea}
                            placeholder="Descreva aqui orientações, velocidade do trator, clima ou observações gerais..."
                            multiline={true}
                        />
                    </Card>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>ANEXO / COMPROVANTE (OPCIONAL)</Text>
                    <View style={styles.attachWrapper}>
                        {imageUri ? (
                            <View style={styles.imagePreview}>
                                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                                <TouchableOpacity style={styles.removeBtn} onPress={() => setImageUri(null)}>
                                    <Ionicons name="trash" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.attachButtons}>
                                <TouchableOpacity style={styles.attachBtn} onPress={takePhoto}>
                                    <Ionicons name="camera" size={24} color={theme?.colors?.primary} />
                                    <Text style={[styles.attachText, { color: theme?.colors?.primary }]}>CÂMERA</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
                                    <Ionicons name="images" size={24} color={theme?.colors?.primary} />
                                    <Text style={[styles.attachText, { color: theme?.colors?.primary }]}>GALERIA</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                <AgroButton title={loading ? "SALVANDO..." : "SALVAR PLANO E RECEITA"} onPress={handleSave} loading={loading} />
                <AgroButton title="CANCELAR" variant="secondary" onPress={() => navigation.goBack()} style={{ marginTop: 12 }} />

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* MODAL SELETOR DE ESTOQUE */}
            <Modal visible={itemSelectorVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setItemSelectorVisible(false)} />
                    
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>CATÁLOGO DO ESTOQUE</Text>

                        <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                            {stockItems.length === 0 ? (
                                <Text style={styles.modalEmpty}>Seu estoque está vazio ou sem cadastros ativos.</Text>
                            ) : stockItems.map(item => {
                                const active = selectedStockItem?.produto === item.produto;
                                return (
                                    <TouchableOpacity 
                                        key={item.produto} 
                                        style={[styles.stockCard, active && styles.stockCardActive]}
                                        onPress={() => setSelectedStockItem(item)}
                                    >
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.stockCardName, active && { color: theme?.colors?.primary || '#10B981' }]}>{item.produto}</Text>
                                            <Text style={styles.stockCardQty}>Disponível: {item.quantidade} {item.unidade || 'KG'}</Text>
                                        </View>
                                        {active && <Ionicons name="checkmark-circle" size={22} color={theme?.colors?.primary || '#10B981'} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {selectedStockItem && (
                            <View style={styles.qtyBox}>
                                <Text style={styles.qtyLabel}>DOSE / QUANTIDADE ({selectedStockItem.unidade || 'KG'})</Text>
                                <View style={styles.qtyInputContainer}>
                                    <TextInput 
                                        style={styles.qtyInput}
                                        value={itemQty}
                                        onChangeText={setItemQty}
                                        keyboardType="numeric"
                                        placeholder="0.00"
                                        placeholderTextColor="#9CA3AF"
                                        autoFocus
                                    />
                                </View>
                                <TouchableOpacity style={styles.btnConfirmAdd} onPress={handleAddInsumo}>
                                    <Text style={styles.btnConfirmAddText}>VINCULAR A RECEITA</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 30, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },
    scrollContent: { padding: 20 },
    formCard: { padding: 20, marginBottom: 20 },
    row: { flexDirection: 'row' },
    label: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 10, marginTop: 10, letterSpacing: 1 },
    pillContainer: { flexDirection: 'row', gap: 10, marginTop: 5 },
    pill: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
    pillText: { fontWeight: '900', color: '#6B7280', fontSize: 11 },
    section: { marginBottom: 25 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 },
    btnAddInsumo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    btnAddText: { fontSize: 11, fontWeight: '900' },
    
    // Insumo item list in form
    insumoRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    insumoIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    insumoName: { color: '#1F2937', fontSize: 14, fontWeight: '700' },
    insumoQty: { color: '#6B7280', fontSize: 12, fontWeight: '600', marginTop: 2 },
    btnRemove: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

    textArea: { height: 120, textAlignVertical: 'top', borderBottomWidth: 0 },
    attachWrapper: { marginBottom: 10 },
    attachButtons: { flexDirection: 'row', gap: 15 },
    attachBtn: { flex: 1, backgroundColor: '#FFF', padding: 20, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
    attachText: { fontSize: 10, fontWeight: '900', marginTop: 8 },
    imagePreview: { position: 'relative', height: 200, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
    previewImage: { width: '100%', height: '100%' },
    removeBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(239, 68, 68, 0.8)', padding: 8, borderRadius: 10 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    modalSheet: { backgroundColor: '#FFF', borderRadius: 24, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 15, elevation: 10 },
    modalTitle: { fontSize: 15, fontWeight: '900', color: '#1F2937', textAlign: 'center', marginBottom: 20, letterSpacing: 0.5 },
    modalEmpty: { color: '#6B7280', textAlign: 'center', paddingVertical: 20, fontStyle: 'italic', fontSize: 13 },
    stockCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10 },
    stockCardActive: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
    stockCardName: { fontSize: 14, fontWeight: '700', color: '#374151' },
    stockCardQty: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '600' },
    qtyBox: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    qtyLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 8, letterSpacing: 1 },
    qtyInputContainer: { backgroundColor: '#F9FAFB', borderRadius: 12, height: 50, justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 15 },
    qtyInput: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
    btnConfirmAdd: { backgroundColor: '#10B981', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
    btnConfirmAddText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 1 }
});

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { insertPlanoAdubacao, updatePlanoAdubacao, getEstoque, executeQuery } from '../database/database';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';

// Design System
import AgroInput from '../components/common/AgroInput';
import AgroButton from '../components/common/AgroButton';
import SmartAutocomplete from '../components/common/SmartAutocomplete';
import { CropLibraryService, TalhaoLibraryService } from '../services/LibraryServices';

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
        setSelectedStockItem(null);
        setItemQty('');
    };

    const stockDummyService = {
        search: async (text) => {
            const txt = text ? text.toUpperCase() : '';
            return stockItems
                .filter(item => item.produto && item.produto.toUpperCase().includes(txt))
                .map(i => ({...i, nome: i.produto, uuid: i.produto}));
        },
        getRecents: async () => [],
        getFavorites: async () => [],
        toggleFavorite: async () => [],
        addRecent: async () => {}
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
            style={[styles.container, { backgroundColor: theme?.colors?.bg || '#0B121E' }]}
        >
            <LinearGradient colors={['#111827', '#0F172A']} style={styles.header}>
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
                <LinearGradient colors={['#1F2937', '#111827']} style={styles.formCard}>
                    <AgroInput 
                        label="NOME DO PLANO" 
                        value={nome} 
                        onChangeText={(t) => setNome(t.toUpperCase())} 
                        placeholder="EX: ADUBAÇÃO TOMATE SEM. 4"
                    />

                                        <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <SmartAutocomplete
                                label="CULTURA *"
                                value={cultura}
                                onSelect={val => setCultura(val ? val.nome : '')}
                                service={CropLibraryService}
                                title="SELECIONAR CULTURA"
                                placeholder="CULTURA..."
                                icon="leaf-outline"
                                quickAddFields={[
                                    { key: 'nome', label: 'NOME DA CULTURA', placeholder: 'Ex: Soja BRS' }
                                ]}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <SmartAutocomplete
                                label="ÁREA / LOCAL"
                                value={area}
                                onSelect={val => setArea(val ? val.nome : '')}
                                service={TalhaoLibraryService}
                                title="SELECIONAR TALHÃO"
                                placeholder="LOCAL..."
                                icon="map-outline"
                                quickAddFields={[
                                    { key: 'nome', label: 'NOME DO TALHÃO', placeholder: 'Ex: Talhão Norte 3' },
                                    { key: 'area_ha', label: 'ÁREA (HA)', placeholder: 'Ex: 12.8', keyboardType: 'decimal-pad' }
                                ]}
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
                </LinearGradient>

                {/* CARRINHO DE INSUMOS DO ESTOQUE (INTEGRAÇÃO COMPLETA) */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionLabel}>RECEITA / INSUMOS DEDUTÍVEIS</Text>
                    </View>

                    <SmartAutocomplete
                        label="INSERIR NOVO INSUMO"
                        value={selectedStockItem}
                        onSelect={(item) => {
                            setSelectedStockItem(item);
                            setItemQty('');
                        }}
                        service={stockDummyService}
                        title="ESTOQUE DISPONÍVEL"
                        placeholder="Toque para buscar insumo..."
                        icon="flask-outline"
                    />

                    {selectedStockItem && (
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: theme?.colors?.primary + '50' }}>
                            <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700', marginBottom: 10 }}>
                                Selecionado: {selectedStockItem.produto} ({selectedStockItem.quantidade} {selectedStockItem.unidade} disp.)
                            </Text>
                            <AgroInput
                                label={`DOSE / QUANTIDADE (${selectedStockItem.unidade || 'KG'})`}
                                value={itemQty}
                                onChangeText={setItemQty}
                                keyboardType="numeric"
                                placeholder="0.00"
                            />
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                <AgroButton title="VINCULAR" onPress={handleAddInsumo} style={{ flex: 1, height: 44 }} />
                                <AgroButton title="CANCELAR" variant="secondary" onPress={() => setSelectedStockItem(null)} style={{ flex: 1, height: 44 }} />
                            </View>
                        </View>
                    )}

                    <LinearGradient colors={['#1F2937', '#111827']} style={styles.recipeCard}>
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
                    </LinearGradient>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>RECEITA TÉCNICA / INSTRUÇÕES ADICIONAIS</Text>
                    <LinearGradient colors={['#1F2937', '#111827']} style={styles.recipeCard}>
                        <AgroInput
                            value={descricao}
                            onChangeText={setDescricao}
                            style={styles.textArea}
                            placeholder="Descreva aqui orientações, velocidade do trator, clima ou observações gerais..."
                            multiline={true}
                        />
                    </LinearGradient>
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

            {/* O MODAL CUSTOMIZADO FOI SUBSTITUÍDO PELO SMARTAUTOCOMPLETE */}
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
    pill: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
    pillText: { fontWeight: '900', color: '#9CA3AF', fontSize: 11 },
    section: { marginBottom: 25 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 },
    btnAddInsumo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    btnAddText: { fontSize: 11, fontWeight: '900' },
    
    // Insumo item list in form
    recipeCard: { borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' },
    insumoRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    borderBottom: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    insumoIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    insumoName: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    insumoQty: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', marginTop: 2 },
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
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    modalSheet: { backgroundColor: '#1F2937', borderRadius: 24, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
    modalTitle: { fontSize: 15, fontWeight: '900', color: '#FFF', textAlign: 'center', marginBottom: 20, letterSpacing: 0.5 },
    modalEmpty: { color: '#9CA3AF', textAlign: 'center', paddingVertical: 20, fontStyle: 'italic', fontSize: 13 },
    stockCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 10 },
    stockCardActive: { borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)' },
    stockCardName: { fontSize: 14, fontWeight: '700', color: '#E5E7EB' },
    stockCardQty: { fontSize: 11, color: '#9CA3AF', marginTop: 2, fontWeight: '600' },
    qtyBox: { marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
    qtyLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 8, letterSpacing: 1 },
    qtyInputContainer: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, height: 50, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 15 },
    qtyInput: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    btnConfirmAdd: { backgroundColor: '#10B981', height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
    btnConfirmAddText: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 1 }
});

import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AgroInput from '../ui/components/AgroInput';
import AgroButton from '../ui/components/AgroButton';
import { insertPlanoAdubacao, updatePlanoAdubacao } from '../database/database';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '../theme/ThemeContext';
import { showToast } from '../ui/Toast';

import { useFertilization } from '../modules/production/hooks/useFertilization';
import { useInventory } from '../modules/inventory/hooks/useInventory';

export default function AdubacaoFormScreen({ route, navigation }) {
    const { colors, isDark } = useTheme();
    const editMode = !!route.params?.plano;
    const plano = route.params?.plano || {};

    const [nome, setNome] = useState(plano.nome_plano || '');
    const [cultura, setCultura] = useState(plano.cultura || '');
    const [tipo, setTipo] = useState(plano.tipo_aplicacao || 'GOTEJO');
    const [area, setArea] = useState(plano.area_local || '');
    const [descricao, setDescricao] = useState(plano.descricao_tecnica || '');
    const [imageUri, setImageUri] = useState(plano.anexos_uri || null);
    
    // Hooks Diamond Pro
    const { itens, addInsumo, removeInsumo, savePlan, loading: saving } = useFertilization();
    const { items: stockItems, fetchStock } = useInventory();

    // UI States
    const [itemSelectorVisible, setItemSelectorVisible] = useState(false);
    const [selectedStockItem, setSelectedStockItem] = useState(null);
    const [itemQty, setItemQty] = useState('');

    React.useEffect(() => {
        fetchStock();
    }, [fetchStock]);

    const handleAddItem = () => {
        if (!selectedStockItem || !itemQty) return;
        addInsumo({
            produto_id: selectedStockItem.produto, // No AgroGB o ID costuma ser o nome ou UUID
            nome: selectedStockItem.produto,
            quantidade: parseFloat(itemQty),
            unidade: selectedStockItem.unidade || 'KG'
        });
        setItemSelectorVisible(false);
        setSelectedStockItem(null);
        setItemQty('');
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const takePhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return Alert.alert("Erro", "Acesso à câmera negado.");
        let result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    const handleSave = async () => {
        if (!nome || !cultura) {
            Alert.alert('Campos Obrigatórios', 'Preencha Nome e Cultura.');
            return;
        }

        try {
            const data = {
                uuid: editMode ? plano.uuid : uuidv4(),
                id: editMode ? plano.id : null,
                nome_plano: nome,
                cultura,
                tipo_aplicacao: tipo,
                area_local: area,
                descricao_tecnica: descricao,
                anexos_uri: imageUri
            };

            await savePlan(data);
            showToast('✅ Plano salvo com sucesso!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Erro', 'Falha ao salvar plano.');
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>{editMode ? 'EDITAR PLANO' : 'NOVO PLANO DE ADUBAÇÃO'}</Text>
                <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>DIAMOND PRO</Text>
                </View>
            </View>

            <AgroInput label="NOME DO PLANO" value={nome} onChangeText={(t) => setNome(t.toUpperCase())} placeholder="Ex: ADUBAÇÃO COBERTURA" />

            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <AgroInput label="CULTURA" value={cultura} onChangeText={(t) => setCultura(t.toUpperCase())} />
                </View>
                <View style={{ flex: 1 }}>
                    <AgroInput label="ÁREA / LOCAL" value={area} onChangeText={(t) => setArea(t.toUpperCase())} />
                </View>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>TIPO DE APLICAÇÃO</Text>
            <View style={styles.pillContainer}>
                {['GOTEJO', 'PULVERIZACAO', 'LANCO'].map(t => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.pill, { backgroundColor: colors.card, borderColor: colors.border }, tipo === t && { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}
                        onPress={() => setTipo(t)}
                    >
                        <Text style={[styles.pillText, { color: colors.textMuted }, tipo === t && { color: colors.primary }]}>
                            {t === 'GOTEJO' ? '💧 GOTEJO' : t === 'PULVERIZACAO' ? '🌫️ PULVERIZAÇÃO' : '🚜 A LANÇO'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* SEÇÃO DE INSUMOS INTELIGENTES */}
            <View style={[styles.section, { borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>INSUMOS DA RECEITA</Text>
                    <TouchableOpacity onPress={() => setItemSelectorVisible(true)} style={styles.addBtnSmall}>
                        <Ionicons name="add-circle" size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {itens.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhum insumo selecionado para esta receita.</Text>
                ) : (
                    itens.map(item => (
                        <View key={item.tempId} style={[styles.itemRow, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB' }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.itemName, { color: colors.textPrimary }]}>{item.nome}</Text>
                                <Text style={[styles.itemQty, { color: colors.primary }]}>{item.quantidade} {item.unidade}</Text>
                            </View>
                            <TouchableOpacity onPress={() => removeInsumo(item.tempId)}>
                                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>

            <AgroInput
                label="OBSERVAÇÕES ADICIONAIS"
                value={descricao}
                onChangeText={setDescricao}
                style={{ height: 100, textAlignVertical: 'top' }}
                placeholder="Notas técnicas extras..."
                multiline
            />

            <View style={styles.actionRow}>
                <AgroButton title="SALVAR PLANO" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
                <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={() => navigation.goBack()}>
                    <Text style={{ color: colors.textSecondary, fontWeight: 'bold' }}>CANCELAR</Text>
                </TouchableOpacity>
            </View>

            {/* Modal de Seleção de Insumo */}
            <Modal visible={itemSelectorVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>ADICIONAR INSUMO</Text>
                        
                        <ScrollView style={{ maxHeight: 200 }} contentContainerStyle={{ gap: 8 }}>
                            {stockItems.map(item => (
                                <TouchableOpacity 
                                    key={item.produto} 
                                    style={[styles.stockItem, { borderColor: colors.border }, selectedStockItem?.produto === item.produto && { borderColor: colors.primary, backgroundColor: colors.primary + '05' }]}
                                    onPress={() => setSelectedStockItem(item)}
                                >
                                    <View>
                                        <Text style={[styles.stockName, { color: colors.textPrimary }]}>{item.produto}</Text>
                                        <Text style={{ fontSize: 10, color: colors.textMuted }}>Estoque: {item.quantidade} {item.unidade}</Text>
                                    </View>
                                    {selectedStockItem?.produto === item.produto && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {selectedStockItem && (
                            <View style={{ marginTop: 20 }}>
                                <AgroInput 
                                    label={`QUANTIDADE (${selectedStockItem.unidade})`} 
                                    value={itemQty} 
                                    onChangeText={setItemQty} 
                                    keyboardType="decimal-pad"
                                    autoFocus
                                />
                                <AgroButton title="CONFIRMAR ITEM" onPress={handleAddItem} />
                            </View>
                        )}
                        
                        <TouchableOpacity onPress={() => setItemSelectorVisible(false)} style={{ marginTop: 15, alignItems: 'center' }}>
                            <Text style={{ color: colors.textMuted }}>FECHAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    badgeText: { fontSize: 8, fontWeight: 'bold' },
    row: { flexDirection: 'row', marginBottom: 10 },
    label: { fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 15, letterSpacing: 0.5 },
    pillContainer: { flexDirection: 'row', marginBottom: 20, gap: 10 },
    pill: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
    pillText: { fontWeight: 'bold', fontSize: 11 },
    section: { marginTop: 20, padding: 15, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 12, fontWeight: '800' },
    addBtnSmall: { padding: 4 },
    emptyText: { textAlign: 'center', fontSize: 12, paddingVertical: 20 },
    itemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8 },
    itemName: { fontSize: 13, fontWeight: 'bold' },
    itemQty: { fontSize: 12, fontWeight: '800', marginTop: 2 },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
    cancelBtn: { padding: 18, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    modalContent: { padding: 25, borderRadius: 24, elevation: 10 },
    modalTitle: { fontSize: 16, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
    stockItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
    stockName: { fontSize: 14, fontWeight: 'bold' }
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, ScrollView, Dimensions, FlatList } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertCadastro, getCadastro, deleteCadastro, updateCadastro, insertReceita, getReceita, deleteItemReceita } from '../database/database';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';
import AgroOptionsModal from '../components/common/AgroOptionsModal';

const { width } = Dimensions.get('window');

// --- CONFIGURAÇÃO DE CATEGORIAS (UX) ---
const CATEGORIES = {
    // Novas categorias estruturadas e profissionais de mercado
    FERTILIZANTES: { label: 'Fertilizantes', icon: 'leaf-outline', color: '#16A34A', bg: '#DCFCE7', fields: ['composicao', 'nutrientes', 'fabricante', 'dose', 'bula'] },
    DEFENSIVOS: { label: 'Defensivos Agrícolas', icon: 'flask-outline', color: '#DC2626', bg: '#FEE2E2', fields: ['principio', 'classe', 'fabricante', 'dose', 'bula'] },
    BIOLOGICOS: { label: 'Insumos Biológicos', icon: 'bug-outline', color: '#8B5CF6', bg: '#F5F3FF', fields: ['principio', 'fabricante', 'dose', 'bula'] },
    ADJUVANTES: { label: 'Adjuvantes', icon: 'color-filter-outline', color: '#EC4899', bg: '#FDF2F8', fields: ['fabricante', 'dose'] },
    CORRETIVOS: { label: 'Corretivos de Solo', icon: 'grid-outline', color: '#F59E0B', bg: '#FEF3C7', fields: ['composicao', 'nutrientes', 'fabricante'] },
    NUTRI_FOLIAR: { label: 'Nutrição Foliar', icon: 'water-outline', color: '#06B6D4', bg: '#ECFEFF', fields: ['composicao', 'nutrientes', 'fabricante', 'dose', 'bula'] },
    SEMENTES: { label: 'Sementes / Mudas', icon: 'rose-outline', color: '#10B981', bg: '#ECFDF5', fields: ['fabricante'] },
    
    // [TODO/FUTURO - BIBLIOTECA GLOBAL] 
    // Atualmente a Biblioteca Global foca fortemente em PRODUTOS e INSUMOS.
    // Futuramente, a Biblioteca poderá ser expandida para catalogar DOENÇAS e PRAGAS de cada plantio,
    // permitindo anexar fotos de referência, níveis de severidade e protocolos de tratamento.
    // Isso deve ser validado no roadmap pois "pode ou não acontecer".
    // DOENCAS: { label: 'Doenças / Pragas', icon: 'bug-outline', color: '#991B1B', bg: '#FEE2E2', fields: ['nome_cientifico', 'sintomas', 'fotos', 'culturas_afetadas'] },

    // Legado e estruturais
    DEFENSIVO: { label: 'Defensivo Agrícola', icon: 'flask-outline', color: '#DC2626', bg: '#FEE2E2', fields: ['principio', 'classe', 'fabricante', 'dose', 'bula'] },
    FERTILIZANTE: { label: 'Fertilizante / Adubo', icon: 'leaf-outline', color: '#16A34A', bg: '#DCFCE7', fields: ['composicao', 'nutrientes', 'fabricante', 'dose'] },
    NUTRIENTE: { label: 'Nutriente / Corretivo', icon: 'water-outline', color: '#CA8A04', bg: '#FEF9C3', fields: ['composicao', 'nutrientes'] },
    EMBALAGEM: { label: 'Embalagem / Caixa', icon: 'cube-outline', color: '#4B5563', bg: '#F3F4F6' },
    INSUMO: { label: 'Insumo Geral', icon: 'construct-outline', color: '#6366F1', bg: '#E0E7FF', fields: ['fabricante'] },
    CULTURA: { label: 'Cultura (Plantio)', icon: 'nutrition-outline', color: '#15803D', bg: '#DCFCE7' },
    PRODUTO: { label: 'Produto (Venda)', icon: 'cart-outline', color: '#2563EB', bg: '#DBEAFE', preCheck: ['vendavel'] },
    AREA: { label: 'Área / Talhão', icon: 'map-outline', color: '#059669', bg: '#D1FAE5' }
};

const MARKET_STANDARDS = [
    { label: 'Area / Talhão', unit: 'HA', weight: '1' },
    { label: 'Cx Morango Padrão', unit: 'CX', weight: '1.2' },
    { label: 'Cx Tomate (K)', unit: 'CX', weight: '20' },
    { label: 'Cx Legumes', unit: 'CX', weight: '12' },
    { label: 'Saco Adubo', unit: 'SC', weight: '50' },
    { label: 'Galão Pequeno', unit: 'LT', weight: '5' },
    { label: 'Unitário', unit: 'UNI', weight: '1' }
];

export default function CadastroScreen({ navigation }) {
    const { theme } = useTheme();
    const isDark = theme?.theme_mode === 'dark';
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modais
    const [modalVisible, setModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [obsModalVisible, setObsModalVisible] = useState(false);
    const [assistantVisible, setAssistantVisible] = useState(false);
    const [selectedItemActions, setSelectedItemActions] = useState(null);

    // Form Item
    const [editingItem, setEditingItem] = useState(null);
    const [nome, setNome] = useState('');
    const [unidade, setUnidade] = useState('KG');
    const [tipo, setTipo] = useState('INSUMO');
    const [observacao, setObservacao] = useState('');
    const [fator, setFator] = useState('1');
    const [estocavel, setEstocavel] = useState(true);
    const [vendavel, setVendavel] = useState(false);

    // Form Extended
    const [principioAtivo, setPrincipioAtivo] = useState('');
    const [classeToxicologica, setClasseToxicologica] = useState('');
    const [composicao, setComposicao] = useState('');
    const [precoVenda, setPrecoVenda] = useState('');
    const [precoUnitario, setPrecoUnitario] = useState('');

    // V8.0 Catálogo Rico
    const [fabricante, setFabricante] = useState('');
    const [nutrientes, setNutrientes] = useState('');
    const [dosePadrao, setDosePadrao] = useState('');
    const [bulaTexto, setBulaTexto] = useState('');

    // Form Receita
    const [recipeModalVisible, setRecipeModalVisible] = useState(false);
    const [currentRecipe, setCurrentRecipe] = useState([]);
    const [addIngModal, setAddIngModal] = useState(false);
    const [selectedIng, setSelectedIng] = useState(null);
    const [qtdIng, setQtdIng] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try { const data = await getCadastro(); setItems(data); } catch (e) { } finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!nome.trim()) return Alert.alert('Ops!', 'Dê um nome ao item.');
        try {
            const data = {
                uuid: editingItem ? editingItem.uuid : uuidv4(),
                nome: nome.toUpperCase(), unidade, tipo, observacao: observacao.toUpperCase(),
                fator_conversao: parseFloat(fator) || 1,
                estocavel: estocavel ? 1 : 0,
                vendavel: vendavel ? 1 : 0,
                principio_ativo: principioAtivo.toUpperCase(),
                classe_toxicologica: classeToxicologica.toUpperCase(),
                composicao: composicao.toUpperCase(),
                preco_venda: parseFloat(precoVenda) || 0,
                preco_unitario: parseFloat(precoUnitario) || 0,
                fabricante: fabricante.toUpperCase(),
                nutrientes: nutrientes.toUpperCase(),
                dose_padrao: dosePadrao.toUpperCase(),
                bula_texto: bulaTexto,
                bula_url: ''
            };

            if (editingItem) {
                await updateCadastro(data);
                Alert.alert('Sucesso', 'Item atualizado!');
            } else {
                await insertCadastro(data);
            }

            setModalVisible(false);
            resetForm();
            loadData();
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar.'); }
    };

    const resetForm = () => {
        setEditingItem(null); setNome(''); setObservacao(''); setFator('1');
        setEstocavel(true); setVendavel(false); setUnidade('KG'); setTipo('INSUMO');
        setPrincipioAtivo(''); setClasseToxicologica(''); setComposicao(''); setPrecoVenda(''); setPrecoUnitario('');
        setFabricante(''); setNutrientes(''); setDosePadrao(''); setBulaTexto('');
    };

    const handleEdit = (item) => {
        setEditingItem(item); setNome(item.nome); setUnidade(item.unidade); setTipo(item.tipo);
        setObservacao(item.observacao || ''); setFator((item.fator_conversao || 1).toString());
        setEstocavel(item.estocavel === 1); setVendavel(item.vendavel === 1);
        setPrincipioAtivo(item.principio_ativo || ''); setClasseToxicologica(item.classe_toxicologica || '');
        setComposicao(item.composicao || ''); setPrecoVenda(item.preco_venda ? item.preco_venda.toString() : '');
        setPrecoUnitario(item.preco_unitario ? item.preco_unitario.toString() : '');
        setFabricante(item.fabricante || ''); setNutrientes(item.nutrientes || ''); 
        setDosePadrao(item.dose_padrao || ''); setBulaTexto(item.bula_texto || '');
        setModalVisible(true);
    };

    const handleDelete = (id) => {
        Alert.alert('Excluir', 'Remover item permanentemente do catálogo?', [
            { text: 'Não', style: 'cancel' }, 
            { text: 'Sim, Excluir', style: 'destructive', onPress: async () => { await deleteCadastro(id); loadData(); } }
        ]);
    };

    const selectCategory = (key) => {
        setTipo(key); setCategoryModalVisible(false);
        const cfg = CATEGORIES[key];
        if (cfg.preCheck?.includes('vendavel')) setVendavel(true);
    };

    const sections = Object.values(items.reduce((acc, item) => {
        if (!acc[item.tipo]) acc[item.tipo] = { title: item.tipo, data: [] };
        acc[item.tipo].data.push(item);
        return acc;
    }, {})).sort((a, b) => a.title.localeCompare(b.title));

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={isDark ? ['#111827', '#0F172A'] : [theme?.colors?.primary || '#10B981', '#059669']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>CATÁLOGO RURAL</Text>
                    <TouchableOpacity 
                        style={styles.scanBtn}
                        onPress={() => navigation.navigate('Scanner', {
                            onScanComplete: (data) => {
                                setNome(data.nome); setTipo(data.tipo); setObservacao(data.observacao);
                                setModalVisible(true);
                            }
                        })}
                    >
                        <Ionicons name="scan-outline" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSub}>Gerencie insumos, áreas e produtos finais</Text>
            </LinearGradient>

            {loading ? <ActivityIndicator size="large" color={theme?.colors?.primary} style={{ marginTop: 50 }} /> :
                <SectionList
                    sections={sections}
                    keyExtractor={item => item.id.toString()}
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={styles.listContent}
                    renderSectionHeader={({ section: { title } }) => {
                        const cfg = CATEGORIES[title] || CATEGORIES.INSUMO;
                        return (
                            <View style={styles.sectionHeader}>
                                <View style={[styles.sectionIcon, { backgroundColor: cfg.color }]}>
                                    <Ionicons name={cfg.icon} size={14} color="#FFF" />
                                </View>
                                <Text style={[styles.sectionTitle, { color: cfg.color }]}>{cfg.label.toUpperCase()}</Text>
                            </View>
                        );
                    }}
                    renderItem={({ item }) => (
                        <TouchableOpacity 
                            style={[styles.compactListItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]} 
                            onPress={() => handleEdit(item)}
                            onLongPress={() => setSelectedItemActions(item)}
                        >
                            <View style={styles.compactListInner}>
                                <View style={{ flex: 1, paddingRight: 10 }}>
                                    <Text style={[styles.compactItemName, { color: isDark ? '#E2E8F0' : '#1F2937' }]} numberOfLines={1}>{item.nome}</Text>
                                </View>
                                <View style={styles.compactTagRow}>
                                    <View style={styles.compactUnitBadge}><Text style={styles.compactUnitText}>{item.unidade}</Text></View>
                                    {item.estocavel === 1 && <View style={[styles.compactTag, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#F0FDF4' }]}><Text style={[styles.compactTagText, { color: '#10B981' }]}>EST.</Text></View>}
                                    {item.vendavel === 1 && <View style={[styles.compactTag, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF' }]}><Text style={[styles.compactTagText, { color: '#3B82F6' }]}>VEND.</Text></View>}
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.empty}>Nenhum item cadastrado no catálogo.</Text>}
                />}

            <TouchableOpacity style={[styles.fab, { backgroundColor: theme?.colors?.primary || '#10B981' }]} onPress={() => { resetForm(); setModalVisible(true); }}>
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            {/* MODAL EDITOR PRINCIPAL */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingItem ? 'EDITAR ITEM' : 'NOVO ITEM'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
                            <Text style={styles.inputLabel}>CATEGORIA / TIPO</Text>
                            <TouchableOpacity 
                                style={[styles.categorySelector, { borderColor: CATEGORIES[tipo]?.color || '#E5E7EB' }]} 
                                onPress={() => setCategoryModalVisible(true)}
                            >
                                <View style={styles.catInfo}>
                                    <View style={[styles.catIconBox, { backgroundColor: (CATEGORIES[tipo] || CATEGORIES.INSUMO).color + '20' }]}>
                                        <Ionicons name={(CATEGORIES[tipo] || CATEGORIES.INSUMO).icon} size={20} color={(CATEGORIES[tipo] || CATEGORIES.INSUMO).color} />
                                    </View>
                                    <Text style={[styles.catName, { color: (CATEGORIES[tipo] || CATEGORIES.INSUMO).color }]}>
                                        {(CATEGORIES[tipo] || CATEGORIES.INSUMO).label}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                            </TouchableOpacity>

                            <AgroInput label="NOME DO ITEM" value={nome} onChangeText={setNome} placeholder="EX: FERTILIZANTE NPK 04-14-08" />

                            <View style={styles.unitSection}>
                                <Text style={styles.inputLabel}>UNIDADE DE MEDIDA</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                                    {['KG', 'LT', 'CX', 'SC', 'UNI', 'HA'].map(u => (
                                        <TouchableOpacity 
                                            key={u} 
                                            onPress={() => setUnidade(u)} 
                                            style={[styles.unitChip, unidade === u && { backgroundColor: theme?.colors?.primary, borderColor: theme?.colors?.primary }]}
                                        >
                                            <Text style={[styles.unitChipText, unidade === u && { color: '#FFF' }]}>{u}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {CATEGORIES[tipo]?.fields?.includes('principio') && (
                                <Card style={styles.extraCard}>
                                    <Text style={styles.extraTitle}>DADOS TÉCNICOS</Text>
                                    <AgroInput label="PRINCÍPIO ATIVO" value={principioAtivo} onChangeText={setPrincipioAtivo} />
                                    <AgroInput label="CLASSE TOXICOLÓGICA" value={classeToxicologica} onChangeText={setClasseToxicologica} />
                                </Card>
                            )}

                            {CATEGORIES[tipo]?.fields?.includes('composicao') && (
                                <Card style={styles.extraCard}>
                                    <Text style={styles.extraTitle}>COMPOSIÇÃO QUÍMICA</Text>
                                    <AgroInput label="DETALHES DA COMPOSIÇÃO" value={composicao} onChangeText={setComposicao} multiline />
                                </Card>
                            )}
                            
                            {(CATEGORIES[tipo]?.fields?.some(f => ['fabricante', 'nutrientes', 'dose', 'bula'].includes(f))) && (
                                <Card style={styles.extraCard}>
                                    <Text style={styles.extraTitle}>FICHA TÉCNICA AVANÇADA</Text>
                                    {CATEGORIES[tipo]?.fields?.includes('fabricante') && (
                                        <AgroInput label="FABRICANTE / MARCA" value={fabricante} onChangeText={setFabricante} />
                                    )}
                                    {CATEGORIES[tipo]?.fields?.includes('nutrientes') && (
                                        <AgroInput label="NUTRIENTES PRINCIPAIS (Ex: NPK 10-10-10)" value={nutrientes} onChangeText={setNutrientes} />
                                    )}
                                    {CATEGORIES[tipo]?.fields?.includes('dose') && (
                                        <AgroInput label="DOSE PADRÃO RECOMENDADA (Ex: 2L/ha)" value={dosePadrao} onChangeText={setDosePadrao} />
                                    )}
                                    {CATEGORIES[tipo]?.fields?.includes('bula') && (
                                        <AgroInput label="RESUMO DA BULA / INDICAÇÕES" value={bulaTexto} onChangeText={setBulaTexto} multiline style={{ height: 80 }} />
                                    )}
                                </Card>
                            )}

                            <Card style={styles.extraCard}>
                                <Text style={styles.extraTitle}>FINANCEIRO E CUSTOS</Text>
                                <AgroInput label={`CUSTO UNITÁRIO / PREÇO DE COMPRA (R$/${unidade})`} value={precoUnitario} onChangeText={setPrecoUnitario} keyboardType="numeric" placeholder="Ex: 50.00" />
                                {(tipo === 'PRODUTO' || vendavel) && (
                                    <AgroInput label="PREÇO DE VENDA (R$)" value={precoVenda} onChangeText={setPrecoVenda} keyboardType="numeric" placeholder="Ex: 120.00" />
                                )}
                            </Card>

                            <View style={styles.factorSection}>
                                <Text style={styles.inputLabel}>PESO DA EMBALAGEM / FATOR</Text>
                                <View style={styles.factorRow}>
                                    <TextInput 
                                        style={styles.factorInput} 
                                        value={fator} 
                                        onChangeText={setFator} 
                                        keyboardType="numeric" 
                                    />
                                    <TouchableOpacity style={[styles.stdBtn, { backgroundColor: theme?.colors?.primary }]} onPress={() => setAssistantVisible(true)}>
                                        <Ionicons name="bulb-outline" size={18} color="#FFF" />
                                        <Text style={styles.stdBtnText}>PADRÕES</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.toggleRow}>
                                <TouchableOpacity style={[styles.toggleBox, estocavel && styles.toggleActive]} onPress={() => setEstocavel(!estocavel)}>
                                    <Ionicons name="cube-outline" size={18} color={estocavel ? '#FFF' : '#6B7280'} />
                                    <Text style={[styles.toggleText, estocavel && { color: '#FFF' }]}>ESTOCÁVEL</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.toggleBox, vendavel && styles.toggleActive]} onPress={() => setVendavel(!vendavel)}>
                                    <Ionicons name="cash-outline" size={18} color={vendavel ? '#FFF' : '#6B7280'} />
                                    <Text style={[styles.toggleText, vendavel && { color: '#FFF' }]}>VENDÁVEL</Text>
                                </TouchableOpacity>
                            </View>

                            {editingItem && tipo === 'PRODUTO' && (
                                <AgroButton 
                                    title="FICHA TÉCNICA / RECEITA" 
                                    onPress={() => { setRecipeModalVisible(true); loadRecipeData(editingItem.uuid); }}
                                    icon="construct-outline"
                                    variant="secondary"
                                    style={{ marginVertical: 15 }}
                                />
                            )}

                            <AgroInput label="OBSERVAÇÕES" value={observacao} onChangeText={setObservacao} multiline style={{ height: 100 }} />

                            <View style={styles.actionRow}>
                                <AgroButton title="SALVAR ITEM" onPress={handleSave} style={{ flex: 1 }} />
                                <AgroButton title="FECHAR" variant="secondary" onPress={() => setModalVisible(false)} style={{ flex: 1, marginLeft: 10 }} />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL CATEGORIAS GRID */}
            <Modal visible={categoryModalVisible} transparent animationType="fade">
                <View style={styles.overlayCenter}>
                    <Card style={styles.gridModal}>
                        <Text style={styles.modalTitleCenter}>CATEGORIAS</Text>
                        <View style={styles.catGrid}>
                            {Object.keys(CATEGORIES).filter(key => !['DEFENSIVO', 'FERTILIZANTE', 'NUTRIENTE'].includes(key)).map(key => {
                                const cat = CATEGORIES[key];
                                return (
                                    <TouchableOpacity key={key} style={styles.gridItem} onPress={() => selectCategory(key)}>
                                        <View style={[styles.gridIcon, { backgroundColor: cat.bg }]}>
                                            <Ionicons name={cat.icon} size={24} color={cat.color} />
                                        </View>
                                        <Text style={styles.gridLabel}>{cat.label}</Text>
                                    </TouchableOpacity>
                                )
                            })}
                            <TouchableOpacity style={styles.gridItem} onPress={() => { setCategoryModalVisible(false); Alert.alert('Solicitar', 'Sua solicitação de categoria foi enviada para análise!'); }}>
                                <View style={[styles.gridIcon, { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' }]}>
                                    <Ionicons name="add" size={24} color="#9CA3AF" />
                                </View>
                                <Text style={[styles.gridLabel, { color: '#9CA3AF' }]}>Solicitar Categoria</Text>
                            </TouchableOpacity>
                        </View>
                        <AgroButton title="CANCELAR" variant="secondary" onPress={() => setCategoryModalVisible(false)} />
                    </Card>
                </View>
            </Modal>

            {/* MODAL PADRÕES */}
            <Modal visible={assistantVisible} transparent animationType="fade">
                <View style={styles.overlayCenter}>
                    <Card style={styles.stdModal}>
                        <Text style={styles.modalTitleCenter}>PADRÕES DE MERCADO</Text>
                        <FlatList 
                            data={MARKET_STANDARDS} 
                            keyExtractor={i => i.label}
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true} 
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.stdRow} onPress={() => { setUnidade(item.unit); setFator(item.weight); setAssistantVisible(false); }}>
                                    <Text style={styles.stdName}>{item.label}</Text>
                                    <View style={styles.stdBadge}><Text style={styles.stdValue}>{item.weight} {item.unit}</Text></View>
                                </TouchableOpacity>
                            )} 
                        />
                        <AgroButton title="FECHAR" variant="secondary" onPress={() => setAssistantVisible(false)} style={{ marginTop: 15 }} />
                    </Card>
                </View>
            </Modal>

            {/* MODAL RECEITA (FICHA TÉCNICA E COMPOSIÇÃO DE EMBALAGENS) */}
            <Modal visible={recipeModalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={[styles.modalContent, { height: '80%' }]}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>FÓRMULA / RECEITA DE BAIXA</Text>
                                <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: 'bold', marginTop: 4 }}>
                                    Para: {editingItem?.nome}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setRecipeModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ fontSize: 13, color: '#4B5563', marginBottom: 20, lineHeight: 18 }}>
                           Defina as embalagens ou insumos que devem dar baixa automaticamente do estoque na proporção correta sempre que 1 unidade deste produto for vendida.
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                            {currentRecipe.length === 0 ? (
                                <View style={{ padding: 30, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20 }}>
                                    <Ionicons name="construct-outline" size={40} color="#9CA3AF" />
                                    <Text style={{ textAlign: 'center', marginTop: 10, color: '#9CA3AF', fontWeight: 'bold', fontSize: 13 }}>
                                        Nenhuma receita configurada.
                                    </Text>
                                    <Text style={{ textAlign: 'center', marginTop: 5, color: '#9CA3AF', fontSize: 11 }}>
                                        Ao vender este produto, será dada baixa direta de 1 unidade dele mesmo no estoque.
                                    </Text>
                                </View>
                            ) : (
                                <View style={{ marginBottom: 20 }}>
                                    <Text style={styles.inputLabel}>INSUMOS VINCULADOS A ESTA VENDA</Text>
                                    {currentRecipe.map((rec) => (
                                        <View key={rec.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#F3F4F6' }}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
                                                    <Ionicons name="cube-outline" size={18} color="#6366F1" />
                                                </View>
                                                <View>
                                                    <Text style={{ fontWeight: 'bold', color: '#1F2937', fontSize: 14 }}>{rec.nome_filho}</Text>
                                                    <Text style={{ fontSize: 11, color: '#6B7280' }}>Baixa proporcional</Text>
                                                </View>
                                            </View>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                                                <Text style={{ fontWeight: '800', color: '#10B981', fontSize: 15 }}>
                                                    {rec.quantidade} {rec.unidade_filho}
                                                </Text>
                                                <TouchableOpacity onPress={() => handleDeleteRecipeItem(rec.id)} style={{ padding: 5 }}>
                                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <AgroButton 
                                title="ADICIONAR COMPONENTE / EMBALAGEM" 
                                onPress={() => setAddIngModal(true)}
                                icon="add"
                                style={{ marginTop: 10 }}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* SUBMODAL SELETOR DE COMPONENTE DA RECEITA */}
            <Modal visible={addIngModal} transparent animationType="fade">
                <View style={styles.overlayCenter}>
                    <Card style={{ padding: 25, width: '90%', maxHeight: '85%' }}>
                        <Text style={styles.modalTitleCenter}>VINCULAR EMBALAGEM / INSUMO</Text>
                        
                        <Text style={styles.inputLabel}>SELECIONE O COMPONENTE (ESTOQUE)</Text>
                        <ScrollView style={{ maxHeight: 200, marginBottom: 15, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 5 }}>
                            {items.filter(i => i.estocavel === 1 && i.uuid !== editingItem?.uuid).map(ing => (
                                <TouchableOpacity 
                                    key={ing.uuid} 
                                    onPress={() => setSelectedIng(ing)}
                                    style={{ padding: 12, backgroundColor: selectedIng?.uuid === ing.uuid ? '#D1FAE5' : 'transparent', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}
                                >
                                    <Text style={{ fontWeight: 'bold', color: selectedIng?.uuid === ing.uuid ? '#065F46' : '#374151', fontSize: 13 }}>{ing.nome}</Text>
                                    <Text style={{ fontSize: 10, color: '#6B7280', fontWeight: 'bold' }}>{ing.unidade}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {selectedIng && (
                            <View style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginBottom: 15 }}>
                                <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: 'bold' }}>Selecionado:</Text>
                                <Text style={{ fontSize: 14, fontWeight: '800', color: '#10B981', marginTop: 2 }}>{selectedIng.nome}</Text>
                            </View>
                        )}

                        <AgroInput 
                            label="QUANTIDADE DE BAIXA POR UNIDADE DO PRODUTO" 
                            value={qtdIng} 
                            onChangeText={setQtdIng} 
                            keyboardType="numeric" 
                            placeholder="Ex: 4 (para 4 cambucas por caixa)" 
                        />

                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                            <AgroButton title="CONFIRMAR" onPress={handleSaveRecipeItem} style={{ flex: 1 }} />
                            <AgroButton title="FECHAR" variant="secondary" onPress={() => { setAddIngModal(false); setSelectedIng(null); setQtdIng(''); }} style={{ flex: 1 }} />
                        </View>
                    </Card>
                </View>
            </Modal>

            {/* OPTIONS MODAL DE TOQUE LONGO */}
            <AgroOptionsModal
                visible={!!selectedItemActions}
                onClose={() => setSelectedItemActions(null)}
                title={selectedItemActions?.nome || ''}
                subtitle={CATEGORIES[selectedItemActions?.tipo]?.label || selectedItemActions?.tipo || ''}
                onEdit={() => handleEdit(selectedItemActions)}
                onDelete={() => handleDelete(selectedItemActions.id)}
                editLabel="Editar Item"
                deleteLabel="Excluir Item"
            />
        </View>
    );

    async function handleSaveRecipeItem() {
        if (!selectedIng || !qtdIng) {
            return Alert.alert('Ops!', 'Selecione um insumo e informe a quantidade.');
        }
        try {
            await insertReceita(editingItem.uuid, selectedIng.uuid, parseFloat(qtdIng));
            Alert.alert('Sucesso', 'Componente adicionado à receita!');
            setSelectedIng(null);
            setQtdIng('');
            setAddIngModal(false);
            loadRecipeData(editingItem.uuid);
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível adicionar o item à receita.');
        }
    }

    async function handleDeleteRecipeItem(id) {
        Alert.alert('Remover', 'Excluir este insumo da receita?', [
            { text: 'Não', style: 'cancel' },
            {
                text: 'Sim, Remover',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteItemReceita(id);
                        loadRecipeData(editingItem.uuid);
                    } catch (e) {
                        Alert.alert('Erro', 'Falha ao remover o item.');
                    }
                }
            }
        ]);
    }

    async function loadRecipeData(paiUuid) {
        try { const data = await getReceita(paiUuid); setCurrentRecipe(data); } catch (e) { }
    }
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },
    scanBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 },
    listContent: { padding: 20, paddingBottom: 100 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 20 },
    sectionIcon: { width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
    compactListItem: { paddingVertical: 12, paddingHorizontal: 5, borderBottomWidth: 1 },
    compactListInner: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    compactItemName: { fontSize: 13, fontWeight: '700' },
    compactTagRow: { flexDirection: 'row', gap: 4 },
    compactUnitBadge: { backgroundColor: 'rgba(107, 114, 128, 0.15)', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
    compactUnitText: { fontSize: 8, fontWeight: '900', color: '#6B7280' },
    compactTag: { paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
    compactTagText: { fontSize: 8, fontWeight: '900' },
    deleteBtn: { padding: 10 },
    empty: { textAlign: 'center', marginTop: 50, color: '#9CA3AF', fontWeight: 'bold' },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', elevation: 10 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '90%', padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1F2937', letterSpacing: 1 },
    closeBtn: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 12 },
    inputLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 10, marginTop: 15, letterSpacing: 1 },
    categorySelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: 15, backgroundColor: '#F9FAFB' },
    catInfo: { flexDirection: 'row', alignItems: 'center' },
    catIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    catName: { fontSize: 14, fontWeight: '800' },
    unitSection: { marginTop: 5 },
    unitScroll: { flexDirection: 'row' },
    unitChip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F3F4F6', marginRight: 10, borderWidth: 1, borderColor: '#E5E7EB' },
    unitChipText: { fontSize: 11, fontWeight: '900', color: '#6B7280' },
    extraCard: { marginTop: 15, padding: 15, backgroundColor: '#F9FAFB', borderStyle: 'dashed' },
    extraTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginBottom: 15 },
    factorSection: { marginTop: 5 },
    factorRow: { flexDirection: 'row', gap: 10 },
    factorInput: { flex: 1, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 15, padding: 12, fontSize: 15, fontWeight: '800', color: '#1F2937' },
    stdBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderRadius: 15, gap: 8 },
    stdBtnText: { color: '#FFF', fontWeight: '900', fontSize: 10 },
    toggleRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
    toggleBox: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 15, backgroundColor: '#F3F4F6', gap: 8 },
    toggleActive: { backgroundColor: '#10B981' },
    toggleText: { fontSize: 11, fontWeight: '900', color: '#6B7280' },
    actionRow: { flexDirection: 'row', marginTop: 30 },
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
    gridModal: { padding: 25 },
    modalTitleCenter: { fontSize: 16, fontWeight: '900', color: '#1F2937', textAlign: 'center', marginBottom: 25, letterSpacing: 1 },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25, justifyContent: 'center' },
    gridItem: { width: (width - 110) / 3, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
    gridIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    gridLabel: { fontSize: 10, fontWeight: '800', color: '#4B5563', textAlign: 'center' },
    stdModal: { padding: 25, maxHeight: '80%' },
    stdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    stdName: { fontSize: 14, fontWeight: '700', color: '#374151' },
    stdBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    stdValue: { fontSize: 11, fontWeight: '900', color: '#10B981' }
});

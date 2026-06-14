import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertColheita, getCadastro, executeQuery, insertDescarte, getColheitasRecentes, deleteColheita } from '../database/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

// Design System
import AgroButton from '../components/common/AgroButton';
import SmartAutocomplete from '../components/common/SmartAutocomplete';
import { TalhaoLibraryService as AreaLibraryService, ProductLibraryService } from '../services/LibraryServices';
import AgroInput from '../components/common/AgroInput';

export default function ColheitaScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    
    const [activeTab, setActiveTab] = useState('COLHEITA'); // 'COLHEITA' | 'CONGELAMENTO' | 'DESCARTE'

    // Form States
    const [talhao, setTalhao] = useState('');
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [observacao, setObservacao] = useState('');
    const [qtdCaixas, setQtdCaixas] = useState('');
    const [fatorAtual, setFatorAtual] = useState(1);

    // Congelamento Tab State
    const [congTalhao, setCongTalhao] = useState('');
    const [congProduto, setCongProduto] = useState('');
    const [congQtd, setCongQtd] = useState('');
    const [congObs, setCongObs] = useState('');

    // Descarte Tab State
    const [descProduto, setDescProduto] = useState('');
    const [descQtd, setDescQtd] = useState('');
    const [descMotivo, setDescMotivo] = useState('');
    const [descObs, setDescObs] = useState('');

    // Multi-item Temp State for Harvest Tab
    const [harvestItems, setHarvestItems] = useState([]);
    
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal Trigger Targets
    const [quickAddModal, setQuickAddModal] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemFator, setNewItemFator] = useState('1');

    // Lists
    const [productsDB, setProductsDB] = useState([]);
    const [areasDB, setAreasDB] = useState([]);
    const [searchText, setSearchText] = useState('');

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const loadData = async () => {
        setLoading(true);
        try {
            const allItems = await getCadastro();
            setProductsDB(allItems.filter(i => i.tipo === 'PRODUTO'));
            const resTalhoes = await executeQuery('SELECT * FROM talhoes WHERE is_deleted = 0 ORDER BY nome ASC');
            const areas = [];
            for (let i = 0; i < resTalhoes.rows.length; i++) areas.push(resTalhoes.rows.item(i));
            setAreasDB(areas);
            
            const hist = await getColheitasRecentes();
            setHistory(hist);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const up = (t, setter) => setter(t.toUpperCase());

    const handleCaixasChange = (txt) => {
        setQtdCaixas(txt);
        const boxes = parseFloat(txt) || 0;
        if (boxes > 0) {
            setQuantidade((boxes * fatorAtual).toFixed(2));
        } else {
            setQuantidade('');
        }
    };

    const addHarvestItem = () => {
        if (!produto || !quantidade || parseFloat(quantidade) <= 0) {
            Alert.alert('Atenção', 'Selecione o produto e informe uma quantidade válida.');
            return;
        }

        const newItem = {
            id: uuidv4(),
            produto: produto.toUpperCase(),
            quantidade: parseFloat(quantidade),
            qtdCaixas: parseFloat(qtdCaixas) || 0,
            fator: fatorAtual
        };

        setHarvestItems([...harvestItems, newItem]);
        setProduto(''); setQuantidade(''); setQtdCaixas(''); setFatorAtual(1);
    };

    const removeHarvestItem = (id) => setHarvestItems(harvestItems.filter(item => item.id !== id));

    const editHarvestItem = (item) => {
        setProduto(item.produto);
        setQuantidade(item.quantidade.toString());
        setQtdCaixas(item.qtdCaixas > 0 ? item.qtdCaixas.toString() : '');
        setFatorAtual(item.fator);
        removeHarvestItem(item.id);
    };

    const updateStock = async (prod, qty, isAddition = true) => {
        try {
            const check = await executeQuery('SELECT * FROM estoque WHERE produto = ?', [prod]);
            if (check.rows.length > 0) {
                const current = check.rows.item(0).quantidade;
                const newQty = isAddition ? (current + qty) : Math.max(0, current - qty);
                await executeQuery('UPDATE estoque SET quantidade = ?, last_updated = ? WHERE produto = ?', [newQty, new Date().toISOString(), prod]);
            } else if (isAddition) {
                await executeQuery('INSERT INTO estoque (produto, quantidade, last_updated) VALUES (?, ?, ?)', [prod, qty, new Date().toISOString()]);
            }
        } catch (e) { console.error('Falha ao atualizar estoque:', e); }
    };

    const salvarColheita = async () => {
        if (!talhao || harvestItems.length === 0) {
            Alert.alert('Atenção', 'Preencha o talhão e adicione pelo menos um item colhido.');
            return;
        }

        Alert.alert(
            'Enviar para Estoque',
            'Deseja enviar estes itens colhidos diretamente para o controle de estoque do AgroGB?',
            [
                { text: 'Apenas Registrar', onPress: () => processSaveColheita(false) },
                { text: 'Sim, Atualizar Estoque', onPress: () => processSaveColheita(true), style: 'default' }
            ]
        );
    };

    const processSaveColheita = async (sendToStock) => {
        try {
            for (const item of harvestItems) {
                await insertColheita({
                    uuid: uuidv4(), cultura: talhao.toUpperCase(), produto: item.produto,
                    quantidade: item.quantidade, congelado: 0, observacao: observacao.toUpperCase(),
                    data: new Date().toISOString().split('T')[0]
                });
                if (sendToStock) await updateStock(item.produto, item.quantidade, true);
            }
            Alert.alert('Tudo Certo!', 'Colheita registrada com sucesso!');
            setHarvestItems([]); setObservacao(''); setTalhao(''); loadData();
        } catch (e) { Alert.alert('Erro', 'Não conseguimos salvar a colheita.'); }
    };

    const salvarCongelamento = async () => {
        if (!congTalhao || !congProduto || !congQtd) {
            Alert.alert('Atenção', 'Preencha os campos obrigatórios.');
            return;
        }

        Alert.alert(
            'Confirmar Congelamento',
            'Deseja abater este valor do seu estoque de produtos frescos e registrar como congelado?',
            [
                { text: 'Registrar Apenas', onPress: () => processSaveCongelamento(false) },
                { text: 'Sim, Abater Estoque', onPress: () => processSaveCongelamento(true) }
            ]
        );
    };

    const processSaveCongelamento = async (deductFromFreshStock) => {
        try {
            const qty = parseFloat(congQtd);
            await insertColheita({
                uuid: uuidv4(), cultura: congTalhao.toUpperCase(), produto: congProduto.toUpperCase(),
                quantidade: 0, congelado: qty, observacao: `[CONGELAMENTO] ${congObs.toUpperCase()}`,
                data: new Date().toISOString().split('T')[0]
            });
            if (deductFromFreshStock) await updateStock(congProduto.toUpperCase(), qty, false);
            Alert.alert('Sucesso!', 'Congelamento registrado.');
            setCongTalhao(''); setCongProduto(''); setCongQtd(''); setCongObs(''); loadData();
        } catch (e) { Alert.alert('Erro', 'Falha ao registrar congelamento.'); }
    };

    const salvarDescarte = async () => {
        if (!descProduto || !descQtd || !descMotivo) {
            Alert.alert('Atenção', 'Preencha os campos obrigatórios.');
            return;
        }

        Alert.alert(
            'Confirmar Descarte',
            'Deseja abater a quantidade descartada do seu estoque atual?',
            [
                { text: 'Registrar Apenas', onPress: () => processSaveDescarte(false) },
                { text: 'Sim, Abater Estoque', onPress: () => processSaveDescarte(true), style: 'destructive' }
            ]
        );
    };

    const processSaveDescarte = async (deductFromStock) => {
        try {
            const qty = parseFloat(descQtd);
            await insertDescarte({
                uuid: uuidv4(), produto: descProduto.toUpperCase(), quantidade_kg: qty,
                motivo: `${descMotivo.toUpperCase()} - ${descObs.toUpperCase()}`,
                data: new Date().toISOString().split('T')[0]
            });
            if (deductFromStock) await updateStock(descProduto.toUpperCase(), qty, false);
            Alert.alert('Descarte Salvo', 'Descarte salvo com sucesso.');
            setDescProduto(''); setDescQtd(''); setDescMotivo(''); setDescObs(''); loadData();
        } catch (e) { Alert.alert('Erro', 'Falha ao registrar descarte.'); }
    };

    const handleDelete = (item) => {
        Alert.alert('Excluir', 'Confirmar exclusão?', [
            { text: 'Não', style: 'cancel' },
            { text: 'Sim', style: 'destructive', onPress: async () => { await deleteColheita(item.uuid); loadData(); } }
        ]);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: activeColors.bg || '#0B121E' }]}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#0B121E' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            {/* CABEÇALHO GLASSMORPHISM */}
            <LinearGradient colors={['#111827', '#0F172A']} style={styles.header}>
                <SafeAreaView>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>APONTAMENTOS</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {/* ABAS (PILLS) INTERATIVAS */}
            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                    <TouchableOpacity 
                        style={[styles.pill, activeTab === 'COLHEITA' && styles.pillActive]}
                        onPress={() => setActiveTab('COLHEITA')}
                    >
                        <Text style={[styles.pillText, activeTab === 'COLHEITA' && { color: '#FFF' }]}>🌾 COLHEITA</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.pill, activeTab === 'CONGELAMENTO' && styles.pillActive]}
                        onPress={() => setActiveTab('CONGELAMENTO')}
                    >
                        <Text style={[styles.pillText, activeTab === 'CONGELAMENTO' && { color: '#FFF' }]}>❄️ CONGELAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.pill, activeTab === 'DESCARTE' && styles.pillActive]}
                        onPress={() => setActiveTab('DESCARTE')}
                    >
                        <Text style={[styles.pillText, activeTab === 'DESCARTE' && { color: '#FFF' }]}>🗑️ DESCARTE</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                
                {/* FORMS COM GLASSMORPHISM */}
                {activeTab === 'COLHEITA' && (
                    <LinearGradient colors={['#1F2937', '#111827']} style={styles.formGradient}>
                        <Text style={styles.sectionTitle}>1. ONDE? (LOCALIZAÇÃO)</Text>
                        <SmartAutocomplete
                            label="Localização / Talhão *"
                            value={talhao}
                            onSelect={item => setTalhao(item ? item.nome : '')}
                            service={AreaLibraryService}
                            title="SELECIONAR TALHÃO"
                            placeholder="Buscar talhão..."
                            icon="map"
                            quickAddFields={[
                                { key: 'nome', label: 'NOME DO TALHÃO', placeholder: 'Ex: Talhão A1' },
                                { key: 'tamanho', label: 'TAMANHO (HECTARES)', placeholder: 'Ex: 10' }
                            ]}
                        />

                        <Text style={styles.sectionTitle}>2. O QUE? (PRODUTO E QUANTIDADE)</Text>
                        <SmartAutocomplete
                            label="Variedade / Produto *"
                            value={produto}
                            onSelect={item => {
                                setProduto(item ? item.nome : '');
                                setFatorAtual(item?.fator_conversao || 1);
                                if (qtdCaixas) setQuantidade((parseFloat(qtdCaixas) * (item?.fator_conversao || 1)).toFixed(2));
                            }}
                            service={ProductLibraryService}
                            title="SELECIONAR PRODUTO"
                            placeholder="Buscar produto..."
                            icon="leaf"
                            quickAddFields={[
                                { key: 'nome', label: 'NOME DO PRODUTO', placeholder: 'Ex: Milho Safrinha' },
                                { key: 'categoria', label: 'CATEGORIA', placeholder: 'Ex: Grãos' }
                            ]}
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <AgroInput 
                                    label="volumes (CX)"
                                    value={qtdCaixas}
                                    onChangeText={handleCaixasChange}
                                    placeholder="0"
                                    keyboardType="decimal-pad"
                                />
                                <Text style={styles.fatorText}>Fator: {fatorAtual} Kg</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <AgroInput 
                                    label="Total Kg *"
                                    value={quantidade}
                                    onChangeText={setQuantidade}
                                    placeholder="0.00"
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>

                        <TouchableOpacity style={styles.addItemBtn} onPress={addHarvestItem}>
                            <Ionicons name="add-circle" size={20} color="#10B981" />
                            <Text style={styles.addItemText}>ADICIONAR À LISTA</Text>
                        </TouchableOpacity>

                        {harvestItems.length > 0 && (
                            <View style={styles.tempListContainer}>
                                <Text style={styles.tempListTitle}>ITENS AGUARDANDO SALVAMENTO ({harvestItems.length})</Text>
                                {harvestItems.map((item) => (
                                    <View key={item.id} style={styles.tempItemCard}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.tempItemName}>{item.produto}</Text>
                                            <Text style={styles.tempItemSub}>{item.quantidade} kg {item.qtdCaixas > 0 ? `(${item.qtdCaixas} cx)` : ''}</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <TouchableOpacity onPress={() => editHarvestItem(item)}>
                                                <Ionicons name="pencil" size={16} color="#9CA3AF" />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => removeHarvestItem(item.id)}>
                                                <Ionicons name="trash" size={16} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        <Text style={styles.sectionTitle}>3. OBSERVAÇÕES ADICIONAIS</Text>
                        <AgroInput 
                            label="Observações"
                            value={observacao}
                            onChangeText={(t) => up(t, setObservacao)}
                            placeholder="DETALHES TÉCNICOS..."
                            icon="document-text"
                            style={{ marginBottom: 20 }}
                        />
                        <AgroButton title="SALVAR APONTAMENTO" onPress={salvarColheita} />
                    </LinearGradient>
                )}

                {activeTab === 'CONGELAMENTO' && (
                    <LinearGradient colors={['#1F2937', '#111827']} style={styles.formGradient}>
                        <Text style={styles.sectionTitle}>CONGELAR PRODUTOS FRESCOS</Text>
                        <SmartAutocomplete
                            label="Localização / Talhão *"
                            value={congTalhao}
                            onSelect={item => setCongTalhao(item ? item.nome : '')}
                            service={AreaLibraryService}
                            title="SELECIONAR TALHÃO"
                            placeholder="Buscar talhão..."
                            icon="map"
                        />
                        <SmartAutocomplete
                            label="Produto / Cultura *"
                            value={congProduto}
                            onSelect={item => setCongProduto(item ? item.nome : '')}
                            service={ProductLibraryService}
                            title="SELECIONAR PRODUTO"
                            placeholder="Buscar produto..."
                            icon="leaf"
                        />
                        <AgroInput label="Quantidade a Congelar (Kg) *" value={congQtd} onChangeText={setCongQtd} placeholder="0.00" keyboardType="decimal-pad" style={{ marginBottom: 15 }} />
                        <AgroInput label="Observações" value={congObs} onChangeText={t => up(t, setCongObs)} placeholder="Ex: Carga câmara fria 2" icon="document-text" style={{ marginBottom: 20 }} />
                        <AgroButton title="REGISTRAR CONGELAMENTO" onPress={salvarCongelamento} />
                    </LinearGradient>
                )}

                {activeTab === 'DESCARTE' && (
                    <LinearGradient colors={['#1F2937', '#111827']} style={styles.formGradient}>
                        <Text style={styles.sectionTitle}>LANÇAR PERDA / DESCARTE DE PRODUTO</Text>
                        <SmartAutocomplete
                            label="Produto / Cultura *"
                            value={descProduto}
                            onSelect={item => setDescProduto(item ? item.nome : '')}
                            service={ProductLibraryService}
                            title="SELECIONAR PRODUTO"
                            placeholder="Buscar produto..."
                            icon="leaf"
                        />
                        <AgroInput label="Quantidade Descartada (Kg) *" value={descQtd} onChangeText={setDescQtd} placeholder="0.00" keyboardType="decimal-pad" style={{ marginBottom: 15 }} />
                        <AgroInput label="Motivo do Descarte *" value={descMotivo} onChangeText={t => up(t, setDescMotivo)} placeholder="Ex: Fruto passado, pragas..." icon="alert-circle-outline" style={{ marginBottom: 15 }} />
                        <AgroInput label="Observações" value={descObs} onChangeText={t => up(t, setDescObs)} placeholder="Detalhes adicionais" icon="document-text" style={{ marginBottom: 20 }} />
                        <AgroButton title="REGISTRAR DESCARTE" onPress={salvarDescarte} color="#EF4444" />
                    </LinearGradient>
                )}

                {/* FEED DE HISTÓRICO GLASSMORPHISM */}
                <Text style={styles.historyTitle}>ÚLTIMOS APONTAMENTOS DE COLHEITA</Text>
                {history.map(item => (
                    <LinearGradient key={item.uuid} colors={['#1F2937', '#111827']} style={styles.historyCard}>
                        <View style={styles.historyIcon}>
                            <Ionicons name="leaf" size={20} color="#10B981" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.hProd}>{item.produto}</Text>
                            <Text style={styles.hSub}>{item.cultura} • {new Date(item.data).toLocaleDateString('pt-BR')}</Text>
                            <Text style={styles.hVal}>
                                {item.quantidade > 0 ? `${item.quantidade} kg Colhido ` : ''}
                                {item.congelado > 0 ? `${item.congelado} kg Congelado` : ''}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionBtn}>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </LinearGradient>
                ))}
            </ScrollView>

            {/* MODAIS LEGADOS REMOVIDOS - INTEGRADO AO SMARTAUTOCOMPLETE */}

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { justifyContent: 'center', alignItems: 'center' },
    
    header: { paddingTop: 40, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    
    filtersContainer: { marginTop: -20, height: 40 },
    pill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1F2937', marginRight: 10, borderWidth: 1, borderColor: '#374151' },
    pillActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    pillText: { color: '#9CA3AF', fontSize: 12, fontWeight: 'bold' },
    
    list: { padding: 20, paddingBottom: 100 },
    
    formGradient: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, marginTop: 10, marginBottom: 15 },
    row: { flexDirection: 'row' },
    fatorText: { fontSize: 9, color: '#10B981', fontWeight: 'bold', marginLeft: 10, marginBottom: 10, marginTop: 5 },
    
    addItemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#10B981', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 15, marginTop: 10, marginBottom: 20, backgroundColor: 'rgba(16, 185, 129, 0.05)' },
    addItemText: { fontSize: 12, fontWeight: '900', color: '#10B981', letterSpacing: 0.5 },
    
    tempListContainer: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    tempListTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, marginBottom: 15 },
    tempItemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#374151', borderRadius: 10, padding: 12, marginBottom: 8 },
    tempItemName: { fontSize: 13, fontWeight: '800', color: '#FFF' },
    tempItemSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    
    historyTitle: { fontSize: 12, fontWeight: '900', color: '#6B7280', letterSpacing: 1, marginTop: 10, marginBottom: 15, marginLeft: 5 },
    historyCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 15, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    historyIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    hProd: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
    hSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
    hVal: { fontSize: 12, fontWeight: '900', color: '#10B981', marginTop: 4 },
    actionBtn: { padding: 8, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 10, marginLeft: 10 },
    
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
    modalBg: { backgroundColor: '#1F2937', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '80%', padding: 25 },
    miniModal: { backgroundColor: '#1F2937', borderRadius: 25, padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    searchBar: { backgroundColor: '#374151', padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 14, color: '#FFF' },
    itemRow: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#374151' },
    itemText: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
    itemSub: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
    miniBtn: { flex: 1, backgroundColor: '#10B981', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 15, marginHorizontal: 5 },
    btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }
});

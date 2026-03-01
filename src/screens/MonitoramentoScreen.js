import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, FlatList, Modal, Alert, StyleSheet, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getCadastro } from '../database/database';
// Mock analyzeContent if not found, or user can add it later. 
// For now, I'll define a local mock if the import is tricky, but best to import from services if it exists.
// Checking previous turns, 'analyzeContent' might be in a file I haven't seen. 
// I will assume it is in '../services/ai' or similar, but if grep fails, I will add a placeholder.
import { analyzeContent } from '../services/AIService';
import { MenuConfigService } from '../services/MenuConfigService';

const THEME = {
    bg: '#F4F6F5',
    headerBg: ['#176E46', '#1F8A5B'],
    tabActive: '#FFF',
    tabInactive: 'rgba(255,255,255,0.3)',
    textMain: '#1E1E1E'
};

export default function MonitoramentoScreen({ navigation }) {
    // FEATURE FLAGS (Remote Config)
    const [features, setFeatures] = useState({
        novo_registro: true,
        pesquisa_pdf: true,
        galeria_fotos: true
    });

    // TABS: REGISTROS | BASE_CONHECIMENTO
    const [activeTab, setActiveTab] = useState('REGISTROS');
    const [isGalleryMode, setIsGalleryMode] = useState(false); // To toggle Grid/List

    // SUB-SCREENS: LIST, NEW, ANALYSIS, DETAIL
    const [screen, setScreen] = useState('LIST');

    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [areas, setAreas] = useState([]);

    // Knowledge Base Search
    const [kbQuery, setKbQuery] = useState('');
    const [kbItems, setKbItems] = useState([]);
    const [allKb, setAllKb] = useState([]);

    // Form State
    const [form, setForm] = useState({
        uuid: '', area: null, cultura: '', data: '', observacao: '',
        mediaURI: null, mediaType: null, mediaBase64: null
    });
    const [analysis, setAnalysis] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    // Camera
    const [cameraVisible, setCameraVisible] = useState(false);
    const cameraRef = useRef(null);

    useFocusEffect(useCallback(() => {
        loadData();
        loadKnowledgeBase();
        MenuConfigService.getMonitoramentoFeatures().then(f => {
            if (f) setFeatures(f);
        });
    }, []));

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await executeQuery(`
                SELECT m.*, i.classificacao_principal 
                FROM monitoramento_entidade m
                LEFT JOIN analise_ia i ON m.uuid = i.monitoramento_uuid
                ORDER BY m.data DESC LIMIT 50
            `);
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setHistory(rows);

            const cad = await getCadastro();
            setAreas(cad.filter(i => i.tipo === 'AREA' || i.tipo === 'CULTURA'));
        } catch (e) { } finally { setLoading(false); }
    };

    const loadKnowledgeBase = async () => {
        try {
            const res = await executeQuery('SELECT * FROM base_conhecimento_pro WHERE ativo = 1 ORDER BY titulo ASC');
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setAllKb(rows);
            setKbItems(rows);
        } catch (e) { console.log('KB Error', e); }
    };

    useEffect(() => {
        if (!kbQuery) setKbItems(allKb);
        else {
            const up = kbQuery.toUpperCase();
            setKbItems(allKb.filter(i =>
                i.titulo.toUpperCase().includes(up) ||
                (i.sintomas && i.sintomas.toUpperCase().includes(up))
            ));
        }
    }, [kbQuery, allKb]);

    const startNew = () => {
        setForm({ uuid: uuidv4(), area: null, cultura: '', data: new Date().toISOString(), observacao: '', mediaURI: null, mediaType: null, mediaBase64: null });
        setScreen('NEW');
    };

    const pickDocument = async () => {
        try {
            const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
            if (!res.canceled && res.assets && res.assets.length > 0)
                setForm(p => ({ ...p, mediaURI: res.assets[0].uri, mediaType: 'PDF' }));
        } catch (e) { }
    };

    const takePhoto = async () => {
        if (cameraRef.current) {
            const p = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
            setForm(prev => ({ ...prev, mediaURI: p.uri, mediaType: 'IMAGEM', mediaBase64: p.base64 }));
            setCameraVisible(false);
        }
    };

    const runAI = async () => {
        if (!form.area && !form.cultura) { Alert.alert('Atenção', 'Informe Área/Cultura'); return; }
        if (!form.observacao && !form.mediaURI) { Alert.alert('Atenção', 'Informe dados'); return; }
        setLoading(true);
        try {
            const res = await analyzeContent(form.mediaURI, form.mediaType, form.mediaBase64 || form.observacao);
            if (res.success) { setAnalysis(res.data); setScreen('ANALYSIS'); }
            else Alert.alert('Erro', 'Falha na análise.');
        } catch (e) { Alert.alert('Erro', 'Erro conexao'); }
        finally { setLoading(false); }
    };

    const saveFinal = async () => {
        try {
            const uuid = form.uuid;
            await executeQuery(`INSERT INTO monitoramento_entidade (uuid, area_id, cultura_id, data, observacao_usuario, status, nivel_confianca, criado_em, last_updated) VALUES (?,?,?,?,?,?,?,?,?)`,
                [uuid, form.area?.uuid || 'N/A', form.area?.nome || form.cultura || 'GERAL', form.data, form.observacao.toUpperCase(), 'CONFIRMADO', analysis?.nivel_confianca_sugerido || 'INFORMATIVO', new Date().toISOString(), new Date().toISOString()]
            );
            if (form.mediaURI) await executeQuery(`INSERT INTO monitoramento_media (uuid, monitoramento_uuid, tipo, caminho_arquivo, criado_em, last_updated) VALUES (?,?,?,?,?,?)`, [uuidv4(), uuid, form.mediaType, form.mediaURI, new Date().toISOString(), new Date().toISOString()]);
            if (analysis) await executeQuery(`INSERT INTO analise_ia (uuid, monitoramento_uuid, classificacao_principal, sintomas, causa_provavel, sugestao_controle, produtos_citados, criado_em, last_updated) VALUES (?,?,?,?,?,?,?,?,?)`,
                [uuidv4(), uuid, analysis.classificacao_principal, analysis.sintomas, analysis.causa_provavel, analysis.sugestao_controle, analysis.produtos_citados, new Date().toISOString(), new Date().toISOString()]
            );
            Alert.alert('Sucesso', 'Salvo!');
            loadData();
            setScreen('LIST');
        } catch (e) { Alert.alert('Erro', 'Falha BD'); }
    };

    // RENDERERS

    const renderHeader = () => (
        <LinearGradient colors={THEME.headerBg} style={styles.header}>
            <View style={styles.headerTop}>
                {screen !== 'LIST' ?
                    <TouchableOpacity onPress={() => setScreen('LIST')}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity> :
                    <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color="#FFF" /></TouchableOpacity>
                }
                <Text style={styles.headerTitle}>
                    {screen === 'LIST' ? 'MONITORAMENTO' : screen === 'NEW' ? 'NOVO REGISTRO' : 'DETALHES'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            {/* TAB BAR (Only visible in LIST mode) */}
            {screen === 'LIST' && (
                <View style={styles.tabBar}>
                    {features.novo_registro && (
                        <TouchableOpacity style={[styles.tabItem, activeTab === 'REGISTROS' && styles.tabItemActive]} onPress={() => setActiveTab('REGISTROS')}>
                            <Text style={[styles.tabText, activeTab === 'REGISTROS' && styles.tabTextActive]}>DIÁRIO DE CAMPO</Text>
                        </TouchableOpacity>
                    )}
                    {features.pesquisa_pdf && (
                        <TouchableOpacity style={[styles.tabItem, activeTab === 'KB' && styles.tabItemActive]} onPress={() => setActiveTab('KB')}>
                            <Text style={[styles.tabText, activeTab === 'KB' && styles.tabTextActive]}>BASE DE CONHECIMENTO</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </LinearGradient>
    );

    const renderList = () => (
        <View style={{ flex: 1 }}>
            <FlatList
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                data={history}
                keyExtractor={i => i.uuid}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} onPress={() => { setSelectedItem(item); setScreen('DETAIL'); }}>
                        <View style={styles.cardHeader}>
                            <View style={styles.badgeDate}>
                                <Text style={styles.dateText}>{new Date(item.data).toLocaleDateString().slice(0, 5)}</Text>
                            </View>
                            <Text style={styles.cardTitle}>{item.cultura_id}</Text>
                        </View>
                        <Text style={styles.cardBody} numberOfLines={2}>
                            {item.classificacao_principal ? `🤖 ${item.classificacao_principal}` : item.observacao_usuario}
                        </Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.empty}>Nenhum registro.</Text>}
            />
            {features.novo_registro && (
                <TouchableOpacity style={styles.fab} onPress={startNew}><Ionicons name="add" size={30} color="#FFF" /></TouchableOpacity>
            )}
        </View>
    );

    const renderKB = () => (
        <View style={{ flex: 1, padding: 20 }}>
            <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color="#9CA3AF" />
                <TextInput
                    style={styles.inputSearch}
                    placeholder="Buscar pragas, doenças..."
                    placeholderTextColor="#9CA3AF"
                    value={kbQuery}
                    onChangeText={setKbQuery}
                />
            </View>

            <FlatList
                data={kbItems}
                keyExtractor={i => i.uuid || i.id?.toString()}
                renderItem={({ item }) => (
                    <View style={styles.kbCard}>
                        <View style={styles.kbHeader}>
                            <View style={[styles.kbTag, { backgroundColor: item.tipo === 'DOENCA' ? '#FEE2E2' : '#FEF3C7' }]}>
                                <Text style={[styles.kbTagText, { color: item.tipo === 'DOENCA' ? '#991B1B' : '#92400E' }]}>{item.tipo}</Text>
                            </View>
                            <Text style={styles.kbTitle}>{item.titulo}</Text>
                        </View>
                        <Text style={styles.kbLabel}>SINTOMAS:</Text>
                        <Text style={styles.kbText}>{item.sintomas}</Text>
                        <Text style={styles.kbLabel}>CONTROLE:</Text>
                        <Text style={styles.kbText}>{item.controle}</Text>
                        <Text style={styles.kbSource}>Fonte: {item.fonte}</Text>
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.empty}>Nenhum resultado na base técnica.</Text>}
            />
        </View>
    );

    const renderNewForm = () => (
        <ScrollView style={{ flex: 1, padding: 20 }}>
            <Text style={styles.label}>LOCAL / CULTURA</Text>
            <View style={styles.inputRow}>
                <Ionicons name="map-outline" size={20} color="#6B7280" />
                <TextInput style={styles.input} placeholder="Ex: Talhão 1" value={form.cultura} onChangeText={t => setForm({ ...form, cultura: t })} />
            </View>

            <Text style={styles.label}>OBSERVAÇÃO</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} multiline placeholder="Descreva aqui..." value={form.observacao} onChangeText={t => setForm({ ...form, observacao: t })} />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
                <TouchableOpacity style={styles.mediaBtn} onPress={() => setCameraVisible(true)}>
                    <Ionicons name="camera" size={24} color="#059669" />
                    <Text>FOTO</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaBtn} onPress={pickDocument}>
                    <Ionicons name="document-text" size={24} color="#EA580C" />
                    <Text>PDF</Text>
                </TouchableOpacity>
            </View>

            {form.mediaURI && <Text style={{ marginTop: 10, color: '#059669', fontWeight: 'bold' }}>Mídia anexada!</Text>}

            <TouchableOpacity style={styles.btnAi} onPress={runAI}>
                <Ionicons name="sparkles" size={20} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: 'bold', marginLeft: 10 }}>ANALISAR COM IA</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSave} onPress={saveFinal}>
                <Text style={{ color: '#6B7280', fontWeight: 'bold' }}>SALVAR SEM IA</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    const renderAnalysisView = () => (
        <ScrollView style={{ flex: 1, padding: 20 }}>
            {analysis && (
                <View style={styles.aiResultBox}>
                    <Text style={styles.aiTitle}>DIAGNÓSTICO: {analysis.classificacao_principal}</Text>
                    <Text style={styles.aiBody}>{analysis.sintomas}</Text>
                    <Text style={styles.aiLabel}>SUGESTÃO DE CONTROLE:</Text>
                    <TextInput
                        style={styles.aiInput}
                        multiline
                        value={analysis.sugestao_controle}
                        onChangeText={t => setAnalysis({ ...analysis, sugestao_controle: t })}
                    />
                    <TouchableOpacity style={styles.btnConfirm} onPress={saveFinal}>
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>CONFIRMAR DIAGNÓSTICO</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );

    // Camera Modal
    if (cameraVisible) return (
        <Modal visible={true}>
            <Camera style={{ flex: 1 }} ref={cameraRef}>
                <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 50 }}>
                    <TouchableOpacity onPress={takePhoto} style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF' }} />
                    <TouchableOpacity onPress={() => setCameraVisible(false)} style={{ position: 'absolute', top: 50, right: 30 }}><Ionicons name="close" size={40} color="#FFF" /></TouchableOpacity>
                </View>
            </Camera>
        </Modal>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}
            {screen === 'LIST' && activeTab === 'REGISTROS' && renderList()}
            {screen === 'LIST' && activeTab === 'KB' && renderKB()}
            {screen === 'NEW' && renderNewForm()}
            {screen === 'ANALYSIS' && renderAnalysisView()}
            {screen === 'DETAIL' && <View style={{ padding: 20 }}><Text style={styles.label}>Detalhes do registro...</Text><TouchableOpacity onPress={() => setScreen('LIST')}><Text>Voltar</Text></TouchableOpacity></View>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: THEME.bg },
    header: { paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

    tabBar: { flexDirection: 'row', marginTop: 22, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 4 },
    tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabItemActive: { backgroundColor: '#FFF' },
    tabText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
    tabTextActive: { color: '#176E46' },

    // List
    card: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    badgeDate: { backgroundColor: '#F4F6F5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    dateText: { fontSize: 11, fontWeight: '700', color: '#6E6E6E' },
    cardTitle: { fontSize: 14, fontWeight: '700', color: '#1E1E1E' },
    cardBody: { fontSize: 13, color: '#6E6E6E' },
    fab: { position: 'absolute', bottom: 28, right: 28, width: 58, height: 58, borderRadius: 29, backgroundColor: '#1F8A5B', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#1F8A5B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    empty: { textAlign: 'center', marginTop: 50, color: '#6E6E6E' },

    // KB
    searchBox: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', height: 48, marginBottom: 18, borderWidth: 1, borderColor: '#D9D9D9' },
    inputSearch: { flex: 1, marginLeft: 10, fontSize: 15, color: '#1E1E1E' },
    kbCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#F4F6F5', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6 },
    kbHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
    kbTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    kbTagText: { fontSize: 10, fontWeight: '800' },
    kbTitle: { fontSize: 15, fontWeight: '800', color: '#1E1E1E', flex: 1 },
    kbLabel: { fontSize: 11, fontWeight: '700', color: '#6E6E6E', marginTop: 10, marginBottom: 2, textTransform: 'uppercase' },
    kbText: { fontSize: 14, color: '#1E1E1E', lineHeight: 20 },
    kbSource: { fontSize: 10, color: '#6E6E6E', fontStyle: 'italic', marginTop: 14, textAlign: 'right' },

    // Form
    label: { fontSize: 11, fontWeight: '700', color: '#6E6E6E', marginBottom: 6, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: '#1E1E1E' },
    inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 14, paddingHorizontal: 14 },
    mediaBtn: { flex: 1, backgroundColor: '#FFF', padding: 18, alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: '#D9D9D9' },
    btnAi: { flexDirection: 'row', backgroundColor: '#1F8A5B', padding: 17, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginTop: 28 },
    btnSave: { padding: 14, alignItems: 'center', marginTop: 10 },

    // AI Result
    aiResultBox: { backgroundColor: '#E8F5EE', padding: 20, borderRadius: 18 },
    aiTitle: { fontSize: 17, fontWeight: '900', color: '#176E46', marginBottom: 10 },
    aiBody: { fontSize: 14, color: '#1F8A5B', marginBottom: 18 },
    aiLabel: { fontSize: 12, fontWeight: '700', color: '#1F8A5B' },
    aiInput: { backgroundColor: '#FFF', borderRadius: 10, padding: 10, minHeight: 60, textAlignVertical: 'top', marginTop: 5, borderWidth: 1, borderColor: '#D9D9D9' },
    btnConfirm: { backgroundColor: '#1F8A5B', padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 18 }
});


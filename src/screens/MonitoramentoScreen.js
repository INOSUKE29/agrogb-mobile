import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, FlatList, Modal, Alert, StyleSheet, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getCadastro } from '../database/database';
import { analyzeContent } from '../services/AIService';
import { MenuConfigService } from '../services/MenuConfigService';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import GlowInput from '../ui/GlowInput';
import PrimaryButton from '../ui/PrimaryButton';
import GlowFAB from '../ui/GlowFAB';
import { DARK, MODAL_OVERLAY } from '../styles/darkTheme';

export default function MonitoramentoScreen({ navigation }) {
    const [features, setFeatures] = useState({ novo_registro: true, pesquisa_pdf: true, galeria_fotos: true });
    const [activeTab, setActiveTab] = useState('REGISTROS');
    const [isGalleryMode, setIsGalleryMode] = useState(false);
    const [screen, setScreen] = useState('LIST');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [areas, setAreas] = useState([]);
    const [kbQuery, setKbQuery] = useState('');
    const [kbItems, setKbItems] = useState([]);
    const [allKb, setAllKb] = useState([]);
    const [form, setForm] = useState({ uuid: '', area: null, cultura: '', data: '', observacao: '', mediaURI: null, mediaType: null, mediaBase64: null });
    const [analysis, setAnalysis] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [cameraVisible, setCameraVisible] = useState(false);
    const cameraRef = useRef(null);

    useFocusEffect(useCallback(() => {
        loadData(); loadKnowledgeBase();
        MenuConfigService.getMonitoramentoFeatures().then(f => { if (f) setFeatures(f); });
    }, []));

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await executeQuery(`SELECT m.*, i.classificacao_principal FROM monitoramento_entidade m LEFT JOIN analise_ia i ON m.uuid = i.monitoramento_uuid ORDER BY m.data DESC LIMIT 50`);
            const rows = []; for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setHistory(rows);
            const cad = await getCadastro(); setAreas(cad.filter(i => i.tipo === 'AREA' || i.tipo === 'CULTURA'));
        } catch (e) { } finally { setLoading(false); }
    };

    const loadKnowledgeBase = async () => {
        try {
            const res = await executeQuery('SELECT * FROM base_conhecimento_pro WHERE ativo = 1 ORDER BY titulo ASC');
            const rows = []; for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setAllKb(rows); setKbItems(rows);
        } catch (e) { console.log('KB Error', e); }
    };

    useEffect(() => {
        if (!kbQuery) setKbItems(allKb);
        else { const up = kbQuery.toUpperCase(); setKbItems(allKb.filter(i => i.titulo.toUpperCase().includes(up) || (i.sintomas && i.sintomas.toUpperCase().includes(up)))); }
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
        } catch (e) { Alert.alert('Erro', 'Erro conexao'); } finally { setLoading(false); }
    };

    const saveFinal = async () => {
        try {
            const uuid = form.uuid;
            await executeQuery(`INSERT INTO monitoramento_entidade (uuid, area_id, cultura_id, data, observacao_usuario, status, nivel_confianca, criado_em, last_updated) VALUES (?,?,?,?,?,?,?,?,?)`,
                [uuid, form.area?.uuid || 'N/A', form.area?.nome || form.cultura || 'GERAL', form.data, form.observacao.toUpperCase(), 'CONFIRMADO', analysis?.nivel_confianca_sugerido || 'INFORMATIVO', new Date().toISOString(), new Date().toISOString()]);
            if (form.mediaURI) await executeQuery(`INSERT INTO monitoramento_media (uuid, monitoramento_uuid, tipo, caminho_arquivo, criado_em, last_updated) VALUES (?,?,?,?,?,?)`, [uuidv4(), uuid, form.mediaType, form.mediaURI, new Date().toISOString(), new Date().toISOString()]);
            if (analysis) await executeQuery(`INSERT INTO analise_ia (uuid, monitoramento_uuid, classificacao_principal, sintomas, causa_provavel, sugestao_controle, produtos_citados, criado_em, last_updated) VALUES (?,?,?,?,?,?,?,?,?)`,
                [uuidv4(), uuid, analysis.classificacao_principal, analysis.sintomas, analysis.causa_provavel, analysis.sugestao_controle, analysis.produtos_citados, new Date().toISOString(), new Date().toISOString()]);
            Alert.alert('Sucesso', 'Salvo!'); loadData(); setScreen('LIST');
        } catch (e) { Alert.alert('Erro', 'Falha BD'); }
    };

    // === RENDERERS ===
    const renderList = () => (
        <View style={{ flex: 1 }}>
            <FlatList
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                data={history}
                keyExtractor={i => i.uuid}
                renderItem={({ item }) => (
                    <GlowCard style={styles.listCard}>
                        <TouchableOpacity onPress={() => { setSelectedItem(item); setScreen('DETAIL'); }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <View style={styles.datePill}>
                                    <Text style={styles.dateText}>{new Date(item.data).toLocaleDateString().slice(0, 5)}</Text>
                                </View>
                                <Text style={styles.cardTitle}>{item.cultura_id}</Text>
                            </View>
                            <Text style={styles.cardBody} numberOfLines={2}>
                                {item.classificacao_principal ? `🤖 ${item.classificacao_principal}` : item.observacao_usuario}
                            </Text>
                        </TouchableOpacity>
                    </GlowCard>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyBox}>
                        <Ionicons name="leaf-outline" size={60} color={DARK.glowBorder} />
                        <Text style={styles.emptyText}>Nenhum registro encontrado.</Text>
                    </View>
                }
            />
            {features.novo_registro && <GlowFAB onPress={startNew} />}
        </View>
    );

    const renderKB = () => (
        <View style={{ flex: 1, padding: 20 }}>
            <GlowInput value={kbQuery} onChangeText={setKbQuery} placeholder="Buscar pragas, doenças..." style={{ marginBottom: 16 }} />
            <FlatList
                data={kbItems}
                keyExtractor={i => i.uuid || i.id?.toString()}
                renderItem={({ item }) => (
                    <GlowCard style={{ marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 }}>
                            <View style={[styles.kbTag, { backgroundColor: item.tipo === 'DOENCA' ? 'rgba(255,59,59,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                                <Text style={[styles.kbTagText, { color: item.tipo === 'DOENCA' ? DARK.danger : DARK.warning }]}>{item.tipo}</Text>
                            </View>
                            <Text style={styles.kbTitle}>{item.titulo}</Text>
                        </View>
                        <Text style={styles.kbLabel}>SINTOMAS:</Text>
                        <Text style={styles.kbText}>{item.sintomas}</Text>
                        <Text style={styles.kbLabel}>CONTROLE:</Text>
                        <Text style={styles.kbText}>{item.controle}</Text>
                        <Text style={styles.kbSource}>Fonte: {item.fonte}</Text>
                    </GlowCard>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>Nenhum resultado na base técnica.</Text>}
            />
        </View>
    );

    const renderNewForm = () => (
        <ScrollView style={{ flex: 1, padding: 20 }}>
            <GlowCard>
                <Text style={styles.formLabel}>LOCAL / CULTURA</Text>
                <GlowInput placeholder="Ex: Talhão 1" value={form.cultura} onChangeText={t => setForm({ ...form, cultura: t })} />
                <Text style={styles.formLabel}>OBSERVAÇÃO</Text>
                <GlowInput style={{ height: 80, textAlignVertical: 'top' }} multiline placeholder="Descreva aqui..." value={form.observacao} onChangeText={t => setForm({ ...form, observacao: t })} />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 16 }}>
                    <TouchableOpacity style={styles.mediaBtn} onPress={() => setCameraVisible(true)}>
                        <Ionicons name="camera" size={22} color={DARK.glow} />
                        <Text style={styles.mediaBtnText}>FOTO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.mediaBtn} onPress={pickDocument}>
                        <Ionicons name="document-text" size={22} color={DARK.warning} />
                        <Text style={styles.mediaBtnText}>PDF</Text>
                    </TouchableOpacity>
                </View>
                {form.mediaURI && <Text style={{ color: DARK.glow, fontWeight: 'bold', marginBottom: 10 }}>✔ Mídia anexada!</Text>}

                <PrimaryButton label="ANALISAR COM IA" onPress={runAI} icon={<Ionicons name="sparkles" size={18} color="#061E1A" />} />
                <TouchableOpacity style={{ padding: 14, alignItems: 'center', marginTop: 8 }} onPress={saveFinal}>
                    <Text style={{ color: DARK.textMuted, fontWeight: 'bold' }}>SALVAR SEM IA</Text>
                </TouchableOpacity>
            </GlowCard>
        </ScrollView>
    );

    const renderAnalysis = () => (
        <ScrollView style={{ flex: 1, padding: 20 }}>
            {analysis && (
                <GlowCard style={{ borderColor: 'rgba(59,130,246,0.4)' }}>
                    <Text style={styles.aiTitle}>DIAGNÓSTICO: {analysis.classificacao_principal}</Text>
                    <Text style={styles.aiBody}>{analysis.sintomas}</Text>
                    <Text style={styles.formLabel}>SUGESTÃO DE CONTROLE:</Text>
                    <GlowInput multiline value={analysis.sugestao_controle} onChangeText={t => setAnalysis({ ...analysis, sugestao_controle: t })} style={{ minHeight: 80, textAlignVertical: 'top' }} />
                    <PrimaryButton label="CONFIRMAR DIAGNÓSTICO" onPress={saveFinal} />
                </GlowCard>
            )}
        </ScrollView>
    );

    if (cameraVisible) return (
        <Modal visible={true}>
            <Camera style={{ flex: 1 }} ref={cameraRef}>
                <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 50 }}>
                    <TouchableOpacity onPress={takePhoto} style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: DARK.glow }} />
                    <TouchableOpacity onPress={() => setCameraVisible(false)} style={{ position: 'absolute', top: 50, right: 30 }}>
                        <Ionicons name="close" size={40} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </Camera>
        </Modal>
    );

    return (
        <AppContainer>
            {/* HEADER */}
            <View style={styles.headerWrapper}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => screen !== 'LIST' ? setScreen('LIST') : navigation.goBack()} style={{ padding: 4 }}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {screen === 'LIST' ? 'MONITORAMENTO' : screen === 'NEW' ? 'NOVO REGISTRO' : 'DETALHES'}
                    </Text>
                    <View style={{ width: 28 }} />
                </View>

                {screen === 'LIST' && (
                    <View style={styles.tabBar}>
                        {features.novo_registro && (
                            <TouchableOpacity style={[styles.tabItem, activeTab === 'REGISTROS' && styles.tabActive]} onPress={() => setActiveTab('REGISTROS')}>
                                <Text style={[styles.tabText, activeTab === 'REGISTROS' && styles.tabTextActive]}>DIÁRIO DE CAMPO</Text>
                            </TouchableOpacity>
                        )}
                        {features.pesquisa_pdf && (
                            <TouchableOpacity style={[styles.tabItem, activeTab === 'KB' && styles.tabActive]} onPress={() => setActiveTab('KB')}>
                                <Text style={[styles.tabText, activeTab === 'KB' && styles.tabTextActive]}>BASE DE CONHECIMENTO</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
                <View style={styles.glowLine} />
            </View>

            {screen === 'LIST' && activeTab === 'REGISTROS' && renderList()}
            {screen === 'LIST' && activeTab === 'KB' && renderKB()}
            {screen === 'NEW' && renderNewForm()}
            {screen === 'ANALYSIS' && renderAnalysis()}
            {screen === 'DETAIL' && <View style={{ padding: 20 }}><Text style={{ color: DARK.textMuted }}>Detalhes do registro...</Text><TouchableOpacity onPress={() => setScreen('LIST')}><Text style={{ color: DARK.glow, marginTop: 10 }}>← Voltar</Text></TouchableOpacity></View>}
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    headerWrapper: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 14 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: DARK.textPrimary, fontSize: 15, fontWeight: '900', letterSpacing: 1 },
    glowLine: { height: 1, backgroundColor: DARK.glowLine, marginTop: 14 },

    tabBar: { flexDirection: 'row', marginTop: 14, backgroundColor: 'rgba(0,255,156,0.06)', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: DARK.glowBorder },
    tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    tabActive: { backgroundColor: DARK.glow },
    tabText: { fontSize: 11, fontWeight: 'bold', color: DARK.textMuted },
    tabTextActive: { color: '#061E1A' },

    listCard: { marginBottom: 12 },
    datePill: { backgroundColor: 'rgba(0,255,156,0.12)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: DARK.glowBorder },
    dateText: { fontSize: 11, fontWeight: 'bold', color: DARK.glow },
    cardTitle: { fontSize: 14, fontWeight: 'bold', color: DARK.textPrimary },
    cardBody: { fontSize: 13, color: DARK.textSecondary },

    emptyBox: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: DARK.textMuted, marginTop: 16, fontSize: 15 },

    kbTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    kbTagText: { fontSize: 10, fontWeight: 'bold' },
    kbTitle: { fontSize: 15, fontWeight: '900', color: DARK.textPrimary, flex: 1 },
    kbLabel: { fontSize: 10, fontWeight: '900', color: DARK.textMuted, marginTop: 12, marginBottom: 3, letterSpacing: 1 },
    kbText: { fontSize: 13, color: DARK.textSecondary, lineHeight: 20 },
    kbSource: { fontSize: 10, color: DARK.textMuted, fontStyle: 'italic', marginTop: 12, textAlign: 'right' },

    formLabel: { fontSize: 10, fontWeight: '900', color: DARK.textMuted, letterSpacing: 1.2, marginBottom: 8, marginTop: 8 },
    mediaBtn: { flex: 1, backgroundColor: 'rgba(0,255,156,0.06)', borderWidth: 1, borderColor: DARK.glowBorder, borderRadius: 12, padding: 16, alignItems: 'center', gap: 6 },
    mediaBtnText: { color: DARK.textSecondary, fontWeight: 'bold', fontSize: 12 },

    aiTitle: { fontSize: 17, fontWeight: '900', color: '#60A5FA', marginBottom: 10 },
    aiBody: { fontSize: 13, color: DARK.textSecondary, marginBottom: 16 },
});

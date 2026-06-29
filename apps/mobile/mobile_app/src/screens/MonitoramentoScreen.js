import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, FlatList, Modal, Alert, StyleSheet, Dimensions, StatusBar, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, getCadastro } from '../database/database';
import { analyzeContent } from '../services/AIService';
import { MenuConfigService } from '../services/MenuConfigService';
import { useTheme } from '../theme/ThemeContext';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';
import SmartAutocomplete from '../components/common/SmartAutocomplete';
import { TalhaoLibraryService } from '../services/LibraryServices';

const { width } = Dimensions.get('window');

export default function MonitoramentoScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    
    const [features, setFeatures] = useState({ novo_registro: true, pesquisa_pdf: true, galeria_fotos: true });
    const [activeTab, setActiveTab] = useState('REGISTROS');
    const [screen, setScreen] = useState('LIST');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [areas, setAreas] = useState([]);

    // Knowledge Base
    const [kbQuery, setKbQuery] = useState('');
    const [kbItems, setKbItems] = useState([]);
    const [allKb, setAllKb] = useState([]);

    // Form State
    const [form, setForm] = useState({ uuid: '', area: null, cultura: '', data: '', observacao: '', mediaURI: null, mediaType: null, mediaBase64: null });
    const [analysis, setAnalysis] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    // Camera
    const [cameraVisible, setCameraVisible] = useState(false);
    const cameraRef = useRef(null);

    useFocusEffect(useCallback(() => {
        loadData();
        loadKnowledgeBase();
        MenuConfigService.getMonitoramentoFeatures().then(f => { if (f) setFeatures(f); });
        (async () => {
            await Location.requestForegroundPermissionsAsync();
        })();
    }, []));

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await executeQuery(`
                SELECT m.*, i.classificacao_principal, i.tipo_problema, i.sugestao_controle,
                       (SELECT caminho_arquivo FROM v2_monitoramentos_midia WHERE monitoramento_uuid = m.uuid AND tipo = 'PDF' LIMIT 1) as pdf_uri,
                       (SELECT COUNT(*) FROM v2_monitoramentos_midia WHERE monitoramento_uuid = m.uuid AND tipo = 'IMAGEM') as foto_count
                FROM v2_monitoramentos m
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
        } catch (e) { }
    };

    useEffect(() => {
        if (!kbQuery) setKbItems(allKb);
        else {
            const up = kbQuery.toUpperCase();
            setKbItems(allKb.filter(i => i.titulo.toUpperCase().includes(up) || (i.sintomas && i.sintomas.toUpperCase().includes(up))));
        }
    }, [kbQuery, allKb]);

    const startNew = () => {
        setForm({ uuid: uuidv4(), area: null, cultura: '', data: new Date().toISOString(), observacao: '', mediaURI: null, mediaType: null, mediaBase64: null });
        setScreen('NEW');
    };

    const runAI = async () => {
        if (!form.cultura) { Alert.alert('Atenção', 'Informe a localização ou cultura.'); return; }
        setLoading(true);
        try {
            const res = await analyzeContent(form.mediaURI, form.mediaType, form.mediaBase64 || form.observacao);
            if (res.success) { setAnalysis(res.data); setScreen('ANALYSIS'); }
            else Alert.alert('Erro', 'Falha na análise inteligente.');
        } catch (e) { Alert.alert('Erro', 'Erro de conexão com o servidor de IA.'); }
        finally { setLoading(false); }
    };

    const saveFinal = async () => {
        try {
            const uuid = form.uuid;
            await executeQuery(`INSERT INTO v2_monitoramentos (uuid, area_id, cultura_id, data, observacao_usuario, status, nivel_confianca, geoloc, criado_em, last_updated) VALUES (?,?,?,?,?,?,?,?,?,?)`,
                [uuid, form.area?.uuid || 'N/A', form.area?.nome || form.cultura || 'GERAL', form.data, form.observacao.toUpperCase(), 'CONFIRMADO', analysis?.nivel_confianca_sugerido || 'INFORMATIVO', form.geoloc || null, new Date().toISOString(), new Date().toISOString()]
            );
            if (form.mediaURI) await executeQuery(`INSERT INTO v2_monitoramentos_midia (uuid, monitoramento_uuid, tipo, caminho_arquivo, criado_em, last_updated) VALUES (?,?,?,?,?,?)`, [uuidv4(), uuid, form.mediaType, form.mediaURI, new Date().toISOString(), new Date().toISOString()]);
            if (analysis) await executeQuery(`INSERT INTO analise_ia (uuid, monitoramento_uuid, classificacao_principal, sintomas, causa_provavel, sugestao_controle, produtos_citados, criado_em, last_updated) VALUES (?,?,?,?,?,?,?,?,?)`,
                [uuidv4(), uuid, analysis.classificacao_principal, analysis.sintomas, analysis.causa_provavel, analysis.sugestao_controle, analysis.produtos_citados, new Date().toISOString(), new Date().toISOString()]
            );
            Alert.alert('Sucesso', 'Monitoramento registrado com sucesso!');
            loadData();
            setScreen('LIST');
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar no banco de dados.'); }
    };

    const handleGeneratePDF = async (item) => {
        try {
            setLoading(true);
            const { v4: uuidv4 } = require('uuid');
            const Print = require('expo-print');
            const Sharing = require('expo-sharing');
            const FileSystem = require('expo-file-system');
            
            const today = new Date().toLocaleDateString('pt-BR');
            const dateStr = new Date(item.data).toLocaleDateString('pt-BR');
            
            // Fetch media path for photos
            const mediaRes = await executeQuery(`SELECT * FROM v2_monitoramentos_midia WHERE monitoramento_uuid = ? AND tipo = 'IMAGEM'`, [item.uuid]);
            const photos = [];
            for (let i = 0; i < mediaRes.rows.length; i++) {
                photos.push(mediaRes.rows.item(i));
            }
            
            // Build photo HTML elements if any exist
            let photosHtml = '';
            if (photos.length > 0) {
                photosHtml = `
                    <div style="margin-top: 25px;">
                        <h3 style="color: #064E3B; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px;">FOTOS DO MONITORAMENTO</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 15px;">
                            ${photos.map(p => `<img src="${p.caminho_arquivo}" style="width: 180px; height: 180px; border-radius: 8px; object-fit: cover;" />`).join('')}
                        </div>
                    </div>
                `;
            }
            
            const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1F2937; padding: 40px; }
                    .header { border-bottom: 3px solid #10B981; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
                    .logo { font-size: 28px; font-weight: 800; color: #10B981; }
                    .logo-sub { color: #1F2937; }
                    .title { font-size: 20px; font-weight: 700; text-transform: uppercase; color: #111827; text-align: right; }
                    .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 35px; background: #F9FAFB; padding: 20px; border-radius: 12px; border-left: 5px solid #10B981; }
                    .meta-item { font-size: 14px; }
                    .meta-label { font-weight: 800; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
                    .meta-val { font-size: 15px; font-weight: 700; margin-top: 4px; }
                    .section { margin-bottom: 30px; }
                    .section-title { font-size: 15px; font-weight: 800; color: #064E3B; border-bottom: 2px solid #E5E7EB; padding-bottom: 8px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
                    .card-box { background: #F3F4F6; border-radius: 8px; padding: 15px; font-size: 14px; line-height: 1.6; }
                    .footer { text-align: center; font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB; margin-top: 50px; padding-top: 15px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">AGRO<span class="logo-sub">GB</span></div>
                    <div>
                        <div class="title">RELATÓRIO DE MONITORAMENTO</div>
                        <div style="font-size: 12px; color: #6B7280; text-align: right; margin-top: 5px;">Gerado em ${today}</div>
                    </div>
                </div>
                
                <div class="meta-grid">
                    <div class="meta-item">
                        <div class="meta-label">TALHÃO / CULTURA</div>
                        <div class="meta-val">${item.cultura_id}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">DATA DA OBSERVAÇÃO</div>
                        <div class="meta-val">${dateStr}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">DIAGNÓSTICO DA IA</div>
                        <div class="meta-val" style="color: #4F46E5;">${item.classificacao_principal || 'INFORMATIVO GERAL'}</div>
                    </div>
                    <div class="meta-item">
                        <div class="meta-label">NÍVEL DE INTENSIDADE</div>
                        <div class="meta-val">${item.nivel_confianca || 'BAIXA'}</div>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">OBSERVAÇÕES DO CAMPO</div>
                    <div class="card-box" style="background: #FFF; border: 1px solid #E5E7EB;">
                        ${item.observacao_usuario || 'NENHUMA OBSERVAÇÃO REGISTRADA.'}
                    </div>
                </div>
                
                ${item.sugestao_controle ? `
                <div class="section">
                    <div class="section-title">RECOMENDAÇÃO TÉCNICA E MANEJO</div>
                    <div class="card-box" style="background: #ECFDF5; border-left: 4px solid #10B981; color: #065F46;">
                        ${item.sugestao_controle}
                    </div>
                </div>
                ` : ''}
                
                ${photosHtml}
                
                <div class="footer">
                    AgroGB Mobile v7.0 • Monitoramento Inteligente de Pragas e Doenças
                </div>
            </body>
            </html>
            `;
            
            const { uri } = await Print.printToFileAsync({ html });
            
            const safeTitle = `Monitoramento_${item.uuid.slice(0, 8)}.pdf`;
            const newPath = `${FileSystem.documentDirectory}${safeTitle}`;
            await FileSystem.moveAsync({ from: uri, to: newPath });
            
            const countRes = await executeQuery(`SELECT * FROM v2_monitoramentos_midia WHERE monitoramento_uuid = ? AND tipo = 'PDF'`, [item.uuid]);
            if (countRes.rows.length === 0) {
                await executeQuery(
                    `INSERT INTO v2_monitoramentos_midia (uuid, monitoramento_uuid, tipo, caminho_arquivo, criado_em, last_updated) VALUES (?, ?, ?, ?, ?, ?)`,
                    [uuidv4(), item.uuid, 'PDF', newPath, new Date().toISOString(), new Date().toISOString()]
                );
            } else {
                await executeQuery(
                    `UPDATE v2_monitoramentos_midia SET caminho_arquivo = ?, last_updated = ? WHERE monitoramento_uuid = ? AND tipo = 'PDF'`,
                    [newPath, new Date().toISOString(), item.uuid]
                );
            }
            
            await loadData();
            
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(newPath);
            } else {
                Alert.alert('Sucesso', `PDF gerado com sucesso em: ${newPath}`);
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Erro', 'Falha ao gerar relatório PDF.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPDF = async (pdfUri) => {
        try {
            const Sharing = require('expo-sharing');
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(pdfUri);
            } else {
                Alert.alert('Atenção', 'Compartilhamento não disponível neste dispositivo.');
            }
        } catch (e) {
            Alert.alert('Erro', 'Falha ao abrir PDF.');
        }
    };

    const handleDeleteItem = async (uuid) => {
        Alert.alert(
            'Excluir Monitoramento',
            'Deseja excluir este registro de monitoramento permanentemente?',
            [
                { text: 'Não', style: 'cancel' },
                {
                    text: 'Sim, Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await executeQuery('DELETE FROM v2_monitoramentos WHERE uuid = ?', [uuid]);
                            await executeQuery('DELETE FROM v2_monitoramentos_midia WHERE monitoramento_uuid = ?', [uuid]);
                            await executeQuery('DELETE FROM analise_ia WHERE monitoramento_uuid = ?', [uuid]);
                            Alert.alert('Sucesso', 'Monitoramento excluído.');
                            loadData();
                            setScreen('LIST');
                        } catch (e) {
                            Alert.alert('Erro', 'Falha ao excluir.');
                        }
                    }
                }
            ]
        );
    };

    const isDark = theme?.theme_mode === 'dark';
    const textColor = activeColors.text || '#1E293B';
    const textMutedColor = activeColors.textMuted || '#64748B';
    const cardBg = activeColors.card || '#FFFFFF';
    const borderCol = activeColors.border || 'rgba(0,0,0,0.1)';

    const renderHeader = () => (
        <LinearGradient 
            colors={isDark ? ['#111827', '#0F172A'] : [activeColors.primary || '#10B981', activeColors.primaryDeep || '#064E3B']} 
            style={styles.header}
        >
            <View style={styles.headerTop}>
                <TouchableOpacity onPress={() => screen === 'LIST' ? navigation.goBack() : setScreen('LIST')} style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={22} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{screen === 'LIST' ? 'MONITORAMENTO' : screen === 'NEW' ? 'NOVO REGISTRO' : screen === 'DETAIL' ? 'DETALHE' : 'DIAGNÓSTICO'}</Text>
                <TouchableOpacity onPress={() => Alert.alert('Info', 'Monitoramento Técnico com IA')} style={styles.iconBtn}>
                    <Ionicons name="sparkles-outline" size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            {screen === 'LIST' && (
                <View style={styles.tabBar}>
                    <TouchableOpacity 
                        style={[styles.tabItem, activeTab === 'REGISTROS' && (isDark ? styles.tabItemActiveDark : styles.tabItemActive)]} 
                        onPress={() => setActiveTab('REGISTROS')}
                    >
                        <Text style={[styles.tabText, activeTab === 'REGISTROS' && (isDark ? styles.tabTextActiveDark : styles.tabTextActive)]}>DIÁRIO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tabItem, activeTab === 'KB' && (isDark ? styles.tabItemActiveDark : styles.tabItemActive)]} 
                        onPress={() => setActiveTab('KB')}
                    >
                        <Text style={[styles.tabText, activeTab === 'KB' && (isDark ? styles.tabTextActiveDark : styles.tabTextActive)]}>BASE TÉCNICA</Text>
                    </TouchableOpacity>
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
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                renderItem={({ item }) => {
                    const hasPdf = !!item.pdf_uri;
                    const dateVal = new Date(item.data);
                    const formattedDate = !isNaN(dateVal.getTime()) ? dateVal.toLocaleDateString('pt-BR').slice(0, 5) : '--/--';
                    
                    let tagLabel = 'OBSERVAÇÃO';
                    let tagColor = '#6B7280';
                    if (item.classificacao_principal) {
                        if (item.tipo_problema === 'DOENCA') {
                            tagLabel = 'DOENÇA';
                            tagColor = '#EF4444';
                        } else if (item.tipo_problema === 'PRAGA') {
                            tagLabel = 'PRAGA';
                            tagColor = '#F59E0B';
                        } else {
                            tagLabel = 'DIAGNÓSTICO';
                            tagColor = '#4F46E5';
                        }
                    }

                    return (
                        <Card style={styles.historyCard} onPress={() => { setSelectedItem(item); setScreen('DETAIL'); }} noPadding>
                            <View style={styles.premiumCardInner}>
                                <View style={styles.premiumCardHeader}>
                                    <View style={[styles.premiumTag, { backgroundColor: tagColor + '15' }]}>
                                        <Text style={[styles.premiumTagText, { color: tagColor }]}>{tagLabel}</Text>
                                    </View>
                                    <Text style={[styles.premiumDateText, { color: textMutedColor }]}>{formattedDate}</Text>
                                </View>
                                
                                <Text style={[styles.premiumCulturaText, { color: textColor }]}>{item.cultura_id}</Text>
                                <Text style={[styles.premiumDescText, { color: textMutedColor }]} numberOfLines={2}>
                                    {item.observacao_usuario || 'Sem observações adicionais.'}
                                </Text>

                                {item.classificacao_principal && (
                                    <View style={styles.premiumAiBox}>
                                        <Ionicons name="sparkles" size={12} color="#4F46E5" />
                                        <Text style={styles.premiumAiText} numberOfLines={1}>
                                            {item.classificacao_principal}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.premiumCardFooter}>
                                    <Text style={[styles.premiumMediaCount, { color: textMutedColor }]}>
                                        📷 {item.foto_count || 0} fotos
                                    </Text>
                                    
                                    {hasPdf && (
                                        <TouchableOpacity 
                                            style={styles.premiumPdfBadge}
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                handleOpenPDF(item.pdf_uri);
                                            }}
                                        >
                                            <Ionicons name="document-text" size={14} color={activeColors.primary || '#10B981'} />
                                            <Text style={[styles.premiumPdfBadgeText, { color: activeColors.primary || '#10B981' }]}>PDF</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </Card>
                    );
                }}
                ListEmptyComponent={<Text style={[styles.empty, { color: textMutedColor }]}>Nenhum registro encontrado.</Text>}
            />
            <TouchableOpacity style={[styles.fab, { backgroundColor: activeColors.primary || '#10B981' }]} onPress={startNew}>
                <Ionicons name="add" size={30} color="#FFF" />
            </TouchableOpacity>
        </View>
    );

    const renderKB = () => (
        <View style={{ flex: 1, padding: 20 }}>
            <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: borderCol, borderWidth: isDark ? 1 : 0 }]}>
                <Ionicons name="search" size={20} color={textMutedColor} />
                <TextInput
                    style={[styles.inputSearch, { color: textColor }]}
                    placeholder="Buscar pragas ou doenças..."
                    placeholderTextColor={textMutedColor}
                    value={kbQuery}
                    onChangeText={setKbQuery}
                />
            </View>
            <FlatList
                data={kbItems}
                keyExtractor={i => i.uuid || i.id?.toString()}
                    initialNumToRender={8}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    removeClippedSubviews={true}
                renderItem={({ item }) => {
                    const isDoenca = item.tipo === 'DOENCA';
                    const tagBg = isDark
                        ? (isDoenca ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)')
                        : (isDoenca ? '#FEE2E2' : '#FEF3C7');
                    const tagTextCol = isDark
                        ? (isDoenca ? '#F87171' : '#FBBF24')
                        : (isDoenca ? '#991B1B' : '#92400E');

                    return (
                        <Card style={styles.kbCard}>
                            <View style={styles.kbHeader}>
                                <View style={[styles.kbTag, { backgroundColor: tagBg }]}>
                                    <Text style={[styles.kbTagText, { color: tagTextCol }]}>{item.tipo}</Text>
                                </View>
                                <Text style={[styles.kbTitle, { color: textColor }]}>{item.titulo}</Text>
                            </View>
                            <Text style={[styles.kbLabel, { color: textMutedColor }]}>SINTOMAS PRINCIPAIS</Text>
                            <Text style={[styles.kbText, { color: textColor }]}>{item.sintomas}</Text>
                            <Text style={[styles.kbLabel, { color: textMutedColor }]}>RECOMENDAÇÃO DE CONTROLE</Text>
                            <Text style={[styles.kbText, { color: textColor }]}>{item.controle}</Text>
                            <Text style={[styles.kbSource, { color: textMutedColor }]}>Fonte: {item.fonte}</Text>
                        </Card>
                    );
                }}
                ListEmptyComponent={<Text style={[styles.empty, { color: textMutedColor }]}>Nenhum resultado técnico.</Text>}
            />
        </View>
    );

    const renderNewForm = () => (
        <ScrollView style={{ flex: 1, padding: 20 }}>
            <Card style={{ marginBottom: 20 }}>
                <SmartAutocomplete
                    label="LOCALIZAÇÃO / TALHÃO *"
                    value={form.area?.nome ? form.area : form.cultura}
                    onSelect={val => setForm({ ...form, area: val, cultura: val ? val.nome : '' })}
                    service={TalhaoLibraryService}
                    title="SELECIONAR TALHÃO"
                    placeholder="SELECIONAR TALHÃO..."
                    icon="map-outline"
                    quickAddFields={[
                        { key: 'nome', label: 'NOME DO TALHÃO', placeholder: 'Ex: Talhão Oeste 4' },
                        { key: 'area_ha', label: 'ÁREA (HA)', placeholder: 'Ex: 8.5', keyboardType: 'decimal-pad' }
                    ]}
                />
                <AgroInput label="OBSERVAÇÕES DE CAMPO" value={form.observacao} onChangeText={t => setForm({ ...form, observacao: t })} multiline placeholder="Descreva os sintomas ou sinais observados..." />
                
                <View style={styles.mediaContainer}>
                    <TouchableOpacity style={[styles.mediaOption, { backgroundColor: cardBg, borderColor: borderCol }]} onPress={() => setCameraVisible(true)}>
                        <View style={[styles.mediaIcon, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5' }]}>
                            <Ionicons name="camera" size={24} color={activeColors.primary || '#10B981'} />
                        </View>
                        <Text style={[styles.mediaLabel, { color: textColor }]}>FOTO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.mediaOption, { backgroundColor: cardBg, borderColor: borderCol }]} onPress={async () => {
                        const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
                        if (!res.canceled) setForm({ ...form, mediaURI: res.assets[0].uri, mediaType: 'PDF' });
                    }}>
                        <View style={[styles.mediaIcon, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.12)' : '#FFF7ED' }]}>
                            <Ionicons name="document-text" size={24} color="#F97316" />
                        </View>
                        <Text style={[styles.mediaLabel, { color: textColor }]}>PDF/ANEXO</Text>
                    </TouchableOpacity>
                </View>

                {form.mediaURI && (
                    <View style={styles.attachmentBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={activeColors.success || '#10B981'} />
                        <Text style={[styles.attachmentText, { color: activeColors.success || '#10B981' }]}>Mídia anexada com sucesso</Text>
                    </View>
                )}
            </Card>

            <AgroButton title="EXECUTAR DIAGNÓSTICO IA" icon="sparkles" onPress={runAI} loading={loading} />
            <AgroButton title="SALVAR APENAS DADOS" variant="secondary" onPress={saveFinal} style={{ marginTop: 10 }} />
        </ScrollView>
    );

    const aiHeaderColors = isDark 
        ? ['rgba(79, 70, 229, 0.12)', 'rgba(79, 70, 229, 0.25)'] 
        : ['#EEF2FF', '#E0E7FF'];

    const renderAnalysisView = () => (
        <ScrollView style={{ flex: 1, padding: 20 }}>
            {analysis && (
                <Card style={styles.aiResultCard}>
                    <LinearGradient colors={aiHeaderColors} style={styles.aiHeader}>
                        <MaterialCommunityIcons name="robot" size={24} color="#4F46E5" />
                        <Text style={styles.aiTitle}>RESULTADO DA INTELIGÊNCIA</Text>
                    </LinearGradient>
                    
                    <View style={styles.aiContent}>
                        <Text style={[styles.diagnosisLabel, { color: textMutedColor }]}>DIAGNÓSTICO SUGERIDO</Text>
                        <Text style={[styles.diagnosisValue, { color: textColor }]}>{analysis.classificacao_principal}</Text>
                        
                        <View style={[styles.divider, { backgroundColor: borderCol }]} />
                        
                        <Text style={styles.aiFieldLabel}>SINTOMAS DETECTADOS</Text>
                        <Text style={[styles.aiFieldText, { color: textColor }]}>{analysis.sintomas}</Text>
                        
                        <Text style={styles.aiFieldLabel}>AÇÕES DE CONTROLE RECOMENDADAS</Text>
                        <TextInput
                            style={[styles.aiTextArea, { backgroundColor: cardBg, borderColor: borderCol, color: textColor }]}
                            multiline
                            value={analysis.sugestao_controle}
                            onChangeText={t => setAnalysis({ ...analysis, sugestao_controle: t })}
                        />
                        
                        <AgroButton title="VALIDAR E SALVAR" onPress={saveFinal} style={{ marginTop: 20 }} />
                    </View>
                </Card>
            )}
        </ScrollView>
    );

    const renderDetailView = () => {
        if (!selectedItem) return null;
        const dateStr = new Date(selectedItem.data).toLocaleDateString('pt-BR');
        
        return (
            <ScrollView style={{ flex: 1, padding: 20 }} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
                <Card style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <Text style={{ fontSize: 10, fontWeight: '900', color: activeColors.primary || '#10B981', letterSpacing: 1 }}>DETALHES</Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: textMutedColor }}>{dateStr}</Text>
                    </View>
                    
                    <Text style={[styles.diagnosisValue, { color: textColor, fontSize: 18, marginBottom: 15 }]}>
                        {selectedItem.cultura_id}
                    </Text>
                    
                    <Text style={{ fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1, marginBottom: 5 }}>OBSERVAÇÃO DO PRODUTOR</Text>
                    <Text style={{ fontSize: 14, color: textColor, lineHeight: 20, marginBottom: 20 }}>
                        {selectedItem.observacao_usuario || 'NENHUMA OBSERVAÇÃO REGISTRADA.'}
                    </Text>
                    
                    {selectedItem.classificacao_principal && (
                        <View style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6', padding: 15, borderRadius: 12, marginTop: 10 }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: '#4F46E5', letterSpacing: 1, marginBottom: 5 }}>🤖 DIAGNÓSTICO IA</Text>
                            <Text style={{ fontSize: 15, fontWeight: '800', color: textColor }}>{selectedItem.classificacao_principal}</Text>
                            
                            {selectedItem.sugestao_controle && (
                                <View style={{ marginTop: 15 }}>
                                    <Text style={{ fontSize: 10, fontWeight: '900', color: isDark ? '#34D399' : '#065F46', letterSpacing: 0.5, marginBottom: 4 }}>RECOMENDAÇÃO TÉCNICA</Text>
                                    <Text style={{ fontSize: 13, color: isDark ? '#D1D5DB' : '#374151', lineHeight: 18 }}>{selectedItem.sugestao_controle}</Text>
                                </View>
                            )}
                        </View>
                    )}
                </Card>
                
                {selectedItem.pdf_uri && (
                    <Card style={{ marginBottom: 20, backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ECFDF5', borderColor: activeColors.primary || '#10B981', borderStyle: 'dashed', borderWidth: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Ionicons name="document-text" size={24} color={activeColors.primary || '#10B981'} />
                                <View>
                                    <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#34D399' : '#065F46' }}>Relatório PDF Gerado</Text>
                                    <Text style={{ fontSize: 10, color: textMutedColor }}>Disponível para compartilhar</Text>
                                </View>
                            </View>
                            <TouchableOpacity 
                                style={{ backgroundColor: activeColors.primary || '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                                onPress={() => handleOpenPDF(selectedItem.pdf_uri)}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '900', color: '#FFF' }}>ABRIR</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>
                )}
                
                <AgroButton 
                    title="GERAR RELATÓRIO PDF" 
                    icon="document-text" 
                    onPress={() => handleGeneratePDF(selectedItem)} 
                    loading={loading}
                />
                
                <AgroButton 
                    title="EXCLUIR REGISTRO" 
                    variant="secondary" 
                    icon="trash" 
                    onPress={() => handleDeleteItem(selectedItem.uuid)} 
                    style={{ marginTop: 12 }}
                />
                
                <AgroButton 
                    title="VOLTAR PARA A LISTA" 
                    variant="secondary" 
                    onPress={() => setScreen('LIST')} 
                    style={{ marginTop: 12 }}
                />
            </ScrollView>
        );
    };

    if (cameraVisible) return (
        <Modal visible={true}>
            <Camera style={{ flex: 1 }} ref={cameraRef}>
                <View style={styles.cameraOverlay}>
                    <TouchableOpacity onPress={() => setCameraVisible(false)} style={styles.cameraClose}>
                        <Ionicons name="close" size={32} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={async () => {
                        const p = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true });
                        const loc = await Location.getCurrentPositionAsync({});
                        setForm({ ...form, mediaURI: p.uri, mediaType: 'IMAGEM', mediaBase64: p.base64, geoloc: `${loc.coords.latitude},${loc.coords.longitude}` });
                        setCameraVisible(false);
                    }} style={styles.shutterBtn} />
                </View>
            </Camera>
        </Modal>
    );

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <SafeAreaView style={{ flex: 1 }}>
                {renderHeader()}
                {screen === 'LIST' && activeTab === 'REGISTROS' && renderList()}
                {screen === 'LIST' && activeTab === 'KB' && renderKB()}
                {screen === 'NEW' && renderNewForm()}
                {screen === 'ANALYSIS' && renderAnalysisView()}
                {screen === 'DETAIL' && renderDetailView()}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabBar: { flexDirection: 'row', marginTop: 20, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 15, padding: 5 },
    tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabItemActive: { backgroundColor: '#FFF' },
    tabItemActiveDark: { backgroundColor: 'rgba(255,255,255,0.15)' },
    tabText: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 },
    tabTextActive: { color: '#065F46' },
    tabTextActiveDark: { color: '#FFF' },
    historyCard: { marginBottom: 12 },
    cardInner: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    dateBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginRight: 15 },
    dateText: { fontSize: 11, fontWeight: '800' },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '800' },
    cardBody: { fontSize: 12, marginTop: 2 },
    fab: { position: 'absolute', bottom: 30, right: 25, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
    empty: { textAlign: 'center', marginTop: 50, fontWeight: 'bold' },
    searchBox: { flexDirection: 'row', borderRadius: 15, paddingHorizontal: 15, alignItems: 'center', height: 55, marginBottom: 20, elevation: 1 },
    inputSearch: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '600' },
    kbCard: { marginBottom: 15 },
    kbHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    kbTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    kbTagText: { fontSize: 9, fontWeight: '900' },
    kbTitle: { fontSize: 16, fontWeight: '900', flex: 1 },
    kbLabel: { fontSize: 9, fontWeight: '900', marginTop: 12, marginBottom: 4, letterSpacing: 1 },
    kbText: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
    kbSource: { fontSize: 9, fontStyle: 'italic', marginTop: 15, textAlign: 'right' },
    mediaContainer: { flexDirection: 'row', gap: 15, marginTop: 15 },
    mediaOption: { flex: 1, alignItems: 'center', padding: 15, borderRadius: 15, borderWidth: 1 },
    mediaIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    mediaLabel: { fontSize: 10, fontWeight: '900' },
    attachmentBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 15, justifyContent: 'center' },
    attachmentText: { fontSize: 11, fontWeight: 'bold' },
    aiResultCard: { padding: 0, overflow: 'hidden' },
    aiHeader: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
    aiTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    aiContent: { padding: 20 },
    diagnosisLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    diagnosisValue: { fontSize: 20, fontWeight: '900', marginTop: 4 },
    divider: { height: 1, marginVertical: 20 },
    aiFieldLabel: { fontSize: 10, fontWeight: '900', marginTop: 15, marginBottom: 6 },
    aiFieldText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
    aiTextArea: { borderRadius: 12, padding: 15, minHeight: 100, textAlignVertical: 'top', marginTop: 5, fontSize: 14, borderWidth: 1 },
    cameraOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 50 },
    cameraClose: { position: 'absolute', top: 50, right: 30 },
    shutterBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', borderWidth: 5, borderColor: 'rgba(255,255,255,0.3)' },

    // Premium Card Styles
    premiumCardInner: { padding: 16 },
    premiumCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    premiumTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    premiumTagText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    premiumDateText: { fontSize: 11, fontWeight: '800' },
    premiumCulturaText: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
    premiumDescText: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
    premiumAiBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(79, 70, 229, 0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
    premiumAiText: { fontSize: 11, fontWeight: '800', color: '#6366f1', maxWidth: width - 100 },
    premiumCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(156, 163, 175, 0.2)', paddingTop: 10, marginTop: 4 },
    premiumMediaCount: { fontSize: 11, fontWeight: '700' },
    premiumPdfBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    premiumPdfBadgeText: { fontSize: 11, fontWeight: '900' }
});

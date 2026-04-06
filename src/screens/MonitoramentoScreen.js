/**
 * MonitoramentoScreen.js — AgroGB OS: Centro de Controle de Campo
 * 
 * Módulo de Inteligência Operacional:
 * - Painel climático em tempo real (OpenWeather + GPS)
 * - Alertas meteorológicos com nível de risco
 * - Diário de campo: pragas, doenças, nutrição, clima
 * - Pesquisa agronômica integrada
 * - Timeline de registros com severidade visual
 */

import React, { useState, useCallback, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, FlatList,
    Modal, Alert, Linking, ScrollView, TextInput,
    SafeAreaView, StatusBar, Platform, ActivityIndicator,
    RefreshControl, Animated
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { executeQuery } from '../database/database';
import { showToast } from '../ui/Toast';
import { useWeather } from '../context/WeatherContext';
import { v4 as uuidv4 } from 'uuid';

// ── CONSTANTES ────────────────────────────────────────────────────────────────
const TABS = ['CAMPO', 'PESQUISA'];

const CATEGORIAS = [
    { key: 'PRAGA',    label: 'Praga',     icon: 'bug',              color: '#EF4444' },
    { key: 'DOENCA',   label: 'Doença',    icon: 'medical',          color: '#F97316' },
    { key: 'NUTRICAO', label: 'Nutrição',  icon: 'leaf',             color: '#10B981' },
    { key: 'CLIMA',    label: 'Clima',     icon: 'thunderstorm',     color: '#3B82F6' },
    { key: 'OUTROS',   label: 'Outros',    icon: 'ellipsis-horizontal', color: '#9CA3AF' },
];

const SEVERIDADES = [
    { key: 'BAIXA', label: 'Baixa',  color: '#10B981', bg: 'rgba(16,185,129,0.15)', icon: 'checkmark-circle' },
    { key: 'MEDIA', label: 'Média',  color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', icon: 'warning' },
    { key: 'ALTA',  label: 'Alta',   color: '#EF4444', bg: 'rgba(239,68,68,0.15)',  icon: 'alert-circle' },
];

const SEARCHES = [
    { label: 'Mancha foliar morango', query: 'mancha foliar morango tratamento' },
    { label: 'Pulgão em hortaliças', query: 'pulgão hortaliça controle orgânico' },
    { label: 'Botrytis / mofo cinzento', query: 'botrytis cinerea morango fungicida' },
    { label: 'Deficiência de boro', query: 'deficiência de boro plantas sintomas' },
    { label: 'Cigarrinha verde', query: 'cigarrinha verde cultura controle biológico' },
];

const getWeatherIcon = (icon) => {
    if (!icon) return 'partly-sunny';
    if (icon.includes('01')) return 'sunny';
    if (icon.includes('02') || icon.includes('03')) return 'partly-sunny';
    if (icon.includes('04')) return 'cloud';
    if (icon.includes('09') || icon.includes('10')) return 'rainy';
    if (icon.includes('11')) return 'thunderstorm';
    if (icon.includes('13')) return 'snow';
    if (icon.includes('50')) return 'cloudy';
    return 'partly-sunny';
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function MonitoramentoScreen({ navigation }) {
    const { weather, loading: weatherLoading, refreshWeather } = useWeather();
    const [activeTab, setActiveTab] = useState('CAMPO');
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Form state
    const [addModal, setAddModal] = useState(false);
    const [fieldNote, setFieldNote] = useState('');
    const [fieldLocal, setFieldLocal] = useState('');
    const [fieldCategoria, setFieldCategoria] = useState('OUTROS');
    const [fieldSeveridade, setFieldSeveridade] = useState('BAIXA');
    const [savingNote, setSavingNote] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState('');

    useFocusEffect(useCallback(() => { loadHistory(); }, []));

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await executeQuery(
                `SELECT * FROM monitoramento_entidade WHERE status != 'EXCLUIDO' ORDER BY data DESC LIMIT 60`
            );
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setHistory(rows);
        } catch { }
        finally { setLoadingHistory(false); }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([loadHistory(), refreshWeather(false)]);
        setRefreshing(false);
    };

    const handleSaveNote = async () => {
        if (!fieldNote.trim()) { Alert.alert('Atenção', 'Escreva uma observação.'); return; }
        setSavingNote(true);
        try {
            await executeQuery(
                `INSERT INTO monitoramento_entidade (uuid, cultura_id, data, observacao_usuario, status, nivel_confianca, severidade, categoria, criado_em, last_updated) VALUES (?,?,?,?,?,?,?,?,?,?)`,
                [
                    uuidv4(),
                    fieldLocal.toUpperCase() || 'CAMPO GERAL',
                    new Date().toISOString(),
                    fieldNote.toUpperCase(),
                    'CONFIRMADO',
                    'TÉCNICO',
                    fieldSeveridade,
                    fieldCategoria,
                    new Date().toISOString(),
                    new Date().toISOString()
                ]
            );
            setFieldNote(''); setFieldLocal('');
            setFieldCategoria('OUTROS'); setFieldSeveridade('BAIXA');
            setAddModal(false);
            loadHistory();
            showToast('✅ Observação registrada no Diário de Campo!');
        } catch (e) {
            Alert.alert('Erro', 'Falha ao salvar. Verifique o banco de dados.');
        } finally { setSavingNote(false); }
    };

    const handleSearch = async (query) => {
        const q = encodeURIComponent((query || searchQuery).trim() + ' agricultura');
        const url = `https://www.google.com/search?q=${q}`;
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) Linking.openURL(url);
    };

    const handleDelete = (item) => {
        Alert.alert('Excluir Registro', 'Remover este apontamento?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir', style: 'destructive', onPress: async () => {
                    await executeQuery(`UPDATE monitoramento_entidade SET status='EXCLUIDO' WHERE uuid=?`, [item.uuid]);
                    loadHistory();
                }
            }
        ]);
    };

    const getSeveridade = (key) => SEVERIDADES.find(s => s.key === key) || SEVERIDADES[0];
    const getCategoria = (key) => CATEGORIAS.find(c => c.key === key) || CATEGORIAS[4];

    const formatDate = (iso) => {
        try {
            const d = new Date(iso);
            return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
        } catch { return iso; }
    };

    // ── WEATHER BLOCK ────────────────────────────────────────────────────────
    const WeatherPanel = () => {
        if (weatherLoading) {
            return (
                <View style={styles.weatherLoadingBox}>
                    <ActivityIndicator color="#34D399" size="small" />
                    <Text style={{ color: '#6B7280', fontSize: 12, marginLeft: 10 }}>Carregando clima...</Text>
                </View>
            );
        }
        if (!weather) return null;

        const riskLevel = weather.alerts?.length > 0
            ? (weather.alerts.some(a => a.color === '#EF4444') ? 'ALTO' : 'MÉDIO')
            : 'NORMAL';
        const riskColor = riskLevel === 'ALTO' ? '#EF4444' : riskLevel === 'MÉDIO' ? '#F59E0B' : '#10B981';

        return (
            <View style={styles.weatherPanel}>
                {/* Main weather */}
                <LinearGradient
                    colors={['rgba(52,211,153,0.08)', 'rgba(0,0,0,0)']}
                    style={styles.weatherMainBlock}
                >
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Ionicons name="location" size={12} color="#34D399" />
                            <Text style={styles.weatherCity}>{weather.city}</Text>
                            <TouchableOpacity onPress={() => refreshWeather(true)}>
                                <Ionicons name="refresh" size={14} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.weatherTemp}>{weather.temp}°<Text style={{ fontSize: 18, color: '#9CA3AF' }}>C</Text></Text>
                        <Text style={styles.weatherDesc}>{weather.description}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 8 }}>
                        <Ionicons name={getWeatherIcon(weather.icon)} size={48} color="#34D399" style={{ opacity: 0.9 }} />
                        <View style={[styles.riskBadge, { backgroundColor: riskColor + '20', borderColor: riskColor + '40' }]}>
                            <View style={[styles.riskDot, { backgroundColor: riskColor }]} />
                            <Text style={[styles.riskText, { color: riskColor }]}>RISCO {riskLevel}</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Metrics row */}
                <View style={styles.weatherMetrics}>
                    {[
                        { icon: 'water', label: 'Umidade', value: `${weather.humidity}%`, color: '#3B82F6' },
                        { icon: 'speedometer', label: 'Vento', value: `${weather.wind} km/h`, color: '#8B5CF6' },
                        { icon: 'umbrella', label: 'Chuva', value: `${weather.pop}%`, color: '#60A5FA' },
                    ].map((m, i) => (
                        <View key={i} style={[styles.metricCard, { borderColor: m.color + '20' }]}>
                            <Ionicons name={m.icon} size={18} color={m.color} />
                            <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
                            <Text style={styles.metricLabel}>{m.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Alerts */}
                {weather.alerts?.map((alert, i) => (
                    <View key={i} style={[styles.alertBanner, { borderColor: alert.color + '40', backgroundColor: alert.color + '12' }]}>
                        <Ionicons name="warning" size={16} color={alert.color} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.alertTitle, { color: alert.color }]}>{alert.event}</Text>
                            <Text style={styles.alertDesc}>{alert.description}</Text>
                        </View>
                    </View>
                ))}

                {/* Agro tips */}
                <View style={styles.agroTips}>
                    <Text style={styles.agroTipsLabel}>📋 RECOMENDAÇÕES AGRONÔMICAS</Text>
                    {weather.humidity > 80 && (
                        <View style={styles.agroTip}>
                            <Ionicons name="alert-circle" size={14} color="#F59E0B" />
                            <Text style={styles.agroTipText}>Alta umidade — risco elevado de fungos. Monitore folhagem.</Text>
                        </View>
                    )}
                    {weather.wind > 40 && (
                        <View style={styles.agroTip}>
                            <Ionicons name="alert-circle" size={14} color="#EF4444" />
                            <Text style={styles.agroTipText}>Vento forte — evite aplicação de defensivos hoje.</Text>
                        </View>
                    )}
                    {weather.pop > 60 && (
                        <View style={styles.agroTip}>
                            <Ionicons name="rainy" size={14} color="#3B82F6" />
                            <Text style={styles.agroTipText}>Alta chance de chuva — priorize colheitas urgentes.</Text>
                        </View>
                    )}
                    {weather.temp > 35 && (
                        <View style={styles.agroTip}>
                            <Ionicons name="thermometer" size={14} color="#EF4444" />
                            <Text style={styles.agroTipText}>Calor extremo — irrigue nas primeiras horas da manhã.</Text>
                        </View>
                    )}
                    {weather.humidity <= 80 && weather.wind <= 40 && weather.pop <= 60 && weather.temp <= 35 && (
                        <View style={styles.agroTip}>
                            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                            <Text style={styles.agroTipText}>Condições ideais para operações de campo.</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    // ── FIELD LOG ITEM ────────────────────────────────────────────────────────
    const renderHistoryItem = ({ item, index }) => {
        const sev = getSeveridade(item.severidade);
        const cat = getCategoria(item.categoria);
        return (
            <View style={[styles.historyCard, { borderLeftColor: sev.color, borderLeftWidth: 3 }]}>
                <View style={styles.historyTop}>
                    <View style={[styles.historyIconBox, { backgroundColor: cat.color + '15' }]}>
                        <Ionicons name={cat.icon} size={18} color={cat.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={[styles.historyCultura, { color: cat.color }]}>{item.cultura_id}</Text>
                            <View style={[styles.sevChip, { backgroundColor: sev.bg, borderColor: sev.color + '40' }]}>
                                <Ionicons name={sev.icon} size={10} color={sev.color} />
                                <Text style={[styles.sevChipText, { color: sev.color }]}>{sev.label}</Text>
                            </View>
                        </View>
                        <Text style={styles.historyDate}>{formatDate(item.data)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={16} color="rgba(239,68,68,0.6)" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.historyNote}>{item.observacao_usuario}</Text>
                <View style={styles.historyFooter}>
                    <View style={[styles.catBadge, { backgroundColor: cat.color + '10' }]}>
                        <Text style={[styles.catBadgeText, { color: cat.color }]}>{cat.label.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.historyNivel}>{item.nivel_confianca}</Text>
                </View>
            </View>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <LinearGradient colors={['#050B08', '#0A120E', '#030504']} style={StyleSheet.absoluteFill} />
            {/* ambient orb */}
            <View style={[styles.orb, { backgroundColor: '#10B981', top: -100, left: -100 }]} />
            <View style={[styles.orb, { backgroundColor: '#3B82F6', bottom: 100, right: -120, opacity: 0.06 }]} />

            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <SafeAreaView style={{ flex: 1 }}>
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
                        <Ionicons name="arrow-back" size={22} color="#D1FAE5" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Monitoramento</Text>
                        <Text style={styles.headerSub}>Centro de Controle Agronômico</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtnHeader} onPress={() => setAddModal(true)}>
                        <Ionicons name="add" size={22} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* TABS */}
                <View style={styles.tabsRow}>
                    {TABS.map(tab => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Ionicons
                                name={tab === 'CAMPO' ? 'journal' : 'search'}
                                size={14}
                                color={activeTab === tab ? '#34D399' : '#6B7280'}
                                style={{ marginRight: 6 }}
                            />
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab === 'CAMPO' ? 'Diário de Campo' : 'Pesquisa Agronômica'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {activeTab === 'CAMPO' ? (
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34D399" />}
                    >
                        {/* WEATHER */}
                        <WeatherPanel />

                        {/* HISTORY */}
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>DIÁRIO DE CAMPO</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{history.length}</Text>
                            </View>
                        </View>

                        {loadingHistory ? (
                            <ActivityIndicator color="#34D399" style={{ marginTop: 20 }} />
                        ) : history.length === 0 ? (
                            <View style={styles.emptyBox}>
                                <View style={styles.emptyRing}>
                                    <MaterialCommunityIcons name="binoculars" size={36} color="rgba(52,211,153,0.4)" />
                                </View>
                                <Text style={styles.emptyTitle}>Nenhum registro</Text>
                                <Text style={styles.emptyDesc}>Inicie o monitoramento registrando observações de campo: pragas, doenças, deficiências.</Text>
                                <TouchableOpacity style={styles.emptyBtn} onPress={() => setAddModal(true)}>
                                    <Text style={styles.emptyBtnText}>+ Primeira Observação</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            history.map((item, index) => renderHistoryItem({ item, index }))
                        )}
                    </ScrollView>
                ) : (
                    /* PESQUISA TAB */
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.searchIntroTitle}>🔬 Diagnóstico Agronômico</Text>
                        <Text style={styles.searchIntroSub}>Pesquise doenças, pragas e deficiências na base de conhecimento agrícola.</Text>

                        <View style={styles.searchBoxWrap}>
                            <Ionicons name="search" size={18} color="#34D399" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Ex: mancha foliar, pulgão, míldio..."
                                placeholderTextColor="#4B5563"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={() => handleSearch()}
                                returnKeyType="search"
                            />
                            <TouchableOpacity style={styles.searchBtn} onPress={() => handleSearch()}>
                                <Text style={styles.searchBtnText}>BUSCAR</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.quickSearchLabel}>BUSCAS RÁPIDAS</Text>
                        {SEARCHES.map((s, i) => (
                            <TouchableOpacity key={i} style={styles.quickSearchItem} onPress={() => handleSearch(s.query)}>
                                <Ionicons name="flask" size={16} color="#34D399" />
                                <Text style={styles.quickSearchText}>{s.label}</Text>
                                <Ionicons name="arrow-forward" size={14} color="#6B7280" />
                            </TouchableOpacity>
                        ))}

                        <View style={styles.categoriesGrid}>
                            <Text style={styles.quickSearchLabel}>EXPLORAR POR CATEGORIA</Text>
                            <View style={styles.catGrid}>
                                {CATEGORIAS.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.key}
                                        style={[styles.catGridItem, { borderColor: cat.color + '30', backgroundColor: cat.color + '08' }]}
                                        onPress={() => handleSearch(cat.label + ' agricultura controle')}
                                    >
                                        <Ionicons name={cat.icon} size={24} color={cat.color} />
                                        <Text style={[styles.catGridLabel, { color: cat.color }]}>{cat.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                )}

                {/* ── MODAL: NOVO REGISTRO ──────────────────────────────────── */}
                <Modal visible={addModal} animationType="slide" transparent>
                    <View style={styles.modalBg}>
                        <View style={styles.modalSheet}>
                            <View style={styles.modalHandle} />
                            <View style={styles.modalHeaderRow}>
                                <Text style={styles.modalTitle}>📋 Registro de Campo</Text>
                                <TouchableOpacity onPress={() => setAddModal(false)} style={styles.closeBtn}>
                                    <Ionicons name="close" size={22} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                                {/* LOCAL */}
                                <Text style={styles.mLabel}>LOCAL / ÁREA</Text>
                                <View style={styles.mInputBox}>
                                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                                    <TextInput
                                        style={styles.mInput}
                                        placeholder="Ex: Talhão A, Estufa 2..."
                                        placeholderTextColor="#4B5563"
                                        value={fieldLocal}
                                        onChangeText={setFieldLocal}
                                    />
                                </View>

                                {/* CATEGORIA */}
                                <Text style={styles.mLabel}>CATEGORIA</Text>
                                <View style={styles.chipRow}>
                                    {CATEGORIAS.map(cat => (
                                        <TouchableOpacity
                                            key={cat.key}
                                            style={[
                                                styles.catChip,
                                                fieldCategoria === cat.key && { backgroundColor: cat.color + '20', borderColor: cat.color }
                                            ]}
                                            onPress={() => setFieldCategoria(cat.key)}
                                        >
                                            <Ionicons name={cat.icon} size={14} color={fieldCategoria === cat.key ? cat.color : '#6B7280'} />
                                            <Text style={[styles.catChipText, fieldCategoria === cat.key && { color: cat.color }]}>
                                                {cat.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* SEVERIDADE */}
                                <Text style={styles.mLabel}>SEVERIDADE</Text>
                                <View style={styles.chipRow}>
                                    {SEVERIDADES.map(sev => (
                                        <TouchableOpacity
                                            key={sev.key}
                                            style={[
                                                styles.sevChipBtn,
                                                { flex: 1 },
                                                fieldSeveridade === sev.key && { backgroundColor: sev.bg, borderColor: sev.color + '60' }
                                            ]}
                                            onPress={() => setFieldSeveridade(sev.key)}
                                        >
                                            <Ionicons name={sev.icon} size={16} color={fieldSeveridade === sev.key ? sev.color : '#6B7280'} />
                                            <Text style={[styles.sevChipBtnText, fieldSeveridade === sev.key && { color: sev.color }]}>
                                                {sev.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* OBSERVAÇÃO */}
                                <Text style={styles.mLabel}>OBSERVAÇÃO</Text>
                                <TextInput
                                    style={styles.mTextArea}
                                    placeholder="Descreva o que observou: sintomas, localização, quantidade afetada..."
                                    placeholderTextColor="#4B5563"
                                    value={fieldNote}
                                    onChangeText={setFieldNote}
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />

                                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
                                    <LinearGradient colors={['#10B981', '#047857']} style={styles.saveGradient}>
                                        {savingNote ? <ActivityIndicator color="#FFF" size="small" /> : (
                                            <>
                                                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                                <Text style={styles.saveBtnText}>SALVAR NO DIÁRIO</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    orb: { position: 'absolute', width: 350, height: 350, borderRadius: 175, opacity: 0.08 },

    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20, paddingBottom: 15 },
    backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 0.3 },
    headerSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    addBtnHeader: { marginLeft: 'auto', width: 42, height: 42, borderRadius: 14, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },

    tabsRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 15 },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 12 },
    tabBtnActive: { backgroundColor: 'rgba(52,211,153,0.12)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
    tabText: { color: '#6B7280', fontSize: 12, fontWeight: '800' },
    tabTextActive: { color: '#34D399' },

    scrollContent: { padding: 20, paddingBottom: 100 },

    // WEATHER
    weatherPanel: { marginBottom: 25 },
    weatherLoadingBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 60 },
    weatherMainBlock: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, borderColor: 'rgba(52,211,153,0.15)', marginBottom: 12 },
    weatherCity: { color: '#9CA3AF', fontSize: 12, fontWeight: '700' },
    weatherTemp: { color: '#FFF', fontSize: 52, fontWeight: '900', lineHeight: 60, marginTop: 4 },
    weatherDesc: { color: '#9CA3AF', fontSize: 13, fontWeight: '600', textTransform: 'capitalize', marginTop: 4 },
    riskBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, gap: 5 },
    riskDot: { width: 6, height: 6, borderRadius: 3 },
    riskText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },

    weatherMetrics: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    metricCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1, gap: 4 },
    metricValue: { fontSize: 16, fontWeight: '900' },
    metricLabel: { color: '#6B7280', fontSize: 9, fontWeight: '800', letterSpacing: 1 },

    alertBanner: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 10 },
    alertTitle: { fontSize: 12, fontWeight: '900' },
    alertDesc: { color: '#9CA3AF', fontSize: 11, marginTop: 2 },

    agroTips: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    agroTipsLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 12 },
    agroTip: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
    agroTipText: { color: '#D1FAE5', fontSize: 12, flex: 1, lineHeight: 18 },

    // HISTORY
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
    sectionTitle: { color: '#9CA3AF', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
    countBadge: { backgroundColor: 'rgba(52,211,153,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    countBadgeText: { color: '#34D399', fontSize: 10, fontWeight: '900' },

    historyCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderTopColor: 'rgba(255,255,255,0.1)' },
    historyTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    historyIconBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    historyCultura: { fontSize: 13, fontWeight: '900', letterSpacing: 0.3 },
    historyDate: { color: '#6B7280', fontSize: 10, marginTop: 3, fontWeight: '700' },
    historyNote: { color: '#D1FAE5', fontSize: 13, lineHeight: 20, fontWeight: '600' },
    historyFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
    catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    catBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    historyNivel: { color: '#4B5563', fontSize: 9, fontWeight: '800' },
    sevChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, gap: 4 },
    sevChipText: { fontSize: 9, fontWeight: '900' },
    deleteBtn: { padding: 8 },

    emptyBox: { alignItems: 'center', paddingVertical: 40 },
    emptyRing: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: 'rgba(52,211,153,0.2)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 8 },
    emptyDesc: { color: '#6B7280', fontSize: 13, textAlign: 'center', lineHeight: 20 },
    emptyBtn: { marginTop: 20, backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
    emptyBtnText: { color: '#34D399', fontWeight: '900', fontSize: 13 },

    // SEARCH TAB
    searchIntroTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 6 },
    searchIntroSub: { color: '#6B7280', fontSize: 13, lineHeight: 20, marginBottom: 20 },
    searchBoxWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, paddingLeft: 16, paddingRight: 8, height: 56, borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)', gap: 10, marginBottom: 25 },
    searchInput: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '600' },
    searchBtn: { backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
    searchBtnText: { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
    quickSearchLabel: { color: '#6B7280', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
    quickSearchItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', gap: 12 },
    quickSearchText: { flex: 1, color: '#D1FAE5', fontSize: 13, fontWeight: '700' },
    categoriesGrid: { marginTop: 10 },
    catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    catGridItem: { width: '30%', aspectRatio: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, gap: 8 },
    catGridLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

    // MODAL
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
    modalSheet: { width: '90%', maxWidth: 500, alignSelf: 'center', backgroundColor: '#0D1711', borderRadius: 32, padding: 24, maxHeight: '90%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderTopColor: 'rgba(255,255,255,0.15)' },
    modalHandle: { display: 'none' },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
    closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },

    mLabel: { color: '#6B7280', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 10, marginTop: 15 },
    mInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, paddingHorizontal: 14, height: 54, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 10 },
    mInput: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '600' },
    mTextArea: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, padding: 16, color: '#FFF', fontSize: 14, fontWeight: '600', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', minHeight: 100 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', gap: 6 },
    catChipText: { color: '#6B7280', fontSize: 11, fontWeight: '800' },
    sevChipBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)', gap: 6 },
    sevChipBtnText: { color: '#6B7280', fontSize: 12, fontWeight: '900' },

    saveBtn: { marginTop: 20, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
    saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, gap: 10 },
    saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
});

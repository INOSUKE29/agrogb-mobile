import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, FlatList, StatusBar, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { executeQuery } from '../database/database';
import { ManejoService } from '../services/ManejoService';
import { useFocusEffect } from '@react-navigation/native';
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

export default function AplicacoesScreen({ navigation, isTabbed }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    
    const [talhoes, setTalhoes] = useState([]);
    const [history, setHistory] = useState([]);
    const [modalTalhao, setModalTalhao] = useState(false);
    
    const [form, setForm] = useState({
        talhao_uuid: '',
        talhao_nome: '',
        produto_nome: '',
        produto_uuid: '',
        praga_alvo: '',
        dose_ha: '',
        volume_calda_l: '',
        carencia_dias: '7',
        area_hectares: 0,
        preco_unitario: 0
    });
    
    const [modalProduto, setModalProduto] = useState(false);
    const [produtosCatalogo, setProdutosCatalogo] = useState([]);

    useFocusEffect(useCallback(() => {
        loadData();
    }, []));

    const loadData = async () => {
        try {
            const resT = await executeQuery('SELECT uuid, nome, area_hectares FROM talhoes WHERE is_deleted = 0');
            const rowsT = [];
            for (let i = 0; i < resT.rows.length; i++) rowsT.push(resT.rows.item(i));
            setTalhoes(rowsT);

            const resH = await executeQuery(
                `SELECT a.*, t.nome as talhao_nome 
                 FROM aplicacoes a 
                 LEFT JOIN talhoes t ON a.talhao_uuid = t.uuid 
                 WHERE a.is_deleted = 0 
                 ORDER BY a.data DESC LIMIT 10`
            );
            const rowsH = [];
            for (let i = 0; i < resH.rows.length; i++) rowsH.push(resH.rows.item(i));
            setHistory(rowsH);

            // Buscar produtos do catálogo aprovado
            const resP = await executeQuery("SELECT uuid, nome_comercial as nome, preco_unitario FROM cadastro WHERE is_deleted = 0");
            const rowsP = [];
            for (let i = 0; i < resP.rows.length; i++) rowsP.push(resP.rows.item(i));
            setProdutosCatalogo(rowsP);
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        if (!form.talhao_uuid || !form.produto_nome) return Alert.alert('Aviso', 'Preencha o talhão e o produto.');
        try {
            const res = await ManejoService.registrarManejo(form);
            if (res.success) {
                Alert.alert('Sucesso', `Aplicação registrada. Liberado para colheita em: ${res.dataLibStr.split('-').reverse().join('/')}`);
                setForm({ talhao_uuid: '', talhao_nome: '', produto_nome: '', praga_alvo: '', dose_ha: '', volume_calda_l: '', carencia_dias: '7', area_hectares: 0, preco_unitario: 0 });
                loadData();
            } else {
                Alert.alert('Erro', res.error || 'Falha ao salvar aplicação.');
            }
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar aplicação.'); }
    };

    const isDark = theme?.theme_mode === 'dark';
    const textColor = activeColors.text || '#1E293B';
    const textMutedColor = activeColors.textMuted || '#64748B';
    const cardBg = activeColors.card || '#FFFFFF';
    const borderCol = activeColors.border || 'rgba(0,0,0,0.1)';

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F3F4F6' }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            {!isTabbed && (
                <LinearGradient colors={[activeColors.warning || '#F59E0B', activeColors.warningDeep || '#D97706']} style={styles.header}>
                    <SafeAreaView>
                        <View style={styles.headerTop}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                                <Ionicons name="arrow-back" size={22} color="#FFF" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>APLICAÇÃO DE DEFENSIVOS</Text>
                            <View style={{ width: 38 }} />
                        </View>
                        <Text style={styles.headerSub}>Controle fitossanitário e carência de colheita</Text>
                    </SafeAreaView>
                </LinearGradient>
            )}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
                <Card style={styles.formCard}>
                    <Text style={[styles.sectionTitle, { color: textMutedColor }]}>NOVA APLICAÇÃO</Text>
                    
                    <TouchableOpacity 
                        style={[styles.selectBtn, { backgroundColor: cardBg, borderColor: borderCol, borderWidth: isDark ? 1 : 1 }]} 
                        onPress={() => setModalTalhao(true)}
                    >
                        <Text style={[styles.selectText, { color: form.talhao_nome ? textColor : textMutedColor }]}>
                            {form.talhao_nome || "SELECIONAR TALHÃO / ÁREA..."}
                        </Text>
                        <Ionicons name="location-outline" size={20} color={textMutedColor} />
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.selectBtn, { backgroundColor: cardBg, borderColor: borderCol, borderWidth: isDark ? 1 : 1 }]} 
                        onPress={() => setModalProduto(true)}
                    >
                        <Text style={[styles.selectText, { color: form.produto_nome ? textColor : textMutedColor }]}>
                            {form.produto_nome || "SELECIONAR PRODUTO (CATÁLOGO)..."}
                        </Text>
                        <Ionicons name="flask-outline" size={20} color={textMutedColor} />
                    </TouchableOpacity>

                    <AgroInput label="PRAGA ALVO / MOTIVO" value={form.praga_alvo} onChangeText={t => setForm({...form, praga_alvo: t})} />

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <AgroInput label="DOSE / HA" value={form.dose_ha} keyboardType="numeric" onChangeText={t => setForm({...form, dose_ha: t})} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AgroInput label="CARENCIA (DIAS)" value={form.carencia_dias} keyboardType="numeric" onChangeText={t => setForm({...form, carencia_dias: t})} />
                        </View>
                    </View>

                    <AgroButton title="REGISTRAR APLICAÇÃO" onPress={handleSave} />
                </Card>

                <Text style={[styles.historyTitle, { color: textColor }]}>HISTÓRICO DE MANEJO</Text>
                {history.map(item => (
                    <Card key={item.uuid} style={styles.histCard}>
                        <View style={styles.histRow}>
                            <View style={[styles.histIcon, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FFF7ED' }]}>
                                <Ionicons name="shield-checkmark-outline" size={20} color={activeColors.warning || '#F59E0B'} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.histTalhao, { color: textColor }]}>{item.talhao_nome}</Text>
                                <Text style={[styles.histProd, { color: activeColors.warning || '#D97706' }]}>{item.produto_nome}</Text>
                                <Text style={[styles.histCarencia, { color: textMutedColor }]}>Carência: {item.carencia_dias} dias • Liberação: {item.data_liberacao.split('-').reverse().join('/')}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#FEF3C7' }]}>
                                <Text style={[styles.statusText, { color: isDark ? '#FBBF24' : '#D97706' }]}>ATIVO</Text>
                            </View>
                        </View>
                    </Card>
                ))}
            </ScrollView>

            <Modal visible={modalTalhao} animationType="fade" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modal, { backgroundColor: cardBg }]}>
                        <Text style={[styles.modalTitle, { color: textColor }]}>SELECIONAR ÁREA</Text>
                        <FlatList
                            data={talhoes}
                            keyExtractor={i => i.uuid}
                            initialNumToRender={8}
                            maxToRenderPerBatch={10}
                            windowSize={5}
                            removeClippedSubviews={true}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    key={item.uuid} 
                                    style={styles.modalItem} 
                                    onPress={() => {
                                        setForm({ ...form, talhao_uuid: item.uuid, talhao_nome: item.nome, area_hectares: item.area_hectares || 1 });
                                        setModalTalhao(false);
                                    }}
                                >
                                    <Text style={[styles.talhaoText, { color: textColor }]}>{item.nome}</Text>
                                    <Ionicons name="chevron-forward" size={16} color={textMutedColor} />
                                </TouchableOpacity>
                            )}
                        />
                        <AgroButton title="FECHAR" variant="secondary" onPress={() => setModalTalhao(false)} />
                    </View>
                </View>
            </Modal>

            <Modal visible={modalProduto} animationType="fade" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modal, { backgroundColor: cardBg }]}>
                        <Text style={[styles.modalTitle, { color: textColor }]}>CATÁLOGO DE PRODUTOS</Text>
                        <FlatList
                            data={produtosCatalogo}
                            keyExtractor={i => i.uuid.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity 
                                    key={item.uuid} 
                                    style={styles.modalItem} 
                                    onPress={() => {
                                        setForm({ ...form, produto_nome: item.nome, produto_uuid: item.uuid, preco_unitario: item.preco_unitario || 0 });
                                        setModalProduto(false);
                                    }}
                                >
                                    <Text style={[styles.talhaoText, { color: textColor }]}>{item.nome}</Text>
                                    <Ionicons name="checkmark-circle-outline" size={16} color={textMutedColor} />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={{textAlign:'center', padding: 20, color: textMutedColor}}>Nenhum produto cadastrado na Biblioteca.</Text>}
                        />
                        <AgroButton title="FECHAR" variant="secondary" onPress={() => setModalProduto(false)} />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 40, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600', textAlign: 'center' },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    formCard: { padding: 20 },
    sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },
    selectBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 15, padding: 15, marginBottom: 15 },
    selectText: { fontSize: 13, fontWeight: '800' },
    row: { flexDirection: 'row' },
    historyTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: 25, marginBottom: 15 },
    histCard: { marginBottom: 10, padding: 15 },
    histRow: { flexDirection: 'row', alignItems: 'center' },
    histIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    histTalhao: { fontSize: 14, fontWeight: 'bold' },
    histProd: { fontSize: 11, fontWeight: '900', marginTop: 2 },
    histCarencia: { fontSize: 10, marginTop: 2 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontSize: 9, fontWeight: '900' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 25 },
    modal: { borderRadius: 25, padding: 25, maxHeight: '80%' },
    modalTitle: { fontSize: 16, fontWeight: '900', marginBottom: 20, textAlign: 'center' },
    talhaoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
    talhaoText: { fontSize: 14, fontWeight: '800' }
});

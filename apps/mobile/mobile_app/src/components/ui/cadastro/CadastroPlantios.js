import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, FlatList, TouchableOpacity } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getCadastro, executeQuery } from '../../database/database';
import { ProductionService } from '../../modules/production/services/ProductionService';
import AppContainer from '../AppContainer';
import ScreenHeader from '../ScreenHeader';
import GlowCard from '../GlowCard';
import GlowInput from '../GlowInput';
import PrimaryButton from '../PrimaryButton';
import CultureSelector from '../../components/CultureSelector';
import { useTheme } from '../../theme/ThemeContext';
import { showToast } from '../Toast';

export default function CadastroPlantios({ navigation }) {
    const { colors, isDark } = useTheme();
    const [talhao, setTalhao] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [variedade, setVariedade] = useState('');
    const [history, setHistory] = useState([]);
    
    // UI States
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [items, setItems] = useState([]);
    const [culturasDB, setCulturasDB] = useState([]);

    useFocusEffect(useCallback(() => { loadHistory(); loadCulturas(); }, []));

    const loadHistory = async () => {
        try {
            const res = await executeQuery('SELECT * FROM plantio ORDER BY data DESC LIMIT 10');
            const rows = [];
            for (let i = 0; i < res.rows.length; i++) rows.push(res.rows.item(i));
            setHistory(rows);
        } catch { }
    };

    const loadCulturas = async () => {
        try {
            const all = await getCadastro();
            setCulturasDB(all.filter(i => i.tipo === 'CULTURA'));
        } catch {}
    };

    const openSelector = async (type) => {
        setModalType(type); 
        setModalVisible(true);
        try {
            const all = await getCadastro();
            setItems(all.filter(i => i.tipo === type));
        } catch { }
    };

    const handleSelect = (item) => {
        if (modalType === 'AREA') { setTalhao(item.nome); }
        else { setVariedade(item.nome); }
        setModalVisible(false);
    };

    const salvar = async () => {
        if (!talhao || !quantidade || !variedade) return Alert.alert('Atenção', 'Preencha todos os campos obrigatórios.');
        
        setLoading(true);
        try {
            await ProductionService.recordPlantio({
                uuid: uuidv4(),
                cultura: variedade.toUpperCase(),
                tipo_plantio: talhao.toUpperCase(),
                quantidade_pes: parseInt(quantidade) || 0,
                data: new Date().toISOString().split('T')[0]
            });
            showToast('✅ Plantio registrado com sucesso!');
            
            try {
                const AutoSyncService = require('../../services/AutoSyncService').default;
                AutoSyncService.trigger();
            } catch (e) { console.log('AutoSync trigger error', e); }

            setTalhao(''); setQuantidade(''); setVariedade(''); 
            loadHistory();
        } catch { 
            Alert.alert('Erro', 'Falha ao registrar plantio.'); 
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppContainer>
            <ScreenHeader title="REGISTRAR PLANTIO" onBack={() => navigation?.goBack()} />

            <ScrollView contentContainerStyle={styles.scroll}>
                
                <CultureSelector 
                    cultures={culturasDB}
                    selectedCulture={variedade}
                    onSelect={(cult) => setVariedade(cult.nome)}
                />

                <GlowCard style={styles.sectionCard}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>INFORMAÇÕES DA ÁREA</Text>
                    
                    <View style={styles.row}>
                        <View style={{ flex: 1.5, marginRight: 10 }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>TALHÃO / ÁREA <Text style={{color: '#EF4444'}}>*</Text></Text>
                            <TouchableOpacity
                                style={[styles.selector, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', borderColor: colors.border }]}
                                onPress={() => openSelector('AREA')}
                            >
                                <Text style={[styles.selectorText, { color: colors.textPrimary }, !talhao && { color: colors.placeholder }]}>{talhao || 'Selecionar Área'}</Text>
                                <Ionicons name="location" size={18} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>QTD DE PÉS <Text style={{color: '#EF4444'}}>*</Text></Text>
                            <GlowInput
                                value={quantidade}
                                onChangeText={setQuantidade}
                                placeholder="0"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </GlowCard>

                <PrimaryButton title="SALVAR PLANTIO" onPress={salvar} loading={loading} style={{ marginTop: 10, marginBottom: 30 }} />

                {history.length > 0 && (
                    <GlowCard style={[styles.sectionCard, { marginTop: 10 }]}>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 15 }]}>ÚLTIMOS REGISTROS</Text>
                        {history.map(item => (
                            <View key={item.uuid} style={[styles.historyCard, { borderColor: colors.border }]}>
                                <View style={styles.historyIconBox}>
                                    <Ionicons name="leaf" size={18} color={colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>{item.cultura}</Text>
                                    <Text style={[styles.historySub, { color: colors.textSecondary }]}>{item.quantidade_pes} Pés em {item.tipo_plantio}</Text>
                                </View>
                            </View>
                        ))}
                    </GlowCard>
                )}
            </ScrollView>

            {/* Modal de Seleção (Área) */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <GlowCard style={[styles.modalContent, { height: '60%' }]}>
                        <View style={{ flex: 1, padding: 10 }}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                                SELECIONE {modalType === 'AREA' ? 'A ÁREA' : 'A CULTURA'}
                            </Text>
                            <FlatList
                                data={items}
                                keyExtractor={i => i.uuid}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[styles.pickItem, { borderBottomColor: colors.border }]}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Text style={[styles.pickText, { color: colors.textPrimary }]}>{item.nome}</Text>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>Nenhum item cadastrado.</Text>}
                            />
                            <PrimaryButton title="FECHAR" onPress={() => setModalVisible(false)} style={{ marginTop: 10 }} />
                        </View>
                    </GlowCard>
                </View>
            </Modal>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 16, paddingBottom: 100 },
    sectionCard: { marginBottom: 16, padding: 20 },
    sectionTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 10 },
    row: { flexDirection: 'row', alignItems: 'center' },
    label: { fontSize: 10, fontWeight: '900', marginBottom: 8, letterSpacing: 1 },
    selector: {
        height: 55,
        borderWidth: 1.5,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16
    },
    selectorText: { flex: 1, fontSize: 14, fontWeight: '700' },
    historyCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    historyIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    historyTitle: { fontSize: 14, fontWeight: 'bold' },
    historySub: { fontSize: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 25 },
    modalContent: { width: '100%', elevation: 15 },
    modalTitle: { fontSize: 16, fontWeight: '900', marginBottom: 20, textAlign: 'center', letterSpacing: 1 },
    pickItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1 },
    pickText: { fontSize: 14, fontWeight: '800' }
});

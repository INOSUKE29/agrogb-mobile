import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Modal, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { executeQuery, insertCadernoNota } from '../database/database';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

// Design System
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

export default function CadernoCampoScreen({ navigation }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const [timeline, setTimeline] = useState([]);

    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [notaTexto, setNotaTexto] = useState('');

    const loadTimeline = async () => {
        setLoading(true);
        try {
            const query = `
                SELECT 'COLHEITA' as tipo, data, cultura || ' - ' || produto || ' (' || quantidade || 'kg)' as descricao, observacao
                FROM colheitas WHERE is_deleted = 0
                UNION ALL
                SELECT 'VENDA' as tipo, data, cliente || ' - ' || produto || ' (R$ ' || valor || ')' as descricao, observacao
                FROM vendas WHERE is_deleted = 0
                UNION ALL
                SELECT 'CUSTO' as tipo, data, tipo || ' - ' || produto || ' (R$ ' || valor_total || ')' as descricao, observacao
                FROM custos WHERE is_deleted = 0
                UNION ALL
                SELECT 'COMPRA' as tipo, data, item || ' (R$ ' || valor || ')' as descricao, observacao
                FROM compras WHERE is_deleted = 0
                UNION ALL
                SELECT 'PLANTIO' as tipo, data, cultura || ' (' || quantidade_pes || ' area/pes)' as descricao, observacao
                FROM plantio WHERE is_deleted = 0
                UNION ALL
                SELECT 'ANOTAÇÃO' as tipo, data, 'Nota Manual' as descricao, observacao
                FROM caderno_notas WHERE is_deleted = 0
                ORDER BY data DESC
                LIMIT 50
            `;

            const res = await executeQuery(query);
            const data = [];
            for (let i = 0; i < res.rows.length; i++) {
                const row = { ...res.rows.item(i) };
                if (row.tipo === 'ANOTAÇÃO' && row.observacao && row.observacao.toUpperCase().startsWith('[ADUBAÇÃO')) {
                    row.tipo = 'ADUBAÇÃO';
                }
                data.push(row);
            }
            setTimeline(data);
        } catch (e) {
            console.error('Timeline Error:', e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(useCallback(() => { loadTimeline(); }, []));

    const getIcon = (tipo) => {
        switch (tipo) {
            case 'COLHEITA': return { name: 'leaf', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
            case 'ADUBAÇÃO': return { name: 'flask', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
            case 'VENDA': return { name: 'cash', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' };
            case 'CUSTO': return { name: 'trending-down', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
            case 'COMPRA': return { name: 'cart', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.15)' };
            case 'PLANTIO': return { name: 'analytics', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' };
            case 'ANOTAÇÃO': return { name: 'document-text', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.15)' };
            default: return { name: 'ellipse', color: '#6B7280', bg: 'rgba(107, 114, 128, 0.15)' };
        }
    };

    const handleSaveNota = async () => {
        if (!notaTexto.trim()) {
            Alert.alert('Aviso', 'Escreva a anotação do seu dia na fazenda antes de salvar!');
            return;
        }
        try {
            await insertCadernoNota({ observacao: notaTexto.trim(), data: new Date().toISOString() });
            setNotaTexto(''); setModalVisible(false); loadTimeline();
            Alert.alert('Nota Salva', 'Anotação adicionada ao caderno de campo com sucesso!');
        } catch (e) { 
            Alert.alert('Erro', 'Não conseguimos salvar a sua anotação agora.'); 
        }
    };

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
                        <View style={{alignItems: 'center'}}>
                            <Text style={styles.headerTitle}>CADERNO DE CAMPO</Text>
                            <Text style={styles.headerSub}>Histórico da Fazenda</Text>
                        </View>
                        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.backBtn}>
                            <Ionicons name="create-outline" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {timeline.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="journal-outline" size={64} color="#374151" />
                            <Text style={styles.emptyText}>Sem registros no momento.</Text>
                            <Text style={styles.emptySub}>Suas colheitas, vendas e anotações aparecerão aqui.</Text>
                        </View>
                    ) : (
                        timeline.map((item, index) => {
                            const iconConfig = getIcon(item.tipo);
                            const date = item.data?.includes('T') ? item.data.split('T')[0] : item.data;
                            const formattedDate = date ? date.split('-').reverse().join('/') : '--/--/--';

                            return (
                                <View key={index} style={styles.timelineRow}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg, borderColor: iconConfig.color }]}>
                                            <Ionicons name={iconConfig.name} size={16} color={iconConfig.color} />
                                        </View>
                                        {index < timeline.length - 1 && <View style={styles.verticalLine} />}
                                    </View>

                                    <View style={styles.timelineContent}>
                                        <Text style={styles.dateText}>{formattedDate}</Text>
                                        <LinearGradient 
                                            colors={['#1F2937', '#111827']} 
                                            style={[styles.itemCard, { borderLeftColor: iconConfig.color }]}
                                        >
                                            <View style={styles.cardHeader}>
                                                <Text style={[styles.tipoBadge, { color: iconConfig.color }]}>{item.tipo}</Text>
                                            </View>
                                            <Text style={styles.descText}>{item.descricao}</Text>
                                            {item.observacao && (
                                                <View style={styles.obsBox}>
                                                    <Ionicons name="chatbubble-ellipses-outline" size={14} color="#6B7280" style={{marginRight: 6, marginTop: 2}} />
                                                    <Text style={styles.obsText} selectable>{item.observacao}</Text>
                                                </View>
                                            )}
                                        </LinearGradient>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}

            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <LinearGradient colors={['#10B981', '#059669']} style={styles.fabGradient}>
                    <Ionicons name="pencil" size={28} color="#FFF" />
                </LinearGradient>
            </TouchableOpacity>

            {/* MODAL DE NOVA ANOTAÇÃO DARK */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>NOVA ANOTAÇÃO</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={30} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                        
                        <AgroInput 
                            label="O que aconteceu hoje?"
                            placeholder="Descreva detalhes climáticos, adubação ou observações..."
                            value={notaTexto}
                            onChangeText={setNotaTexto}
                            multiline
                            style={{ height: 120, textAlignVertical: 'top' }}
                        />

                        <AgroButton 
                            title="SALVAR NO CADERNO" 
                            onPress={handleSaveNota}
                            style={{ marginTop: 20 }}
                        />
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 40, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    headerSub: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold', marginTop: 2, letterSpacing: 1 },
    
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 20, paddingBottom: 100 },
    
    timelineRow: { flexDirection: 'row' },
    timelineLeft: { alignItems: 'center', width: 40, marginRight: 15 },
    iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', zIndex: 10, borderWidth: 1 },
    verticalLine: { width: 2, flex: 1, backgroundColor: '#374151', marginVertical: -5, opacity: 0.5, borderStyle: 'dashed' },
    
    timelineContent: { flex: 1, paddingBottom: 25 },
    dateText: { fontSize: 10, fontWeight: '900', color: '#6B7280', marginBottom: 8, letterSpacing: 1.5 },
    itemCard: { borderRadius: 15, padding: 15, borderLeftWidth: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    tipoBadge: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    descText: { fontSize: 14, color: '#FFF', fontWeight: 'bold' },
    
    obsBox: { marginTop: 12, padding: 12, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8, flexDirection: 'row', alignItems: 'flex-start' },
    obsText: { fontSize: 12, color: '#9CA3AF', fontStyle: 'italic', flex: 1, lineHeight: 18 },
    
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 16, fontWeight: 'bold', color: '#9CA3AF', marginTop: 20 },
    emptySub: { fontSize: 13, color: '#6B7280', marginTop: 5, textAlign: 'center' },
    
    fab: { position: 'absolute', bottom: 30, right: 25, elevation: 8 },
    fabGradient: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1F2937', borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 25, paddingBottom: 40 },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 15, fontWeight: '900', color: '#FFF', letterSpacing: 1 }
});

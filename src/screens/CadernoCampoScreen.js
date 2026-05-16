import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar as RNStatusBar, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { executeQuery, insertCadernoNota } from '../database/database';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

export default function CadernoCampoScreen({ navigation }) {
    const { theme } = useTheme();
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
                data.push(res.rows.item(i));
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
            case 'COLHEITA': return { name: 'leaf', color: '#10B981', bg: '#F0FDF4' };
            case 'VENDA': return { name: 'cash', color: '#3B82F6', bg: '#EFF6FF' };
            case 'CUSTO': return { name: 'trending-down', color: '#EF4444', bg: '#FEF2F2' };
            case 'COMPRA': return { name: 'cart', color: '#F59E0B', bg: '#FFFBEB' };
            case 'PLANTIO': return { name: 'analytics', color: '#8B5CF6', bg: '#F5F3FF' };
            case 'ANOTAÇÃO': return { name: 'document-text', color: '#6B7280', bg: '#F3F4F6' };
            default: return { name: 'ellipse', color: '#9CA3AF', bg: '#F9FAFB' };
        }
    };

    const handleSaveNota = async () => {
        if (!notaTexto.trim()) return Alert.alert('Aviso', 'Escreva algo para salvar.');
        try {
            await insertCadernoNota({ observacao: notaTexto.trim(), data: new Date().toISOString() });
            setNotaTexto(''); setModalVisible(false); loadTimeline();
        } catch (e) { Alert.alert('Erro', 'Falha ao salvar nota.'); }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', '#059669']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>CADERNO AGRÍCOLA</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Ionicons name="create-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSub}>Histórico cronológico unificado da propriedade</Text>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme?.colors?.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {timeline.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="journal-outline" size={64} color="#D1D5DB" />
                            <Text style={styles.emptyText}>Sem registros no momento.</Text>
                            <Text style={styles.emptySub}>Atividades registradas aparecerão aqui.</Text>
                        </View>
                    ) : (
                        timeline.map((item, index) => {
                            const iconConfig = getIcon(item.tipo);
                            const date = item.data?.includes('T') ? item.data.split('T')[0] : item.data;
                            const formattedDate = date ? date.split('-').reverse().join('/') : '--/--/--';

                            return (
                                <View key={index} style={styles.timelineRow}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[styles.iconCircle, { backgroundColor: iconConfig.bg }]}>
                                            <Ionicons name={iconConfig.name} size={18} color={iconConfig.color} />
                                        </View>
                                        {index < timeline.length - 1 && <View style={styles.verticalLine} />}
                                    </View>

                                    <View style={styles.timelineContent}>
                                        <Text style={styles.dateText}>{formattedDate}</Text>
                                        <Card style={styles.itemCard} noPadding>
                                            <View style={styles.cardPadding}>
                                                <View style={styles.cardHeader}>
                                                    <Text style={[styles.tipoBadge, { color: iconConfig.color }]}>{item.tipo}</Text>
                                                </View>
                                                <Text style={styles.descText}>{item.descricao}</Text>
                                                {item.observacao && (
                                                    <View style={styles.obsBox}>
                                                        <Text style={styles.obsText}>{item.observacao}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </Card>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}

            <TouchableOpacity style={[styles.fab, { backgroundColor: theme?.colors?.primary || '#10B981' }]} onPress={() => setModalVisible(true)}>
                <Ionicons name="pencil" size={24} color="#FFF" />
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
                    <Card style={styles.modalContent}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>NOVA ANOTAÇÃO</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        
                        <AgroInput 
                            label="O que aconteceu hoje?"
                            placeholder="Descreva detalhes climáticos, observações ou lembretes..."
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
                    </Card>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 'bold' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 20, paddingBottom: 100 },
    timelineRow: { flexDirection: 'row' },
    timelineLeft: { alignItems: 'center', width: 40, marginRight: 15 },
    iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', zIndex: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    verticalLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginVertical: -5 },
    timelineContent: { flex: 1, paddingBottom: 25 },
    dateText: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', marginBottom: 8, letterSpacing: 1 },
    itemCard: { borderLeftWidth: 4, borderLeftColor: '#E5E7EB' },
    cardPadding: { padding: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    tipoBadge: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    descText: { fontSize: 14, color: '#1F2937', fontWeight: 'bold' },
    obsBox: { marginTop: 10, padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8, borderLeftWidth: 2, borderLeftColor: '#E5E7EB' },
    obsText: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
    emptyState: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 16, fontWeight: 'bold', color: '#4B5563', marginTop: 20 },
    emptySub: { fontSize: 13, color: '#9CA3AF', marginTop: 5, textAlign: 'center' },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { padding: 25, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 15, fontWeight: '900', color: '#1F2937', letterSpacing: 1 }
});


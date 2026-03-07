import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar as RNStatusBar, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { executeQuery, insertCadernoNota } from '../database/database';
import { useTheme } from '../theme/ThemeContext';
import { SPACING } from '../design/spacing';
import { TYPOGRAPHY } from '../design/typography';
import { RADIUS } from '../design/radius';

const { width } = Dimensions.get('window');

export default function CadernoCampoScreen({ navigation }) {
    const { colors, isDark } = useTheme();
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [notaTexto, setNotaTexto] = useState('');
    const [filter, setFilter] = useState('TODOS');

    const FILTERS = ['TODOS', 'COLHEITA', 'VENDA', 'CUSTO', 'COMPRA', 'PLANTIO', 'ANOTAÇÃO'];

    const loadTimeline = async () => {
        setLoading(true);
        try {
            // UNIFIED TIMELINE v8.5
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

    const getIconConfig = (tipo) => {
        switch (tipo) {
            case 'COLHEITA': return { name: 'leaf', color: '#10B981', bg: '#D1FAE520', emoji: '🌾' };
            case 'VENDA': return { name: 'cash', color: '#3B82F6', bg: '#DBEAFE20', emoji: '💰' };
            case 'CUSTO': return { name: 'trending-down', color: '#EF4444', bg: '#FEE2E220', emoji: '📉' };
            case 'COMPRA': return { name: 'cart', color: '#F59E0B', bg: '#FEF3C720', emoji: '🛒' };
            case 'PLANTIO': return { name: 'analytics', color: '#8B5CF6', bg: '#EDE9FE20', emoji: '🌱' };
            case 'ANOTAÇÃO': return { name: 'document-text', color: '#6B7280', bg: '#F3F4F620', emoji: '📝' };
            default: return { name: 'ellipse', color: '#9CA3AF', bg: '#F9FAFB20', emoji: '📌' };
        }
    };

    const filteredTimeline = filter === 'TODOS' ? timeline : timeline.filter(t => t.tipo === filter);

    const handleSaveNota = async () => {
        if (!notaTexto.trim()) {
            Alert.alert('Aviso', 'Escreva algo para salvar.');
            return;
        }
        try {
            await insertCadernoNota({
                observacao: notaTexto.trim(),
                data: new Date().toISOString()
            });
            setNotaTexto('');
            setModalVisible(false);
            loadTimeline();
        } catch (e) {
            console.error(e);
            Alert.alert('Erro', 'Não foi possível salvar a anotação.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <RNStatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Caderno Agrícola</Text>
                    <Text style={styles.headerSub}>Linha do Tempo Profissional v8</Text>
                </View>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <>
                    <View style={[styles.filterContainer, { backgroundColor: colors.background, borderBottomColor: colors.glassBorder }]}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
                            {FILTERS.map(f => (
                                <TouchableOpacity
                                    key={f}
                                    style={[
                                        styles.filterPill,
                                        { backgroundColor: colors.card, borderColor: colors.glassBorder },
                                        filter === f && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => setFilter(f)}
                                >
                                    <Text style={[styles.filterPillText, { color: colors.textSecondary }, filter === f && { color: '#FFF' }]}>{f}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    <ScrollView contentContainerStyle={styles.scroll}>
                        {filteredTimeline.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="journal-outline" size={60} color={colors.glassBorder} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Nenhum registro encontrado.</Text>
                            </View>
                        ) : (
                            filteredTimeline.map((item, index) => {
                                const iconCfg = getIconConfig(item.tipo);
                                const dateObj = new Date(item.data);
                                const day = String(dateObj.getDate()).padStart(2, '0');
                                const month = String(dateObj.getMonth() + 1).padStart(2, '0');

                                return (
                                    <View key={index} style={styles.timelineItem}>
                                        <View style={styles.timelineLeft}>
                                            <View style={[styles.iconCircle, { backgroundColor: iconCfg.color + '20' }]}>
                                                <Ionicons name={iconCfg.name} size={18} color={iconCfg.color} />
                                            </View>
                                            {index < filteredTimeline.length - 1 && <View style={[styles.timelineLine, { backgroundColor: colors.glassBorder }]} />}
                                        </View>

                                        <View style={styles.timelineContent}>
                                            <Text style={[styles.dateText, { color: colors.textMuted }]}>{day}/{month}</Text>
                                            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>
                                                <View style={styles.cardTop}>
                                                    <Text style={[styles.tipoBadge, { color: iconCfg.color }]}>
                                                        {iconCfg.emoji} {item.tipo}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.descText, { color: colors.textPrimary }]}>{item.descricao}</Text>
                                                {item.observacao ? (
                                                    <Text style={[styles.obsText, { color: colors.textSecondary, backgroundColor: colors.background }]}>"{item.observacao}"</Text>
                                                ) : null}
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>
                </>
            )}

            <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
                <Ionicons name="pencil" size={24} color="#FFF" />
            </TouchableOpacity>

            <Modal animationType="slide" transparent={true} visible={modalVisible}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Anotação de Campo</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={[styles.inputArea, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.glassBorder }]}
                            placeholder="Descreva detalhes da lavoura..."
                            placeholderTextColor={colors.placeholder}
                            multiline
                            value={notaTexto}
                            onChangeText={setNotaTexto}
                        />
                        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSaveNota}>
                            <Text style={styles.saveBtnText}>Salvar no Caderno</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 10, letterSpacing: 1 },
    backBtn: { padding: 4 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 20, paddingBottom: 100 },

    // Filters
    filterContainer: { backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    pillScroll: { paddingHorizontal: 20, paddingVertical: 12, gap: 10 },
    filterPill: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB' },
    filterPillActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
    filterPillText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
    filterPillTextActive: { color: '#FFF' },

    // Timeline
    timelineItem: { flexDirection: 'row', marginBottom: 0 },
    timelineLeft: { alignItems: 'center', width: 40, marginRight: 15 },
    iconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginTop: -5, marginBottom: -10 },

    timelineContent: { flex: 1, paddingBottom: 25 },
    dateText: { fontSize: 12, fontWeight: 'bold', color: '#6B7280', marginBottom: 8 },
    card: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, elevation: 1, borderWidth: 1, borderColor: '#F3F4F6' },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    tipoBadge: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    descText: { fontSize: 15, color: '#1F2937', fontWeight: '500' },
    obsText: { fontSize: 13, color: '#6B7280', marginTop: 8, fontStyle: 'italic', backgroundColor: '#F9FAFB', padding: 8, borderRadius: 6 },

    emptyState: { alignItems: 'center', marginTop: 50 },
    emptyText: { fontSize: 16, fontWeight: 'bold', color: '#4B5563', marginTop: 15 },
    emptySub: { fontSize: 14, color: '#9CA3AF', marginTop: 5, textAlign: 'center' },

    fab: {
        position: 'absolute', bottom: 30, right: 30,
        backgroundColor: '#10B981', width: 60, height: 60, borderRadius: 30,
        justifyContent: 'center', alignItems: 'center', elevation: 5
    },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 25, minHeight: 300 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
    inputArea: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 15, height: 120, fontSize: 16, color: '#1F2937', marginBottom: 20 },
    saveBtn: { backgroundColor: '#10B981', padding: 15, borderRadius: 10, alignItems: 'center' },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

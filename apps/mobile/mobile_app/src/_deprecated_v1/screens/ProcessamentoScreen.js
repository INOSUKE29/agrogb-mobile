/**
 * ProcessamentoScreen.js â€” AgroGB Diamond Pro
 * Registro de Perdas & Congelamento
 * PadrÃ£o: Dark Glassmorphism, sem useTheme, sem componentes legados
 */

import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ScrollView, Alert, SafeAreaView, StatusBar, Platform,
    ActivityIndicator, KeyboardAvoidingView,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertProcessamento } from '../services/EstoqueService';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { showToast } from '../ui/Toast';

const MODES = [
    {
        id: 'DESCARTE',
        icon: 'trash-outline',
        label: 'PERDAS',
        color: '#F43F5E',
        gradient: ['#4C0519', '#881337'],
        subtitle: 'Avarias, deterioraÃ§Ã£o e descartes',
        placeholder: 'EX: MATURAÃ‡ÃƒO EXCESSIVA, PRAGAS...',
        fieldLabel: 'MOTIVO DO DESCARTE',
        btnLabel: 'CONFIRMAR PERDA',
    },
    {
        id: 'CONGELAMENTO',
        icon: 'snow-outline',
        label: 'CÃ‚MARA FRIA',
        color: '#3B82F6',
        gradient: ['#1E1B4B', '#1D4ED8'],
        subtitle: 'Polpas, congelados e separaÃ§Ã£o de lote',
        placeholder: 'EX: LOTE 15B, MORANGOS MENORES...',
        fieldLabel: 'OBSERVAÃ‡Ã•ES DO LOTE',
        btnLabel: 'CONFIRMAR CONGELAMENTO',
    },
];

export default function ProcessamentoScreen({ navigation }) {
    const [tipoIdx, setTipoIdx] = useState(0);
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [motivo, setMotivo] = useState('');
    const [loading, setLoading] = useState(false);

    const mode = MODES[tipoIdx];

    const handleSave = async () => {
        if (!produto.trim() || !quantidade.trim()) {
            Alert.alert('AtenÃ§Ã£o', 'Produto e Quantidade sÃ£o obrigatÃ³rios.');
            return;
        }

        const qty = parseFloat(quantidade);
        if (isNaN(qty) || qty <= 0) {
            Alert.alert('AtenÃ§Ã£o', 'Informe uma quantidade vÃ¡lida.');
            return;
        }

        setLoading(true);
        try {
            await insertProcessamento({
                uuid: uuidv4(),
                produto: produto.trim().toUpperCase(),
                quantidade_kg: qty,
                motivo: (motivo.trim() || 'NÃƒO INFORMADO').toUpperCase(),
                data: new Date().toISOString().split('T')[0],
                tipo: mode.id,
            });

            showToast(`âœ… ${mode.id === 'DESCARTE' ? 'Perda' : 'Congelamento'} registrado!`);
            setProduto('');
            setQuantidade('');
            setMotivo('');
            navigation.goBack();
        } catch (e) {
            Alert.alert('Erro', `NÃ£o foi possÃ­vel registrar o ${mode.label.toLowerCase()}.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.webContainer}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            

            {/* AMBIENT ORB */}
            <View style={[styles.ambientOrb, { backgroundColor: mode.color, top: -60, right: -40 }]} />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
                            <Ionicons name="chevron-back" size={24} color="#F8FAFC" />
                        </TouchableOpacity>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.headerTitle}>PROCESSAMENTO</Text>
                            <Text style={styles.headerSub}>PERDAS & CÃ‚MARA FRIA</Text>
                        </View>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* â”€â”€ SEGMENTED CONTROL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                        <View style={styles.segmentedControl}>
                            {MODES.map((m, idx) => {
                                const active = idx === tipoIdx;
                                return (
                                    <TouchableOpacity
                                        key={m.id}
                                        style={[
                                            styles.segmentBtn,
                                            active && {
                                                backgroundColor: m.color + '20',
                                                borderColor: m.color + '50',
                                                shadowColor: m.color,
                                                shadowOpacity: 0.4,
                                                shadowRadius: 8,
                                            },
                                        ]}
                                        onPress={() => { setTipoIdx(idx); setMotivo(''); }}
                                    >
                                        <Ionicons
                                            name={m.icon}
                                            size={16}
                                            color={active ? m.color : '#64748B'}
                                            style={{ marginRight: 6 }}
                                        />
                                        <Text style={[styles.segmentText, active && { color: '#FFF' }]}>
                                            {m.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* â”€â”€ BANNER DO MODO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                        <LinearGradient
                            colors={[mode.gradient[0] + 'CC', mode.gradient[1] + '33']}
                            style={[styles.modeBanner, { borderColor: mode.color + '30' }]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        >
                            <View style={[styles.modeIconBox, { backgroundColor: mode.color + '20', borderColor: mode.color + '40' }]}>
                                <Ionicons name={mode.icon} size={28} color={mode.color} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={[styles.modeTitle, { color: mode.color }]}>{mode.label}</Text>
                                <Text style={styles.modeSub}>{mode.subtitle}</Text>
                            </View>
                        </LinearGradient>

                        {/* â”€â”€ CARD: DADOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                        <View style={styles.glassCard}>
                            <View style={[styles.cardHeaderStrip, { backgroundColor: mode.color + '10', borderColor: mode.color + '30' }]}>
                                <MaterialCommunityIcons name="flask-outline" size={16} color={mode.color} />
                                <Text style={[styles.cardHeaderTitle, { color: mode.color }]}>DADOS DO PRODUTO</Text>
                            </View>

                            {/* Produto */}
                            <View style={styles.labelRow}>
                                <Ionicons name="cube-outline" size={14} color="#94A3B8" />
                                <Text style={styles.inputLabel}> PRODUTO</Text>
                            </View>
                            <TextInput
                                style={styles.textInput}
                                value={produto}
                                onChangeText={t => setProduto(t.toUpperCase())}
                                placeholder="EX: MORANGO, ABACAXI..."
                                placeholderTextColor="#475569"
                                autoCapitalize="characters"
                            />

                            {/* Quantidade */}
                            <View style={styles.labelRow}>
                                <Ionicons name="scale-outline" size={14} color="#94A3B8" />
                                <Text style={styles.inputLabel}> QUANTIDADE (KG) *</Text>
                            </View>
                            <View style={[styles.qtyBox, { borderColor: mode.color + '40' }]}>
                                <TextInput
                                    style={[styles.qtyInput, { color: mode.color }]}
                                    value={quantidade}
                                    onChangeText={setQuantidade}
                                    keyboardType="decimal-pad"
                                    placeholder="0.00"
                                    placeholderTextColor="#334155"
                                />
                                <Text style={[styles.qtyUnit, { color: mode.color + '80' }]}>KG</Text>
                            </View>

                            {/* Atalhos de quantidade */}
                            <View style={styles.quickBtnRow}>
                                {[5, 10, 20, 50].map(val => (
                                    <TouchableOpacity
                                        key={val}
                                        style={[styles.quickBtn, { borderColor: mode.color + '40', backgroundColor: mode.color + '0D' }]}
                                        onPress={() => setQuantidade((parseFloat(quantidade || 0) + val).toString())}
                                    >
                                        <Text style={[styles.quickBtnText, { color: mode.color }]}>+{val}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Motivo / ObservaÃ§Ã£o */}
                            <View style={[styles.labelRow, { marginTop: 8 }]}>
                                <Ionicons name="chatbox-ellipses-outline" size={14} color="#94A3B8" />
                                <Text style={styles.inputLabel}> {mode.fieldLabel}</Text>
                            </View>
                            <TextInput
                                style={[styles.textInput, { height: 100, textAlignVertical: 'top', paddingTop: 18 }]}
                                value={motivo}
                                onChangeText={t => setMotivo(t.toUpperCase())}
                                placeholder={mode.placeholder}
                                placeholderTextColor="#475569"
                                multiline
                                autoCapitalize="characters"
                            />
                        </View>

                        {/* â”€â”€ BOTÃƒO CONFIRMAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                        <TouchableOpacity
                            style={[styles.submitBtn, { shadowColor: mode.color }]}
                            onPress={handleSave}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={mode.gradient}
                                style={styles.submitGradient}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFF" size="small" />
                                ) : (
                                    <>
                                        <Ionicons
                                            name={mode.id === 'DESCARTE' ? 'trash' : 'snow'}
                                            size={20} color="#FFF"
                                        />
                                        <Text style={styles.submitText}>{mode.btnLabel}</Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    webContainer: { flex: 1, backgroundColor: '#020617' },
    ambientOrb: {
        position: 'absolute', width: 280, height: 280,
        borderRadius: 140, opacity: 0.07, zIndex: -1,
    },
    safeArea: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center' },

    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 22,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
        paddingBottom: 20,
    },
    backBtn: {
        width: 42, height: 42, borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 13, fontWeight: '900', color: '#F8FAFC', letterSpacing: 2 },
    headerSub: { fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: 1, marginTop: 4 },

    scrollContent: { paddingHorizontal: 22, paddingBottom: 60 },

    /* SEGMENTED */
    segmentedControl: {
        flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 18, padding: 6, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)', marginBottom: 22,
    },
    segmentBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', height: 48, borderRadius: 14,
        borderWidth: 1, borderColor: 'transparent',
    },
    segmentText: { fontSize: 12, fontWeight: '900', color: '#64748B', letterSpacing: 0.5 },

    /* MODE BANNER */
    modeBanner: {
        flexDirection: 'row', alignItems: 'center', borderRadius: 20,
        padding: 20, borderWidth: 1, marginBottom: 22,
    },
    modeIconBox: {
        width: 56, height: 56, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center', borderWidth: 1,
    },
    modeTitle: { fontSize: 16, fontWeight: '900', letterSpacing: 1 },
    modeSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4, fontWeight: '600' },

    /* GLASS CARD */
    glassCard: {
        backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 24,
        padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
        marginBottom: 22,
    },
    cardHeaderStrip: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 22,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
        alignSelf: 'flex-start', borderWidth: 1,
    },
    cardHeaderTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginLeft: 8 },

    /* INPUTS */
    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 6 },
    inputLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },

    textInput: {
        backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16,
        paddingHorizontal: 20, height: 60, color: '#F8FAFC',
        fontSize: 15, fontWeight: '700', marginBottom: 4,
    },

    /* QTY BOX */
    qtyBox: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1,
        borderRadius: 20, paddingHorizontal: 20, marginBottom: 14,
    },
    qtyInput: { flex: 1, height: 72, fontSize: 34, fontWeight: '900', textAlign: 'center' },
    qtyUnit: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },

    /* QUICK QTY BUTTONS */
    quickBtnRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
    quickBtn: {
        flex: 1, height: 38, borderRadius: 12, borderWidth: 1,
        justifyContent: 'center', alignItems: 'center',
    },
    quickBtnText: { fontSize: 12, fontWeight: '900' },

    /* SUBMIT */
    submitBtn: {
        borderRadius: 20, overflow: 'hidden', marginTop: 6,
        shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 15,
    },
    submitGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        height: 68, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    submitText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
});


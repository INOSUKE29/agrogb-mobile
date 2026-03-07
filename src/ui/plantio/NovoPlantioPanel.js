import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const THEME = {
    primary: '#15803D', // Green 700
    primaryLight: '#DCFCE7', // Green 100
    white: '#FFFFFF',
    textMain: '#111827',
    textSub: '#6B7280',
    border: '#E5E7EB',
    accent: '#F59E0B' // Amber for highlights
};

export default function NovoPlantioPanel({
    talhao,
    cultura,
    quantidade,
    setQuantidade,
    previsao,
    setPrevisao,
    onSelectArea,
    onSelectCultura,
    onConfirm
}) {

    // Auto-calculate prediction suggestion (simple logic)
    useEffect(() => {
        if (cultura && !previsao) {
            const today = new Date();
            // Ex: Default to 3 months ahead just as a placeholder suggestion
            today.setMonth(today.getMonth() + 3);
            const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
            setPrevisao(`${monthNames[today.getMonth()]} / ${today.getFullYear()}`);
        }
    }, [cultura]);

    const addQtd = (val) => {
        const current = parseInt(quantidade) || 0;
        setQuantidade((current + val).toString());
    };

    return (
        <View style={styles.container}>

            {/* 1. Header & Progress */}
            <View style={styles.header}>
                <View style={styles.progressRow}>
                    <StepBadge num="1" label="Área" active={!!talhao} />
                    <View style={styles.line} />
                    <StepBadge num="2" label="Cultura" active={!!cultura} />
                    <View style={styles.line} />
                    <StepBadge num="3" label="Qtd" active={!!quantidade} />
                    <View style={styles.line} />
                    <StepBadge num="4" label="Colheita" active={!!previsao} />
                </View>
            </View>

            {/* 2. Área Selection */}
            <TouchableOpacity style={styles.cardSelect} onPress={onSelectArea}>
                <View style={styles.cardImageContainer}>
                    <Image source={{ uri: 'https://img.freepik.com/free-vector/flat-farm-landscape_23-2148152342.jpg' }} style={styles.cardImage} resizeMode="cover" />
                    {/* Using a placeholder image purely for visual if real one not avail, or just icon */}
                    <View style={[styles.cardImage, { backgroundColor: '#dbeafe', position: 'absolute', alignItems: 'center', justifyContent: 'center' }]}>
                        <Ionicons name="map-outline" size={32} color="#2563EB" />
                    </View>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 15 }}>
                    <Text style={styles.cardLabel}>Área (Onde?)</Text>
                    <Text style={[styles.cardValue, !talhao && { color: '#9CA3AF' }]}>{talhao || 'Selecionar Talhão'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            {/* 3. Cultura Selection */}
            <TouchableOpacity style={styles.cardSelect} onPress={onSelectCultura}>
                <View style={styles.cardImageContainer}>
                    <View style={[styles.cardImage, { backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }]}>
                        <MaterialCommunityIcons name="sprout" size={32} color="#15803D" />
                    </View>
                </View>
                <View style={{ flex: 1, paddingHorizontal: 15 }}>
                    <Text style={styles.cardLabel}>Cultura (O que?)</Text>
                    <Text style={[styles.cardValue, !cultura && { color: '#9CA3AF' }]}>{cultura || 'Selecionar Cultura'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            {/* 4. Quantidade & Quick Buttons */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quantidade (mudas/pés)</Text>
                <View style={styles.qtdRow}>
                    <TouchableOpacity style={styles.btnMinus} onPress={() => addQtd(-100)}>
                        <Text style={styles.btnMinusTxt}>-</Text>
                    </TouchableOpacity>
                    <TextInput
                        style={styles.qtdInput}
                        value={quantidade}
                        onChangeText={setQuantidade}
                        keyboardType="numeric"
                        placeholder="0"
                    />
                    <TouchableOpacity style={styles.btnPlus} onPress={() => addQtd(100)}>
                        <Text style={styles.btnPlusTxt}>+</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.quickBtns}>
                    <QuickBtn val={100} onPress={() => addQtd(100)} />
                    <QuickBtn val={500} onPress={() => addQtd(500)} />
                    <QuickBtn val={1000} onPress={() => addQtd(1000)} />
                </View>
            </View>

            {/* 5. Previsão */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Previsão de Colheita</Text>
                <View style={styles.previsaoBox}>
                    <Ionicons name="calendar" size={20} color="#6B7280" />
                    <TextInput
                        style={styles.previsaoInput}
                        value={previsao}
                        onChangeText={setPrevisao}
                        placeholder="Mês / Ano"
                    />
                </View>
                <Text style={styles.hint}>Sugestão automática baseada no ciclo.</Text>
            </View>

            {/* 6. Summary Block */}
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>CONFIRA OS DADOS</Text>
                <SummaryRow icon="location-outline" text={talhao || '...'} />
                <SummaryRow icon="leaf-outline" text={cultura || '...'} />
                <SummaryRow icon="apps-outline" text={quantidade ? `${quantidade} unidades` : '...'} />
                <SummaryRow icon="time-outline" text={previsao || '...'} />

                {/* 7. Confirm Button */}
                <TouchableOpacity style={styles.btnConfirm} onPress={onConfirm}>
                    <MaterialCommunityIcons name="check-circle" size={24} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.btnConfirmTxt}>CONFIRMAR PLANTIO</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}

// Subcomponents
const StepBadge = ({ num, label, active }) => (
    <View style={{ alignItems: 'center', flexDirection: 'row' }}>
        <View style={[styles.badge, active ? styles.badgeActive : styles.badgeInactive]}>
            {active ? <Ionicons name="checkmark" size={10} color="#FFF" /> : <Text style={styles.badgeTxt}>{num}</Text>}
        </View>
        <Text style={[styles.stepLabel, active && { color: '#15803D', fontWeight: 'bold' }]}>{label}</Text>
    </View>
);

const QuickBtn = ({ val, onPress }) => (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress}>
        <Text style={styles.quickBtnTxt}>+ {val}</Text>
    </TouchableOpacity>
);

const SummaryRow = ({ icon, text }) => (
    <View style={styles.summaryRow}>
        <Ionicons name={icon} size={18} color={'#15803D'} style={{ width: 24 }} />
        <Text style={styles.summaryText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { padding: 20 },
    header: { marginBottom: 20 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    line: { height: 2, flex: 1, backgroundColor: '#E5E7EB', marginHorizontal: 5 },
    badge: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', marginRight: 4 },
    badgeActive: { backgroundColor: '#15803D' },
    badgeInactive: { backgroundColor: '#D1D5DB' },
    badgeTxt: { fontSize: 10, color: '#FFF', fontWeight: 'bold' },
    stepLabel: { fontSize: 10, color: '#9CA3AF' },

    cardSelect: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, padding: 12, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F3F4F6', elevation: 1 },
    cardImageContainer: { width: 50, height: 50, borderRadius: 10, overflow: 'hidden' },
    cardImage: { width: '100%', height: '100%' },
    cardLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
    cardValue: { fontSize: 16, color: '#111827', fontWeight: 'bold' },

    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
    qtdRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    qtdInput: { width: 120, textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: '#111827', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginHorizontal: 15 },
    btnMinus: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    btnMinusTxt: { fontSize: 24, color: '#4B5563', lineHeight: 26 },
    btnPlus: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
    btnPlusTxt: { fontSize: 24, color: '#15803D', lineHeight: 26 },

    quickBtns: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
    quickBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    quickBtnTxt: { fontSize: 12, fontWeight: 'bold', color: '#4B5563' },

    previsaoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12 },
    previsaoInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#111827' },
    hint: { fontSize: 11, color: '#9CA3AF', marginTop: 5 },

    summaryCard: { backgroundColor: '#F0FDF4', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#DCFCE7' },
    summaryTitle: { fontSize: 12, fontWeight: '900', color: '#6B7280', marginBottom: 15, letterSpacing: 1 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    summaryText: { fontSize: 15, color: '#374151', fontWeight: '600' },

    btnConfirm: { backgroundColor: '#15803D', padding: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 15, elevation: 3 },
    btnConfirmTxt: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});

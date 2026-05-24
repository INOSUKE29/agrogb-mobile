import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ScheduleVisitFormScreen({ route, navigation }) {
    // Pode receber clientId via rota (quando vem da lista de clientes)
    const { clientId, clientName } = route.params || {};

    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [notes, setNotes] = useState('');

    const handleSave = () => {
        if (!date || !time) {
            Alert.alert('Erro', 'Por favor, preencha a data e o horário da visita.');
            return;
        }

        // Simula o salvamento
        Alert.alert('Sucesso', 'Visita agendada com sucesso! O produtor será notificado.', [
            { text: 'OK', onPress: () => navigation.navigate('Visitas') }
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient colors={['#FF8F00', '#F57C00']} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Agendar Visita</Text>
                    <View style={{width: 40}} />
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                <View style={styles.infoCard}>
                    <Ionicons name="person-circle" size={40} color="#1565C0" />
                    <View style={styles.infoTexts}>
                        <Text style={styles.infoLabel}>Produtor Selecionado</Text>
                        <Text style={styles.infoValue}>{clientName || 'Selecione um cliente'}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
                </View>

                <Text style={styles.sectionTitle}>Data e Hora</Text>
                <View style={styles.row}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Data (DD/MM/AAAA)</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="calendar-outline" size={20} color="#64748B" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input} 
                                placeholder="Ex: 25/05/2026"
                                value={date}
                                onChangeText={setDate}
                                keyboardType="numbers-and-punctuation"
                            />
                        </View>
                    </View>
                    <View style={{width: 15}} />
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Horário</Text>
                        <View style={styles.inputWrap}>
                            <Ionicons name="time-outline" size={20} color="#64748B" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input} 
                                placeholder="Ex: 14:30"
                                value={time}
                                onChangeText={setTime}
                                keyboardType="numbers-and-punctuation"
                            />
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Motivo / Observações</Text>
                <View style={[styles.inputWrap, { height: 120, alignItems: 'flex-start', paddingTop: 10 }]}>
                    <TextInput 
                        style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
                        placeholder="Descreva o objetivo da visita técnica..."
                        value={notes}
                        onChangeText={setNotes}
                        multiline
                    />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                    <Text style={styles.saveBtnText}>Confirmar Agendamento</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingTop: Platform.OS === 'android' ? 50 : 20, paddingHorizontal: 20, paddingBottom: 25, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF' },
    
    content: { padding: 20, paddingBottom: 50 },
    
    infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, marginBottom: 25 },
    infoTexts: { flex: 1, marginLeft: 15 },
    infoLabel: { fontSize: 12, color: '#64748B', fontWeight: '700', textTransform: 'uppercase' },
    infoValue: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginTop: 2 },
    
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 10, marginTop: 10 },
    row: { flexDirection: 'row' },
    inputGroup: { flex: 1 },
    label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 15 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: '#334155' },
    
    saveBtn: { backgroundColor: '#1565C0', borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 30, elevation: 4, shadowColor: '#1565C0', shadowOpacity: 0.3, shadowRadius: 8 },
    saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});

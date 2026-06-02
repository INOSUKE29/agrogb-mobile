import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { insertMaquina, updateMaquinaRevisao } from '../database/database';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { showToast } from '../components/ui/Toast';

const TIPOS = [
    { id: 'TRATOR', label: 'Trator', icon: 'tractor' },
    { id: 'CAMINHAO', label: 'CaminhÃ£o', icon: 'truck-outline' },
    { id: 'IMPLEMENTO', label: 'Implemento', icon: 'tools' },
    { id: 'OUTRO', label: 'Outro', icon: 'car-outline' },
];

export default function MaquinaFormScreen({ navigation, route }) {
    const editItem = route.params?.editItem;

    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('TRATOR');
    const [placa, setPlaca] = useState('');
    const [horimetro, setHorimetro] = useState('');
    const [revisao, setRevisao] = useState('');

    useEffect(() => {
        if (editItem) {
            setNome(editItem.nome);
            setTipo(editItem.tipo || 'TRATOR');
            setPlaca(editItem.placa || '');
            setHorimetro(editItem.horimetro_atual?.toString() || '0');
            setRevisao(editItem.intervalo_revisao?.toString() || '250');
        }
    }, [editItem]);

    const handleSave = async () => {
        if (!nome.trim()) {
            return Alert.alert('AtenÃ§Ã£o', 'O nome da mÃ¡quina Ã© obrigatÃ³rio.');
        }

        const hNum = parseFloat(horimetro) || 0;
        const rNum = parseFloat(revisao) || 0;

        try {
            if (editItem) {
                await updateMaquinaRevisao(editItem.uuid, hNum, rNum);
                showToast('MÃ¡quina atualizada!');
            } else {
                await insertMaquina({
                    uuid: uuidv4(),
                    nome: nome.toUpperCase(),
                    tipo: tipo,
                    placa: placa.toUpperCase(),
                    horimetro_atual: hNum,
                    intervalo_revisao: rNum,
                    local_atual: 'Base Principal',
                    consumo: '0 L/h'
                });
                showToast('MÃ¡quina cadastrada com sucesso!');
            }
            navigation.goBack();
        } catch {
            Alert.alert('Erro', 'NÃ£o foi possÃ­vel salvar a mÃ¡quina.');
        }
    };

    return (
        <View style={styles.webContainer}>
            {/* O Famoso Fundo Dark Farm Esverdeado */}
            
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            <View style={styles.mobileFrame}>
                <SafeAreaView style={{ flex: 1 }}>
                    {/* CUSTOM HEADER GLASSMORPHISM */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color="#D1FAE5" />
                        </TouchableOpacity>
                        <View style={{alignItems: 'center'}}>
                            <Text style={styles.headerTitle}>{editItem ? 'Editar MÃ¡quina' : 'Nova MÃ¡quina'}</Text>
                            <Text style={styles.headerSub}>Cadastro de Frota</Text>
                        </View>
                        <View style={{width: 40}} /> {/* Spacer pra centralizar */}
                    </View>
                    
                     <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                        
                        {/* AMBIENT ORBS */}
                        <View style={[styles.orb, { top: 100, right: -50, backgroundColor: '#10B981', opacity: 0.15 }]} />
                        <View style={[styles.orb, { bottom: 100, left: -60, backgroundColor: '#3B82F6', opacity: 0.1 }]} />

                        {/* PAINEL DE VIDRO (GLASSMORPHISM CARD) */}
                        <View intensity={30} tint="dark" style={styles.glassCard}>
                            
                            {/* NOME / IDENTIFICAÃ‡ÃƒO */}
                            <Text style={styles.label}>NOME / IDENTIFICAÃ‡ÃƒO *</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="pencil-outline" size={18} color="#34D399" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.glassInput}
                                    placeholder="Ex: TRATOR JOHN DEERE 6125"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={nome}
                                    onChangeText={setNome}
                                />
                            </View>

                            {/* GRID DE TIPOS (ESTILO NEO-BRUTALISM DARK) */}
                            <Text style={styles.label}>TIPO DE VEÃCULO</Text>
                            <View style={styles.tipoGrid}>
                                {TIPOS.map((t) => {
                                    const isActive = tipo === t.id;
                                    return (
                                        <TouchableOpacity
                                            key={t.id}
                                            style={[
                                                styles.tipoItem,
                                                isActive && styles.tipoItemActive
                                            ]}
                                            onPress={() => setTipo(t.id)}
                                            activeOpacity={0.7}
                                        >
                                            {isActive && (
                                                <View style={styles.activeBadge}>
                                                    <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                                                </View>
                                            )}
                                            <View style={[styles.iconWrapper, isActive && styles.iconWrapperActive]}>
                                                <MaterialCommunityIcons 
                                                    name={t.icon} 
                                                    size={32} 
                                                    color={isActive ? '#34D399' : 'rgba(255,255,255,0.4)'} 
                                                />
                                            </View>
                                            <Text style={[styles.tipoLabel, isActive && styles.tipoLabelActive]}>
                                                {t.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* PLACA */}
                            <Text style={styles.label}>PLACA / CHASSI (OPCIONAL)</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="barcode-outline" size={18} color="#34D399" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.glassInput}
                                    placeholder="ABC-1234"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    value={placa}
                                    onChangeText={setPlaca}
                                    autoCapitalize="characters"
                                />
                            </View>

                            {/* METRICS ROW */}
                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>HORÃMETRO / KM</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="speedometer-outline" size={18} color="#34D399" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.glassInput}
                                            placeholder="0"
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            value={horimetro}
                                            onChangeText={setHorimetro}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>REVISÃƒO (H/KM)</Text>
                                    <View style={styles.inputWrapper}>
                                        <Ionicons name="build-outline" size={18} color="#34D399" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.glassInput}
                                            placeholder="250"
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            value={revisao}
                                            onChangeText={setRevisao}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* BOTÃƒO ESTILO CÃPSULA (GLOW GREEN) */}
                            <TouchableOpacity style={styles.glowSubmitBtn} onPress={handleSave} activeOpacity={0.8}>
                                <LinearGradient colors={['#10B981', '#059669', '#064E3B']} start={{x:0, y:0}} end={{x:1, y:1}} style={styles.btnGradient}>
                                    <Text style={styles.submitBtnText}>{editItem ? 'SALVAR ALTERAÃ‡Ã•ES' : 'CADASTRAR MÃQUINA'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                        </View>
                    </ScrollView>
                </SafeAreaView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    webContainer: { flex: 1, alignItems: 'center', backgroundColor: '#000' },
    mobileFrame: { flex: 1, width: '100%', maxWidth: 480, position: 'relative' },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20, paddingBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
    headerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

    scroll: { padding: 20, paddingBottom: 50 },
    
    glassCard: { 
        backgroundColor: 'rgba(255, 255, 255, 0.03)', 
        borderRadius: 30, 
        padding: 24, 
        borderWidth: 1, 
        borderColor: 'rgba(255,255,255,0.12)',
        overflow: 'hidden'
    },
    
    orb: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        shadowColor: '#10B981', shadowRadius: 30, shadowOpacity: 0.1
    },

    label: { 
        fontSize: 11, 
        fontWeight: '900', 
        letterSpacing: 1.5, 
        color: '#A7F3D0', 
        marginBottom: 10, 
        marginTop: 22,
        opacity: 0.9
    },
    
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0B151F',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 16,
    },
    inputIcon: { marginRight: 12 },
    glassInput: {
        flex: 1,
        paddingVertical: 15,
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600'
    },

    tipoGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
    tipoItem: { 
        width: '48%', 
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingVertical: 20, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 10,
        position: 'relative'
    },
    tipoItemActive: {
        borderColor: '#34D399', 
        backgroundColor: 'rgba(52, 211, 153, 0.08)',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10
    },
    activeBadge: {
        position: 'absolute',
        top: 10,
        right: 12,
        zIndex: 10
    },
    iconWrapper: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(255,255,255,0.03)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    iconWrapperActive: {
        backgroundColor: 'rgba(52, 211, 153, 0.12)',
        borderColor: 'rgba(52, 211, 153, 0.4)',
    },
    tipoLabel: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.5)' },
    tipoLabelActive: { color: '#FFF' },

    row: { flexDirection: 'row', gap: 15 },

    glowSubmitBtn: {
        borderRadius: 18,
        marginTop: 40,
        overflow: 'hidden',
        elevation: 12,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 15,
    },
    btnGradient: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4
    }
});


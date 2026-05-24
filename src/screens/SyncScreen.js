import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { getAppSettings, updateAppSetting } from '../database/database';
import ScreenHeader from '../ui/ScreenHeader';
import FundoAnimado from '../components/FundoAnimado';
import { showToast } from '../ui/Toast';

export default function SyncScreen({ navigation }) {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    const [settings, setSettings] = useState({});

    useEffect(() => { loadSettings(); }, []);

    const loadSettings = async () => {
        const data = await getAppSettings();
        if (data) setSettings(data);
    };

    const handleUpdateSetting = async (key, val) => {
        setSettings(prev => ({ ...prev, [key]: val }));
        await updateAppSetting(key, val);
    };

    const ControlItem = ({ icon, label, description, onPress, color = '#10B981' }) => (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.item}>
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.desc}>{description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
        </TouchableOpacity>
    );

    return (
        <FundoAnimado>
            <StatusBar barStyle="light-content" />
            <ScreenHeader title="PAINEL DE CONTROLE" onBack={() => navigation.goBack()} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                
                {/* ðŸ›° STATUS HEADER PREMIUM */}
                <LinearGradient colors={['rgba(16, 185, 129, 0.1)', 'transparent']} style={styles.statusHeader}>
                    <View style={styles.statusRow}>
                        <View>
                            <Text style={styles.statusTitle}>SISTEMA AGROGB</Text>
                            <Text style={styles.statusSub}>VersÃ£o 2026.04 â€¢ Diamante</Text>
                        </View>
                        <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusBadgeTxt}>ONLINE</Text>
                        </View>
                    </View>
                </LinearGradient>

                <Text style={styles.secTitle}>CONFIGURAÃ‡Ã•ES GERAIS</Text>
                <View style={styles.card}>
                    <ControlItem icon="business" label="Minha Fazenda" description="Ajustar nome, CNPJ e dados" onPress={() => setActiveModal('FAZENDA')} />
                    <View style={styles.line} />
                    <ControlItem icon="color-palette" label="Visual & Tema" description="Cores e modo de exibiÃ§Ã£o" color="#8B5CF6" onPress={() => setActiveModal('TEMA')} />
                    <View style={styles.line} />
                    <ControlItem icon="cloud-download" label="Atualizar Telas" description="Puxar melhorias automÃ¡ticas" color="#3B82F6" onPress={() => Alert.alert('Check', 'Buscando atualizaÃ§Ãµes...')} />
                </View>

                <Text style={styles.secTitle}>SEGURANÃ‡A & DADOS</Text>
                <View style={styles.card}>
                    <ControlItem icon="sync" label="Sincronizar Agora" description="Enviar dados para nuvem" color="#10B981" onPress={() => showToast('Iniciando sincronizaÃ§Ã£o...')} />
                    <View style={styles.line} />
                    <ControlItem icon="shield-checkmark" label="Backup Total" description="XLSX e Nuvem unificados" color="#FBBF24" onPress={() => showToast('Gerando backup seguro...')} />
                    <View style={styles.line} />
                    <ControlItem icon="trash-outline" label="ManutenÃ§Ã£o" description="Limpar cache e otimizar" color="#EF4444" onPress={() => Alert.alert('Aviso', 'Isso irÃ¡ reiniciar o app.')} />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerTxt}>AgroGB Tecnologia â€¢ Todos os direitos reservados</Text>
                </View>
            </ScrollView>

            {/* MODAL FAZENDA SIMPLE & CLEAN */}
            <Modal visible={activeModal === 'FAZENDA'} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View intensity={90} tint="dark" style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Dados da Propriedade</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)}><Ionicons name="close" size={24} color="#FFF" /></TouchableOpacity>
                        </View>
                        <TextInput 
                            style={styles.input} 
                            placeholder="NOME DA FAZENDA" 
                            placeholderTextColor="rgba(255,255,255,0.3)" 
                            value={settings.fazenda_nome} 
                            onChangeText={t => handleUpdateSetting('fazenda_nome', t)}
                        />
                        <TouchableOpacity style={styles.saveBtn} onPress={() => setActiveModal(null)}>
                            <LinearGradient colors={['#10B981', '#059669']} style={styles.saveGrad}>
                                <Text style={styles.saveTxt}>SALVAR ALTERAÃ‡Ã•ES</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </FundoAnimado>
    );
}

const styles = StyleSheet.create({
    scroll: { padding: 20, paddingBottom: 100 },
    statusHeader: { borderRadius: 30, padding: 25, marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    statusTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
    statusSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
    statusBadgeTxt: { color: '#10B981', fontSize: 10, fontWeight: 'bold' },

    secTitle: { fontSize: 11, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 15, marginLeft: 10 },
    card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 28, padding: 10, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    item: { flexDirection: 'row', alignItems: 'center', padding: 15 },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    label: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    desc: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
    line: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 15 },

    footer: { marginTop: 40, alignItems: 'center' },
    footerTxt: { color: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 'bold' },

    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 30, paddingBottom: 50 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
    input: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: 18, color: '#FFF', fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    saveBtn: { borderRadius: 20, overflow: 'hidden' },
    saveGrad: { height: 64, justifyContent: 'center', alignItems: 'center' },
    saveTxt: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 }
});


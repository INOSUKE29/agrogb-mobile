import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeQuery, getAppSettings, updateAppSetting } from '../database/database';

// Design System
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const { width } = Dimensions.get('window');
const BIO_KEY = 'agrogb_biometric_credentials';

export default function SyncScreen({ navigation }) {
    const { theme, saveTheme } = useTheme();
    const [userLevel, setUserLevel] = useState('USUARIO');
    const [settings, setSettings] = useState({});
    const [isBioEnabled, setIsBioEnabled] = useState(false);
    const [hasBioHardware, setHasBioHardware] = useState(false);

    // Modais Visibilidade
    const [activeModal, setActiveModal] = useState(null); // 'prop', 'theme', 'fin', 'clima', 'rel', 'media', 'lixeira', 'bio'
    const [lixeiraCount, setLixeiraCount] = useState(0);

    useEffect(() => {
        verificarNivelAcesso();
        loadSettings();
        countLixeira();
        checkBiometrics();
    }, []);

    const checkBiometrics = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        setHasBioHardware(compatible);
        const bio = await SecureStore.getItemAsync(BIO_KEY);
        setIsBioEnabled(!!bio);
    };

    const countLixeira = async () => {
        try {
            let total = 0;
            const tabelas = ['vendas', 'compras', 'colheitas', 'custos', 'talhoes', 'fornecedores', 'irrigacao'];
            for (const t of tabelas) {
                const res = await executeQuery(`SELECT COUNT(*) as c FROM ${t} WHERE is_deleted = 1`);
                total += res.rows.item(0).c;
            }
            setLixeiraCount(total);
        } catch (e) { }
    };

    const loadSettings = async () => {
        try {
            const data = await getAppSettings();
            if (data) setSettings(data);
        } catch (e) { }
    };

    const verificarNivelAcesso = async () => {
        try {
            const json = await AsyncStorage.getItem('user_session');
            if (json) {
                const session = JSON.parse(json);
                const res = await executeQuery('SELECT nivel FROM usuarios WHERE id = ?', [session.id]);
                if (res.rows.length > 0) setUserLevel(res.rows.item(0).nivel);
            }
        } catch (e) { }
    };

    const isAdmin = userLevel === 'ADM';

    const SettingItem = ({ icon, label, description, onPress, adminOnly, danger }) => {
        if (adminOnly && !isAdmin) return null;
        return (
            <Card style={[styles.optionCard, danger && styles.dangerCard]} noPadding onPress={onPress}>
                <View style={styles.cardInner}>
                    <View style={[styles.iconContainer, { backgroundColor: danger ? '#FEF2F2' : (theme?.colors?.primary || '#10B981') + '15' }]}>
                        <Ionicons name={icon} size={22} color={danger ? '#EF4444' : (theme?.colors?.primary || '#10B981')} />
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={[styles.cardTitle, danger && { color: '#B91C1C' }]}>{label}</Text>
                        <Text style={styles.cardDesc}>{description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={danger ? '#FCA5A5' : '#D1D5DB'} />
                </View>
            </Card>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme?.colors?.bg || '#F3F4F6' }]}>
            <LinearGradient colors={[theme?.colors?.primary || '#10B981', '#059669']} style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>CONFIGURAÇÕES</Text>
                    <TouchableOpacity onPress={() => Alert.alert('AgroGB', 'v2.4.0 Premium Enterprise')}>
                        <Ionicons name="information-circle-outline" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerSub}>Controle total da sua operação digital</Text>
            </LinearGradient>

            <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                <Text style={styles.sectionTitle}>SISTEMA & PREFERÊNCIAS</Text>
                <SettingItem icon="business-outline" label="Propriedade" description="Dados fiscais e identidade" onPress={() => setActiveModal('prop')} />
                <SettingItem icon="color-palette-outline" label="Personalização" description="Cores e temas visuais" onPress={() => setActiveModal('theme')} />
                <SettingItem icon="wallet-outline" label="Financeiro" description="Moeda e metas de lucro" onPress={() => setActiveModal('fin')} />
                <SettingItem 
                    icon="finger-print-outline" 
                    label="Segurança Biométrica" 
                    description={isBioEnabled ? "Ativado para login rápido" : "Desativado"} 
                    onPress={() => setActiveModal('bio')} 
                />

                <Text style={styles.sectionTitle}>MOTOR DA PLATAFORMA</Text>
                <SettingItem icon="cloudy-night-outline" label="Clima & Geolocalização" description="APIs e serviços ambientais" onPress={() => setActiveModal('clima')} />
                <SettingItem icon="document-text-outline" label="Relatórios PDF" description="Layouts e assinaturas" onPress={() => setActiveModal('rel')} />
                <SettingItem icon="image-outline" label="Mídia & Fotos" description="Qualidade e armazenamento" onPress={() => setActiveModal('media')} />
                <SettingItem icon="sync-outline" label="Cloud & Backup" description="Sincronização Agrogb Cloud" onPress={() => Alert.alert('Premium', 'Módulo de Nuvem Ativo.')} />

                {isAdmin && (
                    <>
                        <Text style={styles.sectionTitle}>ADMINISTRAÇÃO</Text>
                        <SettingItem icon="people-outline" label="Colaboradores" description="Gestão de equipe e acessos" onPress={() => navigation.navigate('Usuarios')} />
                        <SettingItem icon="trash-bin-outline" label="Lixeira" description={`${lixeiraCount} itens para exclusão`} onPress={() => { countLixeira(); setActiveModal('lixeira'); }} />
                        <SettingItem icon="warning-outline" label="Manutenção" description="Limpeza de banco e logs" danger onPress={() => {
                            Alert.alert('Cuidado!', 'Deseja otimizar o banco de dados? Isso não apaga seus dados.', [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Otimizar Agora', onPress: () => Alert.alert('Sucesso', 'Banco de dados otimizado.') }
                            ]);
                        }} />
                    </>
                )}
            </ScrollView>

            {/* MODAL 1: PROPRIEDADE */}
            <Modal visible={activeModal === 'prop'} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>DADOS DA PROPRIEDADE</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <AgroInput label="NOME DA FAZENDA" value={settings.fazenda_nome || ''} onChangeText={(t) => setSettings({ ...settings, fazenda_nome: t })} />
                            <AgroInput label="PRODUTOR / RAZÃO SOCIAL" value={settings.fazenda_produtor || ''} onChangeText={(t) => setSettings({ ...settings, fazenda_produtor: t })} />
                            <AgroInput label="CPF / CNPJ" value={settings.fazenda_documento || ''} keyboardType="numeric" onChangeText={(t) => setSettings({ ...settings, fazenda_documento: t })} />
                            <View style={styles.row}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <AgroInput label="TELEFONE" value={settings.fazenda_telefone || ''} keyboardType="phone-pad" onChangeText={(t) => setSettings({ ...settings, fazenda_telefone: t })} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <AgroInput label="EMAIL" value={settings.fazenda_email || ''} keyboardType="email-address" autoCapitalize="none" onChangeText={(t) => setSettings({ ...settings, fazenda_email: t })} />
                                </View>
                            </View>
                            <AgroButton title="SALVAR ALTERAÇÕES" onPress={async () => {
                                await updateAppSetting('fazenda_nome', settings.fazenda_nome);
                                await updateAppSetting('fazenda_produtor', settings.fazenda_produtor);
                                await updateAppSetting('fazenda_documento', settings.fazenda_documento);
                                await updateAppSetting('fazenda_telefone', settings.fazenda_telefone);
                                await updateAppSetting('fazenda_email', settings.fazenda_email);
                                Alert.alert('Sucesso', 'Dados atualizados!');
                                setActiveModal(null);
                            }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL 2: TEMA */}
            <Modal visible={activeModal === 'theme'} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalContent, { height: '60%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>APARÊNCIA</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.inputLabel}>COR PRIMÁRIA DO SISTEMA</Text>
                        <View style={styles.colorGrid}>
                            {['#10B981', '#059669', '#2563EB', '#D97706', '#7C3AED', '#1F2937'].map(c => (
                                <TouchableOpacity 
                                    key={c} 
                                    style={[styles.colorOption, { backgroundColor: c }, theme.primary_color === c && styles.colorSelected]} 
                                    onPress={() => saveTheme(null, c)}
                                >
                                    {theme.primary_color === c && <Ionicons name="checkmark" size={20} color="#FFF" />}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.inputLabel}>MODO DE EXIBIÇÃO</Text>
                        <View style={styles.modeRow}>
                            {[
                                { id: 'light', icon: 'sunny-outline', label: 'CLARO' },
                                { id: 'dark', icon: 'moon-outline', label: 'ESCURO' },
                                { id: 'system', icon: 'phone-portrait-outline', label: 'SISTEMA' }
                            ].map(m => (
                                <TouchableOpacity 
                                    key={m.id} 
                                    style={[styles.modeBtn, theme?.theme_mode === m.id && { borderColor: theme?.colors?.primary || '#10B981', backgroundColor: (theme?.colors?.primary || '#10B981') + '10' }]}
                                    onPress={() => saveTheme(m.id, null)}
                                >
                                    <Ionicons name={m.icon} size={20} color={theme?.theme_mode === m.id ? (theme?.colors?.primary || '#10B981') : '#9CA3AF'} />
                                    <Text style={[styles.modeText, theme?.theme_mode === m.id && { color: theme?.colors?.primary || '#10B981' }]}>{m.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL 3: FINANCEIRO */}
            <Modal visible={activeModal === 'fin'} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalContent, { height: '60%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>REGRAS FINANCEIRAS</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <AgroInput label="MOEDA" value={settings.fin_moeda || 'R$'} maxLength={3} onChangeText={(t) => setSettings({ ...settings, fin_moeda: t })} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AgroInput label="COTAÇÃO USD" value={String(settings.usd_rate || 5.0)} keyboardType="numeric" onChangeText={(t) => setSettings({ ...settings, usd_rate: parseFloat(t) || 5.0 })} />
                            </View>
                        </View>
                        <AgroInput label="MÊS FISCAL" value={String(settings.fin_mes_fiscal || 1)} keyboardType="numeric" maxLength={2} onChangeText={(t) => setSettings({ ...settings, fin_mes_fiscal: parseInt(t) || 1 })} />
                        <AgroInput label="META DE LUCRO MENSAL" value={settings.fin_meta_lucro ? String(settings.fin_meta_lucro) : ''} keyboardType="numeric" placeholder="0.00" onChangeText={(t) => setSettings({ ...settings, fin_meta_lucro: t })} />
                        
                        <TouchableOpacity 
                            style={styles.toggleRow} 
                            onPress={() => setSettings({ ...settings, fin_calc_margem: settings.fin_calc_margem ? 0 : 1 })}
                        >
                            <Text style={styles.toggleLabel}>Cálculo Automático de Margem</Text>
                            <Ionicons name={settings.fin_calc_margem ? "checkbox" : "square-outline"} size={24} color={theme?.colors?.primary || '#10B981'} />
                        </TouchableOpacity>

                        <AgroButton title="SALVAR REGRAS" onPress={async () => {
                            await updateAppSetting('fin_moeda', settings.fin_moeda);
                            await updateAppSetting('fin_mes_fiscal', settings.fin_mes_fiscal);
                            await updateAppSetting('fin_meta_lucro', settings.fin_meta_lucro);
                            await updateAppSetting('fin_calc_margem', settings.fin_calc_margem);
                            await updateAppSetting('usd_rate', settings.usd_rate);
                            Alert.alert('Sucesso', 'Regras financeiras salvas.');
                            setActiveModal(null);
                        }} />
                    </View>
                </View>
            </Modal>

            {/* MODAL LIXEIRA */}
            <Modal visible={activeModal === 'lixeira'} animationType="fade" transparent>
                <View style={styles.overlayCenter}>
                    <Card style={styles.lixeiraCard}>
                        <View style={styles.lixeiraIcon}>
                            <Ionicons name="trash-bin" size={40} color="#EF4444" />
                        </View>
                        <Text style={styles.lixeiraTitle}>{lixeiraCount} Itens na Lixeira</Text>
                        <Text style={styles.lixeiraDesc}>Estes itens foram marcados para exclusão mas ainda ocupam espaço no dispositivo.</Text>
                        
                        <View style={styles.actionRow}>
                            <AgroButton 
                                title="ESVAZIAR" 
                                onPress={async () => {
                                    const tabelas = ['vendas', 'compras', 'colheitas', 'custos', 'talhoes', 'fornecedores', 'irrigacao'];
                                    for (const t of tabelas) { await executeQuery(`DELETE FROM ${t} WHERE is_deleted = 1`); }
                                    countLixeira();
                                    Alert.alert('Sucesso', 'Lixeira limpa!');
                                    setActiveModal(null);
                                }} 
                                style={{ flex: 1 }}
                            />
                            <AgroButton 
                                title="FECHAR" 
                                variant="secondary" 
                                onPress={() => setActiveModal(null)} 
                                style={{ flex: 1, marginLeft: 10 }}
                            />
                        </View>
                    </Card>
                </View>
            </Modal>
            {/* MODAL BIOMETRIA */}
            <Modal visible={activeModal === 'bio'} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalContent, { height: '50%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SEGURANÇA BIOMÉTRICA</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={{ alignItems: 'center', marginVertical: 20 }}>
                            <View style={[styles.lixeiraIcon, { backgroundColor: isBioEnabled ? '#D1FAE5' : '#F3F4F6' }]}>
                                <Ionicons name="finger-print" size={40} color={isBioEnabled ? '#10B981' : '#9CA3AF'} />
                            </View>
                            <Text style={styles.lixeiraTitle}>{isBioEnabled ? 'BIOMETRIA ATIVA' : 'BIOMETRIA DESATIVADA'}</Text>
                            <Text style={styles.lixeiraDesc}>
                                {hasBioHardware 
                                    ? "Ao ativar, você poderá entrar no app apenas com sua digital ou Face ID, sem precisar digitar sua senha."
                                    : "Seu dispositivo não possui suporte a hardware biométrico compatível."}
                            </Text>
                        </View>

                        {hasBioHardware && (
                            <AgroButton 
                                title={isBioEnabled ? "DESATIVAR BIOMETRIA" : "ATIVAR BIOMETRIA"} 
                                variant={isBioEnabled ? "secondary" : "primary"}
                                onPress={async () => {
                                    if (isBioEnabled) {
                                        await SecureStore.deleteItemAsync(BIO_KEY);
                                        setIsBioEnabled(false);
                                        Alert.alert('Sucesso', 'Biometria desativada. Use sua senha no próximo login.');
                                        setActiveModal(null);
                                    } else {
                                        Alert.alert('Atenção', 'Para ativar a biometria, você deve sair e realizar um login manual com a opção de salvar biometria ativa.');
                                        setActiveModal(null);
                                    }
                                }}
                            />
                        )}
                    </View>
                </View>
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
    body: { padding: 20 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 15, marginTop: 10 },
    optionCard: { marginBottom: 12 },
    cardInner: { padding: 15, flexDirection: 'row', alignItems: 'center' },
    iconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: '#1F2937' },
    cardDesc: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '600' },
    dangerCard: { borderColor: '#FECACA', borderWidth: 1 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '85%', padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 16, fontWeight: '900', color: '#1F2937' },
    closeBtn: { backgroundColor: '#F3F4F6', padding: 8, borderRadius: 12 },
    inputLabel: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', marginTop: 20, marginBottom: 10, letterSpacing: 1 },
    row: { flexDirection: 'row' },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 10 },
    colorOption: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'transparent' },
    colorSelected: { borderColor: '#FFF', elevation: 5 },
    modeRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    modeBtn: { flex: 1, padding: 15, borderRadius: 15, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
    modeText: { fontSize: 9, fontWeight: '900', marginTop: 5, color: '#9CA3AF' },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, backgroundColor: '#F9FAFB', borderRadius: 15, marginVertical: 20 },
    toggleLabel: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 25 },
    lixeiraCard: { padding: 25, alignItems: 'center' },
    lixeiraIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    lixeiraTitle: { fontSize: 18, fontWeight: '900', color: '#1F2937' },
    lixeiraDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 10, lineHeight: 20 },
    actionRow: { flexDirection: 'row', marginTop: 25, width: '100%' }
});

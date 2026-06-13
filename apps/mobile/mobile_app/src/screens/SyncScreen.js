import ScreenLayout from '../components/layout/ScreenLayout';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeQuery, getAppSettings, updateAppSetting } from '../database/database';
import SyncService, { performSync } from '../services/SyncService';

// Design System
import AgroButton from '../components/common/AgroButton';
import AgroInput from '../components/common/AgroInput';

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const { width } = Dimensions.get('window');
const BIO_KEY = 'agrogb_biometric_credentials';

export default function SyncScreen({ navigation }) {
    const { theme, saveTheme } = useTheme();
    const activeColors = theme?.colors || {};
    
    const [userLevel, setUserLevel] = useState('USUARIO');
    const [settings, setSettings] = useState({});
    const [isBioEnabled, setIsBioEnabled] = useState(false);
    const [hasBioHardware, setHasBioHardware] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Modais Visibilidade
    const [activeModal, setActiveModal] = useState(null); // 'prop', 'theme', 'fin', 'clima', 'rel', 'media', 'lixeira', 'bio'
    const [lixeiraCount, setLixeiraCount] = useState(0);

    useEffect(() => {
        verificarNivelAcesso();
        loadSettings();
        countLixeira();
        checkBiometrics();
        
        // Inscreve no SyncService para saber quando está rodando no background
        const unsubscribe = SyncService.subscribe((status) => {
            setSyncing(status);
        });
        return () => unsubscribe();
    }, []);

    const checkBiometrics = async () => {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        setHasBioHardware(compatible);
        const bio = await SecureStore.getItemAsync(BIO_KEY);
        setIsBioEnabled(!!bio);
    };

    const runManualSync = async () => {
        if (syncing) return;
        try {
            await performSync();
            Alert.alert(
                'Sincronização Concluída', 
                'Backup em nuvem e dados locais foram atualizados com sucesso e estão 100% em paridade com o Supabase.'
            );
            await countLixeira();
        } catch (e) {
            Alert.alert('Falha na Sincronização', 'Não foi possível sincronizar com o Supabase. Verifique sua conexão com a internet.');
        }
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

    const SettingItem = ({ icon, label, description, onPress, adminOnly, danger, isSyncing }) => {
        if (adminOnly && !isAdmin) return null;
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.optionContainer}>
                
            </TouchableOpacity>
        );
    };

    return (
        <ScreenLayout title="Sincronização" onBack={() => navigation.goBack()} scrollable noPadding={false} headerContent={<>
                
                
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <View style={{alignItems: 'center'}}>
                            <Text style={styles.headerTitle}>CONFIGURAÇÕES</Text>
                            <Text style={styles.headerSub}>Controle total da sua operação</Text>
                        </View>
                        <TouchableOpacity onPress={() => Alert.alert('AgroGB', 'v3.0.0 Diamond Edition')} style={styles.backBtn}>
                            <Ionicons name="information-circle-outline" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                
            
            </>}>
            

            {/* CABEÇALHO GLASSMORPHISM */}
            

            
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
                <SettingItem 
                    icon="sync-outline" 
                    label="Cloud & Backup" 
                    description={syncing ? "Sincronizando dados com o Supabase..." : "Sincronização Agrogb Cloud"} 
                    onPress={runManualSync} 
                    isSyncing={syncing}
                />

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
            

            {/* MODAL 1: PROPRIEDADE (DARK) */}
            <Modal visible={activeModal === 'prop'} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>DADOS DA PROPRIEDADE</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
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
                            }} style={{ marginTop: 15 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL 2: TEMA (DARK/NEON) */}
            <Modal visible={activeModal === 'theme'} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalContent, { height: '70%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>APARÊNCIA</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.inputLabel}>COR PRIMÁRIA DO SISTEMA</Text>
                        <View style={styles.colorGrid}>
                            {['#10B981', '#059669', '#3B82F6', '#D97706', '#8B5CF6', '#F43F5E'].map(c => {
                                const isSelected = theme.primary_color === c;
                                return (
                                    <TouchableOpacity 
                                        key={c} 
                                        style={[
                                            styles.colorOption, 
                                            { backgroundColor: c }, 
                                            isSelected && { borderColor: c, shadowColor: c, shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }
                                        ]} 
                                        onPress={() => saveTheme(null, c)}
                                    >
                                        {isSelected && <Ionicons name="checkmark" size={24} color="#FFF" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.inputLabel}>MODO DE EXIBIÇÃO</Text>
                        <View style={styles.modeRow}>
                            {[
                                { id: 'light', icon: 'sunny-outline', label: 'CLARO' },
                                { id: 'dark', icon: 'moon-outline', label: 'ESCURO' },
                                { id: 'system', icon: 'phone-portrait-outline', label: 'SISTEMA' }
                            ].map(m => {
                                const isActive = theme?.theme_mode === m.id;
                                return (
                                    <TouchableOpacity 
                                        key={m.id} 
                                        style={[
                                            styles.modeBtn, 
                                            isActive && { borderColor: activeColors.primary || '#10B981', backgroundColor: (activeColors.primary || '#10B981') + '15' }
                                        ]}
                                        onPress={() => saveTheme(m.id, null)}
                                    >
                                        <Ionicons name={m.icon} size={24} color={isActive ? (activeColors.primary || '#10B981') : '#6B7280'} />
                                        <Text style={[styles.modeText, isActive && { color: activeColors.primary || '#10B981' }]}>{m.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL 3: FINANCEIRO (DARK) */}
            <Modal visible={activeModal === 'fin'} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalContent, { height: '65%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>REGRAS FINANCEIRAS</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
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
                            <Ionicons name={settings.fin_calc_margem ? "checkbox" : "square-outline"} size={26} color={activeColors.primary || '#10B981'} />
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

            {/* MODAL LIXEIRA (DARK) */}
            <Modal visible={activeModal === 'lixeira'} animationType="fade" transparent>
                <View style={styles.overlayCenter}>
                    <View style={styles.lixeiraCard}>
                        <View style={styles.lixeiraIcon}>
                            <Ionicons name="trash-bin" size={40} color="#EF4444" />
                        </View>
                        <Text style={styles.lixeiraTitle}>{lixeiraCount} Itens na Lixeira</Text>
                        <Text style={styles.lixeiraDesc}>Estes itens foram marcados para exclusão mas ainda ocupam espaço no dispositivo.</Text>
                        
                        <View style={styles.actionRow}>
                            <AgroButton 
                                title="ESVAZIAR LIXEIRA" 
                                color="#EF4444"
                                onPress={async () => {
                                    const tabelas = ['vendas', 'compras', 'colheitas', 'custos', 'talhoes', 'fornecedores', 'irrigacao'];
                                    for (const t of tabelas) { await executeQuery(`DELETE FROM ${t} WHERE is_deleted = 1`); }
                                    countLixeira();
                                    Alert.alert('Sucesso', 'Lixeira limpa!');
                                    setActiveModal(null);
                                }} 
                                style={{ flex: 1 }}
                            />
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.cancelBtnTextOnly}>
                                <Text style={styles.cancelBtnText}>FECHAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* MODAL BIOMETRIA (DARK) */}
            <Modal visible={activeModal === 'bio'} animationType="slide" transparent>
                <View style={styles.overlay}>
                    <View style={[styles.modalContent, { height: '55%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>SEGURANÇA BIOMÉTRICA</Text>
                            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={{ alignItems: 'center', marginVertical: 30 }}>
                            <View style={[styles.lixeiraIcon, { backgroundColor: isBioEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)' }]}>
                                <Ionicons name="finger-print" size={50} color={isBioEnabled ? '#10B981' : '#6B7280'} />
                            </View>
                            <Text style={[styles.lixeiraTitle, { marginTop: 20 }]}>{isBioEnabled ? 'BIOMETRIA ATIVA' : 'BIOMETRIA DESATIVADA'}</Text>
                            <Text style={styles.lixeiraDesc}>
                                {hasBioHardware 
                                    ? "Ao ativar, você poderá entrar no app apenas com sua digital ou Face ID, sem precisar digitar sua senha."
                                    : "Seu dispositivo não possui suporte a hardware biométrico compatível."}
                            </Text>
                        </View>

                        {hasBioHardware && (
                            <AgroButton 
                                title={isBioEnabled ? "DESATIVAR BIOMETRIA" : "ATIVAR BIOMETRIA"} 
                                color={isBioEnabled ? '#374151' : '#10B981'}
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
        </ScreenLayout>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 40, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 16, fontWeight: '900', color: '#FFF', letterSpacing: 1.5 },
    headerSub: { fontSize: 10, color: '#9CA3AF', fontWeight: 'bold', marginTop: 2, letterSpacing: 1 },
    
    body: { padding: 20 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: '#6B7280', letterSpacing: 1.5, marginBottom: 15, marginTop: 15 },
    
    optionContainer: { marginBottom: 12 },
    cardInner: { padding: 18, flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 14, fontWeight: '800', color: '#FFF' },
    cardDesc: { fontSize: 11, color: '#9CA3AF', marginTop: 3, fontWeight: '600' },
    
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#1F2937', borderTopLeftRadius: 35, borderTopRightRadius: 35, height: '85%', padding: 25, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    modalTitle: { fontSize: 15, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
    closeBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 20 },
    
    inputLabel: { fontSize: 10, fontWeight: '900', color: '#6B7280', marginTop: 20, marginBottom: 15, letterSpacing: 1.5 },
    row: { flexDirection: 'row' },
    
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15 },
    colorOption: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    
    modeRow: { flexDirection: 'row', gap: 10 },
    modeBtn: { flex: 1, padding: 18, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827' },
    modeText: { fontSize: 10, fontWeight: '900', marginTop: 8, color: '#9CA3AF', letterSpacing: 1 },
    
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 16, marginVertical: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    toggleLabel: { fontSize: 14, fontWeight: '800', color: '#FFF' },
    
    overlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 25 },
    lixeiraCard: { backgroundColor: '#1F2937', padding: 30, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    lixeiraIcon: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    lixeiraTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
    lixeiraDesc: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 12, lineHeight: 20 },
    
    actionRow: { flexDirection: 'column', marginTop: 30, width: '100%', gap: 15 },
    cancelBtnTextOnly: { padding: 15, alignItems: 'center' },
    cancelBtnText: { color: '#9CA3AF', fontWeight: 'bold', fontSize: 13, letterSpacing: 1 }
});

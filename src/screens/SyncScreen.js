import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Switch } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeQuery, getAppSettings, updateAppSetting } from '../database/database';
import * as Updates from 'expo-updates';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import PrimaryButton from '../ui/PrimaryButton';
import { showToast } from '../ui/Toast';
import { syncAllMaster, testConnection } from '../services/supabase';
import { BackupService } from '../services/BackupService';

export default function SyncScreen({ navigation }) {
    const { theme, colors, setTheme } = useTheme();
    const [userLevel, setUserLevel] = useState('USUARIO');
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(false);

    // Modais Visibilidade
    const [activeModal, setActiveModal] = useState(null);


    const handleSyncMaster = async () => {
        try {
            setLoading(true);
            const isConnected = await testConnection();
            if (!isConnected) {
                Alert.alert('Erro de Conexão', 'Não foi possível conectar ao Supabase Master. Verifique sua internet.');
                return;
            }
            const count = await syncAllMaster();
            showToast(`Sincronização concluída! ${count} tabelas processadas.`);
        } catch {
            Alert.alert('Erro', 'Falha na sincronização em nuvem.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckUpdate = async () => {
        try {
            setLoading(true);
            if (__DEV__) {
                Alert.alert('Modo Dev', 'Atualizações OTA só funcionam em builds de produção (EAS).');
                return;
            }
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
                Alert.alert('Atualização Disponível', 'Baixando e instalando nova versão do sistema AgroGB...');
                await Updates.fetchUpdateAsync();
                Alert.alert('Sucesso', 'Atualização concluída! O aplicativo será reiniciado.', [
                    { text: 'OK', onPress: () => Updates.reloadAsync() }
                ]);
            } else {
                showToast('Você já está na versão mais recente!');
            }
        } catch {
            Alert.alert('Erro de Atualização', 'Não foi possível verificar atualizações no momento.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackupLocal = async () => {
        try {
            setLoading(true);
            await BackupService.runLocalBackup();
            showToast('Backup local exportado!');
        } catch {
            Alert.alert('Erro', 'Falha ao gerar backup local.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackupCloud = async () => {
        try {
            setLoading(true);
            const isConnected = await testConnection();
            if (!isConnected) throw new Error('Sem conexão');

            await BackupService.runCloudBackup();
            showToast('Backup enviado para nuvem com sucesso!');
        } catch {
            Alert.alert('Erro', 'Falha no backup em nuvem. Verifique o Storage.');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        Alert.alert(
            'Atenção: Operação Irreversível',
            'Deseja restaurar os dados? Isso apagará todos os dados atuais e substituirá pelos do arquivo de backup.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'RESTAURAR',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await BackupService.restoreFromFile();
                            Alert.alert('Sucesso', 'Dados restaurados. O app precisa ser reiniciado.', [
                                { text: 'OK', onPress: () => Updates.reloadAsync() }
                            ]);
                        } catch {
                            Alert.alert('Erro', 'Falha ao restaurar dados.');
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };
    const [lixeiraCount, setLixeiraCount] = useState(0);

    useEffect(() => {
        verificarNivelAcesso();
        loadSettings();
        countLixeira();
    }, []);

    const countLixeira = async () => {
        try {
            let total = 0;
            const tabelas = ['vendas', 'compras', 'colheitas', 'custos', 'costs', 'monitoramento_entidade', 'cadastro', 'clientes', 'culturas', 'plantio', 'maquinas', 'caderno_notas'];
            for (const t of tabelas) {
                try {
                    const res = await executeQuery(`SELECT COUNT(*) as c FROM ${t} WHERE is_deleted = 1`);
                    total += res.rows.item(0).c;
                } catch { }
            }
            setLixeiraCount(total);
        } catch { }
    };

    const loadSettings = async () => {
        try {
            const data = await getAppSettings();
            if (data) setSettings(data);
        } catch (e) { console.error('LoadSettings Error', e); }
    };

    const verificarNivelAcesso = async () => {
        try {
            const json = await AsyncStorage.getItem('user_session');
            if (json) {
                const session = JSON.parse(json);
                const res = await executeQuery('SELECT nivel FROM usuarios WHERE id = ?', [session.id]);
                if (res.rows.length > 0) {
                    setUserLevel(res.rows.item(0).nivel);
                }
            }
        } catch (e) { console.error('Erro de permissão', e); }
    };

    const isAdmin = userLevel === 'ADM';

    const handleUpdateSetting = async (key, val) => {
        setSettings(prev => ({ ...prev, [key]: val }));
        await updateAppSetting(key, val);
    };


    const ControlItem = ({ icon, label, description, onPress, adminOnly, danger, badge }) => {
        if (adminOnly && !isAdmin) return null;
        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onPress}
                style={styles.itemWrapper}
            >
                <GlowCard style={[styles.controlCard, { backgroundColor: colors.card, borderColor: danger ? (colors.danger || '#EF4444') + '40' : colors.glassBorder }]}>
                    <View style={[styles.iconBox, { backgroundColor: danger ? (colors.danger || '#EF4444') + '15' : (colors.primary || '#1E8E5A') + '15' }]}>
                        <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                        <Text style={[styles.controlLabel, { color: colors.textPrimary }]}>{label}</Text>
                        <Text style={[styles.controlDesc, { color: colors.textMuted }]} numberOfLines={1}>{description}</Text>
                    </View>
                    {badge ? (
                        <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                            <Text style={styles.badgeText}>{badge}</Text>
                        </View>
                    ) : (
                        <Ionicons name="chevron-forward" size={18} color={colors.glassBorder} />
                    )}
                </GlowCard>
            </TouchableOpacity>
        );
    };

    const ModalHeader = ({ title, onClose }) => (
        <View style={styles.modalSubHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.glassBorder }]}>
                <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
        </View>
    );

    return (
        <AppContainer>
            <ScreenHeader title="Painel de Controle" onBack={() => navigation.goBack()} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SISTEMA & PREFERÊNCIAS</Text>

                <ControlItem
                    icon="business-outline" label="Dados da Propriedade" description="Fazenda, CNPJ e contatos"
                    onPress={() => setActiveModal('PROPRIEDADE')}
                />
                <ControlItem
                    icon="color-palette-outline" label="Aparência Visual" description="Cores e modo escuro"
                    onPress={() => setActiveModal('APARENCIA')}
                />
                <ControlItem
                    icon="wallet-outline" label="Regras Financeiras" description="Moeda e metas de lucro"
                    onPress={() => setActiveModal('FINANCEIRO')}
                />

                <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 25 }]}>MOTOR DA PLATAFORMA</Text>

                <ControlItem
                    icon="cloudy-night-outline" label="Serviços & Clima" description="API Key e geolocalização"
                    onPress={() => setActiveModal('CLIMA')}
                />
                <ControlItem
                    icon="document-text-outline" label="Modelos de Relatório" description="Configurações de PDF"
                    onPress={() => setActiveModal('RELATORIO')}
                />
                <ControlItem
                    icon="image-outline" label="Qualidade de Fotos" description="Compressão e limites"
                    onPress={() => setActiveModal('MEDIA')}
                />
                <ControlItem
                    icon="sync-outline" label="Sincronização Master"
                    description={loading ? "Verificando..." : "Sincronizar Cloud Supabase"}
                    onPress={handleSyncMaster}
                />
                <ControlItem
                    icon="cloud-download-outline" label="Atualização do Sistema (OTA)"
                    description="Verificar pacotes e versões novas do app"
                    onPress={handleCheckUpdate}
                />
                <ControlItem
                    icon="save-outline" label="Backup em Nuvem" description="Salvar no Supabase Storage"
                    onPress={handleBackupCloud}
                />
                <ControlItem
                    icon="share-outline" label="Exportar Backup Local" description="Gerar arquivo JSON de segurança"
                    onPress={handleBackupLocal}
                />
                <ControlItem
                    icon="refresh-outline" label="Restaurar Dados" description="Importar de arquivo de backup"
                    onPress={handleRestore}
                />


                {isAdmin && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 25 }]}>GESTÃO & SEGURANÇA</Text>
                        <ControlItem
                            icon="people-outline" label="Gerenciar Equipe" description="Controle de usuários e acessos"
                            onPress={() => navigation.navigate('Usuarios')}
                        />
                        <ControlItem
                            icon="pricetags-outline" label="Tabelas do Sistema" description="Categorias mestres e unidades"
                            onPress={() => navigation.navigate('Cadastro')}
                        />
                        <ControlItem
                            icon="trash-bin-outline" label="Lixeira de Registros"
                            description="Itens aguardando limpeza"
                            badge={lixeiraCount > 0 ? lixeiraCount : null}
                            onPress={() => setActiveModal('LIXEIRA')}
                        />
                        <ControlItem
                            icon="flash-outline" label="Manutenção Técnica" description="Limpeza de cache e banco"
                            danger
                            onPress={() => Alert.alert('Avançado', 'Deseja limpar otimizações técnicas?')}
                        />
                    </>
                )}

                <View style={styles.footerInfo}>
                    <Text style={[styles.versionText, { color: colors.textMuted }]}>AgroGB Intelligence Engine v8.5</Text>
                    <Text style={[styles.buildText, { color: colors.textMuted }]}>Build: 2026.03.06 • Stable</Text>
                </View>
            </ScrollView>

            {/* --- MODALS --- */}

            <Modal visible={!!activeModal} animationType="slide" transparent={true}>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                    <GlowCard style={[styles.modalInner, { backgroundColor: colors.card, borderColor: colors.glassBorder }]}>

                        {activeModal === 'PROPRIEDADE' && (
                            <>
                                <ModalHeader title="Dados da Propriedade" onClose={() => setActiveModal(null)} />
                                <ScrollView style={{ marginTop: 15 }}>
                                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>NOME DA FAZENDA</Text>
                                    <TextInput
                                        style={[styles.modalInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.glassBorder }]}
                                        value={settings.fazenda_nome}
                                        onChangeText={t => handleUpdateSetting('fazenda_nome', t.toUpperCase())}
                                    />
                                    <View style={styles.row}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>CPF / CNPJ</Text>
                                            <TextInput
                                                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.glassBorder }]}
                                                value={settings.fazenda_documento}
                                                keyboardType="numeric"
                                                onChangeText={t => handleUpdateSetting('fazenda_documento', t)}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>TELEFONE</Text>
                                            <TextInput
                                                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.glassBorder }]}
                                                value={settings.fazenda_telefone}
                                                keyboardType="phone-pad"
                                                onChangeText={t => handleUpdateSetting('fazenda_telefone', t)}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.row}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>ÁREA TOTAL (HA)</Text>
                                            <TextInput
                                                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.glassBorder }]}
                                                value={String(settings.fazenda_area || '')}
                                                keyboardType="numeric"
                                                onChangeText={t => handleUpdateSetting('fazenda_area', t)}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>SAFRA ATUAL</Text>
                                            <TextInput
                                                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.glassBorder }]}
                                                value={settings.fazenda_safra}
                                                placeholder="Ex: 2025/2026"
                                                onChangeText={t => handleUpdateSetting('fazenda_safra', t)}
                                            />
                                        </View>
                                    </View>
                                    <PrimaryButton label="SALVAR DADOS" onPress={() => { setActiveModal(null); showToast('Dados atualizados!'); }} style={{ marginTop: 20 }} />
                                </ScrollView>
                            </>
                        )}


                        {activeModal === 'APARENCIA' && (
                            <>
                                <ModalHeader title="Aparência & Temas" onClose={() => setActiveModal(null)} />
                                <View style={{ marginTop: 25 }}>
                                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>MODO DE COR</Text>
                                    <View style={styles.themeRow}>
                                        {['light', 'dark', 'ultra_premium'].map(m => (
                                            <TouchableOpacity
                                                key={m}
                                                onPress={() => setTheme(m)}
                                                style={[styles.themeBtn, { backgroundColor: theme === m ? (colors.primary || '#1E8E5A') + '20' : 'transparent', borderColor: theme === m ? colors.primary : colors.glassBorder }]}
                                            >
                                                <Ionicons name={m === 'light' ? 'sunny' : m === 'dark' ? 'moon' : 'diamond'} size={20} color={theme === m ? colors.primary : colors.textMuted} />
                                                <Text style={[styles.themeLabel, { color: theme === m ? colors.textPrimary : colors.textMuted }]}>{m.toUpperCase()}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 30 }]}>PALETA PRIMÁRIA</Text>
                                    <View style={styles.colorRow}>
                                        {['#10B981', '#2563EB', '#D97706', '#7C3AED', '#EF4444'].map(c => (
                                            <TouchableOpacity
                                                key={c}
                                                onPress={() => updateAppSetting('primary_color', c)}
                                                style={[styles.colorCircle, { backgroundColor: c, borderWidth: 3, borderColor: colors.primary === c ? '#FFF' : 'transparent' }]}
                                            />
                                        ))}
                                    </View>
                                </View>
                            </>
                        )}

                        {activeModal === 'FINANCEIRO' && (
                            <>
                                <ModalHeader title="Regras Financeiras" onClose={() => setActiveModal(null)} />
                                <View style={{ marginTop: 20 }}>
                                    <View style={styles.row}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>MOEDA PADRÃO</Text>
                                            <TextInput
                                                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.glassBorder }]}
                                                value={settings.fin_moeda}
                                                maxLength={3}
                                                onChangeText={t => handleUpdateSetting('fin_moeda', t.toUpperCase())}
                                            />
                                        </View>
                                        <View style={{ flex: 2 }}>
                                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>META LUCRO MENSAL</Text>
                                            <TextInput
                                                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.glassBorder }]}
                                                value={String(settings.fin_meta_lucro || '')}
                                                keyboardType="numeric"
                                                onChangeText={t => handleUpdateSetting('fin_meta_lucro', t)}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.switchRow}>
                                        <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Cálculo Automático de Margem</Text>
                                        <Switch
                                            value={!!settings.fin_calc_margem}
                                            onValueChange={v => handleUpdateSetting('fin_calc_margem', v ? 1 : 0)}
                                            trackColor={{ false: '#767577', true: colors.primary }}
                                        />
                                    </View>

                                    <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 20 }]}>UNIDADES DE MEDIDA</Text>
                                    <View style={styles.row}>
                                        {['KG', 'SC', 'CX', 'LT'].map(u => (
                                            <TouchableOpacity
                                                key={u}
                                                onPress={() => handleUpdateSetting('unidade_padrao', u)}
                                                style={[styles.miniBtn, { borderColor: settings.unidade_padrao === u ? colors.primary : colors.glassBorder, backgroundColor: settings.unidade_padrao === u ? (colors.primary || '#1E8E5A') + '15' : 'transparent' }]}
                                            >
                                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: settings.unidade_padrao === u ? colors.primary : colors.textMuted }}>{u}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </>
                        )}


                        {activeModal === 'LIXEIRA' && (
                            <>
                                <ModalHeader title="Lixeira Administrativa" onClose={() => setActiveModal(null)} />
                                <View style={styles.lixeiraBody}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={60} color={colors.danger} />
                                    <Text style={[styles.lixeiraCount, { color: colors.textPrimary }]}>{lixeiraCount} ITENS</Text>
                                    <Text style={[styles.lixeiraDesc, { color: colors.textMuted }]}>Itens removidos aguardando exclusão física definitiva do banco SQLite.</Text>

                                    <View style={styles.lixeiraActions}>
                                        <TouchableOpacity
                                            style={[styles.restoreBtn, { borderColor: colors.primary }]}
                                            onPress={async () => {
                                                const tabelas = ['vendas', 'compras', 'colheitas', 'custos', 'monitoramento_entidade', 'cadastro', 'clientes', 'culturas', 'plantio', 'maquinas', 'caderno_notas'];
                                                for (const t of tabelas) { await executeQuery(`UPDATE ${t} SET is_deleted = 0 WHERE is_deleted = 1`); }
                                                countLixeira(); showToast('Itens restaurados!'); setActiveModal(null);
                                            }}
                                        >
                                            <Text style={[styles.restoreText, { color: colors.primary }]}>RESTAURAR TUDO</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.purgeBtn, { backgroundColor: colors.danger }]}
                                            onPress={() => {
                                                Alert.alert('AVISO', 'Esta ação é irreversível. Apagar definitivamente?', [
                                                    { text: 'Cancelar' },
                                                    {
                                                        text: 'ESVAZIAR', style: 'destructive',
                                                        onPress: async () => {
                                                            const tabelas = ['vendas', 'compras', 'colheitas', 'custos', 'costs', 'monitoramento_entidade', 'cadastro', 'clientes', 'culturas', 'plantio', 'maquinas', 'caderno_notas'];
                                                            for (const t of tabelas) {
                                                                try { await executeQuery(`DELETE FROM ${t} WHERE is_deleted = 1`); } catch { }
                                                            }
                                                            countLixeira(); showToast('Lixeira limpa!'); setActiveModal(null);
                                                        }
                                                    }
                                                ]);
                                            }}
                                        >
                                            <Text style={styles.purgeText}>ESVAZIAR</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}

                        {activeModal === 'CLIMA' && (
                            <>
                                <ModalHeader title="Ajustes de Clima" onClose={() => setActiveModal(null)} />
                                <View style={{ marginTop: 20 }}>
                                    <View style={styles.switchRow}>
                                        <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Usar GPS Automático</Text>
                                        <Switch
                                            value={!!settings.clima_gps}
                                            onValueChange={v => handleUpdateSetting('clima_gps', v ? 1 : 0)}
                                            trackColor={{ false: '#767577', true: colors.primary }}
                                        />
                                    </View>

                                    {!settings.clima_gps && (
                                        <>
                                            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>CIDADE PADRÃO</Text>
                                            <TextInput
                                                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.glassBorder }]}
                                                value={settings.clima_cidade}
                                                onChangeText={t => handleUpdateSetting('clima_cidade', t)}
                                            />
                                        </>
                                    )}

                                    <Text style={[styles.inputLabel, { color: colors.textMuted }]}>API KEY (OPENWEATHERMAP)</Text>
                                    <TextInput
                                        style={[styles.modalInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.glassBorder }]}
                                        value={settings.clima_api_key}
                                        secureTextEntry
                                        onChangeText={t => handleUpdateSetting('clima_api_key', t)}
                                    />
                                    <PrimaryButton label="TESTAR CONEXÃO" onPress={() => showToast('Conexão OK!')} style={{ marginTop: 15 }} />
                                </View>
                            </>
                        )}

                        {activeModal === 'RELATORIO' && (
                            <>
                                <ModalHeader title="Preferências de Relatório" onClose={() => setActiveModal(null)} />
                                <View style={{ marginTop: 20 }}>
                                    <View style={styles.switchRow}>
                                        <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Exibir Gráficos Prontos</Text>
                                        <Switch
                                            value={!!settings.rel_graficos}
                                            onValueChange={v => handleUpdateSetting('rel_graficos', v ? 1 : 0)}
                                            trackColor={{ false: '#767577', true: colors.primary }}
                                        />
                                    </View>
                                    <View style={styles.switchRow}>
                                        <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Exportar PDF Automaticamente</Text>
                                        <Switch
                                            value={!!settings.rel_auto_pdf}
                                            onValueChange={v => handleUpdateSetting('rel_auto_pdf', v ? 1 : 0)}
                                            trackColor={{ false: '#767577', true: colors.primary }}
                                        />
                                    </View>

                                    <View style={{ marginTop: 20 }}>
                                        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>RODAPÉ DOS DOCUMENTOS</Text>
                                        <TextInput
                                            style={[styles.modalInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.glassBorder, height: 80 }]}
                                            value={settings.rel_rodape}
                                            multiline
                                            onChangeText={t => handleUpdateSetting('rel_rodape', t)}
                                        />
                                    </View>
                                </View>
                            </>
                        )}

                    </GlowCard>
                </View>
            </Modal>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    scrollContent: { padding: 20, paddingBottom: 60 },
    sectionTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15, marginLeft: 5 },
    itemWrapper: { marginBottom: 12 },
    controlCard: { padding: 18, borderRadius: 24, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    controlLabel: { fontSize: 15, fontWeight: 'bold' },
    controlDesc: { fontSize: 12, marginTop: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, minWidth: 24, alignItems: 'center' },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

    modalOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
    modalInner: { padding: 25, borderRadius: 32, borderWidth: 1, maxHeight: '80%' },
    modalSubHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    modalTitle: { fontSize: 18, fontWeight: '900' },
    closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    inputLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8, marginTop: 15 },
    modalInput: { height: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 15, fontSize: 15, fontWeight: '600', marginBottom: 5 },
    row: { flexDirection: 'row', gap: 12 },

    miniBtn: { flex: 1, height: 36, borderRadius: 10, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

    themeRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    themeBtn: { flex: 1, padding: 15, borderRadius: 16, borderWidth: 1, alignItems: 'center', gap: 6 },
    themeLabel: { fontSize: 9, fontWeight: '900' },

    colorRow: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 15 },
    colorCircle: { width: 40, height: 40, borderRadius: 20 },

    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, marginTop: 15, borderBottomWidth: 1 },
    switchLabel: { fontSize: 14, fontWeight: 'bold' },

    lixeiraBody: { alignItems: 'center', paddingVertical: 20 },
    lixeiraCount: { fontSize: 32, fontWeight: '900', marginVertical: 15 },
    lixeiraDesc: { textAlign: 'center', fontSize: 13, lineHeight: 18 },
    lixeiraActions: { flexDirection: 'row', gap: 12, marginTop: 30, width: '100%' },
    restoreBtn: { flex: 1, height: 50, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    restoreText: { fontSize: 11, fontWeight: '900' },
    purgeBtn: { flex: 1, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    purgeText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

    footerInfo: { marginTop: 40, alignItems: 'center', gap: 4 },
    versionText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
    buildText: { fontSize: 10, fontWeight: '600' }
});

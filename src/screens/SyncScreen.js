import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Switch } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import SafeBlurView from '../ui/SafeBlurView';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeQuery, getAppSettings, updateAppSetting } from '../database/database';
import * as Updates from 'expo-updates';
import AppContainer from '../ui/AppContainer';
import { showToast } from '../ui/Toast';
import { testConnection } from '../services/supabaseClient';
import { syncAllMaster } from '../services/SyncService';
import { BackupService } from '../services/BackupService';
import { ErrorService } from '../services/ErrorService';
import ScreenHeader from '../ui/ScreenHeader';
import FundoAnimado from '../components/FundoAnimado';

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
        } catch (error) {
            ErrorService.logError('SyncScreen:handleSyncMaster', error);
            Alert.alert('Erro', 'Falha na sincronização em nuvem. Verifique seu log no botão de inseto no topo.');
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
        } catch (error) {
            ErrorService.logError('SyncScreen:handleCheckUpdate', error);
            Alert.alert('Erro de Atualização', 'Não foi possível verificar atualizações no momento.');
        } finally {
            setLoading(false);
        }
    };


    const handleFullBackup = async () => {
        try {
            setLoading(true);
            showToast('Gerando Backup Local...');
            await BackupService.runLocalBackup();
            
            const isConnected = await testConnection();
            if (!isConnected) {
                Alert.alert('Backup Local OK', 'O backup foi salvo no celular, mas não foi possível enviar para a nuvem (sem internet).');
                return;
            }
            
            showToast('Sincronizando com a Nuvem...');
            await BackupService.runCloudBackup();
            showToast('Escudo de Segurança Ativado! ✅');
        } catch (error) {
            ErrorService.logError('SyncScreen:handleFullBackup', error);
            Alert.alert('Erro', 'Falha ao completar o backup total. Um relatório técnico foi gerado.');
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

    const handleDeepClean = async () => {
        Alert.alert(
            'Manutenção Avançada',
            'Esta ação irá:\n1. Limpar cache de sincronismo\n2. Forçar re-envio de dados locais\n3. Reiniciar o aplicativo\n\nDeseja continuar?',
            [
                { text: 'Não', style: 'cancel' },
                {
                    text: 'LIMPAR TUDO',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            await AsyncStorage.removeItem('last_pull_timestamp');
                            const syncTables = [
                                'v2_colheitas', 'v2_vendas', 'v2_plantios', 
                                'v2_custos', 'v2_analise_solo', 'v2_recomendacoes_tecnicas', 
                                'areas', 'items', 'clientes', 'culturas', 'maquinas'
                            ];
                            for (const table of syncTables) {
                                try { await executeQuery(`UPDATE ${table} SET sync_status = 0`); } catch { }
                            }
                            showToast('Cache limpo! Reiniciando...');
                            setTimeout(() => Updates.reloadAsync(), 2000);
                        } catch {
                            Alert.alert('Erro', 'Falha na limpeza profunda.');
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
                <View style={styles.controlContent}>
                    <View style={[styles.iconBox, { backgroundColor: danger ? (colors.danger || '#EF4444') + '15' : (colors.primary || '#10B981') + '15' }]}>
                        <Ionicons name={icon} size={22} color={danger ? (colors.danger || '#EF4444') : (colors.primary || '#10B981')} />
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
                        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.2)" />
                    )}
                </View>
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
        <FundoAnimado>
            <ScreenHeader title="Painel de Controle" onBack={() => navigation.goBack()} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                <Text style={styles.sectionHeader}>SISTEMA & PREFERÊNCIAS</Text>
                <SafeBlurView intensity={20} tint="dark" style={styles.sectionGlass}>
                    <ControlItem
                        icon="business-outline" label="Dados da Propriedade" description="Fazenda, CNPJ e contatos"
                        onPress={() => setActiveModal('PROPRIEDADE')}
                    />
                    <View style={styles.divider} />
                    <ControlItem
                        icon="color-palette-outline" label="Aparência Visual" description="Cores e modo escuro"
                        onPress={() => setActiveModal('APARENCIA')}
                    />
                    <View style={styles.divider} />
                    <ControlItem
                        icon="wallet-outline" label="Regras Financeiras" description="Moeda e metas de lucro"
                        onPress={() => setActiveModal('FINANCEIRO')}
                    />
                </SafeBlurView>

                <Text style={styles.sectionHeader}>MOTOR DA PLATAFORMA</Text>
                <SafeBlurView intensity={20} tint="dark" style={styles.sectionGlass}>
                    <ControlItem
                        icon="cloudy-night-outline" label="Serviços & Clima" description="API Key e geolocalização"
                        onPress={() => setActiveModal('CLIMA')}
                    />
                    <View style={styles.divider} />
                    <ControlItem
                        icon="document-text-outline" label="Modelos de Relatório" description="Configurações de PDF"
                        onPress={() => setActiveModal('RELATORIO')}
                    />
                    <View style={styles.divider} />
                    <ControlItem
                        icon="image-outline" label="Qualidade de Fotos" description="Compressão e limites"
                        onPress={() => setActiveModal('MEDIA')}
                    />
                    <View style={styles.divider} />
                    <ControlItem
                        icon="cloud-download-outline" label="Atualizar Minhas Telas"
                        description="Puxar novas funções e correções do AgroGB"
                        onPress={handleCheckUpdate}
                    />
                    <View style={styles.divider} />
                    <ControlItem
                        icon="sync-outline" label="Sincronizar Dados (Nuvem)"
                        description={loading ? "Verificando..." : "Enviar colheitas e vendas para a nuvem"}
                        onPress={handleSyncMaster}
                    />
                    <View style={styles.divider} />
                    <ControlItem
                        icon="shield-checkmark-outline" label="Backup de Segurança Total"
                        description="Salva no celular e na nuvem de uma vez só"
                        onPress={handleFullBackup}
                    />
                    <View style={styles.divider} />
                    <ControlItem
                        icon="refresh-outline" label="Restaurar Dados" description="Importar de arquivo de backup"
                        onPress={handleRestore}
                    />
                </SafeBlurView>

                {isAdmin && (
                    <>
                        <Text style={styles.sectionHeader}>GESTÃO & SEGURANÇA</Text>
                        <SafeBlurView intensity={20} tint="dark" style={styles.sectionGlass}>
                            <ControlItem
                                icon="people-outline" label="Gerenciar Equipe" description="Controle de usuários e acessos"
                                onPress={() => navigation.navigate('Usuarios')}
                            />
                            <View style={styles.divider} />
                            <ControlItem
                                icon="pricetags-outline" label="Tabelas do Sistema" description="Categorias mestres e unidades"
                                onPress={() => navigation.navigate('Cadastro')}
                            />
                            <View style={styles.divider} />
                            <ControlItem
                                icon="trash-bin-outline" label="Lixeira de Registros"
                                description="Itens aguardando limpeza"
                                badge={lixeiraCount > 0 ? lixeiraCount : null}
                                onPress={() => setActiveModal('LIXEIRA')}
                            />
                            <View style={styles.divider} />
                            <ControlItem
                                icon="flash-outline" label="Manutenção Técnica" description="Limpeza de cache e banco"
                                danger
                                onPress={handleDeepClean}
                            />
                        </SafeBlurView>
                    </>
                )}

                <View style={styles.footerContainer}>
                    <Text style={[styles.versionText, { color: colors.textMuted }]}>AGROGB DIAMOND • build 2026.04.1.2</Text>
                    <Text style={[styles.legalText, { color: colors.textMuted }]}>2026 © AGROGB TECNOLOGIA LTDA</Text>
                </View>
            </ScrollView>

            {/* --- MODALS --- */}

            <Modal visible={!!activeModal} animationType="fade" transparent={true}>
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                    <SafeBlurView intensity={80} tint="dark" style={styles.modalGlass}>
                        {activeModal === 'PROPRIEDADE' && (
                            <>
                                <ModalHeader title="Dados da Propriedade" onClose={() => setActiveModal(null)} />
                                <ScrollView style={{ marginTop: 15 }} showsVerticalScrollIndicator={false}>
                                    <View style={styles.inputBox}>
                                        <Text style={styles.inputLabel}>NOME DA FAZENDA</Text>
                                        <TextInput
                                            style={[styles.modalInput, { backgroundColor: 'rgba(255,255,255,0.05)', color: colors.textPrimary, borderColor: 'rgba(255,255,255,0.1)' }]}
                                            value={settings.fazenda_nome}
                                            onChangeText={t => handleUpdateSetting('fazenda_nome', t.toUpperCase())}
                                        />
                                    </View>
                                    <View style={styles.row}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inputLabel}>CPF / CNPJ</Text>
                                            <TextInput
                                                style={[styles.modalInput, { backgroundColor: 'rgba(255,255,255,0.05)', color: colors.textPrimary, borderColor: 'rgba(255,255,255,0.1)' }]}
                                                value={settings.fazenda_documento}
                                                keyboardType="numeric"
                                                onChangeText={t => handleUpdateSetting('fazenda_documento', t)}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inputLabel}>TELEFONE</Text>
                                            <TextInput
                                                style={[styles.modalInput, { backgroundColor: 'rgba(255,255,255,0.05)', color: colors.textPrimary, borderColor: 'rgba(255,255,255,0.1)' }]}
                                                value={settings.fazenda_telefone}
                                                keyboardType="phone-pad"
                                                onChangeText={t => handleUpdateSetting('fazenda_telefone', t)}
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.row}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inputLabel}>ÁREA TOTAL (HA)</Text>
                                            <TextInput
                                                style={[styles.modalInput, { backgroundColor: 'rgba(255,255,255,0.05)', color: colors.textPrimary, borderColor: 'rgba(255,255,255,0.1)' }]}
                                                value={String(settings.fazenda_area || '')}
                                                keyboardType="numeric"
                                                onChangeText={t => handleUpdateSetting('fazenda_area', t)}
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.inputLabel}>SAFRA ATUAL</Text>
                                            <TextInput
                                                style={[styles.modalInput, { backgroundColor: 'rgba(255,255,255,0.05)', color: colors.textPrimary, borderColor: 'rgba(255,255,255,0.1)' }]}
                                                value={settings.fazenda_safra}
                                                placeholder="Ex: 2025/2026"
                                                placeholderTextColor="rgba(255,255,255,0.3)"
                                                onChangeText={t => handleUpdateSetting('fazenda_safra', t)}
                                            />
                                        </View>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.saveBtn} 
                                        onPress={() => { setActiveModal(null); showToast('Dados salvos!'); }}
                                    >
                                        <LinearGradient colors={['#10B981', '#059669']} style={styles.saveGradient}>
                                            <Text style={styles.saveText}>SALVAR ALTERAÇÕES</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </ScrollView>
                            </>
                        )}

                        {activeModal === 'APARENCIA' && (
                            <>
                                <ModalHeader title="Aparência & Temas" onClose={() => setActiveModal(null)} />
                                <View style={{ marginTop: 25 }}>
                                    <Text style={styles.inputLabel}>MODO DE COR</Text>
                                    <View style={styles.themeRow}>
                                        {['light', 'dark', 'ultra_premium'].map(m => (
                                            <TouchableOpacity
                                                key={m}
                                                onPress={() => setTheme(m)}
                                                style={[styles.themeBtn, { backgroundColor: theme === m ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)', borderColor: theme === m ? '#10B981' : 'rgba(255,255,255,0.1)' }]}
                                            >
                                                <Ionicons name={m === 'light' ? 'sunny' : m === 'dark' ? 'moon' : 'diamond'} size={20} color={theme === m ? '#10B981' : 'rgba(255,255,255,0.4)'} />
                                                <Text style={[styles.themeLabel, { color: theme === m ? '#FFF' : 'rgba(255,255,255,0.4)' }]}>{m.toUpperCase()}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={[styles.inputLabel, { marginTop: 30 }]}>PALETA PRIMÁRIA</Text>
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
                                            <Text style={styles.inputLabel}>MOEDA PADRÃO</Text>
                                            <TextInput
                                                style={[styles.modalInput, { backgroundColor: 'rgba(255,255,255,0.05)', color: colors.textPrimary, borderColor: 'rgba(255,255,255,0.1)' }]}
                                                value={settings.fin_moeda}
                                                maxLength={3}
                                                onChangeText={t => handleUpdateSetting('fin_moeda', t.toUpperCase())}
                                            />
                                        </View>
                                        <View style={{ flex: 2 }}>
                                            <Text style={styles.inputLabel}>META LUCRO MENSAL</Text>
                                            <TextInput
                                                style={[styles.modalInput, { backgroundColor: 'rgba(255,255,255,0.05)', color: colors.textPrimary, borderColor: 'rgba(255,255,255,0.1)' }]}
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
                                            trackColor={{ false: '#767577', true: '#10B981' }}
                                        />
                                    </View>

                                    <Text style={[styles.inputLabel, { marginTop: 20 }]}>UNIDADES DE MEDIDA</Text>
                                    <View style={styles.row}>
                                        {['KG', 'SC', 'CX', 'LT'].map(u => (
                                            <TouchableOpacity
                                                key={u}
                                                onPress={() => handleUpdateSetting('unidade_padrao', u)}
                                                style={[styles.miniBtn, { borderColor: settings.unidade_padrao === u ? '#10B981' : 'rgba(255,255,255,0.1)', backgroundColor: settings.unidade_padrao === u ? 'rgba(16,185,129,0.1)' : 'transparent' }]}
                                            >
                                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: settings.unidade_padrao === u ? '#10B981' : 'rgba(255,255,255,0.4)' }}>{u}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </>
                        )}

                        {activeModal === 'RELATORIO' && (
                            <>
                                <ModalHeader title="Preferências de Relatório" onClose={() => setActiveModal(null)} />
                                <ScrollView style={{ marginTop: 20 }} showsVerticalScrollIndicator={false}>
                                    <View style={styles.switchRow}>
                                        <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Exibir Gráficos Prontos</Text>
                                        <Switch
                                            value={!!settings.rel_graficos}
                                            onValueChange={v => handleUpdateSetting('rel_graficos', v ? 1 : 0)}
                                            trackColor={{ false: '#767577', true: '#10B981' }}
                                        />
                                    </View>
                                    <View style={styles.switchRow}>
                                        <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Exportar PDF Automaticamente</Text>
                                        <Switch
                                            value={!!settings.rel_auto_pdf}
                                            onValueChange={v => handleUpdateSetting('rel_auto_pdf', v ? 1 : 0)}
                                            trackColor={{ false: '#767577', true: '#10B981' }}
                                        />
                                    </View>

                                    <View style={{ marginTop: 20 }}>
                                        <Text style={styles.inputLabel}>RODAPÉ DOS DOCUMENTOS</Text>
                                        <TextInput
                                            style={[styles.modalInput, { backgroundColor: 'rgba(255,255,255,0.05)', color: colors.textPrimary, borderColor: 'rgba(255,255,255,0.1)', height: 100 }]}
                                            value={settings.rel_rodape}
                                            multiline
                                            placeholder="Ex: AgroGB - Tecnologia Field"
                                            placeholderTextColor="rgba(255,255,255,0.3)"
                                            onChangeText={t => handleUpdateSetting('rel_rodape', t)}
                                        />
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.saveBtn} 
                                        onPress={() => { setActiveModal(null); showToast('Layout de relatório salvo!'); }}
                                    >
                                        <LinearGradient colors={['#10B981', '#059669']} style={styles.saveGradient}>
                                            <Text style={styles.saveText}>ATUALIZAR LAYOUT</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </ScrollView>
                            </>
                        )}

                        {activeModal === 'MEDIA' && (
                            <>
                                <ModalHeader title="Qualidade & Mídia" onClose={() => setActiveModal(null)} />
                                <View style={{ marginTop: 20 }}>
                                    <Text style={styles.inputLabel}>QUALIDADE DAS FOTOS</Text>
                                    <View style={styles.row}>
                                        {['BAIXA', 'MÉDIA', 'HD'].map(q => (
                                            <TouchableOpacity
                                                key={q}
                                                onPress={() => handleUpdateSetting('media_qualidade', q)}
                                                style={[styles.miniBtn, { borderColor: settings.media_qualidade === q ? '#10B981' : 'rgba(255,255,255,0.1)', backgroundColor: settings.media_qualidade === q ? 'rgba(16,185,129,0.1)' : 'transparent' }]}
                                            >
                                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: settings.media_qualidade === q ? '#10B981' : 'rgba(255,255,255,0.4)' }}>{q}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <View style={styles.switchRow}>
                                        <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Salvar Cópia na Galeria</Text>
                                        <Switch
                                            value={!!settings.media_save_gallery}
                                            onValueChange={v => handleUpdateSetting('media_save_gallery', v ? 1 : 0)}
                                            trackColor={{ false: '#767577', true: '#10B981' }}
                                        />
                                    </View>
                                    <View style={styles.switchRow}>
                                        <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Geotag nas Imagens</Text>
                                        <Switch
                                            value={!!settings.media_geotag}
                                            onValueChange={v => handleUpdateSetting('media_geotag', v ? 1 : 0)}
                                            trackColor={{ false: '#767577', true: '#10B981' }}
                                        />
                                    </View>
                                    <Text style={[styles.lixeiraDesc, { marginTop: 20, fontSize: 11 }]}>
                                        Fotos em HD consomem mais dados na sincronização em nuvem.
                                    </Text>
                                </View>
                            </>
                        )}

                        {activeModal === 'LIXEIRA' && (
                            <>
                                <ModalHeader title="Lixeira Administrativa" onClose={() => setActiveModal(null)} />
                                <View style={styles.lixeiraBody}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={80} color={colors.danger} />
                                    <Text style={[styles.lixeiraCount, { color: '#FFF' }]}>{lixeiraCount} ITENS</Text>
                                    <Text style={[styles.lixeiraDesc, { color: 'rgba(255,255,255,0.6)' }]}>
                                        Registros apagados que ainda ocupam espaço no seu dispositivo. 
                                        A limpeza física é definitiva.
                                    </Text>

                                    <View style={styles.lixeiraActions}>
                                        <TouchableOpacity
                                            style={[styles.restoreBtn, { borderColor: '#10B981' }]}
                                            onPress={async () => {
                                                const tabelas = ['vendas', 'compras', 'colheitas', 'custos', 'monitoramento_entidade', 'cadastro', 'clientes', 'culturas', 'plantio', 'maquinas', 'caderno_notas'];
                                                for (const t of tabelas) { try { await executeQuery(`UPDATE ${t} SET is_deleted = 0 WHERE is_deleted = 1`); } catch { } }
                                                countLixeira(); showToast('Itens restaurados com sucesso!'); setActiveModal(null);
                                            }}
                                        >
                                            <Text style={[styles.restoreText, { color: '#10B981' }]}>RESTAURAR TUDO</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.purgeBtn, { backgroundColor: colors.danger }]}
                                            onPress={() => {
                                                Alert.alert('AVISO CRÍTICO', 'Deseja apagar permanentemente todos os itens da lixeira? Esta ação não pode ser desfeita.', [
                                                    { text: 'Cancelar', style: 'cancel' },
                                                    {
                                                        text: 'APAGAR PARA SEMPRE', style: 'destructive',
                                                        onPress: async () => {
                                                            const tabelas = ['vendas', 'compras', 'colheitas', 'custos', 'costs', 'monitoramento_entidade', 'cadastro', 'clientes', 'culturas', 'plantio', 'maquinas', 'caderno_notas'];
                                                            for (const t of tabelas) {
                                                                try { await executeQuery(`DELETE FROM ${t} WHERE is_deleted = 1`); } catch { }
                                                            }
                                                            countLixeira(); showToast('Lixeira esvaziada!'); setActiveModal(null);
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
                    </SafeBlurView>
                </View>
            </Modal>
        </FundoAnimado>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        padding: 18,
        paddingBottom: 60,
    },
    
    // 🌀 Ambient Lighting
    orb: {
        position: 'absolute',
        width: 250,
        height: 250,
        borderRadius: 125,
        shadowColor: '#10B981', shadowRadius: 30, shadowOpacity: 0.1,
        zIndex: -1
    },

    // 📋 Sections Header Design
    sectionHeader: {
        fontSize: 11,
        fontWeight: '900',
        color: '#10B981',
        letterSpacing: 2,
        marginLeft: 10,
        marginBottom: 12,
        marginTop: 25
    },
    sectionGlass: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 10,
        marginBottom: 10
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginHorizontal: 15,
    },

    // 🔘 Control Item Integration
    itemWrapper: {
        width: '100%',
    },
    controlContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 10,
    },
    iconBox: {
        width: 42,
        height: 42,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlLabel: {
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 0.3
    },
    controlDesc: {
        fontSize: 11,
        marginTop: 2,
        opacity: 0.6
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        minWidth: 22,
        alignItems: 'center'
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900'
    },

    // 🚩 Footer
    footerContainer: {
        marginTop: 30,
        alignItems: 'center',
        paddingBottom: 30
    },
    versionText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1.5,
        opacity: 0.6
    },
    legalText: {
        fontSize: 9,
        fontWeight: '800',
        marginTop: 6,
        letterSpacing: 0.5,
        opacity: 0.4
    },

    // 🔲 Modal Design
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 20
    },
    modalGlass: {
        padding: 24,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        maxHeight: '85%'
    },
    modalSubHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    inputBox: {
        marginBottom: 15
    },
    inputLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#10B981',
        letterSpacing: 1,
        marginBottom: 8,
        marginTop: 10
    },
    modalInput: {
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        paddingHorizontal: 15,
        fontSize: 15,
        fontWeight: '600'
    },
    row: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 10
    },
    saveBtn: {
        marginTop: 25,
        borderRadius: 16,
        overflow: 'hidden'
    },
    saveGradient: {
        paddingVertical: 18,
        alignItems: 'center'
    },
    saveText: {
        color: '#FFF',
        fontWeight: '900',
        fontSize: 13,
        letterSpacing: 1
    },
    themeRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 5
    },
    themeBtn: {
        flex: 1,
        paddingVertical: 18,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        gap: 8
    },
    themeLabel: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5
    },
    colorRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 15,
        marginTop: 10
    },
    colorCircle: {
        width: 38,
        height: 38,
        borderRadius: 19
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    switchLabel: {
        fontSize: 14,
        fontWeight: '700'
    },
    miniBtn: {
        flex: 1,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    testBtn: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.3)',
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 20
    },
    testBtnText: {
        color: '#3B82F6',
        fontWeight: '900',
        fontSize: 11,
        letterSpacing: 1
    },
    lixeiraBody: {
        alignItems: 'center',
        paddingVertical: 20
    },
    lixeiraCount: {
        fontSize: 32,
        fontWeight: '900',
        marginVertical: 15
    },
    lixeiraDesc: {
        textAlign: 'center',
        fontSize: 13,
        lineHeight: 18,
        opacity: 0.6
    },
    lixeiraActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 30,
        width: '100%'
    },
    restoreBtn: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    restoreText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5
    },
    purgeBtn: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center'
    },
    purgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5
    }
});

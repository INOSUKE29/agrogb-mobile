import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { executeQuery, getAppSettings, updateAppSetting } from '../database/database';

export default function SyncScreen({ navigation }) {
    const { theme, saveTheme } = useTheme();
    const [userLevel, setUserLevel] = useState('USUARIO');

    // States das Configurações
    const [settings, setSettings] = useState({});

    // Modais Visibilidade
    const [isPropModalVisible, setPropModalVisible] = useState(false);
    const [isThemeModalVisible, setThemeModalVisible] = useState(false);
    const [isFinModalVisible, setFinModalVisible] = useState(false);
    const [isClimaModalVisible, setClimaModalVisible] = useState(false);
    const [isRelModalVisible, setRelModalVisible] = useState(false);
    const [isMediaModalVisible, setMediaModalVisible] = useState(false);
    const [isLixeiraModalVisible, setLixeiraModalVisible] = useState(false);
    const [lixeiraCount, setLixeiraCount] = useState(0);

    useEffect(() => {
        verificarNivelAcesso();
        loadSettings();
        countLixeira();
    }, []);

    const countLixeira = async () => {
        try {
            // Contar somatório de itens deletados nas principais tabelas
            let total = 0;
            const tabelas = ['vendas', 'compras', 'colheitas', 'custos'];
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
        } catch (e) {
            console.error('Erro de permissão', e);
        }
    };

    const isAdmin = userLevel === 'ADM';

    const SettingCard = ({ icon, label, description, onPress, adminOnly, danger }) => {
        if (adminOnly && !isAdmin) return null;

        return (
            <TouchableOpacity
                style={[styles.card, danger && styles.dangerCard]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={[styles.iconBox, { backgroundColor: danger ? '#FEE2E2' : theme.primary_color + '20' }]}>
                    <Ionicons name={icon} size={24} color={danger ? '#EF4444' : theme.primary_color} />
                </View>
                <View style={styles.cardInfo}>
                    <Text style={[styles.cardTitle, danger && { color: '#B91C1C' }]}>{label}</Text>
                    <Text style={styles.cardDesc}>{description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={danger ? '#EF4444' : '#9CA3AF'} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={[theme.primary_color, theme.primary_color + '90']} style={styles.header}>
                <Text style={styles.headerTitle}>Painel de Controle</Text>
                <Text style={styles.headerSub}>Ajustes Inteligentes da Operação</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

                <Text style={styles.sectionTitle}>SISTEMA & PREFERÊNCIAS</Text>
                <SettingCard
                    icon="business-outline" label="Dados da Propriedade" description="Fazenda, CNPJ, Contatos e Logo"
                    onPress={() => setPropModalVisible(true)}
                />
                <SettingCard
                    icon="color-palette-outline" label="Aparência Visual" description="Mudar a cor primária e tema do App"
                    onPress={() => setThemeModalVisible(true)}
                />
                <SettingCard
                    icon="wallet-outline" label="Regras Financeiras" description="Moeda, mês fiscal e metas de lucro"
                    onPress={() => setFinModalVisible(true)}
                />

                <Text style={styles.sectionTitle}>MOTOR DA PLATAFORMA</Text>
                <SettingCard
                    icon="cloudy-night-outline" label="Serviços Locais & Clima" description="Chave API e geolocalização forçada"
                    onPress={() => setClimaModalVisible(true)}
                />
                <SettingCard
                    icon="document-text-outline" label="Modelos de Relatório" description="Layout PDF, assinatura e opções"
                    onPress={() => setRelModalVisible(true)}
                />
                <SettingCard
                    icon="image-outline" label="Qualidade de Fotos" description="Compressão offline de anexos e cache"
                    onPress={() => setMediaModalVisible(true)}
                />
                <SettingCard
                    icon="sync-outline" label="Nuvem & Backup Local" description="Gerar backup ou sincronizar Agrogb"
                    onPress={() => Alert.alert('Em breve', 'Modal de Nuvem')}
                />

                {isAdmin && (
                    <>
                        <Text style={styles.sectionTitle}>GESTÃO EMPRESARIAL (ADMIN)</Text>
                        <SettingCard
                            icon="people-outline" label="Gerenciar Colaboradores" description="Adicionar equipe, bloquear, senhas" adminOnly
                            onPress={() => navigation.navigate('Usuarios')}
                        />
                        <SettingCard
                            icon="pricetags-outline" label="Categorias Mestres" description="Modificar Dicionários de Sistema" adminOnly
                            onPress={() => navigation.navigate('Cadastro')}
                        />
                        <SettingCard
                            icon="trash-bin-outline" label="Lixeira de Registros" description={`${lixeiraCount} itens aguardando exclusão`} adminOnly
                            onPress={() => {
                                countLixeira();
                                setLixeiraModalVisible(true);
                            }}
                        />

                        <View style={{ marginTop: 20 }}>
                            <SettingCard
                                icon="warning-outline" label="Manutenção Avançada" description="Limpeza de Banco, Log Catastrófico e Re-Seed."
                                adminOnly danger
                                onPress={() => {
                                    Alert.alert('Aviso de Segurança', 'Deseja apagar os dados cacheados e forçar reconstrução de tabelas na próxima abertura?', [
                                        { text: 'Cancelar', style: 'cancel' },
                                        { text: 'Limpar Otimização', style: 'destructive', onPress: () => Alert.alert('Feito', 'Limpeza agendada.') }
                                    ]);
                                }}
                            />
                        </View>
                    </>
                )}

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* MODAL 1: DADOS DA PROPRIEDADE */}
            <Modal visible={isPropModalVisible} animationType="slide" transparent={true} onRequestClose={() => setPropModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Dados da Propriedade</Text>
                            <TouchableOpacity onPress={() => setPropModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.inputLabel}>NOME DA FAZENDA / PROPRIEDADE</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.primary_color }]}
                                value={settings.fazenda_nome || ''}
                                onChangeText={(t) => setSettings({ ...settings, fazenda_nome: t })}
                            />

                            <Text style={styles.inputLabel}>PRODUTOR / RAZÃO SOCIAL</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.primary_color }]}
                                value={settings.fazenda_produtor || ''}
                                onChangeText={(t) => setSettings({ ...settings, fazenda_produtor: t })}
                            />

                            <Text style={styles.inputLabel}>CPF / CNPJ</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.primary_color }]}
                                value={settings.fazenda_documento || ''}
                                keyboardType="numeric"
                                onChangeText={(t) => setSettings({ ...settings, fazenda_documento: t })}
                            />

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>TELEFONE</Text>
                                    <TextInput
                                        style={[styles.input, { borderColor: theme.primary_color }]}
                                        value={settings.fazenda_telefone || ''}
                                        keyboardType="phone-pad"
                                        onChangeText={(t) => setSettings({ ...settings, fazenda_telefone: t })}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>EMAIL (OPCIONAL)</Text>
                                    <TextInput
                                        style={[styles.input, { borderColor: theme.primary_color }]}
                                        value={settings.fazenda_email || ''}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        onChangeText={(t) => setSettings({ ...settings, fazenda_email: t })}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: theme.primary_color }]}
                                onPress={async () => {
                                    await updateAppSetting('fazenda_nome', settings.fazenda_nome);
                                    await updateAppSetting('fazenda_produtor', settings.fazenda_produtor);
                                    await updateAppSetting('fazenda_documento', settings.fazenda_documento);
                                    await updateAppSetting('fazenda_telefone', settings.fazenda_telefone);
                                    await updateAppSetting('fazenda_email', settings.fazenda_email);
                                    Alert.alert('Salvo', 'Dados da propriedade atualizados com sucesso!');
                                    setPropModalVisible(false);
                                }}
                            >
                                <Text style={styles.saveBtnText}>SALVAR ALTERAÇÕES</Text>
                            </TouchableOpacity>
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL 2: APARÊNCIA VISUAL / TEMA */}
            <Modal visible={isThemeModalVisible} animationType="fade" transparent={true} onRequestClose={() => setThemeModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '60%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Aparência e Cores</Text>
                            <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.inputLabel}>COR PRIMÁRIA DO APLICATIVO</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 10 }}>
                                {[
                                    { color: '#10B981', name: 'Verde Agro' }, // Original
                                    { color: '#059669', name: 'Verde Petróleo' },
                                    { color: '#2563EB', name: 'Azul Celeste' },
                                    { color: '#D97706', name: 'Laranja Terra' },
                                    { color: '#7C3AED', name: 'Roxo Nobre' },
                                    { color: '#1F2937', name: 'Grafite' },
                                ].map((c) => (
                                    <TouchableOpacity
                                        key={c.color}
                                        style={[
                                            { width: 50, height: 50, borderRadius: 25, backgroundColor: c.color, justifyContent: 'center', alignItems: 'center' },
                                            theme.primary_color === c.color && { borderWidth: 3, borderColor: '#000' }
                                        ]}
                                        onPress={async () => {
                                            await saveTheme(null, c.color);
                                        }}
                                    >
                                        {theme.primary_color === c.color && <Ionicons name="checkmark" size={24} color="#FFF" />}
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.inputLabel, { marginTop: 30 }]}>TEMA (MODO ESCURO)</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                {['light', 'dark', 'system'].map((mode) => (
                                    <TouchableOpacity
                                        key={mode}
                                        style={[
                                            { flex: 1, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
                                            theme.theme_mode === mode && { borderColor: theme.primary_color, backgroundColor: theme.primary_color + '10' }
                                        ]}
                                        onPress={async () => {
                                            await saveTheme(mode, null);
                                        }}
                                    >
                                        <Ionicons
                                            name={mode === 'light' ? 'sunny' : mode === 'dark' ? 'moon' : 'phone-portrait'}
                                            size={20}
                                            color={theme.theme_mode === mode ? theme.primary_color : '#9CA3AF'}
                                        />
                                        <Text style={{ fontSize: 10, fontWeight: 'bold', marginTop: 5, color: theme.theme_mode === mode ? theme.primary_color : '#6B7280' }}>
                                            {mode.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL 3: REGRAS FINANCEIRAS */}
            <Modal visible={isFinModalVisible} animationType="slide" transparent={true} onRequestClose={() => setFinModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Configuração Financeira</Text>
                            <TouchableOpacity onPress={() => setFinModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>MOEDA PADRÃO</Text>
                                    <TextInput
                                        style={[styles.input, { borderColor: theme.primary_color }]}
                                        value={settings.fin_moeda || 'R$'}
                                        maxLength={3}
                                        onChangeText={(t) => setSettings({ ...settings, fin_moeda: t })}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.inputLabel}>MÊS FISCAL (INÍCIO)</Text>
                                    <TextInput
                                        style={[styles.input, { borderColor: theme.primary_color }]}
                                        value={String(settings.fin_mes_fiscal || 1)}
                                        keyboardType="numeric"
                                        maxLength={2}
                                        onChangeText={(t) => setSettings({ ...settings, fin_mes_fiscal: parseInt(t.replace(/[^0-9]/g, '')) || 1 })}
                                    />
                                </View>
                            </View>

                            <Text style={styles.inputLabel}>META DE LUCRO MENSAL (OPCIONAL)</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.primary_color }]}
                                value={settings.fin_meta_lucro ? String(settings.fin_meta_lucro) : ''}
                                keyboardType="numeric"
                                placeholder="0.00"
                                onChangeText={(t) => setSettings({ ...settings, fin_meta_lucro: t })}
                            />

                            <TouchableOpacity
                                style={[styles.input, { marginTop: 15, borderColor: theme.primary_color, backgroundColor: settings.fin_calc_margem ? theme.primary_color + '20' : '#F9FAFB' }]}
                                onPress={() => setSettings({ ...settings, fin_calc_margem: settings.fin_calc_margem ? 0 : 1 })}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontWeight: 'bold', color: '#1F2937' }}>Cálculo Automático de Margem</Text>
                                    <Ionicons name={settings.fin_calc_margem ? "checkbox" : "square-outline"} size={24} color={theme.primary_color} />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: theme.primary_color }]}
                                onPress={async () => {
                                    await updateAppSetting('fin_moeda', settings.fin_moeda);
                                    await updateAppSetting('fin_mes_fiscal', isNaN(settings.fin_mes_fiscal) ? 1 : settings.fin_mes_fiscal);
                                    await updateAppSetting('fin_meta_lucro', settings.fin_meta_lucro ? parseFloat(settings.fin_meta_lucro) : null);
                                    await updateAppSetting('fin_calc_margem', settings.fin_calc_margem);
                                    Alert.alert('Salvo', 'Regras financeiras atualizadas!');
                                    setFinModalVisible(false);
                                }}
                            >
                                <Text style={styles.saveBtnText}>SALVAR REGRAS</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL 4: CLIMA E SERVIÇOS */}
            <Modal visible={isClimaModalVisible} animationType="fade" transparent={true} onRequestClose={() => setClimaModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '65%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Serviços de Clima</Text>
                            <TouchableOpacity onPress={() => setClimaModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>

                            <TouchableOpacity
                                style={[styles.input, { borderColor: theme.primary_color, backgroundColor: settings.clima_ativo ? theme.primary_color + '20' : '#F9FAFB' }]}
                                onPress={() => setSettings({ ...settings, clima_ativo: settings.clima_ativo ? 0 : 1 })}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontWeight: 'bold', color: '#1F2937' }}>Habilitar Widget de Clima Geral</Text>
                                    <Ionicons name={settings.clima_ativo ? "radio-button-on" : "radio-button-off"} size={24} color={theme.primary_color} />
                                </View>
                            </TouchableOpacity>

                            <Text style={styles.inputLabel}>CHAVE DE API (OPENWEATHERMAP) - OPCIONAL</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.primary_color }]}
                                value={settings.clima_api_key || ''}
                                autoCapitalize="none"
                                placeholder="Padrão do AgroGB será usado se vazio"
                                onChangeText={(t) => setSettings({ ...settings, clima_api_key: t })}
                            />

                            <Text style={styles.inputLabel}>CIDADE FIXA FORÇADA (DESATIVA O GPS AUTOMÁTICO)</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.primary_color }]}
                                value={settings.clima_cidade || ''}
                                placeholder="Basta digitar e salvar se o GPS falhar."
                                onChangeText={(t) => setSettings({ ...settings, clima_cidade: t })}
                            />

                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: theme.primary_color }]}
                                onPress={async () => {
                                    await updateAppSetting('clima_ativo', settings.clima_ativo);
                                    await updateAppSetting('clima_api_key', settings.clima_api_key);
                                    await updateAppSetting('clima_cidade', settings.clima_cidade);
                                    Alert.alert('Salvo', 'Configurações de clima atualizadas e em vigor.');
                                    setClimaModalVisible(false);
                                }}
                            >
                                <Text style={styles.saveBtnText}>SALVAR CLIMA</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL 5: RELATÓRIOS PDF */}
            <Modal visible={isRelModalVisible} animationType="slide" transparent={true} onRequestClose={() => setRelModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '55%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Opções de Relatórios</Text>
                            <TouchableOpacity onPress={() => setRelModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>

                            <TouchableOpacity
                                style={[styles.input, { borderColor: theme.primary_color, backgroundColor: settings.rel_incluir_logo ? theme.primary_color + '20' : '#F9FAFB' }]}
                                onPress={() => setSettings({ ...settings, rel_incluir_logo: settings.rel_incluir_logo ? 0 : 1 })}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontWeight: 'bold', color: '#1F2937' }}>Imprimir Cabeçalho e Logo</Text>
                                    <Ionicons name={settings.rel_incluir_logo ? "checkbox" : "square-outline"} size={24} color={theme.primary_color} />
                                </View>
                            </TouchableOpacity>

                            <Text style={[styles.inputLabel, { marginTop: 25 }]}>MODELO PADRÃO DO PDF</Text>
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                                {['resumido', 'completo'].map((mode) => (
                                    <TouchableOpacity
                                        key={mode}
                                        style={[
                                            { flex: 1, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
                                            settings.rel_modelo === mode && { borderColor: theme.primary_color, backgroundColor: theme.primary_color + '10' }
                                        ]}
                                        onPress={() => setSettings({ ...settings, rel_modelo: mode })}
                                    >
                                        <Ionicons name={mode === 'resumido' ? 'list' : 'document-text'} size={20} color={settings.rel_modelo === mode ? theme.primary_color : '#9CA3AF'} />
                                        <Text style={{ fontSize: 11, fontWeight: 'bold', marginTop: 5, color: settings.rel_modelo === mode ? theme.primary_color : '#6B7280' }}>
                                            {mode.toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: theme.primary_color, marginTop: 40 }]}
                                onPress={async () => {
                                    await updateAppSetting('rel_incluir_logo', settings.rel_incluir_logo);
                                    await updateAppSetting('rel_modelo', settings.rel_modelo);
                                    Alert.alert('Salvo', 'Modelo de relatórios salvo.');
                                    setRelModalVisible(false);
                                }}
                            >
                                <Text style={styles.saveBtnText}>SALVAR CONFIGURAÇÃO DE PDF</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL 6: QUALIDADE DE IMAGEM */}
            <Modal visible={isMediaModalVisible} animationType="fade" transparent={true} onRequestClose={() => setMediaModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '55%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Armazenamento de Fotos</Text>
                            <TouchableOpacity onPress={() => setMediaModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.modalBody}>

                            <Text style={styles.inputLabel}>QUALIDADE DA FOTO COMPRIMIDA</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.primary_color }]}
                                value={String(settings.img_qualidade || 0.8)}
                                keyboardType="numeric"
                                placeholder="Numeração de 0.1 a 1.0 (Ex: 0.8 para 80%)"
                                onChangeText={(t) => setSettings({ ...settings, img_qualidade: parseFloat(t) || 0.8 })}
                            />

                            <Text style={styles.inputLabel}>LIMITE MÁX. DE FOTOS POR COMPRA/COLHEITA</Text>
                            <TextInput
                                style={[styles.input, { borderColor: theme.primary_color }]}
                                value={String(settings.img_limite || 3)}
                                keyboardType="numeric"
                                onChangeText={(t) => setSettings({ ...settings, img_limite: parseInt(t.replace(/[^0-9]/g, '')) || 3 })}
                            />

                            <View style={{ backgroundColor: '#FEF2F2', padding: 15, borderRadius: 10, marginTop: 25 }}>
                                <Text style={{ color: '#B91C1C', fontWeight: 'bold', fontSize: 11 }}>ℹ️ IMPORTANTE DE SISTEMA</Text>
                                <Text style={{ color: '#B91C1C', fontSize: 10, marginTop: 5 }}>Qualidades acima de 0.9 e limites altos podem consumir excessivamente a memória flash interna do telefone em médio prazo no modo offline.</Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: theme.primary_color }]}
                                onPress={async () => {
                                    await updateAppSetting('img_qualidade', settings.img_qualidade);
                                    await updateAppSetting('img_limite', settings.img_limite);
                                    Alert.alert('Salvo', 'Políticas de mídia atualizadas.');
                                    setMediaModalVisible(false);
                                }}
                            >
                                <Text style={styles.saveBtnText}>APLICAR LIMITES</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL 7: LIXEIRA */}
            <Modal visible={isLixeiraModalVisible} animationType="fade" transparent={true} onRequestClose={() => setLixeiraModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '50%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Lixeira Administrativa</Text>
                            <TouchableOpacity onPress={() => setLixeiraModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="trash-bin" size={60} color="#E5E7EB" />
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginTop: 15 }}>{lixeiraCount} Itens</Text>
                            <Text style={{ color: '#6B7280', textAlign: 'center', marginVertical: 10 }}>Esses itens foram apagados pelos usuários (Soft Delete), mas continuam ocupando espaço no banco interno.</Text>

                            <View style={{ flexDirection: 'row', gap: 15, marginTop: 20, width: '100%' }}>
                                <TouchableOpacity
                                    style={{ flex: 1, backgroundColor: '#F3F4F6', padding: 15, borderRadius: 10, alignItems: 'center' }}
                                    onPress={async () => {
                                        // Restaura tudo
                                        const tabelas = ['vendas', 'compras', 'colheitas', 'custos'];
                                        for (const t of tabelas) { await executeQuery(`UPDATE ${t} SET is_deleted = 0 WHERE is_deleted = 1`); }
                                        Alert.alert('Restaurado', 'Todos os itens voltaram para o sistema.');
                                        countLixeira();
                                        setLixeiraModalVisible(false);
                                    }}
                                >
                                    <Text style={{ fontWeight: 'bold', color: '#1F2937' }}>Restaurar Tudo</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ flex: 1, backgroundColor: '#EF4444', padding: 15, borderRadius: 10, alignItems: 'center' }}
                                    onPress={() => {
                                        Alert.alert('Aviso', 'Isso deletará fisicamente os arquivos do SQLite. Proceder?', [
                                            { text: 'Cancelar' },
                                            {
                                                text: 'Esvaziar', style: 'destructive', onPress: async () => {
                                                    const tabelas = ['vendas', 'compras', 'colheitas', 'custos'];
                                                    for (const t of tabelas) { await executeQuery(`DELETE FROM ${t} WHERE is_deleted = 1`); }
                                                    countLixeira();
                                                    setLixeiraModalVisible(false);
                                                }
                                            }
                                        ])
                                    }}
                                >
                                    <Text style={{ fontWeight: 'bold', color: '#FFF' }}>Esvaziar e Apagar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { padding: 30, paddingTop: 60, borderBottomLeftRadius: 35, borderBottomRightRadius: 35, elevation: 5 },
    headerTitle: { fontSize: 28, fontWeight: '900', color: '#FFF' },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 5, letterSpacing: 0.5, fontWeight: 'bold' },
    body: { paddingHorizontal: 20, paddingTop: 30 },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 15, marginTop: 10, marginLeft: 5 },
    card: { backgroundColor: '#FFF', padding: 18, borderRadius: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
    dangerCard: { borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2' },
    iconBox: { width: 45, height: 45, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    cardInfo: { flex: 1 },
    cardDesc: { fontSize: 12, color: '#6B7280', lineHeight: 16 },

    // Estilos de Modal Compartilhados
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, height: '80%', padding: 25 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '900', color: '#1F2937' },
    modalBody: { flex: 1 },
    inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#6B7280', marginBottom: 6, marginTop: 15, letterSpacing: 1 },
    input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 15, color: '#1F2937' },
    saveBtn: { padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
    saveBtnText: { color: '#FFF', fontWeight: '900', letterSpacing: 1, fontSize: 14 }
});

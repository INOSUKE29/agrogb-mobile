/**
 * UsuariosScreen.js — AgroGB OS: Gestão de Usuários ERP
 * Sistema de permissões por módulo, roles e controle granular de acesso.
 * Arquitetura: user → role → permissions → módulos liberados
 */

import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Modal, Alert, ActivityIndicator, ScrollView, TextInput,
    Switch, SafeAreaView, StatusBar, Platform, LayoutAnimation, UIManager
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { insertUsuario, getUsuarios, deleteUsuario, updateUsuario } from '../database/database';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─────────────────────────────────────────────
// MÓDULOS DO SISTEMA (AgroGB OS — camadas)
// ─────────────────────────────────────────────
const MODULES = [
    { key: 'clientes',      label: 'Clientes',        icon: 'people',              layer: 'Domínio', color: '#8B5CF6' },
    { key: 'fazendas',      label: 'Fazendas',         icon: 'home',                layer: 'Domínio', color: '#F59E0B' },
    { key: 'talhoes',       label: 'Talhões / Áreas',  icon: 'map',                 layer: 'Domínio', color: '#10B981' },
    { key: 'culturas',      label: 'Culturas',         icon: 'leaf',                layer: 'Domínio', color: '#34D399' },
    { key: 'equipes',       label: 'Equipes',          icon: 'people-circle',       layer: 'Domínio', color: '#60A5FA' },
    { key: 'plantio',       label: 'Plantio',          icon: 'git-branch',          layer: 'Operação', color: '#6EE7B7' },
    { key: 'adubacao',      label: 'Adubação',         icon: 'flask',               layer: 'Operação', color: '#FCD34D' },
    { key: 'aplicacoes',    label: 'Aplicações',       icon: 'water',               layer: 'Operação', color: '#93C5FD' },
    { key: 'colheita',      label: 'Colheita',         icon: 'basket',              layer: 'Operação', color: '#F87171' },
    { key: 'monitoramento', label: 'Monitoramento',    icon: 'pulse',               layer: 'Operação', color: '#A78BFA' },
    { key: 'compras',       label: 'Compras',          icon: 'cart',                layer: 'Financeiro', color: '#FB923C' },
    { key: 'estoque',       label: 'Estoque / Silo',   icon: 'cube',                layer: 'Financeiro', color: '#FBBF24' },
    { key: 'custos',        label: 'Custos',           icon: 'cash',                layer: 'Financeiro', color: '#F472B6' },
    { key: 'vendas',        label: 'Vendas',           icon: 'trending-up',         layer: 'Financeiro', color: '#34D399' },
    { key: 'relatorios',    label: 'Relatórios',       icon: 'bar-chart',           layer: 'Inteligência', color: '#C084FC' },
    { key: 'caderno',       label: 'Caderno de Campo', icon: 'journal',             layer: 'Inteligência', color: '#67E8F9' },
    { key: 'usuarios',      label: 'Usuários',         icon: 'shield-checkmark',    layer: 'Core', color: '#EF4444' },
];

const ACTIONS = [
    { key: 'ver',    label: 'Ver',    icon: 'eye' },
    { key: 'criar',  label: 'Criar',  icon: 'add-circle' },
    { key: 'editar', label: 'Editar', icon: 'pencil' },
    { key: 'excluir',label: 'Excluir',icon: 'trash' },
];

// Permissões padrão por role
const ROLE_DEFAULTS = {
    ADMIN: Object.fromEntries(MODULES.map(m => [m.key, { ver: true, criar: true, editar: true, excluir: true }])),
    TECNICO: Object.fromEntries(MODULES.map(m => [m.key, {
        ver: true,
        criar: !['usuarios', 'relatorios', 'custos', 'vendas'].includes(m.key),
        editar: !['usuarios', 'relatorios', 'custos', 'vendas'].includes(m.key),
        excluir: false,
    }])),
    OPERADOR: Object.fromEntries(MODULES.map(m => [m.key, {
        ver: ['talhoes', 'culturas', 'plantio', 'adubacao', 'aplicacoes', 'colheita', 'estoque'].includes(m.key),
        criar: ['plantio', 'adubacao', 'colheita'].includes(m.key),
        editar: false,
        excluir: false,
    }])),
};

const ROLES = [
    { id: 'ADMIN',    label: 'Administrador', icon: 'shield-checkmark', color: '#EF4444', desc: 'Acesso total ao sistema' },
    { id: 'TECNICO',  label: 'Técnico',        icon: 'construct',        color: '#F59E0B', desc: 'Operações e relatórios' },
    { id: 'OPERADOR', label: 'Operador',        icon: 'person',           color: '#10B981', desc: 'Campo e produção' },
];

const buildDefaultPermissions = (role) => ROLE_DEFAULTS[role] || ROLE_DEFAULTS.OPERADOR;
const getLayerColor = (layer) => {
    if (layer === 'Core') return '#EF4444';
    if (layer === 'Domínio') return '#8B5CF6';
    if (layer === 'Operação') return '#10B981';
    if (layer === 'Financeiro') return '#F59E0B';
    return '#60A5FA';
};

// ─────────────────────────────────────────────────────────────────────────────
export default function UsuariosScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(null); // null | 'FORM' | 'PERMISSIONS'
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');

    // Form State
    const [editId, setEditId] = useState(null);
    const [formNome, setFormNome] = useState('');
    const [formLogin, setFormLogin] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formTelefone, setFormTelefone] = useState('');
    const [formSenha, setFormSenha] = useState('');
    const [formRole, setFormRole] = useState('OPERADOR');
    const [formActive, setFormActive] = useState(true);
    const [formPerms, setFormPerms] = useState(buildDefaultPermissions('OPERADOR'));
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try { setItems(await getUsuarios()); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openNew = () => {
        setEditId(null);
        setFormNome(''); setFormLogin(''); setFormEmail('');
        setFormTelefone(''); setFormSenha('');
        setFormRole('OPERADOR'); setFormActive(true);
        setFormPerms(buildDefaultPermissions('OPERADOR'));
        setStep('FORM');
    };

    const openEdit = (item) => {
        setEditId(item.id);
        setFormNome(item.nome_completo || '');
        setFormLogin(item.usuario || '');
        setFormEmail(item.email || '');
        setFormTelefone(item.telefone || '');
        setFormSenha('');
        setFormRole(item.nivel === 'ADM' ? 'ADMIN' : item.nivel || 'OPERADOR');
        setFormActive(item.ativo !== false);
        try { setFormPerms(item.permissoes ? JSON.parse(item.permissoes) : buildDefaultPermissions(item.nivel === 'ADM' ? 'ADMIN' : 'OPERADOR')); }
        catch { setFormPerms(buildDefaultPermissions('OPERADOR')); }
        setStep('FORM');
    };

    const applyRoleDefaults = (role) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setFormRole(role);
        setFormPerms(buildDefaultPermissions(role));
    };

    const togglePerm = (module, action) => {
        setFormPerms(prev => ({
            ...prev,
            [module]: { ...prev[module], [action]: !prev[module]?.[action] }
        }));
    };

    const toggleAllModule = (moduleKey, value) => {
        setFormPerms(prev => ({
            ...prev,
            [moduleKey]: Object.fromEntries(ACTIONS.map(a => [a.key, value]))
        }));
    };

    const handleSave = async () => {
        if (!formLogin.trim() || (!editId && !formSenha.trim())) {
            return Alert.alert('Campos obrigatórios', 'Login e senha são obrigatórios.');
        }
        const dados = {
            id: editId || undefined,
            usuario: formLogin.toUpperCase(),
            senha: formSenha || undefined,
            nivel: formRole === 'ADMIN' ? 'ADM' : formRole,
            nome_completo: formNome.toUpperCase(),
            email: formEmail.toLowerCase(),
            telefone: formTelefone,
            ativo: formActive,
            permissoes: JSON.stringify(formPerms),
        };
        try {
            if (editId) { await updateUsuario(dados); }
            else { await insertUsuario(dados); }
            setStep(null);
            loadData();
        } catch {
            Alert.alert('Erro', 'Falha ao salvar. Verifique se o login já existe.');
        }
    };

    const handleDelete = (item) => {
        if (item.usuario === 'ADMIN') return Alert.alert('Protegido', 'O usuário master não pode ser removido.');
        Alert.alert('Remover Acesso', `Remover ${item.nome_completo || item.usuario}?`, [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Remover', style: 'destructive', onPress: async () => { await deleteUsuario(item.id); loadData(); } }
        ]);
    };

    const filteredItems = items.filter(i => {
        const matchSearch = !searchQuery || (i.nome_completo + i.usuario + i.email).toLowerCase().includes(searchQuery.toLowerCase());
        const matchRole = filterRole === 'ALL' || i.nivel === (filterRole === 'ADMIN' ? 'ADM' : filterRole);
        return matchSearch && matchRole;
    });

    const getRoleInfo = (nivel) => {
        if (nivel === 'ADM' || nivel === 'ADMIN') return ROLES[0];
        if (nivel === 'TECNICO') return ROLES[1];
        return ROLES[2];
    };

    const layers = [...new Set(MODULES.map(m => m.layer))];

    // ─── RENDER USER CARD ────────────────────────────────────────────────────
    const renderUser = ({ item }) => {
        const role = getRoleInfo(item.nivel);
        const initials = (item.nome_completo || item.usuario || '?').charAt(0).toUpperCase();
        return (
            <TouchableOpacity style={styles.userCard} onPress={() => openEdit(item)} activeOpacity={0.8}>
                <View style={[styles.userAvatar, { backgroundColor: role.color + '20', borderColor: role.color + '40' }]}>
                    <Text style={[styles.userAvatarText, { color: role.color }]}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.nome_completo || item.usuario}</Text>
                    <Text style={styles.userEmail}>{item.email || 'sem email'}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: role.color + '15', borderColor: role.color + '30' }]}>
                        <Ionicons name={role.icon} size={11} color={role.color} />
                        <Text style={[styles.roleBadgeText, { color: role.color }]}>{role.label.toUpperCase()}</Text>
                        {item.ativo === false && (
                            <View style={styles.inactiveDot} />
                        )}
                    </View>
                </View>
                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                        <Ionicons name="pencil" size={16} color="#34D399" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    // ─── PERMISSION ROW ────────────────────────────────────────
    const PermissionRow = ({ mod }) => {
        const allOn = ACTIONS.every(a => formPerms[mod.key]?.[a.key]);
        return (
            <View style={styles.permModuleRow}>
                <View style={styles.permModuleHeader}>
                    <View style={[styles.permModuleIcon, { backgroundColor: mod.color + '15' }]}>
                        <Ionicons name={mod.icon} size={16} color={mod.color} />
                    </View>
                    <Text style={styles.permModuleLabel}>{mod.label}</Text>
                    <TouchableOpacity
                        style={[styles.allToggle, allOn && { backgroundColor: mod.color + '20' }]}
                        onPress={() => toggleAllModule(mod.key, !allOn)}
                    >
                        <Text style={[styles.allToggleText, { color: allOn ? mod.color : '#6B7280' }]}>
                            {allOn ? 'TUDO ON' : 'TUDO OFF'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.permActionsRow}>
                    {ACTIONS.map(action => {
                        const active = formPerms[mod.key]?.[action.key] || false;
                        return (
                            <TouchableOpacity
                                key={action.key}
                                style={[styles.permChip, active && { backgroundColor: mod.color + '20', borderColor: mod.color + '50' }]}
                                onPress={() => togglePerm(mod.key, action.key)}
                            >
                                <Ionicons name={action.icon} size={12} color={active ? mod.color : '#4B5563'} />
                                <Text style={[styles.permChipText, { color: active ? mod.color : '#4B5563' }]}>{action.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    // ─── MAIN ─────────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <LinearGradient colors={['#050B08', '#0A120E', '#030504']} style={StyleSheet.absoluteFill} />
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <SafeAreaView style={{ flex: 1 }}>
                {/* HEADER */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
                        <Ionicons name="arrow-back" size={22} color="#D1FAE5" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>Usuários <Text style={{ color: '#34D399' }}>&</Text> Acessos</Text>
                        <Text style={styles.headerSub}>AgroGB OS — Controle de Permissões</Text>
                    </View>
                    <TouchableOpacity style={styles.addBtnHeader} onPress={openNew}>
                        <Ionicons name="add" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* STATS STRIP */}
                <View style={styles.statsStrip}>
                    {ROLES.map(r => {
                        const count = items.filter(u => {
                            if (r.id === 'ADMIN') return u.nivel === 'ADM' || u.nivel === 'ADMIN';
                            return u.nivel === r.id;
                        }).length;
                        return (
                            <View key={r.id} style={[styles.statCard, { borderColor: r.color + '30' }]}>
                                <Ionicons name={r.icon} size={18} color={r.color} />
                                <Text style={[styles.statNum, { color: r.color }]}>{count}</Text>
                                <Text style={styles.statLabel}>{r.label}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* SEARCH + FILTER */}
                <View style={styles.searchRow}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={16} color="#6B7280" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar usuário..."
                            placeholderTextColor="#4B5563"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 20, maxHeight: 48 }}>
                    {['ALL', ...ROLES.map(r => r.id)].map(role => {
                        const active = filterRole === role;
                        const info = role === 'ALL' ? { color: '#9CA3AF', label: 'Todos' } : ROLES.find(r => r.id === role);
                        return (
                            <TouchableOpacity
                                key={role}
                                style={[styles.filterChip, active && { backgroundColor: info.color + '20', borderColor: info.color + '60' }]}
                                onPress={() => setFilterRole(role)}
                            >
                                <Text style={[styles.filterChipText, { color: active ? info.color : '#6B7280' }]}>
                                    {role === 'ALL' ? 'TODOS' : info?.label?.toUpperCase()}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* USER LIST */}
                {loading ? (
                    <View style={styles.center}><ActivityIndicator size="large" color="#34D399" /></View>
                ) : (
                    <FlatList
                        data={filteredItems}
                        keyExtractor={i => i.id.toString()}
                        renderItem={renderUser}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyBox}>
                                <View style={styles.emptyRing}>
                                    <MaterialCommunityIcons name="account-group-outline" size={40} color="rgba(52,211,153,0.3)" />
                                </View>
                                <Text style={styles.emptyTitle}>Nenhum usuário</Text>
                                <Text style={styles.emptyDesc}>Adicione membros da sua equipe para controlar acessos ao AgroGB OS.</Text>
                                <TouchableOpacity style={styles.emptyActionBtn} onPress={openNew}>
                                    <Text style={styles.emptyActionText}>+ Criar Primeiro Usuário</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>

            {/* ── MODAL: FORM (STEP 1) ─────────────────────────────────── */}
            <Modal visible={step === 'FORM'} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={styles.modalSheet}>
                        {/* Handle */}
                        <View style={styles.modalHandle} />

                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>{editId ? '✏️ Editar Perfil' : '👤 Novo Usuário'}</Text>
                            <TouchableOpacity onPress={() => setStep(null)} style={styles.closeBtn}>
                                <Ionicons name="close" size={22} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>

                            {/* ROLE SELECTION */}
                            <Text style={styles.sectionLabel}>TIPO DE ACESSO</Text>
                            <View style={styles.roleRow}>
                                {ROLES.map(r => (
                                    <TouchableOpacity
                                        key={r.id}
                                        style={[styles.roleCard, formRole === r.id && { borderColor: r.color, backgroundColor: r.color + '15' }]}
                                        onPress={() => applyRoleDefaults(r.id)}
                                    >
                                        <Ionicons name={r.icon} size={22} color={formRole === r.id ? r.color : '#6B7280'} />
                                        <Text style={[styles.roleCardLabel, { color: formRole === r.id ? r.color : '#9CA3AF' }]}>{r.label}</Text>
                                        <Text style={[styles.roleCardDesc, { color: '#6B7280' }]}>{r.desc}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* DADOS BÁSICOS */}
                            <Text style={styles.sectionLabel}>DADOS DO USUÁRIO</Text>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>NOME COMPLETO</Text>
                                <View style={styles.inputBox}>
                                    <Ionicons name="person-outline" size={16} color="#6B7280" />
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="Ex: João Silva"
                                        placeholderTextColor="#4B5563"
                                        value={formNome}
                                        onChangeText={setFormNome}
                                    />
                                </View>
                            </View>

                            <View style={styles.rowGrid}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.formLabel}>LOGIN</Text>
                                    <View style={styles.inputBox}>
                                        <Ionicons name="at" size={16} color="#6B7280" />
                                        <TextInput
                                            style={styles.formInput}
                                            placeholder="joao.silva"
                                            placeholderTextColor="#4B5563"
                                            value={formLogin}
                                            onChangeText={t => setFormLogin(t.replace(/\s/g, '').toUpperCase())}
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.formLabel}>SENHA {editId ? '(deixe para manter)' : '*'}</Text>
                                    <View style={styles.inputBox}>
                                        <Ionicons name="lock-closed-outline" size={16} color="#6B7280" />
                                        <TextInput
                                            style={[styles.formInput, { flex: 1 }]}
                                            placeholder="••••••"
                                            placeholderTextColor="#4B5563"
                                            value={formSenha}
                                            onChangeText={setFormSenha}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={16} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>EMAIL</Text>
                                <View style={styles.inputBox}>
                                    <Ionicons name="mail-outline" size={16} color="#6B7280" />
                                    <TextInput
                                        style={styles.formInput}
                                        placeholder="nome@fazenda.com"
                                        placeholderTextColor="#4B5563"
                                        value={formEmail}
                                        onChangeText={setFormEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.rowGrid}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.formLabel}>TELEFONE</Text>
                                    <View style={styles.inputBox}>
                                        <Ionicons name="call-outline" size={16} color="#6B7280" />
                                        <TextInput
                                            style={styles.formInput}
                                            placeholder="(00) 99999-0000"
                                            placeholderTextColor="#4B5563"
                                            value={formTelefone}
                                            onChangeText={setFormTelefone}
                                            keyboardType="phone-pad"
                                        />
                                    </View>
                                </View>
                                <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                                    <Text style={styles.formLabel}>CONTA ATIVA</Text>
                                    <View style={[styles.inputBox, { justifyContent: 'space-between' }]}>
                                        <Text style={{ color: formActive ? '#34D399' : '#EF4444', fontWeight: '800', fontSize: 12 }}>
                                            {formActive ? 'ATIVO' : 'INATIVO'}
                                        </Text>
                                        <Switch
                                            value={formActive}
                                            onValueChange={setFormActive}
                                            trackColor={{ true: '#10B981', false: '#374151' }}
                                            thumbColor={formActive ? '#34D399' : '#9CA3AF'}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* PERMISSIONS BUTTON */}
                            <TouchableOpacity style={styles.permissionsNavBtn} onPress={() => setStep('PERMISSIONS')}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.permissionsNavTitle}>🔐 Configurar Permissões por Módulo</Text>
                                    <Text style={styles.permissionsNavSub}>
                                        Permissões aplicadas automaticamente pelo role. Personalize por módulo.
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#34D399" />
                            </TouchableOpacity>

                            {/* SAVE */}
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <LinearGradient colors={['#10B981', '#047857']} style={styles.saveBtnGradient}>
                                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                    <Text style={styles.saveBtnText}>SALVAR USUÁRIO</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ── MODAL: PERMISSIONS (STEP 2) ─────────────────────────── */}
            <Modal visible={step === 'PERMISSIONS'} animationType="slide" transparent>
                <View style={styles.modalBg}>
                    <View style={[styles.modalSheet, { height: '95%' }]}>
                        <View style={styles.modalHandle} />

                        <View style={styles.modalHeaderRow}>
                            <View>
                                <Text style={styles.modalTitle}>🔐 Permissões</Text>
                                <Text style={{ color: '#6B7280', fontSize: 11 }}>Role: {ROLES.find(r => r.id === formRole)?.label}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setStep('FORM')} style={styles.closeBtn}>
                                <Ionicons name="arrow-back" size={22} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                            {layers.map(layer => {
                                const layerModules = MODULES.filter(m => m.layer === layer);
                                const lColor = getLayerColor(layer);
                                return (
                                    <View key={layer} style={styles.layerSection}>
                                        <View style={[styles.layerHeader, { borderLeftColor: lColor }]}>
                                            <Text style={[styles.layerTitle, { color: lColor }]}>{layer.toUpperCase()}</Text>
                                        </View>
                                        {layerModules.map(mod => <PermissionRow key={mod.key} mod={mod} />)}
                                    </View>
                                );
                            })}
                        </ScrollView>

                        <TouchableOpacity style={styles.saveBtn} onPress={() => setStep('FORM')}>
                            <LinearGradient colors={['#10B981', '#047857']} style={styles.saveBtnGradient}>
                                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                                <Text style={styles.saveBtnText}>CONFIRMAR PERMISSÕES</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },

    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 15 : 20, paddingBottom: 15 },
    backBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 0.3 },
    headerSub: { fontSize: 11, color: '#6B7280', marginTop: 2 },
    addBtnHeader: { marginLeft: 'auto', width: 42, height: 42, borderRadius: 14, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },

    statsStrip: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 15 },
    statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1 },
    statNum: { fontSize: 22, fontWeight: '900', marginTop: 4 },
    statLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '800', letterSpacing: 1, marginTop: 3 },

    searchRow: { paddingHorizontal: 20, marginBottom: 12 },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, paddingHorizontal: 15, height: 48, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 10 },
    searchInput: { flex: 1, color: '#FFF', fontSize: 14 },

    filterChip: { marginRight: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    filterChipText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },

    listContent: { padding: 20, paddingBottom: 100 },
    userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderTopColor: 'rgba(255,255,255,0.1)' },
    userAvatar: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 14, borderWidth: 1 },
    userAvatarText: { fontSize: 22, fontWeight: '900' },
    userName: { color: '#FFF', fontSize: 15, fontWeight: '900' },
    userEmail: { color: '#6B7280', fontSize: 11, marginTop: 2 },
    roleBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, marginTop: 6, gap: 5 },
    roleBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    inactiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444', marginLeft: 4 },
    cardActions: { gap: 8 },
    editBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(52,211,153,0.1)', justifyContent: 'center', alignItems: 'center' },
    deleteBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.1)', justifyContent: 'center', alignItems: 'center' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 },
    emptyRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: 'rgba(52,211,153,0.2)', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', marginBottom: 8 },
    emptyDesc: { color: '#6B7280', fontSize: 13, textAlign: 'center', lineHeight: 20 },
    emptyActionBtn: { marginTop: 20, backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(52,211,153,0.3)' },
    emptyActionText: { color: '#34D399', fontWeight: '900', fontSize: 13 },

    // ── MODAL ──────────────────────────────────────
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
    modalSheet: { width: '90%', maxWidth: 500, alignSelf: 'center', backgroundColor: '#0D1711', borderRadius: 32, padding: 24, maxHeight: '90%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderTopColor: 'rgba(255,255,255,0.15)' },
    modalHandle: { display: 'none' },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
    modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
    closeBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' },

    sectionLabel: { color: '#6B7280', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 12, marginTop: 4 },

    roleRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    roleCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 6 },
    roleCardLabel: { fontSize: 11, fontWeight: '900', textAlign: 'center' },
    roleCardDesc: { fontSize: 9, textAlign: 'center', fontWeight: '600' },

    formGroup: { marginBottom: 14 },
    formLabel: { color: '#6B7280', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 8 },
    rowGrid: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    inputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, paddingHorizontal: 14, height: 54, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 10 },
    formInput: { flex: 1, color: '#FFF', fontSize: 14, fontWeight: '600' },

    permissionsNavBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(52,211,153,0.05)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(52,211,153,0.2)', marginTop: 20, marginBottom: 10, gap: 12 },
    permissionsNavTitle: { color: '#FFF', fontSize: 14, fontWeight: '900', marginBottom: 4 },
    permissionsNavSub: { color: '#6B7280', fontSize: 11, lineHeight: 16 },

    saveBtn: { marginTop: 15, shadowColor: '#10B981', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 10 },
    saveBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, gap: 10 },
    saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },

    // ── PERMISSIONS ─────────────────────────────────────────
    layerSection: { marginBottom: 20 },
    layerHeader: { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 12 },
    layerTitle: { fontSize: 11, fontWeight: '900', letterSpacing: 2 },

    permModuleRow: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
    permModuleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
    permModuleIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    permModuleLabel: { flex: 1, color: '#FFF', fontSize: 13, fontWeight: '800' },
    allToggle: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    allToggleText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },

    permActionsRow: { flexDirection: 'row', gap: 8 },
    permChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', gap: 4 },
    permChipText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
});

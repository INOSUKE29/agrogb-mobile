import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuidv4 } from 'uuid';
import { LinearGradient } from 'expo-linear-gradient';

import { insertCliente, executeQuery } from '../database/database';
import { showToast } from '../components/ui/Toast';

export default function ClienteFormScreen({ navigation, route }) {
    const { cliente, returnTo } = route.params || {};
    const isEditing = !!cliente;
    const [loading, setLoading] = useState(false);

    const getExtendedData = (clienteObj) => {
        if (!clienteObj) return { tipo: 'CLIENTE', ativo: true };
        return {
            tipo: clienteObj.tipo_cliente || 'CLIENTE',
            ativo: clienteObj.ativo !== 0,
            email: clienteObj.email || '',
            telefone2: clienteObj.telefone_secundario || '',
            cidade: clienteObj.cidade || '',
            estado: clienteObj.estado || '',
            obs: clienteObj.observacao_interna || ''
        };
    };

    const extendedData = getExtendedData(cliente);

    // States
    const [nome, setNome] = useState(cliente?.nome || '');
    const [telefone, setTelefone] = useState(cliente?.telefone || '');
    const [endereco, setEndereco] = useState(cliente?.endereco || '');
    const [cpf, setCpf] = useState(cliente?.cpf_cnpj || '');
    const [tipo, setTipo] = useState(extendedData.tipo || 'CLIENTE');
    const [ativo, setAtivo] = useState(extendedData.ativo !== false);
    const [email, setEmail] = useState(extendedData.email || '');
    const [telefone2, setTelefone2] = useState(extendedData.telefone2 || '');
    const [cidade, setCidade] = useState(extendedData.cidade || '');
    const [estado, setEstado] = useState(extendedData.estado || '');
    const [observacaoInterna, setObservacaoInterna] = useState(extendedData.obs || '');

    // Focus state for generic input glow
    const [focusedField, setFocusedField] = useState(null);

    const handleSave = async () => {
        if (!nome.trim()) { 
            Alert.alert('ObrigatÃ³rio', 'Nome ou Empresa Ã© obrigatÃ³rio.'); 
            return; 
        }
        setLoading(true);
        try {
            const clientData = { 
                id: cliente?.id, 
                uuid: cliente?.uuid || uuidv4(), 
                nome: nome.toUpperCase(), 
                telefone, 
                endereco: endereco ? endereco.toUpperCase() : '', 
                cpf_cnpj: cpf, 
                observacao: '', // Limpo, já que usamos observacao_interna 
                tipo_cliente: tipo,
                email,
                telefone_secundario: telefone2,
                cidade,
                estado,
                observacao_interna: observacaoInterna,
                ativo: ativo ? 1 : 0
            };
            
            const now = new Date().toISOString();

            if (isEditing) {
                await executeQuery(
                    `UPDATE v2_clientes SET nome=?, telefone=?, endereco=?, cpf_cnpj=?, observacao=?, tipo_cliente=?, email=?, telefone_secundario=?, cidade=?, estado=?, observacao_interna=?, ativo=?, updated_at=?, sync_status='pending' WHERE id=?`, 
                    [clientData.nome, clientData.telefone, clientData.endereco, clientData.cpf_cnpj, clientData.observacao, clientData.tipo_cliente, clientData.email, clientData.telefone_secundario, clientData.cidade, clientData.estado, clientData.observacao_interna, clientData.ativo, now, clientData.id]
                );
            } else {
                await executeQuery(
                    `INSERT INTO v2_clientes (id, nome, cpf_cnpj, telefone, telefone_secundario, email, cidade, estado, endereco, observacao, observacao_interna, tipo_cliente, ativo, created_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
                    [clientData.uuid, clientData.nome, clientData.cpf_cnpj, clientData.telefone, clientData.telefone_secundario, clientData.email, clientData.cidade, clientData.estado, clientData.endereco, clientData.observacao, clientData.observacao_interna, clientData.tipo_cliente, clientData.ativo, now]
                );
            }
            
            // Queue sync (Outbox) - Using the actual V2 schema
            const payload = JSON.stringify({
                id: clientData.uuid,
                nome: clientData.nome,
                cpf_cnpj: clientData.cpf_cnpj,
                telefone: clientData.telefone,
                email: clientData.email,
                cidade: clientData.cidade,
                estado: clientData.estado,
                endereco: clientData.endereco,
                tipo_cliente: clientData.tipo_cliente,
                ativo: clientData.ativo === 1
            });
            await executeQuery(
                `INSERT INTO sync_outbox (uuid, tabela, registro_uuid, acao, payload_json, status, criado_em) VALUES (?, ?, ?, ?, ?, 'PENDENTE', ?)`,
                [uuidv4(), 'v2_clientes', clientData.uuid, isEditing ? 'UPDATE' : 'INSERT', payload, now]
            );

            showToast(isEditing ? 'Cadastro editado com sucesso!' : 'Parceiro salvo com sucesso!');

            if (returnTo === 'Vendas' && !isEditing) {
                navigation.navigate('Vendas', { newClient: clientData });
            } else {
                navigation.goBack();
            }
        } catch (err) { 
            console.error(err); 
            Alert.alert('Erro', 'Falha ao processar o cadastro.'); 
        } finally { 
            setLoading(false); 
        }
    };

    // UI HELPER: Custom Input
    const renderInput = (label, value, onChange, placeholder, fieldKey, multi = false, half = false, keyboardType="default") => {
        const isFocused = focusedField === fieldKey;
        return (
            <View style={[styles.field, half && { flex: 1 }]}>
                <Text style={styles.label}>{label}</Text>
                <View style={[
                    styles.inputContainer,
                    multi && { height: 100, alignItems: 'flex-start' },
                    isFocused && styles.inputContainerFocused
                ]}>
                    <TextInput
                        style={[styles.input, multi && { height: 90, textAlignVertical: 'top', paddingTop: 15 }]}
                        value={value}
                        onChangeText={onChange}
                        placeholder={placeholder}
                        placeholderTextColor="#475569"
                        onFocus={() => setFocusedField(fieldKey)}
                        onBlur={() => setFocusedField(null)}
                        multiline={multi}
                        keyboardType={keyboardType}
                        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'characters'}
                        maxLength={fieldKey === 'estado' ? 2 : undefined}
                    />
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <SafeAreaView style={{ flex: 1 }}>
                
                {/* Header Premium */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>{isEditing ? 'EDITAR DADOS' : 'NOVO REGISTRO'}</Text>
                        <Text style={styles.headerSub}>CRM do Sistema</Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    
                    {/* SessÃ£o 1: Controle/Status */}
                    <View style={styles.groupCard}>
                        <Text style={styles.sectionHeader}>CLASSIFICAÃ‡ÃƒO DO REGISTRO</Text>
                        
                        <View style={styles.pillContainer}>
                            {[
                                { id: 'CLIENTE', label: 'CLIENTE', icon: 'person', color: '#3B82F6' },
                                { id: 'FORNECEDOR', label: 'FORNECEDOR', icon: 'cube', color: '#F59E0B' },
                                { id: 'PARCEIRO', label: 'PARCEIRO', icon: 'briefcase', color: '#10B981' }
                            ].map(m => {
                                const active = tipo === m.id;
                                return (
                                    <TouchableOpacity
                                        key={m.id}
                                        style={[styles.pill, active && { borderColor: m.color, backgroundColor: m.color + '15' }]}
                                        onPress={() => setTipo(m.id)}
                                    >
                                        <Ionicons name={m.icon} size={14} color={active ? m.color : '#64748B'} />
                                        <Text style={[styles.pillText, active && { color: m.color }]}>{m.label}</Text>
                                        {active && <View style={[styles.glowDot, { backgroundColor: m.color }]} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <View style={styles.toggleRow}>
                            <Text style={styles.toggleText}>Status Operacional na Base</Text>
                            <TouchableOpacity 
                                style={[styles.toggleBtn, ativo ? styles.toggleActive : styles.toggleInactive]}
                                onPress={() => setAtivo(!ativo)}
                            >
                                <View style={[styles.toggleCircle, ativo ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* SessÃ£o 2: InformaÃ§Ãµes Principais */}
                    <Text style={styles.groupTitleDivider}>IDENTIFICAÃ‡ÃƒO</Text>
                    {renderInput('NOME COMPLETO / RAZÃƒO SOCIAL', nome, setNome, 'Ex: JoÃ£o Silva ou Agrotech LTDA', 'nome')}
                    {renderInput('CPF / CNPJ (Somente NÃºmeros)', cpf, setCpf, '12345678900', 'cpf', false, false, 'numeric')}

                    {/* SessÃ£o 3: Contatos */}
                    <Text style={styles.groupTitleDivider}>CONTATOS DIRETOS</Text>
                    <View style={{ flexDirection: 'row', gap: 15 }}>
                        {renderInput('ATENDIMENTO (WHATSAPP)', telefone, setTelefone, '(11) 999...', 'tel1', false, true, 'phone-pad')}
                        {renderInput('TELEFONE FIXO/EXTRA', telefone2, setTelefone2, '(11) 321...', 'tel2', false, true, 'phone-pad')}
                    </View>
                    {renderInput('ENDEREÃ‡O DE E-MAIL', email, setEmail, 'contato@email.com', 'email', false, false, 'email-address')}

                    {/* SessÃ£o 4: EndereÃ§amento */}
                    <Text style={styles.groupTitleDivider}>LOGÃSTICA / ENDEREÃ‡O</Text>
                    {renderInput('LOGRADOURO, NÃšMERO E BAIRRO', endereco, setEndereco, 'Rua das Ostras, 10 - Centro', 'end')}
                    <View style={{ flexDirection: 'row', gap: 15 }}>
                        {renderInput('MUNICÃPIO / CIDADE', cidade, setCidade, 'SÃ£o Paulo', 'cidade', false, true)}
                        <View style={{ width: 80 }}>
                            {renderInput('UF', estado, setEstado, 'SP', 'estado', false)}
                        </View>
                    </View>

                    {renderInput('OBSERVAÃ‡Ã•ES E NOTAS INTERNAS', observacaoInterna, setObservacaoInterna, 'AnotaÃ§Ãµes gerais visÃ­veis com a operaÃ§Ã£o...', 'obs', true)}

                    {/* AÃ§Ãµes */}
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.cancelBtnText}>VOLTAR</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.saveBtnBox} onPress={handleSave} disabled={loading}>
                            <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.saveBtnGradient}>
                                <Text style={styles.saveBtnText}>{loading ? 'PROCESSANDO...' : 'SALVAR REGISTRO'}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                    <View style={{ height: 40 }}/>
                </ScrollView>
            </SafeAreaView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 30, paddingBottom: 20 },
    backButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 15 },
    headerTitle: { color: '#FFF', fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
    headerSub: { color: '#3B82F6', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    
    // Inputs (Copied from AdubacaoForm Screen Premium Style)
    field: { marginBottom: 20 },
    label: { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
    inputContainer: { backgroundColor: 'rgba(15, 23, 42, 0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, height: 56, justifyContent: 'center' },
    inputContainerFocused: { borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.05)' },
    input: { flex: 1, color: '#F8FAFC', fontSize: 15, fontWeight: '600', paddingHorizontal: 16, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },

    // Sections
    groupTitleDivider: { color: '#3B82F6', fontSize: 13, fontWeight: '900', letterSpacing: 1.5, marginVertical: 20 },
    groupCard: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 10 },
    sectionHeader: { color: '#94A3B8', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginBottom: 15 },

    // Pills
    pillContainer: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    pill: { flex: 1, height: 56, borderRadius: 14, backgroundColor: 'rgba(15, 23, 42, 0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' },
    pillText: { color: '#64748B', fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 1 },
    glowDot: { position: 'absolute', bottom: -1, width: 20, height: 3, borderRadius: 2, shadowOpacity: 1, shadowRadius: 5 },

    // Toggle
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 12 },
    toggleText: { color: '#E2E8F0', fontSize: 13, fontWeight: '700' },
    toggleBtn: { width: 46, height: 26, borderRadius: 13, padding: 2, justifyContent: 'center' },
    toggleActive: { backgroundColor: '#10B981' },
    toggleInactive: { backgroundColor: '#475569' },
    toggleCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF' },

    // Actions
    actionRow: { flexDirection: 'row', gap: 15, marginTop: 25 },
    cancelBtn: { flex: 0.8, height: 60, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)' },
    cancelBtnText: { color: '#94A3B8', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
    saveBtnBox: { flex: 1.2, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
    saveBtnGradient: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});


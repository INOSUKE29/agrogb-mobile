import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, StatusBar as RNStatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { v4 as uuidv4 } from 'uuid';
import { insertCliente, executeQuery } from '../database/database';
import { AppInput } from '../ui/components/AppInput';
import { AppButton } from '../ui/components/AppButton';
import AppContainer from '../ui/AppContainer';
import ScreenHeader from '../ui/ScreenHeader';
import GlowCard from '../ui/GlowCard';
import { DARK } from '../styles/darkTheme';

export default function ClienteFormScreen({ navigation, route }) {
    const { cliente, returnTo } = route.params || {};
    const isEditing = !!cliente;
    const [loading, setLoading] = useState(false);

    const getExtendedData = (obs) => {
        if (!obs) return { tipo: 'CLIENTE', ativo: true };
        try { if (obs.startsWith('{')) return JSON.parse(obs); } catch (e) { }
        const match = obs.match(/\[TIPO:(.*?)\]/);
        return { tipo: match ? match[1] : 'CLIENTE', ativo: true };
    };

    const extendedData = getExtendedData(cliente?.observacao);

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

    const handleSave = async () => {
        if (!nome.trim()) { Alert.alert('Atenção', 'Nome / Empresa é obrigatório.'); return; }
        setLoading(true);
        try {
            const payloadJSON = { tipo, ativo, email, telefone2, cidade, estado, obs: observacaoInterna };
            const obsStr = JSON.stringify(payloadJSON);
            const clientData = { id: cliente?.id, uuid: cliente?.uuid || uuidv4(), nome: nome.toUpperCase(), telefone, endereco: endereco ? endereco.toUpperCase() : '', cpf_cnpj: cpf, observacao: obsStr, tipo };
            if (isEditing) {
                await executeQuery(`UPDATE clientes SET nome=?, telefone=?, endereco=?, cpf_cnpj=?, observacao=? WHERE id=?`, [clientData.nome, clientData.telefone, clientData.endereco, clientData.cpf_cnpj, clientData.observacao, clientData.id]);
            } else {
                await insertCliente({ uuid: clientData.uuid, nome: clientData.nome, telefone: clientData.telefone, endereco: clientData.endereco, cpf_cnpj: clientData.cpf_cnpj, observacao: clientData.observacao });
            }
            if (returnTo === 'Vendas' && !isEditing) navigation.navigate('Vendas', { newClient: clientData });
            else navigation.goBack();
        } catch (e) { console.error(e); Alert.alert('Erro', 'Falha ao salvar cliente.'); } finally { setLoading(false); }
    };

    const TIPOS = ['CLIENTE', 'FORNECEDOR', 'PARCEIRO'];

    return (
        <AppContainer>
            <RNStatusBar barStyle="light-content" backgroundColor={DARK.bg} />
            <ScreenHeader title={isEditing ? 'EDITAR CADASTRO' : 'NOVO PARCEIRO'} onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* TIPO & STATUS */}
                <GlowCard style={{ marginBottom: 16 }}>
                    <Text style={styles.sectionTitle}>CONTROLE DE CADASTRO</Text>
                    <View style={styles.typeRow}>
                        {TIPOS.map(t => (
                            <TouchableOpacity key={t} style={[styles.chip, tipo === t && styles.chipActive]} onPress={() => setTipo(t)}>
                                <Text style={[styles.chipText, tipo === t && { color: '#061E1A' }]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                        <Text style={{ flex: 1, color: DARK.textSecondary, fontWeight: 'bold' }}>Cadastro ativo no sistema?</Text>
                        <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: ativo ? DARK.glow : 'rgba(255,255,255,0.1)' }]} onPress={() => setAtivo(!ativo)}>
                            <Text style={{ color: ativo ? '#061E1A' : DARK.textMuted, fontWeight: 'bold', fontSize: 12 }}>{ativo ? 'ATIVO' : 'INATIVO'}</Text>
                        </TouchableOpacity>
                    </View>
                </GlowCard>

                {/* DADOS PRINCIPAIS */}
                <GlowCard style={{ marginBottom: 16 }}>
                    <Text style={styles.sectionTitle}>DADOS PRINCIPAIS</Text>
                    <AppInput label="NOME / EMPRESA *" icon="person-outline" placeholder="EX: JOÃO SILVA" value={nome} onChangeText={t => setNome(t.toUpperCase())} />
                    <AppInput label="CPF / CNPJ" icon="card-outline" placeholder="Apenas números (opcional)" value={cpf} onChangeText={setCpf} keyboardType="numeric" />
                </GlowCard>

                {/* CONTATO */}
                <GlowCard style={{ marginBottom: 16 }}>
                    <Text style={styles.sectionTitle}>CONTATO</Text>
                    <AppInput label="TELEFONE PRINCIPAL (WhatsApp)" icon="logo-whatsapp" placeholder="(00) 00000-0000" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
                    <AppInput label="TELEFONE SECUNDÁRIO" icon="call-outline" placeholder="(00) 00000-0000 (Opcional)" value={telefone2} onChangeText={setTelefone2} keyboardType="phone-pad" />
                    <AppInput label="E-MAIL" icon="mail-outline" placeholder="email@exemplo.com" value={email} onChangeText={t => setEmail(t.toLowerCase())} keyboardType="email-address" />
                </GlowCard>

                {/* LOCALIZAÇÃO */}
                <GlowCard style={{ marginBottom: 16 }}>
                    <Text style={styles.sectionTitle}>LOCALIZAÇÃO</Text>
                    <AppInput label="ENDEREÇO COMPLETO" icon="location-outline" placeholder="Rua, Número, Bairro" value={endereco} onChangeText={t => setEndereco(t.toUpperCase())} />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 2 }}>
                            <AppInput label="CIDADE" placeholder="EX: CASCAVEL" value={cidade} onChangeText={t => setCidade(t.toUpperCase())} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppInput label="ESTADO" placeholder="PR" value={estado} onChangeText={t => setEstado(t.toUpperCase())} maxLength={2} />
                        </View>
                    </View>
                </GlowCard>

                {/* OBSERVAÇÕES */}
                <GlowCard style={{ marginBottom: 24 }}>
                    <Text style={styles.sectionTitle}>OBSERVAÇÕES INTERNAS</Text>
                    <AppInput placeholder="Anotações adicionais sobre o cliente..." value={observacaoInterna} onChangeText={setObservacaoInterna} multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />
                </GlowCard>
            </ScrollView>

            {/* FOOTER */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
                    <Text style={{ color: DARK.textMuted, fontWeight: 'bold' }}>VOLTAR</Text>
                </TouchableOpacity>
                <AppButton title={loading ? 'SALVANDO...' : 'SALVAR CLIENTE'} onPress={handleSave} loading={loading} style={{ flex: 2 }} />
            </View>
        </AppContainer>
    );
}

const styles = StyleSheet.create({
    content: { padding: 20, paddingBottom: 120 },
    sectionTitle: { fontSize: 10, fontWeight: '900', color: DARK.glow, letterSpacing: 1.5, marginBottom: 16 },
    typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: DARK.glowBorder, backgroundColor: 'rgba(0,255,156,0.05)' },
    chipActive: { backgroundColor: DARK.glow, borderColor: DARK.glow },
    chipText: { fontSize: 12, fontWeight: 'bold', color: DARK.textSecondary },
    toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: DARK.modal, padding: 20, borderTopWidth: 1, borderTopColor: DARK.glowBorder, flexDirection: 'row', gap: 12, alignItems: 'center' },
    cancelBtn: { flex: 1, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: DARK.glowBorder, alignItems: 'center', justifyContent: 'center' },
});

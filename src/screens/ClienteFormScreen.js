import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator, StatusBar as RNStatusBar } from 'react-native';
import { COLORS } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { v4 as uuidv4 } from 'uuid';
import { insertCliente, executeQuery } from '../database/database';
import { AppInput } from '../ui/components/AppInput';
import { AppButton } from '../ui/components/AppButton';

export default function ClienteFormScreen({ navigation, route }) {
    const { cliente, returnTo } = route.params || {};
    const isEditing = !!cliente;

    const [loading, setLoading] = useState(false);

    // --- PARSE JSON EVOLUTIVO ---
    const getExtendedData = (obs) => {
        if (!obs) return { tipo: 'CLIENTE', ativo: true };
        try {
            if (obs.startsWith('{')) {
                return JSON.parse(obs);
            }
        } catch (e) { }

        // Legacy Support [TIPO:X]
        const match = obs.match(/\[TIPO:(.*?)\]/);
        return { tipo: match ? match[1] : 'CLIENTE', ativo: true };
    };

    const extendedData = getExtendedData(cliente?.observacao);

    // Form State Básicos
    const [nome, setNome] = useState(cliente?.nome || '');
    const [telefone, setTelefone] = useState(cliente?.telefone || '');
    const [endereco, setEndereco] = useState(cliente?.endereco || '');
    const [cpf, setCpf] = useState(cliente?.cpf_cnpj || '');

    // Form State Novos (Guardados em JSON dentro de observacao)
    const [tipo, setTipo] = useState(extendedData.tipo || 'CLIENTE');
    const [ativo, setAtivo] = useState(extendedData.ativo !== false);
    const [email, setEmail] = useState(extendedData.email || '');
    const [telefone2, setTelefone2] = useState(extendedData.telefone2 || '');
    const [cidade, setCidade] = useState(extendedData.cidade || '');
    const [estado, setEstado] = useState(extendedData.estado || '');
    const [observacaoInterna, setObservacaoInterna] = useState(extendedData.obs || '');

    const handleSave = async () => {
        if (!nome.trim()) {
            Alert.alert('Atenção', 'Nome / Empresa é obrigatório.');
            return;
        }

        setLoading(true);
        try {
            // Empacotar dados novos em JSON compatível
            const payloadJSON = {
                tipo,
                ativo,
                email,
                telefone2,
                cidade,
                estado,
                obs: observacaoInterna
            };
            const obsStr = JSON.stringify(payloadJSON);

            const clientData = {
                id: cliente?.id,
                uuid: cliente?.uuid || uuidv4(),
                nome: nome.toUpperCase(),
                telefone,
                endereco: endereco ? endereco.toUpperCase() : '',
                cpf_cnpj: cpf,
                observacao: obsStr, // Salva o JSON estruturado aqui
                tipo // Para propósitos de callback navigation
            };

            if (isEditing) {
                await executeQuery(
                    `UPDATE clientes SET nome=?, telefone=?, endereco=?, cpf_cnpj=?, observacao=? WHERE id=?`,
                    [clientData.nome, clientData.telefone, clientData.endereco, clientData.cpf_cnpj, clientData.observacao, clientData.id]
                );
            } else {
                await insertCliente({
                    uuid: clientData.uuid,
                    nome: clientData.nome,
                    telefone: clientData.telefone,
                    endereco: clientData.endereco,
                    cpf_cnpj: clientData.cpf_cnpj,
                    observacao: clientData.observacao
                });
            }

            if (returnTo === 'Vendas' && !isEditing) {
                navigation.navigate('Vendas', { newClient: clientData });
            } else {
                navigation.goBack();
            }

        } catch (e) {
            console.error(e);
            Alert.alert('Erro', 'Falha ao salvar cliente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <RNStatusBar barStyle="light-content" backgroundColor={COLORS.backgroundDark} />

            {/* Dark Gradient Background */}
            <LinearGradient
                colors={[COLORS.backgroundDark, '#052e22']}
                style={StyleSheet.absoluteFill}
            />

            {/* HEADER */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{isEditing ? 'EDITAR CADASTRO' : 'NOVO CADASTRO'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* STATUS & TIPO */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>CONTROLE DE CADASTRO</Text>

                    <View style={styles.typeRow}>
                        {['CLIENTE', 'FORNECEDOR', 'PARCEIRO'].map(t => {
                            const isActive = tipo === t;
                            return (
                                <TouchableOpacity
                                    key={t}
                                    style={[
                                        styles.typeChip,
                                        isActive && { backgroundColor: COLORS.primary, borderColor: COLORS.primary }
                                    ]}
                                    onPress={() => setTipo(t)}
                                >
                                    <Text style={[styles.typeText, isActive ? { color: '#FFF' } : { color: COLORS.gray500 }]}>{t}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 15 }}>
                        <Text style={{ flex: 1, color: COLORS.text, fontWeight: 'bold' }}>Cadastro Ativo no Sistema?</Text>
                        <TouchableOpacity
                            style={{ backgroundColor: ativo ? COLORS.success : COLORS.gray500, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                            onPress={() => setAtivo(!ativo)}
                        >
                            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{ativo ? 'SIM (ATIVO)' : 'INATIVO'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* FORM BLOCKS VISUAIS */}
                <View style={[styles.card, { marginTop: 20 }]}>
                    <Text style={styles.sectionTitle}>DADOS PRINCIPAIS</Text>
                    <AppInput
                        label="NOME / EMPRESA *"
                        icon="person-outline"
                        placeholder="EX: JOÃO SILVA"
                        value={nome}
                        onChangeText={t => setNome(t.toUpperCase())}
                    />
                    <AppInput
                        label="CPF / CNPJ"
                        icon="card-outline"
                        placeholder="Apenas números (opcional)"
                        value={cpf}
                        onChangeText={setCpf}
                        keyboardType="numeric"
                    />
                </View>

                <View style={[styles.card, { marginTop: 20 }]}>
                    <Text style={styles.sectionTitle}>CONTATO</Text>
                    <AppInput
                        label="TELEFONE PRINCIPAL (WhatsApp)"
                        icon="logo-whatsapp"
                        placeholder="(00) 00000-0000"
                        value={telefone}
                        onChangeText={setTelefone}
                        keyboardType="phone-pad"
                    />
                    <AppInput
                        label="TELEFONE SECUNDÁRIO"
                        icon="call-outline"
                        placeholder="(00) 00000-0000 (Opcional)"
                        value={telefone2}
                        onChangeText={setTelefone2}
                        keyboardType="phone-pad"
                    />
                    <AppInput
                        label="E-MAIL"
                        icon="mail-outline"
                        placeholder="email@exemplo.com"
                        value={email}
                        onChangeText={t => setEmail(t.toLowerCase())}
                        keyboardType="email-address"
                    />
                </View>

                <View style={[styles.card, { marginTop: 20 }]}>
                    <Text style={styles.sectionTitle}>LOCALIZAÇÃO</Text>
                    <AppInput
                        label="ENDEREÇO COMPLETO"
                        icon="location-outline"
                        placeholder="Rua, Número, Bairro"
                        value={endereco}
                        onChangeText={t => setEndereco(t.toUpperCase())}
                    />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 2 }}>
                            <AppInput
                                label="CIDADE"
                                placeholder="EX: CASCAVEL"
                                value={cidade}
                                onChangeText={t => setCidade(t.toUpperCase())}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <AppInput
                                label="ESTADO"
                                placeholder="PR"
                                value={estado}
                                onChangeText={t => setEstado(t.toUpperCase())}
                                maxLength={2}
                            />
                        </View>
                    </View>
                </View>

                <View style={[styles.card, { marginTop: 20 }]}>
                    <Text style={styles.sectionTitle}>OBSERVAÇÕES INTERNAS</Text>
                    <AppInput
                        placeholder="Anotações adicionais sobre o cliente..."
                        value={observacaoInterna}
                        onChangeText={setObservacaoInterna}
                        multiline
                        style={{ minHeight: 80, textAlignVertical: 'top' }}
                    />
                </View>

            </ScrollView>

            {/* FOOTER ACTION */}
            <View style={styles.footer}>
                <AppButton
                    title="CANCELAR"
                    onPress={() => navigation.goBack()}
                    variant="glass"
                    style={{ flex: 1, marginRight: 10 }}
                    textStyle={{ color: COLORS.white }}
                />

                <AppButton
                    title="SALVAR CLIENTE"
                    onPress={handleSave}
                    loading={loading}
                    style={{ flex: 2 }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.backgroundDark },
    header: {
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24
    },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, letterSpacing: 1 },
    backBtn: { padding: 8 },

    content: { padding: 20, paddingBottom: 100 },

    card: {
        backgroundColor: COLORS.surface, // Branco em Light mode
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        elevation: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.primaryLight, // Light Green on Dark
        marginBottom: 20,
        letterSpacing: 1
    },

    typeRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    typeChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        backgroundColor: 'rgba(0,0,0,0.2)'
    },
    typeText: { fontSize: 12, fontWeight: 'bold', color: COLORS.gray500 },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.surface, // Dark Surface Footer
        padding: 20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        elevation: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: COLORS.glassBorder
    }
});

import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, Clipboard, Share, Alert, 
    TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Linking 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AgronomistService } from '../services/AgronomistService';
import Card from '../components/common/Card';
import AgroButton from '../components/common/AgroButton';

export default function AgronomistLinkScreen({ navigation }) {
    const { theme } = useTheme();
    const { user, role } = useAuth();
    const [code, setCode] = useState('');
    const [agronomistCode, setAgronomistCode] = useState(null);
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [connecting, setConnecting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            if (role === 'AGRONOMO') {
                const myCode = await AgronomistService.getAgronomistCode(user.uuid);
                setAgronomistCode(myCode);
            }
            const activeLinks = await AgronomistService.getActiveLinks(user.uuid, role);
            setLinks(activeLinks);
        } catch (e) {
            console.log('Erro ao carregar dados de vínculo:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        if (!code || code.trim().length === 0) {
            return Alert.alert('Atenção', 'Digite o código de convite do agrônomo.');
        }

        setConnecting(true);
        try {
            const res = await AgronomistService.linkWithAgronomist(user.uuid, code.trim());
            if (res.success) {
                Alert.alert('🎉 Conectado!', 'Seu agrônomo agora tem acesso aos talhões para emitir recomendações técnicas.');
                setCode('');
                loadData();
            } else {
                Alert.alert('Erro', res.error || 'Não foi possível conectar.');
            }
        } catch (err) {
            Alert.alert('Erro', 'Falha ao processar o vínculo.');
        } finally {
            setConnecting(false);
        }
    };

    const handleCopyCode = () => {
        if (agronomistCode) {
            Clipboard.setString(agronomistCode);
            Alert.alert('Copiado!', 'Código de convite copiado para a área de transferência.');
        }
    };

    const handleShareCode = async () => {
        if (!agronomistCode) return;
        try {
            const message = `Olá! Sou seu engenheiro agrônomo no AgroGB. Utilize meu código de convite no app para vincularmos sua lavoura e eu poder te enviar prescrições técnicas:\n\n👉 *${agronomistCode}*\n\nAbra o menu do app AgroGB, clique em "Vincular Agrônomo" e digite este código.`;
            await Share.share({ message });
        } catch (e) {
            console.log(e);
        }
    };

    const handleContact = (phone) => {
        if (!phone) return;
        const cleanPhone = phone.replace(/\D/g, '');
        Linking.openURL(`https://wa.me/55${cleanPhone}`);
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#064E3B', '#10B981']} style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.title}>VÍNCULO TÉCNICO</Text>
                <Text style={styles.subtitle}>Conecte agrônomos e produtores rurais.</Text>
            </LinearGradient>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10B981" />
                    <Text style={styles.loadingText}>Carregando conexões...</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {role === 'AGRONOMO' ? (
                        /* ================= AGRÔNOMO VIEW ================= */
                        <View style={{ gap: 20 }}>
                            <Card style={styles.premiumCard}>
                                <Ionicons name="ribbon-outline" size={40} color="#FFF" style={styles.cardIcon} />
                                <Text style={styles.cardTitle}>Seu Código de Conexão</Text>
                                <Text style={styles.cardSubtitle}>Compartilhe com seus clientes para que eles se vinculem a você no app.</Text>
                                
                                <View style={styles.codeContainer}>
                                    <Text style={styles.codeText}>{agronomistCode || 'GERANDO...'}</Text>
                                    <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
                                        <Ionicons name="copy-outline" size={20} color="#064E3B" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity style={styles.shareBtn} onPress={handleShareCode}>
                                    <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
                                    <Text style={styles.shareBtnText}>COMPARTILHAR NO WHATSAPP</Text>
                                </TouchableOpacity>
                            </Card>

                            <Text style={styles.sectionHeader}>SEUS CLIENTES VINCULADOS ({links.length})</Text>

                            {links.length === 0 ? (
                                <Card style={styles.emptyCard}>
                                    <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                                    <Text style={styles.emptyTitle}>Nenhum produtor vinculado</Text>
                                    <Text style={styles.emptySubtitle}>Compartilhe seu código acima para iniciar a consultoria digital.</Text>
                                </Card>
                            ) : (
                                links.map((link) => (
                                    <Card key={link.uuid} style={styles.linkCard}>
                                        <View style={styles.linkInfo}>
                                            <View style={styles.avatarMini}>
                                                <Ionicons name="person" size={20} color="#10B981" />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.linkName}>{link.client_name}</Text>
                                                <Text style={styles.linkMeta}>{link.client_email || 'Sem e-mail'}</Text>
                                            </View>
                                        </View>
                                        
                                        {link.client_phone && (
                                            <TouchableOpacity 
                                                style={styles.contactBtn} 
                                                onPress={() => handleContact(link.client_phone)}
                                            >
                                                <Ionicons name="logo-whatsapp" size={18} color="#10B981" />
                                                <Text style={styles.contactBtnText}>CONVERSAR</Text>
                                            </TouchableOpacity>
                                        )}
                                    </Card>
                                ))
                            )}
                        </View>
                    ) : (
                        /* ================= CLIENTE (PRODUTOR) VIEW ================= */
                        <View style={{ gap: 20 }}>
                            {links.length > 0 ? (
                                // Cliente já possui agrônomo vinculado
                                <View style={{ gap: 20 }}>
                                    <Text style={styles.sectionHeader}>SEU AGRÔNOMO RESPONSÁVEL</Text>
                                    
                                    {links.map((link) => (
                                        <Card key={link.uuid} style={[styles.linkCard, { flexDirection: 'column', alignItems: 'stretch', padding: 25 }]}>
                                            <View style={styles.linkInfo}>
                                                <View style={[styles.avatarMini, { width: 50, height: 50, borderRadius: 25 }]}>
                                                    <Ionicons name="ribbon" size={24} color="#10B981" />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.linkName, { fontSize: 18 }]}>{link.agronomist_name}</Text>
                                                    <Text style={styles.linkMeta}>Engenheiro Agrônomo / Técnico</Text>
                                                </View>
                                            </View>

                                            <View style={styles.metaRow}>
                                                <Ionicons name="mail-outline" size={16} color="#6B7280" />
                                                <Text style={styles.metaText}>{link.agronomist_email || 'Não informado'}</Text>
                                            </View>

                                            {link.agronomist_phone && (
                                                <View style={styles.metaRow}>
                                                    <Ionicons name="logo-whatsapp" size={16} color="#10B981" />
                                                    <Text style={styles.metaText}>{link.agronomist_phone}</Text>
                                                </View>
                                            )}

                                            <TouchableOpacity 
                                                style={[styles.shareBtn, { backgroundColor: '#10B981', marginTop: 15 }]} 
                                                onPress={() => handleContact(link.agronomist_phone)}
                                            >
                                                <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
                                                <Text style={styles.shareBtnText}>FALAR COM AGRÔNOMO</Text>
                                            </TouchableOpacity>
                                        </Card>
                                    ))}
                                    
                                    <Card style={styles.infoCard}>
                                        <Ionicons name="information-circle-outline" size={22} color="#047857" />
                                        <Text style={styles.infoText}>
                                            Seu agrônomo vinculado pode ver seus talhões e culturas de forma remota para emitir diagnósticos e prescrições de adubação.
                                        </Text>
                                    </Card>
                                </View>
                            ) : (
                                // Cliente não possui agrônomo, mostra form para vincular
                                <View style={{ gap: 20 }}>
                                    <Card style={styles.connectFormCard}>
                                        <Ionicons name="link-outline" size={32} color="#10B981" />
                                        <Text style={styles.formTitle}>Vincular Novo Agrônomo</Text>
                                        <Text style={styles.formSubtitle}>
                                            Digite o código de 9 dígitos (ex: AGRO-83A1) fornecido pelo seu engenheiro agrônomo.
                                        </Text>

                                        <TextInput 
                                            style={styles.input}
                                            placeholder="AGRO-XXXX"
                                            placeholderTextColor="#9CA3AF"
                                            value={code}
                                            onChangeText={setCode}
                                            autoCapitalize="characters"
                                            maxLength={9}
                                        />

                                        <AgroButton 
                                            title="CONECTAR AGRÔNOMO"
                                            onPress={handleConnect}
                                            loading={connecting}
                                        />
                                    </Card>

                                    <Card style={styles.infoCard}>
                                        <Ionicons name="information-circle-outline" size={22} color="#047857" />
                                        <Text style={styles.infoText}>
                                            Ainda não tem um agrônomo vinculado? Você mesmo pode criar seus planejamentos manuais ou compartilhar o acesso com sua equipe técnica.
                                        </Text>
                                    </Card>
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: { paddingTop: 60, paddingBottom: 35, paddingHorizontal: 25, borderBottomLeftRadius: 35, borderBottomRightRadius: 35 },
    backBtn: { marginBottom: 15 },
    title: { color: '#FFF', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
    subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 5, fontWeight: '600' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    loadingText: { fontSize: 14, color: '#4B5563', fontWeight: '600' },
    scroll: { padding: 20, paddingBottom: 100 },
    
    /* Premium card for Agronomist Code display */
    premiumCard: { backgroundColor: '#064E3B', borderRadius: 25, padding: 25, alignItems: 'center', borderBottomWidth: 5, borderColor: '#047857' },
    cardIcon: { marginBottom: 10 },
    cardTitle: { fontSize: 18, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
    cardSubtitle: { fontSize: 12, color: '#D1FAE5', textAlign: 'center', marginTop: 6, lineHeight: 18, opacity: 0.8 },
    codeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 15, paddingHorizontal: 20, paddingVertical: 12, marginTop: 20, width: '100%', justifyContent: 'space-between' },
    codeText: { fontSize: 24, fontWeight: '900', color: '#064E3B', letterSpacing: 2 },
    copyBtn: { padding: 5 },
    shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#10B981', borderRadius: 15, width: '100%', paddingVertical: 15, marginTop: 15 },
    shareBtnText: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 1 },

    /* Link list cards */
    sectionHeader: { fontSize: 11, fontWeight: '900', color: '#6B7280', letterSpacing: 1.5, marginBottom: 10, marginTop: 10 },
    linkCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, borderRadius: 20, backgroundColor: '#FFF', gap: 15 },
    linkInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    avatarMini: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0F2FE', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' },
    linkName: { fontSize: 15, fontWeight: '900', color: '#111827' },
    linkMeta: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '500' },
    contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderColor: '#10B981', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
    contactBtnText: { fontSize: 11, fontWeight: '900', color: '#10B981' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
    metaText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },

    /* Form view for Producer */
    connectFormCard: { padding: 25, borderRadius: 25, alignItems: 'center', gap: 15 },
    formTitle: { fontSize: 18, fontWeight: '900', color: '#111827' },
    formSubtitle: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 20, fontWeight: '500' },
    input: { width: '100%', backgroundColor: '#F3F4F6', borderRadius: 15, paddingVertical: 15, paddingHorizontal: 20, fontSize: 20, fontWeight: '900', color: '#111827', textAlign: 'center', letterSpacing: 2, borderWidth: 1.5, borderColor: '#E5E7EB', marginVertical: 10 },

    /* Empty states and general information */
    emptyCard: { padding: 40, alignItems: 'center', gap: 10, borderRadius: 25 },
    emptyTitle: { fontSize: 16, fontWeight: '900', color: '#4B5563' },
    emptySubtitle: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 18, fontWeight: '500' },
    infoCard: { flexDirection: 'row', padding: 20, backgroundColor: '#D1FAE5', borderRadius: 20, borderLeftWidth: 4, borderColor: '#047857', gap: 12 },
    infoText: { flex: 1, fontSize: 12, color: '#065F46', lineHeight: 18, fontWeight: '600' }
});

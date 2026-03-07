import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, Dimensions, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { executeQuery, insertUsuario } from '../database/database';
import AgroInput from '../ui/components/AgroInput';

// Botão Simples embutido para garantir a cor verde caso o AgroButton genérico tenha cache de azul
const GreenButton = ({ title, onPress, loading }) => (
    <TouchableOpacity style={styles.greenBtn} onPress={onPress} disabled={loading}>
        <Text style={styles.greenBtnText}>{loading ? 'CARREGANDO...' : title}</Text>
    </TouchableOpacity>
);

const { height } = Dimensions.get('window');

// Fundo rural provisório (pode ser trocado por um asset local depois)
const RURAL_BG = { uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80' };

export default function LoginScreen({ navigation }) {
    const [usuario, setUsuario] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const init = async () => {
            // Verificar Auto-Login (Sessão Persistida Offline)
            const userJson = await AsyncStorage.getItem('user_session');
            if (userJson) {
                navigation.replace('Home');
                return;
            }

            // Criar Usuário ADMIN Padrão (Sem depender de Servidor)
            try {
                const res = await executeQuery('SELECT COUNT(*) as qtd FROM usuarios');
                if (res.rows.item(0).qtd === 0) {
                    await insertUsuario({
                        usuario: 'ADMIN',
                        senha: '1234', // Senha corrigida
                        nivel: 'ADMIN',
                        nome_completo: 'Administrador Padrão',
                        email: 'admin',
                        telefone: '0000',
                        endereco: ''
                    });
                } else {
                    // Forçar atualização da senha do Admin caso tenha sido criada como 123 por engano nas builds anteriores
                    await executeQuery("UPDATE usuarios SET senha = '1234' WHERE usuario = 'ADMIN' AND senha = '123'");
                }
            } catch (error) {
                console.log('Erro ao inicializar admin:', error);
            }
        };
        init();
    }, []);

    const handleLogin = async () => {
        const userTrim = usuario.trim().toUpperCase();
        const passTrim = senha.trim();

        if (!userTrim || !passTrim) return Alert.alert('Atenção', 'Informe seu telefone/email e senha.');

        setLoading(true);
        try {
            const phoneClean = userTrim.replace(/\D/g, '');

            // Buscar por usuário, email ou telefone
            const sql = `SELECT * FROM usuarios WHERE is_deleted = 0 AND (usuario = ? OR telefone = ? OR usuario = ? OR email = ?)`;
            const params = [userTrim, userTrim, phoneClean, userTrim];

            const res = await executeQuery(sql, params);

            if (res.rows.length > 0) {
                const userRow = res.rows.item(0);
                const hash = userRow.senha;

                let isValid = false;
                if (hash && hash.startsWith('$2')) {
                    const bcrypt = require('react-native-bcrypt');
                    const isaac = require('isaac');
                    bcrypt.setRandomFallback((len) => {
                        const buf = new Uint8Array(len);
                        return buf.map(() => Math.floor(isaac.random() * 256));
                    });
                    isValid = bcrypt.compareSync(passTrim, hash);
                } else {
                    isValid = (hash === passTrim);
                }

                if (isValid) {
                    const sessionData = {
                        id: userRow.id,
                        usuario: userRow.usuario,
                        nome: userRow.nome_completo || userRow.usuario,
                        nivel: userRow.nivel,
                        timestamp: new Date().getTime()
                    };
                    await AsyncStorage.setItem('user_session', JSON.stringify(sessionData));
                    navigation.replace('Home');
                } else {
                    Alert.alert('Acesso Negado', 'Senha incorreta.');
                }
            } else {
                Alert.alert('Não Encontrado', 'Usuário não cadastrado no banco local.');
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Erro', 'Falha ao processar login.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground source={RURAL_BG} style={styles.container}>
            {/* Overlay Verde Escuro Transparente */}
            <View style={styles.overlay} />

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.inner}>
                <View style={styles.header}>
                    <Ionicons name="leaf" size={60} color="#10B981" style={{ marginBottom: 10 }} />
                    <Text style={styles.logoText}>AGROGB</Text>
                    <Text style={styles.tagline}>Gestão Inteligente Rural</Text>
                </View>

                <View style={styles.formCard}>
                    <AgroInput
                        label="TELEFONE OU EMAIL"
                        placeholder="Ex: admin ou (11) 99999-9999"
                        value={usuario}
                        onChangeText={(t) => setUsuario(t.toUpperCase())}
                        autoCapitalize="none"
                    />

                    <AgroInput
                        label="SENHA DE ACESSO"
                        placeholder="••••••••"
                        value={senha}
                        onChangeText={setSenha}
                        secureTextEntry
                    />

                    <GreenButton title="ENTRAR" onPress={handleLogin} loading={loading} />

                    <View style={styles.linksRow}>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>Esqueci minha senha</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.linkTextBold}>Criar conta</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={{ textAlign: 'center', marginTop: 30, color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 'bold' }}>SISTEMA PRO AGRÍCOLA v8.0</Text>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#064E3B' },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6, 78, 59, 0.85)' },
    inner: { flex: 1, justifyContent: 'center', padding: 25 },
    header: { alignItems: 'center', marginBottom: 40 },
    logoText: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
    tagline: { fontSize: 13, color: '#A7F3D0', fontWeight: 'bold', marginTop: 5, letterSpacing: 1 },
    formCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 30, elevation: 15, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20 },
    greenBtn: { backgroundColor: '#10B981', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, elevation: 2 },
    greenBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
    linksRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 },
    linkText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
    linkTextBold: { fontSize: 12, color: '#10B981', fontWeight: 'bold' }
});

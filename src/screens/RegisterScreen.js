import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { register } from "../services/authService";
import { validatePassword, validateUser } from "../utils/validators";

export default function RegisterScreen({ navigation }) {
    const [user, setUser] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async () => {
        if (!validateUser(user)) {
            return Alert.alert("Erro", "Usuário deve ter pelo menos 3 caracteres");
        }
        if (!validatePassword(password)) {
            return Alert.alert("Erro", "Senha deve ter pelo menos 6 caracteres");
        }
        if (password !== confirm) {
            return Alert.alert("Erro", "As senhas não conferem");
        }

        setLoading(true);
        const recoveryCode = await register(user, password);
        setLoading(false);

        Alert.alert(
            "Conta Criada com Sucesso!",
            `Guarde seu CÓDIGO DE RECUPERAÇÃO com segurança:\n\n${recoveryCode}\n\nVocê precisará dele caso esqueça a senha.`,
            [{ text: "FAZER LOGIN", onPress: () => navigation.navigate("Login") }]
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0B3D2E" />
            <LinearGradient colors={['#0B3D2E', '#114B36']} style={StyleSheet.absoluteFill} />

            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* HEADER */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.title}>Nova Conta</Text>
                        <Text style={styles.subtitle}>Cadastre-se para acessar o AgroGB</Text>
                    </View>

                    {/* CARD */}
                    <View style={styles.card}>

                        {/* INPUT: USUARIO */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>USUÁRIO</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#7A8793" style={styles.inputIcon} />
                                <View style={styles.verticalDivider} />
                                <TextInput
                                    style={styles.textInput}
                                    value={user}
                                    onChangeText={setUser}
                                    placeholder="Escolha um nome de usuário"
                                    placeholderTextColor="#A0A0A0"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* INPUT: SENHA */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>SENHA</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#7A8793" style={styles.inputIcon} />
                                <View style={styles.verticalDivider} />
                                <TextInput
                                    style={styles.textInput}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="Mínimo 6 caracteres"
                                    placeholderTextColor="#A0A0A0"
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#7A8793" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* INPUT: CONFIRMACAO */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>CONFIRMAR SENHA</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#7A8793" style={styles.inputIcon} />
                                <View style={styles.verticalDivider} />
                                <TextInput
                                    style={styles.textInput}
                                    value={confirm}
                                    onChangeText={setConfirm}
                                    placeholder="Repita a senha"
                                    placeholderTextColor="#A0A0A0"
                                    secureTextEntry={!showPassword}
                                />
                            </View>
                        </View>

                        {/* BOTAO CADASTRAR */}
                        <TouchableOpacity
                            style={styles.registerButton}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>CRIAR CONTA</Text>}
                        </TouchableOpacity>

                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0B3D2E" },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },

    header: { marginBottom: 30, alignItems: 'center' },
    backButton: { position: 'absolute', left: 0, top: 0, padding: 8 },
    title: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginTop: 10 },
    subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 5 },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 30,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10
    },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 11, fontWeight: 'bold', color: '#7A8793', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#E5E9EC',
        borderRadius: 12,
        height: 56,
        paddingHorizontal: 16
    },
    inputIcon: { marginRight: 12 },
    verticalDivider: { width: 1, height: 24, backgroundColor: '#E5E9EC', marginRight: 12 },
    textInput: { flex: 1, fontSize: 16, color: '#2E2E2E', height: 50 },
    eyeIcon: { padding: 8 },

    registerButton: {
        backgroundColor: '#1E7F5C',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        elevation: 2,
        shadowColor: '#1E7F5C',
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }
});

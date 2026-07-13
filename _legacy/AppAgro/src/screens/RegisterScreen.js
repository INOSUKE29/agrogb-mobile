import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator
} from "react-native";
import { register } from "../services/authService";
import { validatePassword, validateUser } from "../utils/validators";

export default function RegisterScreen({ navigation }) {
    const [user, setUser] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

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
            "Conta Criada!",
            `Guarde seu código de recuperação: ${recoveryCode}`,
            [{ text: "FAZER LOGIN", onPress: () => navigation.navigate("Login") }]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.glassCard}>
                <Text style={styles.title}>Nova Conta</Text>
                <Text style={styles.subtitle}>Junte-se ao AgroGB</Text>

                <TextInput
                    placeholder="Escolha um Usuário"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    style={styles.input}
                    value={user}
                    onChangeText={setUser}
                    autoCapitalize="none"
                />

                <TextInput
                    placeholder="Senha"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    secureTextEntry
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                />

                <TextInput
                    placeholder="Confirmar Senha"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    secureTextEntry
                    style={styles.input}
                    value={confirm}
                    onChangeText={setConfirm}
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>CADASTRAR</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.linkText}>Voltar ao Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f2e1f",
        justifyContent: "center",
        padding: 20
    },
    glassCard: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 25,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#FFF",
        textAlign: "center",
        marginBottom: 5
    },
    subtitle: {
        fontSize: 14,
        color: "#A1A1AA",
        textAlign: "center",
        marginBottom: 30
    },
    input: {
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 12,
        padding: 15,
        color: "#FFF",
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)"
    },
    button: {
        backgroundColor: "#10B981",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
        marginBottom: 20
    },
    buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
    linkText: { color: "#D1D5DB", textAlign: "center", fontSize: 14 }
});

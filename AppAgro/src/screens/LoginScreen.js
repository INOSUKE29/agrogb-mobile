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
import { login } from "../services/authService";

export default function LoginScreen({ navigation }) {
    const [user, setUser] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!user || !password) return Alert.alert("Erro", "Preencha todos os campos");

        setLoading(true);
        const result = await login(user, password);
        setLoading(false);

        if (result.success) {
            navigation.replace("Home");
        } else {
            Alert.alert("Acesso Negado", result.message);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.glassCard}>
                <Text style={styles.title}>AgroGB</Text>
                <Text style={styles.subtitle}>Acesse sua conta</Text>

                <TextInput
                    placeholder="Usuário"
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

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.buttonText}>ENTRAR</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate("Recover")}>
                    <Text style={styles.linkText}>Esqueci a senha</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate("Register")} style={{ marginTop: 20 }}>
                    <Text style={[styles.linkText, { fontWeight: 'bold', color: '#4ADE80' }]}>
                        Criar nova conta
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f2e1f", // Fundo Agrícola Escuro solicitado
        justifyContent: "center",
        padding: 20
    },
    glassCard: {
        backgroundColor: "rgba(255,255,255,0.08)", // Vidro Leve
        borderRadius: 20,
        padding: 25,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.15)",
        // Backdrop filter is web-only usually, but on mobile we simulate with opacity
    },
    title: {
        fontSize: 32,
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
        backgroundColor: "#10B981", // Green 500
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
        marginBottom: 20
    },
    buttonText: {
        color: "#FFF",
        fontWeight: "bold",
        fontSize: 16
    },
    linkText: {
        color: "#D1D5DB",
        textAlign: "center",
        fontSize: 14,
        marginTop: 10
    }
});

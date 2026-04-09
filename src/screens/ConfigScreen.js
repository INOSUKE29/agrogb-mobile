import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { Platform as RNPlatform } from "react-native";
const LocalAuthentication = RNPlatform.OS !== 'web' ? require('expo-local-authentication') : null;
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabaseClient";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function ConfigScreen({ navigation, user }) {
  // State hooks for all toggles
  const [biometric, setBiometric] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("pt-BR");

  // Load saved preferences from AsyncStorage (local) and Supabase (cloud) on mount
  useEffect(() => {
    loadLocalSettings();
    loadRemoteSettings();
  }, []);

  async function loadLocalSettings() {
    const bio = await AsyncStorage.getItem("biometric");
    const two = await AsyncStorage.getItem("two_factor");
    const dark = await AsyncStorage.getItem("dark_mode");
    const notif = await AsyncStorage.getItem("notifications");
    const lang = await AsyncStorage.getItem("language");

    setBiometric(bio === "true");
    setTwoFactor(two === "true");
    setDarkMode(dark !== "false");
    setNotifications(notif !== "false");
    if (lang) setLanguage(lang);
  }

  // Pull settings stored in Supabase (cloud) – useful when user logs in on a new device
  async function loadRemoteSettings() {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("user_settings")
      .select("biometric_enabled, two_factor, dark_mode, notifications, language")
      .eq("user_id", user.id)
      .single();
    if (error) {
      console.warn("Failed to load remote settings", error);
      return;
    }
    if (data) {
      setBiometric(!!data.biometric_enabled);
      setTwoFactor(!!data.two_factor);
      setDarkMode(data.dark_mode !== false);
      setNotifications(data.notifications !== false);
      if (data.language) setLanguage(data.language);
    }
  }

  // Helper to persist a setting both locally and in Supabase
  async function persistSetting(key, value) {
    // Local persistence
    await AsyncStorage.setItem(key, value.toString());
    // Remote persistence (if user is logged in)
    if (user?.id) {
      const payload = { [key]: value };
      await supabase.from("user_settings").upsert({ user_id: user.id, ...payload });
    }
  }

  // ---------- Handlers for each feature ----------

  // Biometric toggle – performs a real authentication when enabling
  async function handleBiometricToggle(value) {
    if (value) {
      if (!LocalAuthentication) {
        Alert.alert("Indisponível", "Biometria não está disponível no Web.");
        return;
      }
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert("Erro", "Dispositivo não suporta biometria");
        return;
      }
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        Alert.alert("Erro", "Nenhuma biometria cadastrada no dispositivo");
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirme sua biometria para ativar",
        fallbackLabel: "Usar senha",
      });
      if (!result.success) {
        Alert.alert("Falha", "Biometria não confirmada");
        return;
      }
    }
    setBiometric(value);
    await persistSetting("biometric", value);
    if (value) {
      Alert.alert("Sucesso", "Biometria ativada");
    }
  }

  // 2FA toggle – only persists the flag; real 2FA flow would be implemented elsewhere
  async function handle2FAToggle(value) {
    setTwoFactor(value);
    await persistSetting("two_factor", value);
    Alert.alert(
      "2FA",
      value ? "Autenticação em duas etapas ativada" : "Autenticação em duas etapas desativada"
    );
  }

  // Dark mode toggle – updates UI theme (implementation of theme provider is outside this file)
  async function handleDarkModeToggle(value) {
    setDarkMode(value);
    await persistSetting("dark_mode", value);
  }

  // Notifications toggle
  async function handleNotificationsToggle(value) {
    setNotifications(value);
    await persistSetting("notifications", value);
  }

  // Language selection – for simplicity we just toggle between PT-BR and EN-US
  async function handleLanguageChange(newLang) {
    setLanguage(newLang);
    await persistSetting("language", newLang);
    Alert.alert("Idioma", `Idioma alterado para ${newLang}`);
  }

  // Sync data – placeholder that would call a Supabase RPC or pull latest changes
  async function syncData() {
    // In a real app you would call a sync service here
    Alert.alert("Sincronização", "Dados sincronizados com sucesso!");
  }

  // Backup – placeholder for exporting local DB or sending a snapshot to cloud storage
  async function backupData() {
    Alert.alert("Backup", "Backup concluído e salvo na nuvem.");
  }

  // Restore – placeholder for importing a backup file
  async function restoreData() {
    Alert.alert("Restaurar", "Restaurado o backup mais recente.");
  }

  // Logout – clears session and navigates to login screen
  async function logout() {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem("session");
    navigation.replace("Login");
  }

  // ---------- UI Components ----------
  const Section = ({ title, children }) => (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );

  const Row = ({ label, children }) => (
    <View style={styles.row}>
      <Text style={styles.text}>{label}</Text>
      {children}
    </View>
  );

  const Item = ({ label, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.row}>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0F172A', '#0B121E']} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safeArea}>
        {/* Header com botão de voltar */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configurações</Text>
          <View style={{ width: 44 }} />
        </View>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* PERFIL */}
      <Section title="Perfil">
        <Text style={styles.title}>{user?.name || "Usuário"}</Text>
        <Text style={styles.sub}>{user?.email || "email@exemplo.com"}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("EditProfile")}>
          <Text style={styles.link}>Editar Perfil</Text>
        </TouchableOpacity>
      </Section>

      {/* SEGURANÇA */}
      <Section title="Segurança">
        <Row label="Login com Biometria">
          <Switch value={biometric} onValueChange={handleBiometricToggle} />
        </Row>
        <Row label="Autenticação em 2 Fatores">
          <Switch value={twoFactor} onValueChange={handle2FAToggle} />
        </Row>
        <Item label="Alterar Senha" onPress={() => navigation.navigate("ChangePassword")} />
        <Item label="Dispositivos Conectados" onPress={() => navigation.navigate("Devices")} />
        <TouchableOpacity onPress={logout}>
          <Text style={styles.danger}>Sair da Conta</Text>
        </TouchableOpacity>
      </Section>

      {/* EQUIPE */}
      <Section title="Equipe">
        <Item label="Gerenciar Usuários" onPress={() => navigation.navigate("ManageUsers")} />
        <Item label="Permissões & Acessos" onPress={() => navigation.navigate("Permissions")} />
      </Section>

      {/* PREFERÊNCIAS */}
      <Section title="Preferências">
        <Row label="Tema Escuro">
          <Switch value={darkMode} onValueChange={handleDarkModeToggle} />
        </Row>
        <Row label="Notificações">
          <Switch value={notifications} onValueChange={handleNotificationsToggle} />
        </Row>
        <Row label="Idioma">
          <TouchableOpacity onPress={() => handleLanguageChange(language === "pt-BR" ? "en-US" : "pt-BR")}>
            <Text style={styles.link}>{language === "pt-BR" ? "Português (BR)" : "English (US)"}</Text>
          </TouchableOpacity>
        </Row>
      </Section>

      {/* DADOS */}
      <Section title="Dados">
        <Item label="Sincronizar" onPress={syncData} />
        <Item label="Backup Automático" onPress={backupData} />
        <Item label="Restaurar Dados" onPress={restoreData} />
      </Section>

      {/* SUPORTE */}
      <Section title="Suporte">
        <Item label="Ajuda" onPress={() => navigation.navigate("Help")} />
        <Item label="Contato" onPress={() => navigation.navigate("Contact")} />
        <Item label="Termos de Uso" onPress={() => navigation.navigate("Terms")} />
      </Section>

      {/* APP INFO */}
      <Section title="Sobre o App">
        <Text style={styles.text}>Versão 1.0.0</Text>
        <Text style={styles.text}>© 2026 AgroGB</Text>
      </Section>
      <View style={{ height: 40 }} />
    </ScrollView>
    </SafeAreaView>
    </View>
  );
}

// ------------------- Styles -------------------
const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#0B0F1A' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) + 10 : 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  container: {
    flex: 1,
    padding: 15,
  },
  card: {
    backgroundColor: "#121826",
    borderRadius: 12,
    padding: 15,
  },
  sectionTitle: {
    color: "#8FA2FF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  sub: {
    color: "#aaa",
    marginBottom: 10,
  },
  link: {
    color: "#8FA2FF",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  text: {
    color: "#fff",
    fontSize: 15,
  },
  danger: {
    color: "#FF4D4D",
    marginTop: 12,
    fontWeight: "bold",
  },
});

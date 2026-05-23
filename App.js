import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { initDB } from './src/database/database';
import AutoSyncService from './src/services/AutoSyncService';
import { AuthService } from './src/services/authService';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ColheitaScreen from './src/screens/ColheitaScreen';
import VendasScreen from './src/screens/VendasScreen';
import EstoqueScreen from './src/screens/EstoqueScreen';
import SyncScreen from './src/screens/SyncScreen';
import ComprasScreen from './src/screens/ComprasScreen';
import PlantioScreen from './src/screens/PlantioScreen';
import CustosScreen from './src/screens/CustosScreen';
import ProcessamentoScreen from './src/screens/ProcessamentoScreen';
import RelatoriosScreen from './src/screens/RelatoriosScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MonitoramentoScreen from './src/screens/MonitoramentoScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import ClientesScreen from './src/screens/ClientesScreen';
import CulturasScreen from './src/screens/CulturasScreen';
import UsuariosScreen from './src/screens/UsuariosScreen';
import OcrScreen from './src/screens/OcrScreen';
import ScannerScreen from './src/screens/ScannerScreen';
import CadernoCampoScreen from './src/screens/CadernoCampoScreen';
import FrotaScreen from './src/screens/FrotaScreen';
import MaquinaFormScreen from './src/screens/MaquinaFormScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AdubacaoListScreen from './src/screens/AdubacaoListScreen';
import AdubacaoFormScreen from './src/screens/AdubacaoFormScreen';
import AdubacaoDetailScreen from './src/screens/AdubacaoDetailScreen';
import ClienteFormScreen from './src/screens/ClienteFormScreen';
import CadastroFormScreen from './src/screens/CadastroFormScreen';
import MenuCadastrosScreen from './src/screens/MenuCadastrosScreen';
import MenuOperacionalScreen from './src/screens/MenuOperacionalScreen';
import MenuFinanceiroScreen from './src/screens/MenuFinanceiroScreen';
import MenuAdubacaoScreen from './src/screens/MenuAdubacaoScreen';
import MenuSistemaScreen from './src/screens/MenuSistemaScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import RecoverScreen from './src/screens/RecoverScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import VerifyCodeScreen from './src/screens/VerifyCodeScreen';
import EncomendasScreen from './src/screens/EncomendasScreen';
import NovaEncomendaScreen from './src/screens/NovaEncomendaScreen';
import GraficosScreen from './src/screens/GraficosScreen';
import IntelligenceScreen from './src/screens/IntelligenceScreen';
import CategoriasDespesaScreen from './src/screens/CategoriasDespesaScreen';
import FinancialAccountsScreen from './src/screens/FinancialAccountsScreen';
import ApplicationFormScreen from './src/screens/ApplicationFormScreen';
import ConfigScreen from './src/screens/ConfigScreen';
import FertilizationScreen from './src/screens/FertilizationScreen';
import PlanoAdubacaoScreen from './src/screens/PlanoAdubacaoScreen';
import RecipeFormScreen from './src/screens/RecipeFormScreen';
import { supabase } from './src/services/supabaseClient';

// Navegadores e Telas V2
import ClientNavigator from './src/navigation/ClientNavigator';
import AdminSelectorScreen from './src/screens/admin/AdminSelectorScreen';
import AgronomistClientsScreen from './src/screens/agronomist/AgronomistClientsScreen';
import CreateRecommendationScreen from './src/screens/agronomist/CreateRecommendationScreen';
import ErrorBoundary from './src/ui/ErrorBoundary';
import { WeatherProvider } from './src/context/WeatherContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import Toast from './src/ui/Toast';

const Stack = createStackNavigator();

export default function App() {
    const [isDbReady, setIsDbReady] = useState(false);
    const [userSession, setUserSession] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [initError, setInitError] = useState(null);

    useEffect(() => {
        async function checkUpdates() {
            try {
                if (!__DEV__) {
                    const update = await Updates.checkForUpdateAsync();
                    if (update.isAvailable) {
                        console.log("Baixando atualização OTA...");
                        await Updates.fetchUpdateAsync();
                        // Recarrega o app para aplicar a atualização
                        await Updates.reloadAsync(); 
                    }
                }
            } catch (err) {
                console.log("Erro ao checar OTA Updates:", err);
            }
        }
        checkUpdates();

        // initDB inicia o sistema e a sessão do usuário
        initDB()
            .then(async () => {
                const session = await AuthService.checkSession();
                setUserSession(session);
                setIsDbReady(true);
                setIsLoading(false);
                AutoSyncService.start();
            })
            .catch(error => {
                const erroStr = error?.message || String(error);
                if (__DEV__) console.error("Falha fatal na inicialização do App:", erroStr);
                setInitError(erroStr);
                setIsDbReady(true);
                setIsLoading(false);
            });

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (__DEV__) console.log(`[App] Evento Auth: ${event}`);
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                setUserSession(prev => session ? {
                    ...prev,
                    userId: session.user.id,
                    email: session.user.email,
                    token: session.access_token
                } : null);
            } else if (event === 'SIGNED_OUT') {
                setUserSession(null);
            }
        });

        return () => {
            AutoSyncService.stop();
            authListener?.subscription.unsubscribe();
        };
    }, []);

    if (isLoading || !isDbReady) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0B121E', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={{ color: '#64748B', marginTop: 10 }}>AgroGB - V{Updates.runtimeVersion || '1.2.1'} 2026</Text>
            </View>
        );
    }

    if (initError) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0B121E', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Erro Crítico</Text>
                <Text style={{ color: '#fff', textAlign: 'center' }}>Não foi possível iniciar o aplicativo:</Text>
                <Text style={{ color: '#F87171', textAlign: 'center', marginTop: 10 }}>{initError}</Text>
            </View>
        );
    }

    return (
        <View style={styles.webRoot}>
            <View style={styles.appContainer}>
                <GestureHandlerRootView style={{ flex: 1 }}>
            <ErrorBoundary>
                <ThemeProvider>
                    <WeatherProvider>
                        <StatusBar style="light" />
                        <NavigationContainer>
                            <Stack.Navigator
                                screenOptions={{
                                    headerShown: false,
                                    headerStyle: { backgroundColor: '#10B981' },
                                    headerTintColor: '#fff',
                                    headerTitleStyle: { fontWeight: 'bold' },
                                    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                                    transitionSpec: {
                                        open: { animation: 'timing', config: { duration: 250 } },
                                        close: { animation: 'timing', config: { duration: 250 } }
                                    }
                                }}
                            >
                                {!userSession ? (
                                    // STACK DE AUTENTICAÇÃO (Sempre blindada contra loops)
                                    <>
                                        <Stack.Screen name="Login" options={{ headerShown: false }}>
                                            {(props) => <LoginScreen {...props} onLoginSuccess={(sess) => setUserSession(sess)} />}
                                        </Stack.Screen>
                                        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Recuperar Senha' }} />
                                        <Stack.Screen name="Recover" component={RecoverScreen} options={{ title: 'Recuperação' }} />
                                        <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} options={{ title: 'Verificar Código' }} />
                                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Nova Senha' }} />
                                    </>
                                ) : (
                                    // STACK DO APLICATIVO (Só renderiza se estiver logado)
                                    <>
                                        <Stack.Screen name="SessionRouter" options={{ headerShown: false }}>
                                            {(props) => {
                                                React.useEffect(() => {
                                                    const role = userSession?.role || 'AGRONOMO';
                                                    if (role === 'CLIENTE') props.navigation.replace('ClientTabs');
                                                    else if (role === 'ADMIN') props.navigation.replace('AdminSelector');
                                                    else props.navigation.replace('Dashboard');
                                                }, []);
                                                return <View style={{ flex: 1, backgroundColor: '#0B121E' }} />;
                                            }}
                                        </Stack.Screen>
                                        <Stack.Screen name="ClientTabs" component={ClientNavigator} options={{ headerShown: false }} />
                                        <Stack.Screen name="AdminSelector" component={AdminSelectorScreen} options={{ headerShown: false }} />
                                        <Stack.Screen name="AgronomistClients" component={AgronomistClientsScreen} options={{ headerShown: false }} />
                                        <Stack.Screen name="CreateRecommendation" component={CreateRecommendationScreen} options={{ headerShown: false }} />
                                        <Stack.Screen name="Dashboard" component={HomeScreen} options={{ headerShown: false }} />
                                        <Stack.Screen name="Colheita" component={ColheitaScreen} options={{ title: 'Registrar Colheita' }} />
                                        <Stack.Screen name="Vendas" component={VendasScreen} options={{ title: 'Registrar Venda' }} />
                                        <Stack.Screen name="Estoque" component={EstoqueScreen} options={{ title: 'Consultar Estoque' }} />
                                        <Stack.Screen name="Sync" component={SyncScreen} />
                                        {/* Profile foi movido para baixo com options */}
                                        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
                                        <Stack.Screen name="Settings" component={SettingsScreen} />
                                        {/* MenuCadastros foi movido para baixo com options */}
                                        <Stack.Screen name="Compras" component={ComprasScreen} options={{ title: 'Registrar Compra' }} />
                                        <Stack.Screen name="Plantio" component={PlantioScreen} options={{ title: 'Registrar Plantio' }} />
                                        <Stack.Screen name="Custos" component={CustosScreen} options={{ title: 'Registrar Custo' }} />
                                        <Stack.Screen name="Processamento" component={ProcessamentoScreen} options={{ title: 'Perdas' }} />
                                        <Stack.Screen name="Cadastro" component={CadastroScreen} options={{ title: 'Cadastros Gerais' }} />
                                        <Stack.Screen name="Clientes" component={ClientesScreen} options={{ title: 'Gerenciar Clientes' }} />
                                        <Stack.Screen name="Culturas" component={CulturasScreen} options={{ title: 'Culturas e Áreas' }} />
                                        <Stack.Screen name="Relatorios" component={RelatoriosScreen} options={{ title: 'Relatórios' }} />
                                        <Stack.Screen name="Usuarios" component={UsuariosScreen} options={{ title: 'Controle de Usuários' }} />
                                        <Stack.Screen name="Monitoramento" component={MonitoramentoScreen} options={{ title: 'Monitoramento' }} />
                                        <Stack.Screen name="Ocr" component={OcrScreen} options={{ headerShown: false }} />
                                        <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false }} />
                                        <Stack.Screen name="CadernoCampo" component={CadernoCampoScreen} options={{ title: 'Caderno de Campo' }} />
                                        <Stack.Screen name="Frota" component={FrotaScreen} options={{ title: 'Gestão de Frota' }} />
                                        <Stack.Screen name="MaquinaForm" component={MaquinaFormScreen} options={{ title: 'Cadastro de Máquina' }} />
                                        <Stack.Screen name="Profile" options={{ title: 'Meu Perfil' }}>
                                            {(props) => <ProfileScreen {...props} onLogout={() => setUserSession(null)} />}
                                        </Stack.Screen>
                                        <Stack.Screen name="AdubacaoList" component={AdubacaoListScreen} options={{ title: 'Planos de Adubação' }} />
                                        <Stack.Screen name="AdubacaoForm" component={AdubacaoFormScreen} options={{ title: 'Novo Plano' }} />
                                        <Stack.Screen name="AdubacaoDetail" component={AdubacaoDetailScreen} options={{ title: 'Detalhes do Plano' }} />
                                        <Stack.Screen name="ClienteForm" component={ClienteFormScreen} options={{ title: 'Novo Cliente' }} />
                                        <Stack.Screen name="CadastroForm" component={CadastroFormScreen} options={{ title: 'Novo Cadastro' }} />
                                        <Stack.Screen name="MenuCadastros" component={MenuCadastrosScreen} options={{ title: 'Menu de Cadastros' }} />
                                        <Stack.Screen name="MenuOperacional" component={MenuOperacionalScreen} options={{ title: 'Menu Operacional' }} />
                                        <Stack.Screen name="MenuFinanceiro" component={MenuFinanceiroScreen} options={{ title: 'Menu Financeiro' }} />
                                        <Stack.Screen name="MenuAdubacao" component={MenuAdubacaoScreen} options={{ title: 'Menu Adubação' }} />
                                        <Stack.Screen name="MenuSistema" component={MenuSistemaScreen} options={{ title: 'Menu do Sistema' }} />
                                        <Stack.Screen name="Encomendas" component={EncomendasScreen} options={{ title: 'Minhas Encomendas' }} />
                                        <Stack.Screen name="NovaEncomenda" component={NovaEncomendaScreen} options={{ title: 'Nova Encomenda' }} />
                                        <Stack.Screen name="Graficos" component={GraficosScreen} options={{ title: 'Resumo de Gráficos' }} />
                                        <Stack.Screen name="Intelligence" component={IntelligenceScreen} options={{ headerShown: false }} />
                                        <Stack.Screen name="CategoriasDespesa" component={CategoriasDespesaScreen} options={{ title: 'Categorias de Despesa' }} />
                                        <Stack.Screen name="FinancialAccounts" component={FinancialAccountsScreen} options={{ title: 'Contas Financeiras' }} />
                                        <Stack.Screen name="ApplicationForm" component={ApplicationFormScreen} options={{ title: 'Nova Aplicação' }} />
                                        <Stack.Screen name="Config" component={ConfigScreen} options={{ title: 'Configurações Técnicas' }} />
                                        <Stack.Screen name="Fertilization" component={FertilizationScreen} options={{ title: 'Fertirrigação' }} />
                                        <Stack.Screen name="PlanoAdubacao" component={PlanoAdubacaoScreen} options={{ title: 'Plano de Adubação' }} />
                                        <Stack.Screen name="RecipeForm" component={RecipeFormScreen} options={{ title: 'Receituário Agronômico' }} />
                                    </>
                                )}
                            </Stack.Navigator>
                        </NavigationContainer>
                        <Toast />
                    </WeatherProvider>
                </ThemeProvider>
            </ErrorBoundary>
                </GestureHandlerRootView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    webRoot: {
        flex: 1,
        backgroundColor: '#050a0a',
        alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
    },
    appContainer: {
        flex: 1,
        width: '100%',
        maxWidth: Platform.OS === 'web' ? 480 : '100%',
        backgroundColor: '#09100c',
        overflow: 'hidden',
    }
});

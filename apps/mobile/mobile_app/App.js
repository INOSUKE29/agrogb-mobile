import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import './src/locales/i18n'; // Inicializa os idiomas
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

import { initDB } from './src/database/database';
import AutoSyncService from './src/services/AutoSyncService';

// Contextos e Providers
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import ErrorBoundary from './src/components/ui/ErrorBoundary';

// Telas Autenticação
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import RecoverScreen from './src/screens/RecoverScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import VerifyCodeScreen from './src/screens/VerifyCodeScreen';

// Navegadores e Telas V2
import AdminSelectorScreen from './src/screens/admin/AdminSelectorScreen';
import AgronomistClientsScreen from './src/screens/agronomist/AgronomistClientsScreen';
import CreateRecommendationScreen from './src/screens/agronomist/CreateRecommendationScreen';
import VisitsScreen from './src/screens/agronomist/VisitsScreen';
import ScheduleVisitFormScreen from './src/screens/agronomist/ScheduleVisitFormScreen';
import AgronomistEstoqueScreen from './src/screens/agronomist/AgronomistEstoqueScreen';
import AgronomistCadernoScreen from './src/screens/agronomist/AgronomistCadernoScreen';
import AgronomistClientProfileScreen from './src/screens/agronomist/AgronomistClientProfileScreen';
import AgronomistRecommendationsScreen from './src/screens/agronomist/AgronomistRecommendationsScreen';
import RecommendationDetailScreen from './src/screens/agronomist/RecommendationDetailScreen';

// Demais Telas App
import HomeScreen from './src/screens/HomeScreen';
import ColheitaScreen from './src/screens/ColheitaScreen';
import VendasScreen from './src/screens/VendasScreen';
import EstoqueScreen from './src/screens/EstoqueScreen';
import SyncScreen from './src/screens/SyncScreen';
import ComprasScreen from './src/screens/ComprasScreen';
import PlantioScreen from './src/screens/PlantioScreen';
import CustosScreen from './src/screens/CustosScreen';
import RelatoriosScreen from './src/screens/RelatoriosScreen';
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
import EncomendasScreen from './src/screens/EncomendasScreen';
import NovaEncomendaScreen from './src/screens/NovaEncomendaScreen';
import GraficosScreen from './src/screens/GraficosScreen';
import IntelligenceScreen from './src/screens/IntelligenceScreen';
import FinancialAccountsScreen from './src/screens/FinancialAccountsScreen';
import FertilizationScreen from './src/screens/FertilizationScreen';
import PlanoAdubacaoScreen from './src/screens/PlanoAdubacaoScreen';
import RecipeFormScreen from './src/screens/RecipeFormScreen';
import PendenciasScreen from './src/screens/PendenciasScreen';

const Stack = createStackNavigator();

function AppInner() {
    const { user, loading: isAuthLoading, logout } = useAuth();
    const [isDbReady, setIsDbReady] = useState(false);
    const [initError, setInitError] = useState(null);
    const [timeoutError, setTimeoutError] = useState(false);

    useEffect(() => {
        async function checkUpdates() {
            try {
                if (!__DEV__) {
                    const update = await Updates.checkForUpdateAsync();
                    if (update.isAvailable) {
                        await Updates.fetchUpdateAsync();
                        await Updates.reloadAsync();
                    }
                }
            } catch (err) {}
        }
        checkUpdates();

        initDB()
            .then(() => {
                setIsDbReady(true);
                AutoSyncService.start();
            })
            .catch(error => {
                setInitError(error?.message || String(error));
                setIsDbReady(true);
            });

        return () => {
            AutoSyncService.stop();
        };
    }, []);

    useEffect(() => {
        let timer;
        if (isAuthLoading || !isDbReady) {
            timer = setTimeout(() => {
                setTimeoutError(true);
            }, 15000);
        } else {
            setTimeoutError(false);
        }
        return () => clearTimeout(timer);
    }, [isAuthLoading, isDbReady]);

    if (isAuthLoading || !isDbReady) {
        if (timeoutError) {
            return (
                <View style={{ flex: 1, backgroundColor: '#0B121E', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Tempo Limite Excedido</Text>
                    <Text style={{ color: '#9CA3AF', textAlign: 'center', marginBottom: 20 }}>O sistema está demorando muito para inicializar as dependências ou o banco de dados.</Text>
                    <TouchableOpacity 
                        onPress={() => Updates.reloadAsync()} 
                        style={{ backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}
                    >
                        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Tentar Novamente (Recarregar)</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={{ flex: 1, backgroundColor: '#0B121E', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={{ color: '#64748B', marginTop: 10 }}>Carregando Sistema...</Text>
            </View>
        );
    }

    if (initError) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0B121E', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                <Text style={{ color: '#EF4444', fontSize: 18, fontWeight: 'bold' }}>Erro Crítico</Text>
                <Text style={{ color: '#F87171', textAlign: 'center', marginTop: 10 }}>{initError}</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    headerStyle: { backgroundColor: '#10B981' },
                    headerTintColor: '#fff',
                    headerTitleStyle: { fontWeight: 'bold' },
                    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                }}
            >
                {!user ? (
                    // STACK DE AUTENTICAÇÃO
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Recuperar Senha' }} />
                        <Stack.Screen name="Recover" component={RecoverScreen} options={{ title: 'Recuperação' }} />
                        <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} options={{ title: 'Verificar Código' }} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Nova Senha' }} />
                    </>
                ) : (
                    // STACK DO APLICATIVO
                    <>
                        <Stack.Screen name="SessionRouter" options={{ headerShown: false }}>
                            {(props) => {
                                React.useEffect(() => {
                                    const roleStr = user?.role || 'AGRONOMO';
                                    
                                    const verifyBiometry = async () => {
                                        try {
                                            const bioCreds = await SecureStore.getItemAsync('agrogb_biometric_credentials');
                                            if (bioCreds) {
                                                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                                                const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                                                
                                                if (hasHardware && isEnrolled) {
                                                    const auth = await LocalAuthentication.authenticateAsync({
                                                        promptMessage: 'Acesso Restrito - Confirme sua Identidade',
                                                        cancelLabel: 'Cancelar',
                                                        disableDeviceFallback: false,
                                                    });
                                                    
                                                    if (!auth.success) {
                                                        logout();
                                                        return;
                                                    }
                                                }
                                            }
                                        } catch (e) {
                                            console.log('Biometry check failed', e);
                                        }
                                        
                                        if (roleStr === 'ADMIN') props.navigation.replace('AdminSelector');
                                        else props.navigation.replace('Dashboard');
                                    };
                                    
                                    verifyBiometry();
                                }, [user]);
                                return (
                                    <View style={{ flex: 1, backgroundColor: '#0B121E', justifyContent: 'center', alignItems: 'center' }}>
                                        <ActivityIndicator size="large" color="#10B981" />
                                        <Text style={{ color: '#64748B', marginTop: 10 }}>Autenticando Acesso...</Text>
                                    </View>
                                );
                            }}
                        </Stack.Screen>
                        
                        {/* Telas Principais */}
                        <Stack.Screen name="AdminSelector" component={AdminSelectorScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Dashboard" component={HomeScreen} options={{ headerShown: false }} />

                        {/* Telas Agrônomo */}
                        <Stack.Screen name="AgronomistClients" component={AgronomistClientsScreen} />
                        <Stack.Screen name="CreateRecommendation" component={CreateRecommendationScreen} />
                        <Stack.Screen name="Visitas" component={VisitsScreen} />
                        <Stack.Screen name="ScheduleVisitForm" component={ScheduleVisitFormScreen} />
                        <Stack.Screen name="AgronomistClientProfile" component={AgronomistClientProfileScreen} />
                        <Stack.Screen name="AgronomistRecommendations" component={AgronomistRecommendationsScreen} />
                        <Stack.Screen name="RecommendationDetail" component={RecommendationDetailScreen} />
                        <Stack.Screen name="AgronomistEstoque" component={AgronomistEstoqueScreen} />
                        <Stack.Screen name="AgronomistCaderno" component={AgronomistCadernoScreen} />

                        {/* Operacional e Funcionalidades Extras */}
                        <Stack.Screen name="Colheita" component={ColheitaScreen} />
                        <Stack.Screen name="Vendas" component={VendasScreen} />
                        <Stack.Screen name="Estoque" component={EstoqueScreen} />
                        <Stack.Screen name="Sync" component={SyncScreen} />
                        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
                        <Stack.Screen name="Settings" component={SettingsScreen} />
                        <Stack.Screen name="Compras" component={ComprasScreen} />
                        <Stack.Screen name="Plantio" component={PlantioScreen} />
                        <Stack.Screen name="Custos" component={CustosScreen} />
                        <Stack.Screen name="Cadastro" component={CadastroScreen} />
                        <Stack.Screen name="Clientes" component={ClientesScreen} />
                        <Stack.Screen name="Culturas" component={CulturasScreen} />
                        <Stack.Screen name="Relatorios" component={RelatoriosScreen} />
                        <Stack.Screen name="Usuarios" component={UsuariosScreen} />
                        <Stack.Screen name="Monitoramento" component={MonitoramentoScreen} />
                        <Stack.Screen name="Ocr" component={OcrScreen} />
                        <Stack.Screen name="Scanner" component={ScannerScreen} />
                        <Stack.Screen name="CadernoCampo" component={CadernoCampoScreen} />
                        <Stack.Screen name="Frota" component={FrotaScreen} />
                        <Stack.Screen name="MaquinaForm" component={MaquinaFormScreen} />
                        <Stack.Screen name="Profile" options={{ title: 'Meu Perfil' }}>
                            {(props) => <ProfileScreen {...props} onLogout={() => logout()} />}
                        </Stack.Screen>
                        <Stack.Screen name="AdubacaoList" component={AdubacaoListScreen} />
                        <Stack.Screen name="AdubacaoForm" component={AdubacaoFormScreen} />
                        <Stack.Screen name="AdubacaoDetail" component={AdubacaoDetailScreen} />
                        <Stack.Screen name="ClienteForm" component={ClienteFormScreen} />
                        <Stack.Screen name="Encomendas" component={EncomendasScreen} />
                        <Stack.Screen name="NovaEncomenda" component={NovaEncomendaScreen} />
                        <Stack.Screen name="Graficos" component={GraficosScreen} />
                        <Stack.Screen name="Intelligence" component={IntelligenceScreen} />
                        <Stack.Screen name="FinancialAccounts" component={FinancialAccountsScreen} />
                        <Stack.Screen name="Fertilization" component={FertilizationScreen} />
                        <Stack.Screen name="PlanoAdubacao" component={PlanoAdubacaoScreen} />
                        <Stack.Screen name="RecipeForm" component={RecipeFormScreen} />
                        <Stack.Screen name="Pendencias" component={PendenciasScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <View style={styles.webRoot}>
            <View style={styles.appContainer}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <SafeAreaProvider>
                        <ErrorBoundary>
                            <AuthProvider>
                                <ThemeProvider>
                                        <StatusBar style="light" />
                                        <AppInner />
                                </ThemeProvider>
                            </AuthProvider>
                        </ErrorBoundary>
                    </SafeAreaProvider>
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

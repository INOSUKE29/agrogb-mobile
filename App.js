import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import * as Updates from 'expo-updates';
import { StatusBar } from 'expo-status-bar';
import { initDB } from './src/database/database';
import AutoSyncService from './src/services/AutoSyncService';
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
import ProfileScreen from './src/screens/ProfileScreen';
import AdubacaoListScreen from './src/screens/AdubacaoListScreen';
import AdubacaoFormScreen from './src/screens/AdubacaoFormScreen';
import AdubacaoDetailScreen from './src/screens/AdubacaoDetailScreen';
import ClienteFormScreen from './src/screens/ClienteFormScreen';
import CadastroFormScreen from './src/screens/CadastroFormScreen';
import MenuCadastrosScreen from './src/screens/MenuCadastrosScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import RecoverScreen from './src/screens/RecoverScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import VerifyCodeScreen from './src/screens/VerifyCodeScreen';
import EncomendasScreen from './src/screens/EncomendasScreen';
import NovaEncomendaScreen from './src/screens/NovaEncomendaScreen';
import GraficosScreen from './src/screens/GraficosScreen';
import IntelligenceScreen from './src/screens/IntelligenceScreen';
import { SyncWorker } from './src/services/SyncWorker';

import ErrorBoundary from './src/ui/ErrorBoundary';
import { WeatherProvider } from './src/context/WeatherContext';
import { ThemeProvider } from './src/theme/ThemeContext';
import Toast from './src/ui/Toast';

const Stack = createStackNavigator();

export default function App() {
    const [isDbReady, setIsDbReady] = useState(false);

    useEffect(() => {
        // Inicia o motor de sincronização ao abrir o app
        SyncWorker.run();

        // Inicializa OTA Updates primeiro de tudo
        async function checkUpdates() {
            try {
                if (!__DEV__) {
                    const update = await Updates.checkForUpdateAsync();
                    if (update.isAvailable) {
                        console.log("Baixando atualização OTA...");
                        await Updates.fetchUpdateAsync();
                        await Updates.reloadAsync();
                    }
                }
            } catch (err) {
                console.log("Erro ao checar OTA Updates:", err);
            }
        }
        checkUpdates();

        // Inicializa banco de dados ANTES de renderizar qualquer contexto
        initDB()
            .then(() => {
                console.log("DEBUG: DB IS READY");
                setIsDbReady(true);
                AutoSyncService.start();
            })
            .catch(error => {
                console.error("Falha fatal na inicialização do DB:", error);
            });

        return () => {
            AutoSyncService.stop();
        };
    }, []);

    if (!isDbReady) {
        return (
            <View style={{ flex: 1, backgroundColor: '#0B121E', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#10B981" />
            </View>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ErrorBoundary>
                <ThemeProvider>
                    <WeatherProvider>
                        <StatusBar style="light" />
                        <NavigationContainer>
                            <Stack.Navigator
                                initialRouteName="Login"
                                screenOptions={{
                                    headerStyle: { backgroundColor: '#10B981' }, // Será dinâmico futuramente usando styled headers
                                    headerTintColor: '#fff',
                                    headerTitleStyle: { fontWeight: 'bold' },
                                    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
                                    transitionSpec: {
                                        open: { animation: 'timing', config: { duration: 250 } },
                                        close: { animation: 'timing', config: { duration: 250 } }
                                    }
                                }}
                            >
                                <Stack.Screen
                                    name="Login"
                                    component={LoginScreen}
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                    name="Register"
                                    component={RegisterScreen}
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                    name="Home"
                                    component={HomeScreen}
                                    options={{ headerShown: false }}
                                />
                                <Stack.Screen
                                    name="Colheita"
                                    component={ColheitaScreen}
                                    options={{ title: 'Registrar Colheita' }}
                                />
                                <Stack.Screen
                                    name="Vendas"
                                    component={VendasScreen}
                                    options={{ title: 'Registrar Venda' }}
                                />
                                <Stack.Screen
                                    name="Estoque"
                                    component={EstoqueScreen}
                                    options={{ title: 'Consultar Estoque' }}
                                />
                                <Stack.Screen
                                    name="Sync"
                                    component={SyncScreen}
                                    options={{ title: 'Sincronizar Dados' }}
                                />
                                <Stack.Screen
                                    name="Compras"
                                    component={ComprasScreen}
                                    options={{ title: 'Registrar Compra' }}
                                />
                                <Stack.Screen
                                    name="Plantio"
                                    component={PlantioScreen}
                                    options={{ title: 'Registrar Plantio' }}
                                />
                                <Stack.Screen
                                    name="Custos"
                                    component={CustosScreen}
                                    options={{ title: 'Registrar Custo' }}
                                />
                                <Stack.Screen
                                    name="Processamento"
                                    component={ProcessamentoScreen}
                                    options={{ title: 'Processamento & Perdas' }}
                                />
                                <Stack.Screen
                                    name="Cadastro"
                                    component={CadastroScreen}
                                    options={{ title: 'Cadastros Gerais' }}
                                />
                                <Stack.Screen
                                    name="Clientes"
                                    component={ClientesScreen}
                                    options={{ title: 'Gerenciar Clientes' }}
                                />
                                <Stack.Screen
                                    name="Culturas"
                                    component={CulturasScreen}
                                    options={{ title: 'Culturas e Áreas' }}
                                />
                                <Stack.Screen
                                    name="Relatorios"
                                    component={RelatoriosScreen}
                                    options={{ title: 'Relatórios' }}
                                />
                                <Stack.Screen name="Usuarios" component={UsuariosScreen} options={{ title: 'Controle de Usuários' }} />
                                <Stack.Screen name="Monitoramento" component={MonitoramentoScreen} options={{ title: 'Monitoramento' }} />
                                <Stack.Screen name="Ocr" component={OcrScreen} options={{ headerShown: false }} />
                                <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false }} />
                                <Stack.Screen name="CadernoCampo" component={CadernoCampoScreen} options={{ title: 'Caderno de Campo' }} />
                                <Stack.Screen name="Frota" component={FrotaScreen} options={{ title: 'Gestão de Frota' }} />
                                <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Meu Perfil UltraPro' }} />

                                {/* ADUBAÇÃO v5.4 */}
                                <Stack.Screen name="AdubacaoList" component={AdubacaoListScreen} options={{ title: 'Planos de Adubação' }} />
                                <Stack.Screen name="AdubacaoForm" component={AdubacaoFormScreen} options={{ title: 'Novo Plano' }} />
                                <Stack.Screen name="AdubacaoDetail" component={AdubacaoDetailScreen} options={{ title: 'Detalhes do Plano' }} />

                                <Stack.Screen name="ClienteForm" component={ClienteFormScreen} options={{ title: 'Novo Cliente' }} />
                                <Stack.Screen name="CadastroForm" component={CadastroFormScreen} options={{ title: 'Novo Cadastro' }} />
                                <Stack.Screen name="MenuCadastros" component={MenuCadastrosScreen} options={{ title: 'Menu de Cadastros' }} />
                                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Recuperar Senha' }} />
                                <Stack.Screen name="Recover" component={RecoverScreen} options={{ title: 'Recuperação' }} />
                                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Nova Senha' }} />
                                <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} options={{ title: 'Verificar Código' }} />
                                <Stack.Screen name="Encomendas" component={EncomendasScreen} options={{ title: 'Minhas Encomendas' }} />
                                <Stack.Screen name="NovaEncomenda" component={NovaEncomendaScreen} options={{ title: 'Nova Encomenda' }} />
                                <Stack.Screen name="Graficos" component={GraficosScreen} options={{ title: 'Resumo de Gráficos' }} />
                                <Stack.Screen name="Intelligence" component={IntelligenceScreen} options={{ headerShown: false }} />

                            </Stack.Navigator>
                        </NavigationContainer>
                        <Toast />
                    </WeatherProvider>
                </ThemeProvider>
            </ErrorBoundary>
        </GestureHandlerRootView>
    );
}

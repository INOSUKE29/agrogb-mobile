import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { initDB } from './src/database/database';

import LoginScreen from './src/screens/LoginScreen';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import FinanceiroDashboardScreen from './src/screens/FinanceiroDashboardScreen';
import FinanceiroLancamentosScreen from './src/screens/FinanceiroLancamentosScreen';
import CentroCustosScreen from './src/screens/CentroCustosScreen';
import ColheitaScreen from './src/screens/ColheitaScreen';
import VendasScreen from './src/screens/VendasScreen';
import EstoqueScreen from './src/screens/EstoqueScreen';
import SyncScreen from './src/screens/SyncScreen';
import ComprasScreen from './src/screens/ComprasScreen';
import PlantioScreen from './src/screens/PlantioScreen';
import CustosScreen from './src/screens/CustosScreen';
import DescarteScreen from './src/screens/DescarteScreen';
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
import TalhoesScreen from './src/screens/TalhoesScreen';
import FornecedoresScreen from './src/screens/FornecedoresScreen';
import IrrigacaoScreen from './src/screens/IrrigacaoScreen';
import FertirrigacaoScreen from './src/screens/FertirrigacaoScreen';
import AplicacoesScreen from './src/screens/AplicacoesScreen';
import EquipesScreen from './src/screens/EquipesScreen';
import BIRelatoriosAvancadosScreen from './src/screens/BIRelatoriosAvancadosScreen';
import PlanoAdubacaoScreen from './src/screens/PlanoAdubacaoScreen';
import RecipeFormScreen from './src/screens/RecipeFormScreen';
import EncomendasScreen from './src/screens/EncomendasScreen';
import NovaEncomendaScreen from './src/screens/NovaEncomendaScreen';
import IntelligenceScreen from './src/screens/IntelligenceScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import RecoverScreen from './src/screens/RecoverScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import VerifyCodeScreen from './src/screens/VerifyCodeScreen';
import AuditScreen from './src/screens/AuditScreen';
import { SyncProvider } from './src/context/SyncContext';

import ErrorBoundary from './src/components/common/ErrorBoundary';
import { WeatherProvider } from './src/context/WeatherContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';

const Stack = createStackNavigator();

import AutoSyncService from './src/services/AutoSyncService';

export default function App() {
    useEffect(() => {
        initDB().then(() => {
            AutoSyncService.start();
        }).catch(console.error);
    }, []);

    return (
        <ErrorBoundary>
            <AuthProvider>
                <SyncProvider>
                    <ThemeProvider>
                        <WeatherProvider>
                            <StatusBar style="light" />
                            <NavigationContainer>
                                <Stack.Navigator
                                    initialRouteName="Splash"
                                    screenOptions={{
                                        headerShown: false,
                                    }}
                                >
                                    <Stack.Screen name="Splash" component={SplashScreen} />
                                    <Stack.Screen name="Login" component={LoginScreen} />
                                    <Stack.Screen name="Register" component={RegisterScreen} />
                                    <Stack.Screen name="Home" component={HomeScreen} />
                                    <Stack.Screen name="FinanceiroDashboard" component={FinanceiroDashboardScreen} />
                                    <Stack.Screen name="Colheita" component={ColheitaScreen} />
                                    <Stack.Screen name="Vendas" component={VendasScreen} />
                                    <Stack.Screen name="Estoque" component={EstoqueScreen} />
                                    <Stack.Screen name="Sync" component={SyncScreen} />
                                    <Stack.Screen name="Compras" component={ComprasScreen} />
                                    <Stack.Screen name="Plantio" component={PlantioScreen} />
                                    <Stack.Screen name="Custos" component={CustosScreen} />
                                    <Stack.Screen name="Descarte" component={DescarteScreen} />
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
                                    <Stack.Screen name="Profile" component={ProfileScreen} />
                                    <Stack.Screen name="AdubacaoList" component={AdubacaoListScreen} />
                                    <Stack.Screen name="AdubacaoForm" component={AdubacaoFormScreen} />
                                    <Stack.Screen name="AdubacaoDetail" component={AdubacaoDetailScreen} />
                                    <Stack.Screen name="Talhoes" component={TalhoesScreen} />
                                    <Stack.Screen name="Fornecedores" component={FornecedoresScreen} />
                                    <Stack.Screen name="Irrigacao" component={IrrigacaoScreen} />
                                    <Stack.Screen name="Fertirrigacao" component={FertirrigacaoScreen} />
                                    <Stack.Screen name="Aplicacoes" component={AplicacoesScreen} />
                                    <Stack.Screen name="FinanceiroLancamentos" component={FinanceiroLancamentosScreen} />
                                    <Stack.Screen name="CentroCustos" component={CentroCustosScreen} />
                                    <Stack.Screen name="Equipes" component={EquipesScreen} />
                                    <Stack.Screen name="BIRelatoriosAvancados" component={BIRelatoriosAvancadosScreen} />
                                    <Stack.Screen name="PlanoAdubacao" component={PlanoAdubacaoScreen} />
                                    <Stack.Screen name="RecipeForm" component={RecipeFormScreen} />
                                    <Stack.Screen name="Encomendas" component={EncomendasScreen} />
                                    <Stack.Screen name="NovaEncomenda" component={NovaEncomendaScreen} />
                                    <Stack.Screen name="Intelligence" component={IntelligenceScreen} />
                                    <Stack.Screen name="Settings" component={SettingsScreen} />
                                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                                    <Stack.Screen name="Recover" component={RecoverScreen} />
                                    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                                    <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
                                    <Stack.Screen name="Audit" component={AuditScreen} />
                                </Stack.Navigator>
                            </NavigationContainer>
                        </WeatherProvider>
                    </ThemeProvider>
                </SyncProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

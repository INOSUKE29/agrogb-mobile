import React, { useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import RecoverScreen from '../screens/RecoverScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import OnboardingProfileScreen from '../screens/OnboardingProfileScreen';

// Core
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SyncScreen from '../screens/SyncScreen';

// Módulos
import FinanceiroDashboardScreen from '../screens/FinanceiroDashboardScreen';
import FinanceiroLancamentosScreen from '../screens/FinanceiroLancamentosScreen';
import CentroCustosScreen from '../screens/CentroCustosScreen';
import ColheitaScreen from '../screens/ColheitaScreen';
import VendasScreen from '../screens/VendasScreen';
import EstoqueScreen from '../screens/EstoqueScreen';
import ComprasScreen from '../screens/ComprasScreen';
import PlantioScreen from '../screens/PlantioScreen';
import CustosScreen from '../screens/CustosScreen';
import DescarteScreen from '../screens/DescarteScreen';
import CadastroScreen from '../screens/CadastroScreen';
import ClientesScreen from '../screens/ClientesScreen';
import CulturasScreen from '../screens/CulturasScreen';
import RelatoriosScreen from '../screens/RelatoriosScreen';
import UsuariosScreen from '../screens/UsuariosScreen';
import MonitoramentoScreen from '../screens/MonitoramentoScreen';
import OcrScreen from '../screens/OcrScreen';
import ScannerScreen from '../screens/ScannerScreen';
import CadernoCampoScreen from '../screens/CadernoCampoScreen';
import FrotaScreen from '../screens/FrotaScreen';
import AdubacaoListScreen from '../screens/AdubacaoListScreen';
import AdubacaoFormScreen from '../screens/AdubacaoFormScreen';
import AdubacaoDetailScreen from '../screens/AdubacaoDetailScreen';
import TalhoesScreen from '../screens/TalhoesScreen';
import FornecedoresScreen from '../screens/FornecedoresScreen';
import IrrigacaoScreen from '../screens/IrrigacaoScreen';
import FertirrigacaoScreen from '../screens/FertirrigacaoScreen';
import AplicacoesScreen from '../screens/AplicacoesScreen';
import EquipesScreen from '../screens/EquipesScreen';
import BIRelatoriosAvancadosScreen from '../screens/BIRelatoriosAvancadosScreen';
import PlanoAdubacaoScreen from '../screens/PlanoAdubacaoScreen';
import RecipeFormScreen from '../screens/RecipeFormScreen';
import EncomendasScreen from '../screens/EncomendasScreen';
import NovaEncomendaScreen from '../screens/NovaEncomendaScreen';
import IntelligenceScreen from '../screens/IntelligenceScreen';
import AuditScreen from '../screens/AuditScreen';
import AgronomistLinkScreen from '../screens/AgronomistLinkScreen';
import CreateRecommendationScreen from '../screens/CreateRecommendationScreen';
import RecommendationsListScreen from '../screens/RecommendationsListScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
    const { user, loading, role } = useAuth();
    const [splashDone, setSplashDone] = useState(false);

    // Se estiver carregando sessão ou exibindo Splash, mantemos o Splash na tela.
    if (loading || !splashDone) {
        return <SplashScreen onFinish={() => setSplashDone(true)} />;
    }

    // Caso não tenha usuário logado -> FLUXO DE AUTH
    if (!user) {
        return (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                <Stack.Screen name="Recover" component={RecoverScreen} />
                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
            </Stack.Navigator>
        );
    }

    // Caso perfil esteja pendente de completude -> FLUXO ONBOARDING
    if (role === 'PENDENTE') {
        return (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="OnboardingProfile" component={OnboardingProfileScreen} />
            </Stack.Navigator>
        );
    }

    // Caso contrário (AGRICULTOR, AGRONOMO, ADMIN) -> FLUXO PRINCIPAL
    // (Por enquanto todas as telas disponíveis, a limitação de menu será na HomeScreen/Dashboard)
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Home">
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
            <Stack.Screen name="Audit" component={AuditScreen} />
            <Stack.Screen name="AgronomistLink" component={AgronomistLinkScreen} />
            <Stack.Screen name="CreateRecommendation" component={CreateRecommendationScreen} />
            <Stack.Screen name="RecommendationsList" component={RecommendationsListScreen} />
        </Stack.Navigator>
    );
}

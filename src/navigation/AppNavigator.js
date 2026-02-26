import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RecoverScreen from '../screens/RecoverScreen';
import HomeScreen from '../screens/HomeScreen';
import ColheitaScreen from '../screens/ColheitaScreen';
import VendasScreen from '../screens/VendasScreen';
import EstoqueScreen from '../screens/EstoqueScreen';
import SyncScreen from '../screens/SyncScreen';
import ComprasScreen from '../screens/ComprasScreen';
import PlantioScreen from '../screens/PlantioScreen';
import CustosScreen from '../screens/CustosScreen';
import RelatoriosScreen from '../screens/RelatoriosScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MonitoramentoScreen from '../screens/MonitoramentoScreen';
import CadastroScreen from '../screens/CadastroScreen';
import ClientesScreen from '../screens/ClientesScreen';
import CulturasScreen from '../screens/CulturasScreen';
import UsuariosScreen from '../screens/UsuariosScreen';
import OcrScreen from '../screens/OcrScreen';
import ScannerScreen from '../screens/ScannerScreen';
import FrotaScreen from '../screens/FrotaScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdubacaoListScreen from '../screens/AdubacaoListScreen';
import AdubacaoFormScreen from '../screens/AdubacaoFormScreen';
import AdubacaoDetailScreen from '../screens/AdubacaoDetailScreen';
import CadernoCampoScreen from '../screens/CadernoCampoScreen';
import ClienteFormScreen from '../screens/ClienteFormScreen';
import CadastroFormScreen from '../screens/CadastroFormScreen';
import MenuCadastrosScreen from '../screens/MenuCadastrosScreen';
import SettingsScreen from '../screens/SettingsScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
                headerStyle: { backgroundColor: '#10B981' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold' }
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPassword" component={RecoverScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'AgroGB Mobile' }} />
            <Stack.Screen name="Colheita" component={ColheitaScreen} options={{ title: 'Registrar Colheita' }} />
            <Stack.Screen name="Vendas" component={VendasScreen} options={{ title: 'Registrar Venda' }} />
            <Stack.Screen name="Estoque" component={EstoqueScreen} options={{ title: 'Consultar Estoque' }} />
            <Stack.Screen name="Sync" component={SyncScreen} options={{ title: 'Sincronizar Dados' }} />
            <Stack.Screen name="Compras" component={ComprasScreen} options={{ title: 'Registrar Compra' }} />
            <Stack.Screen name="Plantio" component={PlantioScreen} options={{ title: 'Registrar Plantio' }} />
            <Stack.Screen name="Custos" component={CustosScreen} options={{ title: 'Registrar Custo' }} />
            <Stack.Screen name="MenuCadastros" component={MenuCadastrosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Cadastro" component={CadastroScreen} options={{ title: 'Cadastros Gerais' }} />
            <Stack.Screen name="CadastroForm" component={CadastroFormScreen} options={({ route }) => ({ title: route.params?.title || 'Novo Cadastro' })} />
            <Stack.Screen name="Clientes" component={ClientesScreen} options={{ title: 'Gerenciar Clientes' }} />
            <Stack.Screen name="Culturas" component={CulturasScreen} options={{ title: 'Culturas e Áreas' }} />
            <Stack.Screen name="Relatorios" component={RelatoriosScreen} options={{ title: 'Relatórios' }} />
            <Stack.Screen name="Usuarios" component={UsuariosScreen} options={{ title: 'Controle de Usuários' }} />
            <Stack.Screen name="Monitoramento" component={MonitoramentoScreen} options={{ title: 'Monitoramento' }} />
            <Stack.Screen name="Ocr" component={OcrScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Frota" component={FrotaScreen} options={{ title: 'Gestão de Frota' }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Meu Perfil' }} />
            <Stack.Screen name="CadernoCampo" component={CadernoCampoScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Area" component={CulturasScreen} options={{ title: 'Gerenciar Áreas/Talhões' }} />
            <Stack.Screen name="AdubacaoList" component={AdubacaoListScreen} options={{ title: 'Planos de Adubação' }} />
            <Stack.Screen name="AdubacaoForm" component={AdubacaoFormScreen} options={{ title: 'Novo Plano' }} />
            <Stack.Screen name="AdubacaoDetail" component={AdubacaoDetailScreen} options={{ title: 'Detalhes do Plano' }} />
            <Stack.Screen name="ClienteForm" component={ClienteFormScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}

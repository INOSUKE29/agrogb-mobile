import React from 'react';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';

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
import GraficosScreen from '../screens/GraficosScreen';
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
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import CategoriasDespesaScreen from '../screens/CategoriasDespesaScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{
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
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPassword" component={RecoverScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Colheita" component={ColheitaScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Vendas" component={VendasScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Estoque" component={EstoqueScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Sync" component={SyncScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Compras" component={ComprasScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Plantio" component={PlantioScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Custos" component={CustosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MenuCadastros" component={MenuCadastrosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CategoriasDespesa" component={CategoriasDespesaScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Cadastro" component={CadastroScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CadastroForm" component={CadastroFormScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Clientes" component={ClientesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Culturas" component={CulturasScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Relatorios" component={RelatoriosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Graficos" component={GraficosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Usuarios" component={UsuariosScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Monitoramento" component={MonitoramentoScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Ocr" component={OcrScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Frota" component={FrotaScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CadernoCampo" component={CadernoCampoScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Area" component={CulturasScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AdubacaoList" component={AdubacaoListScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AdubacaoForm" component={AdubacaoFormScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AdubacaoDetail" component={AdubacaoDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ClienteForm" component={ClienteFormScreen} options={{ headerShown: false }} />
            <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
}

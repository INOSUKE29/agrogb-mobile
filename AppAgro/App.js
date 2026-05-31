import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import RecoverScreen from './src/screens/RecoverScreen';
import HomeScreen from './src/screens/HomeScreen';
import EstoqueScreen from './src/screens/EstoqueScreen'; // Nova Tela Importada
import { checkSession } from './src/services/authService';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ThemeProvider } from './src/context/ThemeContext';
// import { WeatherProvider } from './src/context/WeatherContext'; // DISABLED

const Stack = createNativeStackNavigator();

export default function App() {
//    const [initialRoute, setInitialRoute] = useState("Login");
//
//    useEffect(() => {
//        // DISABLED SESSION CHECK TO PREVENT HANG
//        // const check = async () => {
//        //     const session = await checkSession();
//        //     setInitialRoute(session ? "Home" : "Login");
//        // };
//        // check();
//    }, []);

    // DIRECT RENDER - BYPASS LOGIN
    const initialRoute = "Home";

    return (
        <NavigationContainer>
            <StatusBar style="light" />
            <Stack.Navigator
                initialRouteName={initialRoute}
                screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f2e1f' } }}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="Recover" component={RecoverScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Estoque" component={EstoqueScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

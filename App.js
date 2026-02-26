import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
    return (
        <ThemeProvider>
            <ErrorBoundary>
                {/* Agora usando 'dark' para que a bateria fique visível se o fundo for branco */}
                <StatusBar style="dark" backgroundColor="#10B981" />
                <NavigationContainer theme={DefaultTheme}>
                    <AppNavigator />
                </NavigationContainer>
            </ErrorBoundary>
        </ThemeProvider>
    );
}

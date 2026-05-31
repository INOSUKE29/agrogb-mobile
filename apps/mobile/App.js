import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { initDB } from './src/database/database';

import RootNavigator from './src/navigation/RootNavigator';

import { SyncProvider } from './src/context/SyncContext';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import { WeatherProvider } from './src/context/WeatherContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
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
                                <RootNavigator />
                            </NavigationContainer>
                        </WeatherProvider>
                    </ThemeProvider>
                </SyncProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
}

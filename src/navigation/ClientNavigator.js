import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Telas do Cliente
import ClientDashboardScreen from '../screens/client/ClientDashboardScreen';
import CulturasScreen from '../screens/CulturasScreen';
import ClientMenuScreen from '../screens/client/ClientMenuScreen';
import { View } from 'react-native';

const Tab = createBottomTabNavigator();

// Placeholder for the "+" button
const DummyScreen = () => <View style={{ flex: 1, backgroundColor: '#0B121E' }} />;

export default function ClientNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    if (route.name === 'HomeClient') {
                        return <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />;
                    } else if (route.name === 'MyFarm') {
                        return <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />;
                    } else if (route.name === 'AddAction') {
                        return (
                            <View style={{
                                width: 50, height: 50, borderRadius: 25,
                                backgroundColor: '#10B981',
                                justifyContent: 'center', alignItems: 'center',
                                marginTop: -20,
                                elevation: 5,
                                shadowColor: '#10B981', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }
                            }}>
                                <Ionicons name="add" size={32} color="#FFF" />
                            </View>
                        );
                    } else if (route.name === 'ClientMenu') {
                        return <Ionicons name={focused ? 'apps' : 'apps-outline'} size={24} color={color} />;
                    }
                },
                tabBarActiveTintColor: '#10B981',
                tabBarInactiveTintColor: '#64748B',
                tabBarStyle: {
                    backgroundColor: '#111827',
                    borderTopWidth: 1,
                    borderTopColor: '#1F2937',
                    height: Platform.OS === 'ios' ? 85 : 65,
                    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
                    paddingTop: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '700',
                },
                headerShown: false,
            })}
        >
            <Tab.Screen 
                name="HomeClient" 
                component={ClientDashboardScreen} 
                options={{ tabBarLabel: 'Início' }} 
            />
            <Tab.Screen 
                name="Culturas" 
                component={CulturasScreen} 
                options={{ tabBarLabel: 'Talhões' }} 
            />
            <Tab.Screen 
                name="AddAction" 
                component={DummyScreen} 
                options={{ 
                    tabBarLabel: 'Atividades',
                    tabBarLabelStyle: { display: 'none' }
                }}
                listeners={({ navigation }) => ({
                    tabPress: e => {
                        e.preventDefault();
                        // Na v2 isso abrirá um BottomSheet de Nova Atividade
                        alert('Módulo de Nova Atividade em construção.');
                    },
                })}
            />
            <Tab.Screen 
                name="ClientMenu" 
                component={ClientMenuScreen} 
                options={{ tabBarLabel: 'Mais' }} 
            />
        </Tab.Navigator>
    );
}

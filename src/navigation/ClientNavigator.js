import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Telas do Cliente
import ClientDashboardScreen from '../screens/client/ClientDashboardScreen';
import RecommendationsScreen from '../screens/client/RecommendationsScreen';
import MyFarmScreen from '../screens/client/MyFarmScreen';

const Tab = createBottomTabNavigator();

export default function ClientNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'HomeClient') {
                        iconName = focused ? 'home' : 'home-outline';
                        return <Ionicons name={iconName} size={size} color={color} />;
                    } else if (route.name === 'Recommendations') {
                        iconName = focused ? 'clipboard-list' : 'clipboard-text-outline';
                        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                    } else if (route.name === 'MyFarm') {
                        iconName = focused ? 'leaf' : 'leaf-outline';
                        return <Ionicons name={iconName} size={size} color={color} />;
                    }
                },
                tabBarActiveTintColor: '#1B5E20',
                tabBarInactiveTintColor: '#90A4AE',
                tabBarStyle: {
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 1,
                    borderTopColor: '#ECEFF1',
                    height: 65,
                    paddingBottom: 10,
                    paddingTop: 10,
                    elevation: 10,
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '600',
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
                name="Recommendations" 
                component={RecommendationsScreen} 
                options={{ tabBarLabel: 'Receitas' }} 
            />
            <Tab.Screen 
                name="MyFarm" 
                component={MyFarmScreen} 
                options={{ tabBarLabel: 'Fazenda' }} 
            />
        </Tab.Navigator>
    );
}

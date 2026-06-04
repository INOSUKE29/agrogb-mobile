import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Placeholder Screens
function DashboardScreen() {
    return (
        <View style={styles.screen}>
            <Text style={styles.text}>Dashboard Mobile (MVP)</Text>
        </View>
    );
}

function CadernoScreen() {
    return (
        <View style={styles.screen}>
            <Text style={styles.text}>Caderno Agrícola (MVP)</Text>
        </View>
    );
}

function FinancialScreen() {
    return (
        <View style={styles.screen}>
            <Text style={styles.text}>Financeiro (MVP)</Text>
        </View>
    );
}

const Tab = createBottomTabNavigator();

export default function Navigation() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: '#1E1E1E',
                    },
                    headerTintColor: '#fff',
                    // Thumb Zone Heuristic: Ergonomic height and spacing
                    tabBarStyle: {
                        backgroundColor: '#1E1E1E',
                        borderTopColor: 'rgba(255,255,255,0.1)',
                        height: 70, // Generous height for thumb zone
                        paddingBottom: 10,
                        paddingTop: 10,
                    },
                    tabBarActiveTintColor: '#22c55e', // AgroGB Primary Green
                    tabBarInactiveTintColor: 'gray',
                    tabBarItemStyle: {
                        // Material Design 3 / Thumb Zone: Minimum 44x44 tap target area
                        minHeight: 44,
                        minWidth: 44,
                        justifyContent: 'center',
                        alignItems: 'center',
                    },
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;

                        if (route.name === 'Dashboard') {
                            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
                        } else if (route.name === 'Caderno') {
                            iconName = focused ? 'book-open' : 'book-open-outline';
                        } else if (route.name === 'Financeiro') {
                            iconName = focused ? 'currency-usd' : 'currency-usd';
                        }

                        // We ensure icons are large enough to be clear in the Thumb Zone
                        return <MaterialCommunityIcons name={iconName as any} size={28} color={color} />;
                    },
                })}
            >
                <Tab.Screen name="Dashboard" component={DashboardScreen} />
                <Tab.Screen name="Caderno" component={CadernoScreen} />
                <Tab.Screen name="Financeiro" component={FinancialScreen} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212', // Material Dark theme default
    },
    text: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

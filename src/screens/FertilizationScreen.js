import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    SafeAreaView, StatusBar, Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { FertilizationService } from '../services/FertilizationService';
import ScreenHeader from '../ui/ScreenHeader';

const { width } = Dimensions.get('window');

/**
 * FertilizationScreen - Interface de Adubação 🌿🧪
 * Design idêntico ao mockup solicitado pelo usuário.
 */
export default function FertilizationScreen() {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState('Receitas'); // 'Receitas' | 'Aplicações'
    const [recipes, setRecipes] = useState([]);
    const [applications, setApplications] = useState([]);

    const loadData = async () => {
        const resRecipes = await FertilizationService.getRecipes();
        const resApps = await FertilizationService.getApplications();
        setRecipes(resRecipes);
        setApplications(resApps);
    };

    useFocusEffect(useCallback(() => {
        loadData();
    }, []));

    // Agrupa receitas por cultura
    const groupedRecipes = recipes.reduce((acc, curr) => {
        if (!acc[curr.culture]) acc[curr.culture] = [];
        acc[curr.culture].push(curr);
        return acc;
    }, {});

    const getCultureIcon = (culture) => {
        const c = culture.toLowerCase();
        if (c.includes('morango')) return '🍓';
        if (c.includes('flor')) return '🌼';
        return '🌿';
    };

    const getRecipeIcon = (type) => {
        return type === 'foliar' ? 'spray-bottle' : 'water-percent';
    };

    return (
        <View style={[styles.container, { backgroundColor: '#0D1B2A' }]}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={styles.safeArea}>
                <ScreenHeader 
                    title="Adubação" 
                    onBack={() => navigation.goBack()} 
                />

                {/* TABS (Segmented Pill Style) */}
                <View style={styles.tabWrapper}>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'Receitas' && styles.tabActive]}
                            onPress={() => setActiveTab('Receitas')}
                        >
                            <Text style={[styles.tabText, activeTab === 'Receitas' && styles.tabTextActive]}>Receitas</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'Aplicações' && styles.tabActive]}
                            onPress={() => setActiveTab('Aplicações')}
                        >
                            <Text style={[styles.tabText, activeTab === 'Aplicações' && styles.tabTextActive]}>Aplicações</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {activeTab === 'Receitas' ? (
                        Object.keys(groupedRecipes).map((culture) => (
                            <View key={culture} style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Text style={styles.cultureIcon}>{getCultureIcon(culture)}</Text>
                                    <Text style={styles.sectionTitle}>{culture}</Text>
                                </View>
                                {groupedRecipes[culture].map((recipe) => (
                                    <TouchableOpacity 
                                        key={recipe.id} 
                                        style={styles.card} 
                                        onPress={() => navigation.navigate('RecipeForm', { recipeId: recipe.id })}
                                    >
                                        <View style={styles.cardInfo}>
                                            <MaterialCommunityIcons 
                                                name={getRecipeIcon(recipe.type)} 
                                                size={22} 
                                                color="#2ECC71" 
                                            />
                                            <Text style={styles.cardName}>{recipe.name}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))
                    ) : (
                        applications.map((app) => (
                            <View key={app.id} style={styles.section}>
                                <Text style={styles.dateLabel}>{app.date}</Text>
                                <TouchableOpacity style={styles.card}>
                                    <View style={styles.cardInfo}>
                                        <MaterialCommunityIcons 
                                            name={getRecipeIcon(app.type || 'foliar')} 
                                            size={22} 
                                            color="#2ECC71" 
                                        />
                                        <View>
                                            <Text style={styles.cardName}>{app.recipe_name}</Text>
                                            <Text style={styles.cardSubname}>{app.culture}</Text>
                                        </View>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                    <View style={{ height: 100 }} />
                </ScrollView>

                {/* FAB (Floating Action Button) */}
                <TouchableOpacity 
                    style={styles.fab}
                    onPress={() => navigation.navigate(activeTab === 'Receitas' ? 'RecipeForm' : 'ApplicationForm')}
                >
                    <View style={styles.fabGradient}>
                        <Ionicons name="add" size={30} color="#FFF" />
                    </View>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    tabWrapper: {
        paddingHorizontal: 20,
        marginVertical: 15,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#162431',
        borderRadius: 12,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
    },
    tabActive: {
        backgroundColor: '#1E3141', // Leve destaque para o container
        backgroundColor: '#1F3C44', // Tom mais próximo do mockup
        borderWidth: 1,
        borderColor: '#2ECC71',
    },
    // Ajuste p/ bater com mockup: a aba ativa é verde transparente ou apenas borda?
    // Mockup: A aba ativa tem um fundo verde escuro/azulado suave.
    tabActive: {
        backgroundColor: '#264653',
        backgroundColor: '#1B4D3E', // Verde escuro profissional
    },
    tabText: {
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '700',
    },
    tabTextActive: {
        color: '#FFF',
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    cultureIcon: {
        fontSize: 18,
        marginRight: 8,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    dateLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    card: {
        backgroundColor: '#1B263B',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    cardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    cardSubname: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        fontWeight: '600',
    },
    fab: { position: 'absolute', bottom: 30, right: 22, borderRadius: 30, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
    fabGradient: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: '#D4AF37' }
});

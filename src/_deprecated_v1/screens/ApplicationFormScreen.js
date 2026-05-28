import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput, SafeAreaView, StatusBar, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FertilizationService } from '../services/FertilizationService';
import { StockService } from '../services/StockService';
import ScreenHeader from '../ui/ScreenHeader';
import { Picker } from '@react-native-picker/picker';

/**
 * ApplicationFormScreen - Registro de Aplicação de Adubo 📅🧪
 */
export default function ApplicationFormScreen() {
    const navigation = useNavigation();
    
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toLocaleDateString('pt-BR'));
    const [culture, setCulture] = useState('Morango');
    const [recipes, setRecipes] = useState([]);
    const [selectedRecipeId, setSelectedRecipeId] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadRecipes();
    }, [culture]);

    const loadRecipes = async () => {
        const allRecipes = await FertilizationService.getRecipes();
        const filtered = allRecipes.filter(r => r.culture === culture);
        setRecipes(filtered);
        if (filtered.length > 0) {
            setSelectedRecipeId(filtered[0].id);
        } else {
            setSelectedRecipeId('');
        }
    };

    const handleApply = async () => {
        if (!selectedRecipeId) {
            Alert.alert('Erro', 'Selecione uma receita para aplicar.');
            return;
        }

        setLoading(true);
        try {
            // 1. Obter detalhes da receita (para saber os insumos)
            const recipe = await FertilizationService.getRecipeDetails(selectedRecipeId);
            
            // 2. Registrar a Aplicação (Histórico + Caderno)
            await FertilizationService.createApplication({
                recipe_id: selectedRecipeId,
                recipe_name: recipe.name,
                date,
                culture,
                notes,
                user_id: 'produtor_local'
            }, recipe.items);

            // 3. Baixar Estoque Automático (Poderoso!)
            await StockService.applyStockDeduction(recipe.items, `Adubação: ${recipe.name}`);

            Alert.alert('Sucesso!', 'Aplicação registrada e estoque atualizado. ✅');
            navigation.goBack();
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Falha ao registrar aplicação.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: '#0D1B2A' }]}>
            <StatusBar barStyle="light-content" />
            <SafeAreaView style={styles.safeArea}>
                <ScreenHeader title="Nova Aplicação" onBack={() => navigation.goBack()} />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        <Text style={styles.label}>Data da Aplicação</Text>
                        <TextInput 
                            style={styles.input} 
                            value={date}
                            onChangeText={setDate}
                            placeholder="DD/MM/AAAA"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />

                        <Text style={styles.label}>Cultura</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={culture}
                                onValueChange={(v) => setCulture(v)}
                                style={styles.picker}
                                dropdownIconColor="#FFF"
                            >
                                <Picker.Item label="Morango" value="Morango" />
                                <Picker.Item label="Flor" value="Flor" />
                                <Picker.Item label="Outros" value="Outros" />
                            </Picker>
                        </View>

                        <Text style={styles.label}>Receita (Filtrada por Cultura)</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={selectedRecipeId}
                                onValueChange={(v) => setSelectedRecipeId(v)}
                                style={styles.picker}
                                dropdownIconColor="#FFF"
                            >
                                {recipes.length > 0 ? (
                                    recipes.map(r => (
                                        <Picker.Item key={r.id} label={r.name} value={r.id} />
                                    ))
                                ) : (
                                    <Picker.Item label="Nenhuma receita para esta cultura" value="" />
                                )}
                            </Picker>
                        </View>

                        <Text style={styles.label}>Observações / Condições</Text>
                        <TextInput 
                            style={[styles.input, { height: 100, textAlignVertical: 'top' }]} 
                            placeholder="Ex: Solo úmido, aplicar ao entardecer." 
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            multiline
                            value={notes}
                            onChangeText={setNotes}
                        />
                    </View>

                    <TouchableOpacity 
                        style={[styles.applyButton, loading && { opacity: 0.7 }]} 
                        onPress={handleApply}
                        disabled={loading || !selectedRecipeId}
                    >
                        <Text style={styles.applyButtonText}>REGISTRAR APLICAÇÃO</Text>
                        <Ionicons name="checkmark-circle" size={24} color="#FFF" style={{ marginLeft: 10 }} />
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scrollContent: { padding: 20 },
    section: { marginBottom: 30 },
    label: { color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 8, fontWeight: '600' },
    input: {
        backgroundColor: '#1B263B',
        borderRadius: 12,
        padding: 15,
        color: '#FFF',
        fontSize: 16,
        marginBottom: 20,
    },
    pickerContainer: {
        backgroundColor: '#1B263B',
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
    },
    picker: {
        color: '#FFF',
    },
    applyButton: {
        backgroundColor: '#2ECC71',
        paddingVertical: 18,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    applyButtonText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});

import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    TextInput, SafeAreaView, StatusBar, Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FertilizationService } from '../services/FertilizationService';
import ScreenHeader from '../ui/ScreenHeader';
import { Picker } from '@react-native-picker/picker';

/**
 * RecipeFormScreen - Cadastro/Edição de Receitas 🌿🧾
 */
export default function RecipeFormScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { recipeId } = route.params || {};
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};

    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [type, setType] = useState('foliar');
    const [culture, setCulture] = useState('Morango');
    const [description, setDescription] = useState('');
    const [items, setItems] = useState([]);

    // Campos do Modal/Item
    const [itemName, setItemName] = useState('');
    const [itemQty, setItemQty] = useState('');
    const [itemUnit, setItemUnit] = useState('ml');

    useEffect(() => {
        if (recipeId) {
            loadRecipe();
        }
    }, [recipeId]);

    const loadRecipe = async () => {
        const data = await FertilizationService.getRecipeDetails(recipeId);
        if (data) {
            setName(data.name);
            setType(data.type);
            setCulture(data.culture);
            setDescription(data.description);
            setItems(data.items.map(it => ({
                id: it.id,
                product_name: it.product_name,
                quantity: String(it.quantity),
                unit: it.unit
            })));
        }
    };

    const addItem = () => {
        if (!itemName || !itemQty) {
            Alert.alert('Erro', 'Preencha o nome do produto e a quantidade.');
            return;
        }
        const newItem = {
            id: Math.random().toString(),
            product_name: itemName,
            quantity: itemQty,
            unit: itemUnit
        };
        setItems([...items, newItem]);
        setItemName('');
        setItemQty('');
    };

    const removeItem = (id) => {
        setItems(items.filter(it => it.id !== id));
    };

    const handleSave = async () => {
        if (!name || items.length === 0) {
            Alert.alert('Erro', 'Informe o nome da receita e adicione pelo menos um insumo.');
            return;
        }

        setLoading(true);
        try {
            await FertilizationService.createRecipe({
                name, type, culture, description, user_id: 'produtor_local'
            }, items);
            Alert.alert('Sucesso', 'Receita salva com sucesso!');
            navigation.goBack();
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível salvar a receita.');
        } finally {
            setLoading(false);
        }
    };

    const isDark = theme?.theme_mode === 'dark';
    const inputBg = activeColors.card || '#FFFFFF';
    const inputBorder = activeColors.border || 'rgba(0,0,0,0.1)';
    const textColor = activeColors.text || '#1E293B';
    const textMutedColor = activeColors.textMuted || '#64748B';

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg || '#F8FAFC' }]}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
            <SafeAreaView style={styles.safeArea}>
                <ScreenHeader title={recipeId ? "Editar Receita" : "Nova Receita"} onBack={() => navigation.goBack()} />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    
                    {/* BLOCO 1: INFO */}
                    <View style={styles.section}>
                        <Text style={[styles.label, { color: textMutedColor }]}>Nome da Receita</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]} 
                            placeholder="Ex: Foliar 1" 
                            placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={[styles.label, { color: textMutedColor }]}>Tipo</Text>
                        <View style={[styles.pickerContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                            <Picker
                                selectedValue={type}
                                onValueChange={(itemValue) => setType(itemValue)}
                                style={[styles.picker, { color: textColor }]}
                                dropdownIconColor={textColor}
                            >
                                <Picker.Item label="Foliar" value="foliar" />
                                <Picker.Item label="Gotejo" value="gotejo" />
                            </Picker>
                        </View>

                        <Text style={[styles.label, { color: textMutedColor }]}>Cultura</Text>
                        <View style={[styles.pickerContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                            <Picker
                                selectedValue={culture}
                                onValueChange={(itemValue) => setCulture(itemValue)}
                                style={[styles.picker, { color: textColor }]}
                                dropdownIconColor={textColor}
                            >
                                <Picker.Item label="Morango" value="Morango" />
                                <Picker.Item label="Flor" value="Flor" />
                                <Picker.Item label="Outros" value="Outros" />
                            </Picker>
                        </View>

                        <Text style={[styles.label, { color: textMutedColor }]}>Descrição (opcional)</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor, height: 80, textAlignVertical: 'top' }]} 
                            placeholder="Notas extras..." 
                            placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                            multiline
                            value={description}
                            onChangeText={setDescription}
                        />
                    </View>

                    {/* BLOCO 2: INSUMOS */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: textColor }]}>Insumos da Adubação</Text>
                        
                        {items.map((item) => (
                            <View key={item.id} style={styles.itemRow}>
                                <View style={styles.itemMain}>
                                    <View style={[styles.itemIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                        <MaterialCommunityIcons name="spray-bottle" size={18} color={activeColors.primary || '#10B981'} />
                                    </View>
                                    <Text style={[styles.itemName, { color: textColor }]}>{item.product_name}</Text>
                                </View>
                                <View style={styles.itemRight}>
                                    <Text style={[styles.itemQty, { color: textMutedColor }]}>{item.quantity} {item.unit}</Text>
                                    <TouchableOpacity onPress={() => removeItem(item.id)}>
                                        <Ionicons name="trash-outline" size={20} color={activeColors.error || '#EF4444'} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        <View style={styles.addItemBox}>
                            <TextInput 
                                style={[styles.input, { flex: 2, marginBottom: 0, backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]} 
                                placeholder="Produto" 
                                placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                                value={itemName}
                                onChangeText={setItemName}
                            />
                            <TextInput 
                                style={[styles.input, { width: 70, marginBottom: 0, marginHorizontal: 8, backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]} 
                                placeholder="Qtd" 
                                keyboardType="numeric"
                                placeholderTextColor={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
                                value={itemQty}
                                onChangeText={setItemQty}
                            />
                            <TouchableOpacity style={[styles.addButton, { backgroundColor: activeColors.primary || '#10B981' }]} onPress={addItem}>
                                <Ionicons name="add" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.saveButton, { backgroundColor: activeColors.primary || '#10B981' }, loading && { opacity: 0.7 }]} 
                        onPress={handleSave}
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>SALVAR RECEITA</Text>
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
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
    label: { fontSize: 13, marginBottom: 8, fontWeight: '600' },
    input: {
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    pickerContainer: {
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
    },
    picker: {
        height: 55,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    itemMain: { flexDirection: 'row', alignItems: 'center' },
    itemIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    itemName: { fontWeight: '600', fontSize: 15, marginLeft: 10 },
    itemRight: { flexDirection: 'row', alignItems: 'center' },
    itemQty: { fontWeight: '700', marginRight: 12 },
    addItemBox: { flexDirection: 'row', alignItems: 'center' },
    addButton: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    saveButton: {
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    saveButtonText: { color: '#FFF', fontWeight: '900', fontSize: 16, letterSpacing: 1 }
});

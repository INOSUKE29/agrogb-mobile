import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/globalStyles';
import Button from './Button';

export default function QuickAddModal({ visible, onClose, onSave, loading, title = 'NOVO CADASTRO', placeholder = 'Nome do item...', hideCategory = true }) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');

    const handleSave = () => {
        if (!name.trim()) return;
        onSave(name.trim(), category.trim());
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={onClose} disabled={loading}>
                            <Ionicons name="close" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>NOME *</Text>
                    <View style={styles.inputBox}>
                        <TextInput
                            style={styles.input}
                            placeholder={placeholder}
                            placeholderTextColor="#8E8E93"
                            value={name}
                            onChangeText={setName}
                            autoFocus
                            editable={!loading}
                            autoCapitalize="words"
                        />
                    </View>

                    {!hideCategory && (
                        <>
                            <Text style={styles.label}>CATEGORIA (OPCIONAL)</Text>
                            <View style={styles.inputBox}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ex: FERTILIZANTE, INSUMO..."
                                    placeholderTextColor="#8E8E93"
                                    value={category}
                                    onChangeText={setCategory}
                                    editable={!loading}
                                    autoCapitalize="characters"
                                />
                            </View>
                        </>
                    )}

                    <Button 
                        title={loading ? "SALVANDO..." : "SALVAR E SELECIONAR"} 
                        icon={loading ? <ActivityIndicator size="small" color="#FFF" style={{marginRight: 8}}/> : <Ionicons name="checkmark-circle" size={18} color="#FFF" />}
                        onPress={handleSave}
                        disabled={loading || !name.trim()}
                        style={{ marginTop: 25, width: '100%' }}
                    />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    card: { 
        backgroundColor: '#FFFFFF', 
        borderRadius: 24, 
        padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 14, fontWeight: '900', letterSpacing: 1, color: '#111827' },
    label: { fontSize: 10, fontWeight: '800', color: '#6B7280', marginBottom: 8, marginTop: 15 },
    inputBox: { 
        flexDirection: 'row', alignItems: 'center', height: 50, 
        borderRadius: 12, borderWidth: 1, paddingHorizontal: 15,
        backgroundColor: '#F9FAFB', borderColor: '#D1D5DB'
    },
    input: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' }
});

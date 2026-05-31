import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function NovoPlantioPanel({ onConfirm, onClose }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>NOVO PLANTIO</Text>
            <View style={styles.row}>
                <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                    <Text style={styles.cancelText}>CANCELAR</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onConfirm} style={styles.confirmBtn}>
                    <Text style={styles.confirmText}>CONFIRMAR</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 25, backgroundColor: '#FFF', borderRadius: 24, elevation: 10 },
    title: { fontSize: 20, fontWeight: '900', color: '#1E1E1E', marginBottom: 25, textAlign: 'center' },
    row: { flexDirection: 'row', gap: 12 },
    cancelBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
    confirmBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: '#15803D', alignItems: 'center' },
    cancelText: { fontWeight: 'bold', color: '#6E6E6E' },
    confirmText: { fontWeight: 'bold', color: '#FFF' }
});

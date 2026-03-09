import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, View } from 'react-native';
import { insertCusto, getCategoriasDespesa } from '../../database/database';

export default function CadastroCustos() {
    const [valor, setValor] = useState('');
    const [categoria] = useState('GERAL');
    const [categorias, setCategorias] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const cats = await getCategoriasDespesa();
                setCategorias(cats);
            } catch { }
        };
        load();
    }, []);

    const salvar = async () => {
        if (!valor || !categoria) return Alert.alert('Ops', 'Lançamento inválido.');
        try {
            await insertCusto({ valor: parseFloat(valor), categoria });
            Alert.alert('Sucesso', 'Custo lançado!');
        } catch { }
    };

    return (
        <ScrollView style={styles.container}>
            <TextInput style={styles.input} placeholder="R$ 0,00" value={valor} onChangeText={setValor} keyboardType="numeric" />
            <TouchableOpacity style={styles.btn} onPress={salvar}><Text style={{ color: '#FFF' }}>LANÇAR CUSTO</Text></TouchableOpacity>
            <View style={{ marginTop: 20 }}>
                {categorias.map(c => <Text key={c.id}>{c.nome}</Text>)}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#FFF' },
    input: { padding: 15, borderWidth: 1, borderRadius: 10, marginBottom: 10 },
    btn: { backgroundColor: '#DC2626', padding: 15, borderRadius: 10, alignItems: 'center' }
});

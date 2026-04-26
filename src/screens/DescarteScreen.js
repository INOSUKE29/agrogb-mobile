import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../ui/ScreenHeader';
import FundoAnimado from '../components/FundoAnimado';

export default function DescarteScreen({ navigation }) {
    return (
        <FundoAnimado>
            <ScreenHeader title="GESTÃO DE DESCARTE" onBack={() => navigation.goBack()} />
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.emptyBox}>
                    <Ionicons name="trash-bin-outline" size={80} color="rgba(255,255,255,0.1)" />
                    <Text style={styles.emptyTxt}>Nenhum registro de descarte encontrado para esta área.</Text>
                    <TouchableOpacity style={styles.btn}>
                        <Text style={styles.btnTxt}>NOVO LANÇAMENTO</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </FundoAnimado>
    );
}

const styles = StyleSheet.create({
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 30 },
    emptyBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 40, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    emptyTxt: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 20, fontSize: 14, fontWeight: '600' },
    btn: { marginTop: 30, backgroundColor: '#10B981', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 20 },
    btnTxt: { color: '#FFF', fontWeight: '900' }
});

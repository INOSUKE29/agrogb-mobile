import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HeaderProfileMenu() {
    const navigation = useNavigation();
    const [visible, setVisible] = useState(false);

    const handleLogout = async () => {
        setVisible(false);
        await AsyncStorage.removeItem('user_session');
        navigation.replace('Login');
    };

    const navigateTo = (screen) => {
        setVisible(false);
        navigation.navigate(screen);
    };

    return (
        <View>
            <TouchableOpacity onPress={() => setVisible(true)} style={styles.iconBtn}>
                <Ionicons name="person-circle" size={32} color="#A7F3D0" />
            </TouchableOpacity>

            <Modal
                transparent
                visible={visible}
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setVisible(false)}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.menu}>
                                <TouchableOpacity style={styles.item} onPress={() => navigateTo('Profile')}>
                                    <Ionicons name="person-outline" size={20} color="#064e3b" />
                                    <Text style={styles.itemText}>Meu Perfil</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.item} onPress={() => navigateTo('Settings')}>
                                    <Ionicons name="settings-outline" size={20} color="#064e3b" />
                                    <Text style={styles.itemText}>Configurações</Text>
                                </TouchableOpacity>

                                <View style={styles.divider} />

                                <TouchableOpacity style={styles.item} onPress={handleLogout}>
                                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                                    <Text style={[styles.itemText, { color: '#EF4444' }]}>Sair</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    iconBtn: { padding: 4 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' },
    menu: {
        position: 'absolute',
        top: 60, // Adjust based on header height
        right: 16,
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingVertical: 8,
        width: 180,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16
    },
    itemText: { marginLeft: 12, fontSize: 14, color: '#1F2937', fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 }
});

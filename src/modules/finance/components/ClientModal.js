import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import BaseModal from '../../../components/modals/BaseModal';
import AgroInput from '../../../ui/components/AgroInput';
import AgroButton from '../../../ui/components/AgroButton';
import { executeQuery } from '../../../database/database';
import { supabase } from '../../../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * ClientModal (V1.1 DIAMOND PRO) 💎
 * Cadastro ultra-rápido de clientes. 🚀
 */
export default function ClientModal({ visible, onClose, onCreated }) {
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!nome.trim()) return Alert.alert('Aviso', 'O nome do cliente é obrigatório.');
        
        setLoading(true);
        try {
            const uuid = uuidv4();
            const timestamp = new Date().toISOString();
            
            const record = {
                uuid,
                nome: nome.toUpperCase(),
                telefone: telefone,
                last_updated: timestamp,
                sync_status: 0
            };

            await executeQuery(
                `INSERT INTO clientes (uuid, nome, telefone, last_updated, sync_status) VALUES (?, ?, ?, ?, ?)`,
                [uuid, record.nome, record.telefone, timestamp, 0]
            );

            // Sync Background
            supabase.from('clients').insert([{
                id: uuid,
                nome: record.nome,
                telefone: record.telefone
            }]).then(({ error }) => {
                if (!error) executeQuery(`UPDATE clientes SET sync_status = 1 WHERE uuid = ?`, [uuid]);
            });

            if (onCreated) onCreated(record);
            setNome('');
            setTelefone('');
            onClose();
        } catch (_) {
            Alert.alert('Erro', 'Falha ao criar cliente rapidamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal visible={visible} onClose={onClose} title="NOVO CLIENTE RÁPIDO">
            <View style={styles.form}>
                <AgroInput
                    label="NOME COMPLETO / RAZÃO"
                    placeholder="Ex: JOÃO DA SILVA"
                    value={nome}
                    onChangeText={setNome}
                    autoFocus
                />
                
                <AgroInput
                    label="TELEFONE / WHATSAPP"
                    placeholder="(00) 00000-0000"
                    value={telefone}
                    onChangeText={setTelefone}
                    keyboardType="phone-pad"
                />

                <AgroButton
                    title="SALVAR CLIENTE"
                    onPress={handleSave}
                    loading={loading}
                    icon="person-add"
                    style={{ marginTop: 20 }}
                />
            </View>
        </BaseModal>
    );
}

const styles = StyleSheet.create({
    form: {
        paddingTop: 10,
    }
});

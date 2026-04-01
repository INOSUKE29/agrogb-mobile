import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import BaseModal from '../../../components/modals/BaseModal';
import AgroInput from '../../../ui/components/AgroInput';
import AgroButton from '../../../ui/components/AgroButton';
import { InventoryService } from '../services/InventoryService';

/**
 * ProductModal (V1.1 DIAMOND PRO) 💎
 * Cadastro ultra-rápido de itens sem sair do fluxo. 🚀
 */
export default function ProductModal({ visible, onClose, onCreated }) {
    const [nome, setNome] = useState('');
    const [unidade, setUnidade] = useState('KG');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!nome.trim()) return Alert.alert('Aviso', 'O nome do produto é obrigatório.');
        
        setLoading(true);
        try {
            const newProduct = await InventoryService.quickCreate({
                nome: nome.toUpperCase(),
                unidade: unidade.toUpperCase(),
                tipo: 'PRODUTO'
            });
            
            if (onCreated) onCreated(newProduct);
            setNome('');
            onClose();
        } catch (_) {
            Alert.alert('Erro', 'Falha ao criar produto rapidamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal visible={visible} onClose={onClose} title="CADASTRAR PRODUTO RÁPIDO">
            <View style={styles.form}>
                <AgroInput
                    label="NOME DO PRODUTO"
                    placeholder="Ex: MORANGO ESPECIAL"
                    value={nome}
                    onChangeText={setNome}
                    autoFocus
                />
                
                <AgroInput
                    label="UNIDADE (KG, CX, LT...)"
                    placeholder="Ex: CX"
                    value={unidade}
                    onChangeText={t => setUnidade(t.toUpperCase())}
                />

                <AgroButton
                    title="CADASTRAR E SELECIONAR"
                    onPress={handleSave}
                    loading={loading}
                    icon="checkmark-done"
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

// src/components/monitoramento/RegistroItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import GlowCard from '../../components/ui/GlowCard';

/**
 * Props:
 *   item: {
 *     id: string,
 *     tipo: 'praga' | 'doenca' | 'observacao',
 *     intensidade?: 'baixa' | 'media' | 'alta',
 *     descricao: string,
 *     fotos?: string[], // array of image URIs (optional)
 *     pdfUrl?: string   // optional PDF URL
 *   }
 */
export default function RegistroItem({ item }) {
  const { colors } = useTheme();

  const getTipoLabel = () => {
    switch (item.tipo) {
      case 'praga': return 'PRAGA';
      case 'doenca': return 'DOENÇA';
      default: return 'OBSERVAÇÃO';
    }
  };

  const getCorIntensidade = () => {
    switch (item.intensidade) {
      case 'alta': return colors.danger || '#E74C3C'; 
      case 'media': return colors.warning || '#F39C12';
      case 'baixa': return colors.info || '#3B82F6';
      default: return colors.border || '#BDC3C7';
    }
  };

  return (
    <GlowCard style={styles.card}>
      {/* Header with type and optional intensity tag */}
      <View style={styles.topo}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
           <Ionicons name="finger-print-outline" size={16} color={colors.textSecondary} style={{marginRight: 6}} />
           <Text style={[styles.tipo, { color: colors.textPrimary }]}>{getTipoLabel()}</Text>
        </View>
        
        {item.intensidade && (
          <View style={[styles.tag, { backgroundColor: getCorIntensidade() + '20', borderColor: getCorIntensidade() + '50', borderWidth: 1 }]}>
            <Text style={[styles.tagText, { color: getCorIntensidade() }]}>{item.intensidade.toUpperCase()}</Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text style={[styles.descricao, { color: colors.textSecondary }]}>{item.descricao}</Text>

      {/* Footer with photo count and optional PDF button */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Text style={[styles.fotos, { color: colors.textMuted }]}>
           <Ionicons name="camera-outline" size={14} /> {item.fotos?.length || 0} foto(s)
        </Text>
        {item.pdfUrl && (
          <TouchableOpacity style={[styles.pdfBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]} onPress={() => {
            console.log('Abrir PDF:', item.pdfUrl);
          }}>
            <Ionicons name="document-text" size={12} color={colors.primary} />
            <Text style={[styles.pdfText, { color: colors.primary }]}> PDF</Text>
          </TouchableOpacity>
        )}
      </View>
    </GlowCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipo: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 9,
    fontWeight: '900',
  },
  descricao: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12
  },
  fotos: {
    fontSize: 12,
    fontWeight: '700'
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  pdfText: {
    fontSize: 10,
    fontWeight: '800',
  },
});

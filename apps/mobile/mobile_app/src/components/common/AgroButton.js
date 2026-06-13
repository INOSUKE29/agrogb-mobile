import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export default function AgroButton({
    title,
    onPress,
    variant = 'primary', // primary, secondary, outline, danger, icon
    iconName, // For variant='icon' or appending to text
    iconPosition = 'left', // 'left' or 'right'
    loading = false,
    disabled = false,
    style,
    textStyle
}) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};
    const isDark = theme?.dark || false;

    // Default height for standardization
    const standardHeight = theme?.metrics?.buttonHeight || 55;
    const standardRadius = theme?.metrics?.radius || 12;

    // Cores Dinâmicas baseadas no tema e variante
    let bg = activeColors.primary || '#10B981';
    let txt = '#FFFFFF';
    let border = 'transparent';
    let borderWidth = 0;

    switch (variant) {
        case 'secondary':
            bg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6';
            txt = isDark ? '#E5E7EB' : '#4B5563';
            border = 'transparent';
            break;
        case 'outline':
            bg = 'transparent';
            txt = activeColors.primary || '#10B981';
            border = activeColors.primary || '#10B981';
            borderWidth = 1.5;
            break;
        case 'danger':
            bg = activeColors.dangerBg || '#FEE2E2';
            txt = activeColors.error || '#EF4444';
            border = 'transparent';
            break;
        case 'icon':
            bg = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E5E7EB';
            txt = isDark ? '#FFFFFF' : '#1F2937';
            border = 'transparent';
            break;
        case 'primary':
        default:
            bg = activeColors.primary || '#10B981';
            txt = '#FFFFFF';
            border = 'transparent';
            break;
    }

    // Estado desativado dinâmico por tema
    if (disabled) {
        bg = isDark ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';
        txt = isDark ? '#6B7280' : '#94A3B8';
        border = isDark ? 'rgba(255, 255, 255, 0.1)' : 'transparent';
        if (variant === 'outline') {
            bg = 'transparent';
            borderWidth = 1.5;
        }
    }

    // Estilo base do container
    const containerStyle = [
        styles.container,
        {
            backgroundColor: bg,
            borderColor: border,
            borderWidth: borderWidth,
            borderRadius: variant === 'icon' && !title ? standardHeight / 2 : standardRadius,
            height: standardHeight,
            width: variant === 'icon' && !title ? standardHeight : 'auto',
            paddingHorizontal: variant === 'icon' && !title ? 0 : 20,
            justifyContent: 'center',
            alignItems: 'center',
        },
        style
    ];

    const renderContent = () => {
        if (loading) {
            return <ActivityIndicator color={txt} size="small" />;
        }

        if (variant === 'icon' && !title) {
            return <Ionicons name={iconName} size={24} color={txt} />;
        }

        return (
            <View style={styles.contentRow}>
                {iconName && iconPosition === 'left' && (
                    <Ionicons name={iconName} size={20} color={txt} style={styles.iconLeft} />
                )}
                <Text style={[styles.text, { color: txt }, textStyle]}>
                    {title ? title.toUpperCase() : ''}
                </Text>
                {iconName && iconPosition === 'right' && (
                    <Ionicons name={iconName} size={20} color={txt} style={styles.iconRight} />
                )}
            </View>
        );
    };

    return (
        <TouchableOpacity
            style={containerStyle}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={disabled || loading}
        >
            {renderContent()}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
        // Standard shadow for all buttons to keep consistency
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    text: {
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1.2,
    },
    iconLeft: {
        marginRight: 8,
    },
    iconRight: {
        marginLeft: 8,
    }
});

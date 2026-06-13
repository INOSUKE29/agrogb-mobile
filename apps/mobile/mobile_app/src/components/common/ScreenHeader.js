import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export default function ScreenHeader({ 
    title, 
    subtitle, 
    onBack, 
    rightActions, // Array de componentes ou função que retorna JSX
    showBack = true,
    forceDarkTheme = false,
    style 
}) {
    const { theme } = useTheme();
    const navigation = useNavigation();
    const isDark = forceDarkTheme || theme?.dark || false;

    const textColor = isDark ? '#FFF' : '#111827';
    const subTextColor = isDark ? '#9CA3AF' : '#6B7280';
    const iconColor = isDark ? '#FFF' : '#374151';

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <View style={[styles.headerContainer, style]}>
            <View style={styles.leftContainer}>
                {showBack && (
                    <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={28} color={iconColor} />
                    </TouchableOpacity>
                )}
                <View style={styles.titleContainer}>
                    <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
                        {title}
                    </Text>
                    {subtitle && (
                        <Text style={[styles.subtitle, { color: subTextColor }]} numberOfLines={1}>
                            {subtitle}
                        </Text>
                    )}
                </View>
            </View>

            <View style={styles.rightContainer}>
                {rightActions}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 15,
        minHeight: 60,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    }
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/ThemeContext';

export default function AppHeader({ title, subtitle, rightIcon, onRightPress, showBack = true }) {
    const navigation = useNavigation();
    const { colors } = useTheme();

    // Calculando margem extra caso status bar não seja coberta no gradient
    const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight;

    return (
        <View style={[styles.headerWrap, { backgroundColor: colors.bg, paddingTop: STATUSBAR_HEIGHT + 10 }]}>
            
            {showBack ? (
                <TouchableOpacity style={[styles.iconWrap, { backgroundColor: colors.cardBg }]} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={colors.textMain} />
                </TouchableOpacity>
            ) : <View style={styles.iconWrap} />}

            <View style={styles.titleWrap}>
                <Text style={[styles.title, { color: colors.textMain }]} numberOfLines={1}>{title}</Text>
                {subtitle && <Text style={[styles.subtitle, { color: colors.textSub }]} numberOfLines={1}>{subtitle}</Text>}
            </View>

            {rightIcon ? (
                <TouchableOpacity style={[styles.iconWrap, { backgroundColor: colors.cardBg }]} onPress={onRightPress}>
                    <Ionicons name={rightIcon} size={22} color={colors.textMain} />
                </TouchableOpacity>
            ) : <View style={styles.iconWrap} />}
        </View>
    );
}

const styles = StyleSheet.create({
    headerWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 15,
        justifyContent: 'space-between'
    },
    titleWrap: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 10
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    subtitle: {
        fontSize: 12,
        marginTop: 2
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.02)'
    }
});

import React from 'react';
import { View, StyleSheet } from 'react-native';

import { useTheme } from '../theme/ThemeContext';

export default function AppContainer({ children, style }) {
    const { colors } = useTheme();

    return (
        <View
            style={[
                styles.fill,
                { backgroundColor: colors.background },
                style
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
});

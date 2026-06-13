import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme/ThemeContext';
import { colors } from '../../styles/globalStyles';
import ScreenHeader from '../common/ScreenHeader';

export default function ScreenLayout({
    children,
    title,
    subtitle,
    onBack,
    rightActions,
    showBack = true,
    scrollable = false,
    contentContainerStyle,
    gradientColors, // custom gradient colors [top, bottom]
    headerContent,  // custom header children (e.g. tabs)
    noPadding = false,
}) {
    const { theme } = useTheme();
    const isDark = theme?.dark || false;

    // Premium V8 Defaults (Authentic Glassmorphism with deep blue/slate)
    const defaultGradient = isDark 
        ? ['#111827', '#0F172A'] 
        : [theme?.colors?.primary || '#10B981', '#064E3B'];

    const colorsToUse = gradientColors || defaultGradient;

    const ContentWrapper = scrollable ? ScrollView : View;
    const wrapperProps = scrollable 
        ? { 
            showsVerticalScrollIndicator: false, 
            contentContainerStyle: [styles.scrollContent, contentContainerStyle] 
          } 
        : { 
            style: [styles.viewContent, contentContainerStyle] 
          };

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            
            <LinearGradient colors={colorsToUse} style={styles.headerGradient}>
                <SafeAreaView>
                    {(title || showBack) && (
                        <ScreenHeader 
                            title={title} 
                            subtitle={subtitle} 
                            onBack={onBack}
                            rightActions={rightActions}
                            showBack={showBack}
                            // Forces text/icon colors to white for the header gradient
                            forceDarkTheme={true} 
                        />
                    )}
                    {headerContent}
                </SafeAreaView>
            </LinearGradient>

            <ContentWrapper {...wrapperProps}>
                <View style={noPadding ? styles.noPadding : styles.padding}>
                    {children}
                </View>
            </ContentWrapper>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerGradient: {
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingBottom: 20,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100,
    },
    viewContent: {
        flex: 1,
    },
    padding: {
        flex: 1,
        padding: 20,
    },
    noPadding: {
        flex: 1,
    }
});

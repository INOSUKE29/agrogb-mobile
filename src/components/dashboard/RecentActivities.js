import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import Card from '../common/Card';

export default function RecentActivities({ activities }) {
    const { theme } = useTheme();
    const activeColors = theme?.colors || {};

    if (!activities || activities.length === 0) return null;

    const iconBg = theme?.theme_mode === 'dark' ? '#1E293B' : '#F1F5F9';
    const iconColor = activeColors.textMuted || '#6B7280';
    const borderColor = activeColors.border || '#F3F4F6';

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: activeColors.textMuted || '#6B7280' }]}>ATIVIDADES RECENTES</Text>
            <Card noPadding>
                {activities.map((item, index) => (
                    <TouchableOpacity 
                        key={item.id} 
                        style={[
                            styles.activityItem, 
                            { borderBottomColor: borderColor },
                            index === activities.length - 1 && { borderBottomWidth: 0 }
                        ]}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
                            <Ionicons name={item.icon} size={20} color={iconColor} />
                        </View>
                        <View style={styles.content}>
                            <Text style={[styles.title, { color: activeColors.text || '#1F2937' }]}>{item.title}</Text>
                            <Text style={[styles.description, { color: activeColors.textMuted || '#6B7280' }]}>{item.description}</Text>
                        </View>
                        <View style={styles.rightSide}>
                            <Text style={[
                                styles.value, 
                                { color: item.value.startsWith('+') ? '#10B981' : item.value.startsWith('-') ? '#EF4444' : (activeColors.text || '#374151') }
                            ]}>
                                {item.value}
                            </Text>
                            <Text style={[styles.time, { color: activeColors.textMuted || '#9CA3AF' }]}>{item.time}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </Card>
            
            <TouchableOpacity style={styles.viewMoreBtn}>
                <Text style={[styles.viewMoreText, { color: activeColors.primary || '#10B981' }]}>VER TUDO</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginVertical: 15,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 15,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    description: {
        fontSize: 12,
        marginTop: 2,
    },
    rightSide: {
        alignItems: 'flex-end',
    },
    value: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    time: {
        fontSize: 10,
        marginTop: 2,
    },
    viewMoreBtn: {
        alignItems: 'center',
        marginTop: 15,
    },
    viewMoreText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
    }
});

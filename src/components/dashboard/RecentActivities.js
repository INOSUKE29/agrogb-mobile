import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '../common/Card';

export default function RecentActivities({ activities }) {
    if (!activities || activities.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>ATIVIDADES RECENTES</Text>
            <Card noPadding>
                {activities.map((item, index) => (
                    <TouchableOpacity 
                        key={item.id} 
                        style={[
                            styles.activityItem, 
                            index === activities.length - 1 && { borderBottomWidth: 0 }
                        ]}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name={item.icon} size={22} color="#4B5563" />
                        </View>
                        <View style={styles.content}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                        </View>
                        <View style={styles.rightSide}>
                            <Text style={[
                                styles.value, 
                                { color: item.value.startsWith('+') ? '#10B981' : item.value.startsWith('-') ? '#EF4444' : '#374151' }
                            ]}>
                                {item.value}
                            </Text>
                            <Text style={styles.time}>{item.time}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </Card>
            
            <TouchableOpacity style={styles.viewMoreBtn}>
                <Text style={styles.viewMoreText}>VER TUDO</Text>
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
        color: '#6B7280',
        letterSpacing: 1,
        marginBottom: 15,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
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
        color: '#1F2937',
    },
    description: {
        fontSize: 12,
        color: '#6B7280',
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
        color: '#9CA3AF',
        marginTop: 2,
    },
    viewMoreBtn: {
        alignItems: 'center',
        marginTop: 15,
    },
    viewMoreText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#10B981',
        letterSpacing: 1,
    }
});

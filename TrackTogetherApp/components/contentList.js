import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useListContext } from '../contexts/ListContext';
import { useNavigation } from '@react-navigation/native';

export const ContentList = () => {
    const { contentList, loading } = useListContext();
    const navigation = useNavigation();

    if (loading) {
        return (
            <View style={[styles.container, styles.centered]}>
                <ActivityIndicator size="large" color="#07a1b5" />
            </View>
        );
    }

    if (contentList.length === 0) {
        return (
            <View style={[styles.container, styles.centered]}>
                <Text style={styles.emptyText}>No lists yet. Create your first list!</Text>
            </View>
        );
    }

    const handleListClick = (listId) => {
        navigation.navigate('ListDetails', { listId });
    };

    return (
        <ScrollView style={styles.container}>
            {contentList.map((content) => (
                <TouchableOpacity 
                    key={content.id} 
                    style={styles.item} 
                    onPress={() => handleListClick(content.id)}
                >
                    <Text style={styles.text}>{content.name}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    item: {
        padding: 15,
        borderWidth: 1,
        marginVertical: 5,
        borderRadius: 3,
        borderColor: '#07a1b5',
        backgroundColor: '#07a1b5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 5,
        justifyContent: 'center',
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyText: {
        color: '#e0e0e0',
        fontSize: 16,
        textAlign: 'center',
    }
});

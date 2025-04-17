import React from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useListContext } from '../contexts/ListContext';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/AntDesign';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Alert } from 'react-native';

export const ContentList = () => {
    const { contentList, loading, refreshLists  } = useListContext();
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

    const handleDeleteList = async (listId) => {
        const listRef = doc(db, 'lists', listId);
    
        const fetchListName = async () => {
            const docSnapshot = await getDoc(listRef);
            if (docSnapshot.exists()) {
                return docSnapshot.data().name;
            } else {
                console.error('Document not found');
                return '';
            }
        };
    
        const deleteList = async () => {
            try {
                await deleteDoc(listRef);
                refreshLists(),
                console.log('List deleted');
            } catch (error) {
                console.error('Error deleting list: ', error);
            }
        };
    
        try {
            const listName = await fetchListName();
            if (listName) {
                Alert.alert(
                    'Confirm Deletion',
                    `Are you sure you want to delete "${listName}"? This action cannot be undone.`,
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                        },
                        {
                            text: 'Confirm',
                            onPress: deleteList,
                        },
                    ]
                );
            } else {
                console.log('List name could not be fetched');
            }
        } catch (error) {
            console.error('Error fetching list name: ', error);
        }
    };

    return (
        <ScrollView style={styles.container}>
            {contentList.map((content) => (
                <View key={content.id} style={styles.itemContainer}>
                    <TouchableOpacity 
                        style={styles.item} 
                        onPress={() => handleListClick(content.id)}
                    >
                        <Text style={styles.text}>{content.name}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.delete}
                        onPress={() => handleDeleteList(content.id)}
                    >
                        <Icon name="delete" size={25} color="black" />
                    </TouchableOpacity>
                </View>
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
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
        borderWidth: 1,
        borderRadius: 3,
        borderColor: '#07a1b5',
        backgroundColor: '#07a1b5',
        shadowOpacity: 0.8,
        shadowRadius: 5,
    },
    item: {
        flex: 1,
        padding: 15,
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
    },
    delete: {
        padding: 5,
        marginRight: 5,
        borderRadius: 5,
    }
});
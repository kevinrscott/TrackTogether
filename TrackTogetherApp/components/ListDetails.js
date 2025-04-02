import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';
import { useRoute } from '@react-navigation/native';
import Footer from './Footer';
import InviteUser from './InviteUser';

const ListDetails = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const route = useRoute(); 
    const { listId } = route.params;

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const user = auth.currentUser;
                const itemRef = collection(db, "users", user.uid, "lists", listId, "items");
                const itemSnapshot = await getDocs(itemRef);

                const items = []
                itemSnapshot.forEach((doc) => {
                    items.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                setItems([...items]);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching movies:', error);
                setLoading(false);
            }
        };

        fetchItems();
    }, [listId]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#07a1b5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <InviteUser listId={listId} />
            <Text style={styles.header}>Movies & Shows in this List:</Text>
            {items.length === 0 ? (
                <Text style={styles.emptyText}>No movies or shows in this list.</Text>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.movieItem}>
                            <Text style={styles.text}>{item.title || item.name}</Text>
                            <Text style={styles.text}>{item.year}</Text>
                        </View>
                    )}
                />
            )}

            <Footer />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        flex: 1,
        backgroundColor: '#1c1c1c',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 20,
    },
    emptyText: {
        color: '#e0e0e0',
        fontSize: 16,
        textAlign: 'center',
    },
    movieItem: {
        padding: 10,
        marginBottom: 10,
        backgroundColor: '#333',
        borderRadius: 5,
    },
    text: {
        color: 'white',
    },
});

export default ListDetails;

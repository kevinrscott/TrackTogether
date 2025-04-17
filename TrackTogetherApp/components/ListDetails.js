import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, SafeAreaView } from 'react-native';
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
                const itemRef = collection(db, "lists", listId, "items");
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
        <SafeAreaView style={styles.container}>
            <View style={styles.contentContainer}>
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
                                <Text style={[
                                styles.typeText,
                                item.type === "Movie"
                                ? styles.movie
                                : item.type === "Show"
                                ? styles.show
                                : item.type === "Game"
                                ? styles.game
                                : styles.defaultType, 
                            ]}>
                                {item.type}
                                {item.type === "Movie" ? "🎬 " :
                                item.type === "Show" ? "📺 " :
                                item.type === "Game" ? "🎮 " : ""}</Text>
                            </View>
                        )}
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
            <View style={styles.invite}>
                    <InviteUser listId={listId} />
                </View>
            <View>
                <Footer />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1c1c1c',
    },
    contentContainer: {
        flex: 1,
        padding: 5,
        paddingBottom: 0
    },
    listContent: {
        paddingBottom: 1,
        marginBottom: 0,
    },
    centered: {
        flex: 1,
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
        marginBottom: 3,
        backgroundColor: '#333',
        borderRadius: 5,
    },
    text: {
        color: 'white',
    },
    movie: {
        color: '#fcba03',
    },
    show: {
        color: '#1F8EF1',
    },
    game: {
        color: '#2ECC71'
    },
    invite: {
        alignItems: 'flex-end',
        marginBottom: 10,
        paddingBottom: 35,
        marginTop: 0
    },
});

export default ListDetails;
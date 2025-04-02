import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ListProvider } from '../contexts/ListContext';
import { CreateList } from './createList';
import Footer from "./Footer";
import { ContentList } from './contentList';

const HomeScreen = () => {
    return (
        <ListProvider>
            <View style={styles.container}>
                <View style={styles.header}>
                    <CreateList />
                </View>
                <View style={styles.content}>
                    <ContentList />
                </View>
                <Footer />
            </View>
        </ListProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#1c1c1c',
    },
    header: {
        alignItems: 'flex-end',
        maxHeight: 'auto',
        maxWidth: 'auto',
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        color: '#e0e0e0',
    },
    content: {
        flex: 1,
    }
});

export default HomeScreen;
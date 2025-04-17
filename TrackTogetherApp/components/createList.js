import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Entypo';
import { useListContext } from '../contexts/ListContext';

export const CreateList = () => {
    const { createNewList } = useListContext();
    
    const handleCreateList = () => {
        Alert.prompt(
            "New list",
            "Enter a name for your new list:",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Create",
                    onPress: async (listName) => {
                        const success = await createNewList(listName);
                        if (success) {
                            Alert.alert("Success", `"${listName}" List created successfully!`);
                        }
                    }
                }
            ],
            "plain-text"
        );
    };

    return (
        <View>
            <TouchableOpacity style={styles.button} onPress={handleCreateList}>
                <Icon style={styles.buttonIcon} name="add-to-list" size={30} color="#07a1b5" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 10,
        backgroundColor: '#07a1b5',
        borderRadius: 5,
    },
    buttonIcon: {
        paddingHorizontal: 10,
        color: 'white',
    }
});
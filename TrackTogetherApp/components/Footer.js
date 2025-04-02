import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { logoutUser } from '../services/AuthService';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import OtherIcon from 'react-native-vector-icons/Ionicons';

const Footer = () => {
    const navigation = useNavigation();

    const handleLogout = async () => {
        try {
            await logoutUser();
            navigation.replace('Login');
        } catch (error) {
            console.error(error);
        }
    };
    
    return (
        <View style={styles.footer}>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
                <Icon style={styles.buttonIcon}name="home" size={30} color="#07a1b5" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Movies')}>
                <Icon style={styles.buttonIcon}name="film" size={30} color="#07a1b5" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Notifications')}>
                <OtherIcon style={styles.buttonIcon}name="notifications" size={30} color="#07a1b5" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleLogout}>
                <Icon style={styles.buttonIcon}name="sign-out" size={30} color="#07a1b5" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        backgroundColor: 'black',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    button: {
        padding: 3,
        backgroundColor: 'transparent',
        paddingLeft: 20,
        paddingRight: 20,
    },
    buttonIcon: {
        paddingHorizontal: 15,
        paddingVertical: 6
    }
});

export default Footer;
import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { registerUser, loginUser } from "../services/AuthService";

const Login = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);

    const handleAuthentication = async () => {
        try {
            if (isLogin) {
                const user = await loginUser(email, password);
                Alert.alert("Success", "Logged in Successfully", [
                    { text: "OK", onPress: () => navigation.replace('Home') }
                ]);
            } else {
                const user = await registerUser(email, password);
                Alert.alert("Success", "Account created successfully", [
                    { text: "OK", onPress: () => navigation.replace('Home') }
                ]);
            }
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                Alert.alert('Error', 'Email already in use');
            } else if (error.code === 'auth/invalid-email') {
                Alert.alert('Error', 'Invalid email address');
            } else if (error.code === 'auth/weak-password') {
                Alert.alert('Error', 'Password is too weak');
            } else {
                Alert.alert('Error', error.message);
            }
        }
    };

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
    }

    return (
        <View style={styles.container}>
          <Text style={styles.title}>
            {isLogin ? 'Login' : 'Register'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor='white'
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor='white'
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleAuthentication}
          >
            <Text style={styles.buttonText}>
              {isLogin ? 'Log In' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleAuthMode}>
            <Text style={styles.toggleText}>
              {isLogin 
                ? 'Need an account? Sign Up' 
                : 'Already have an account? Log In'}
            </Text>
          </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#1c1c1c',
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
        color: 'white',
    },
    input: {
        height: 50,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 10,
        borderRadius: 5,
        color: 'white',
    },
    button: {
        backgroundColor: '#07a1b5',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    toggleText: {
        marginTop: 15,
        textAlign: 'center',
        color: '#438a94',
    },
});

export default Login;
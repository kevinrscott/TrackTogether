import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

import Login from "./components/Login";
import HomeScreen from "./components/HomeScreen";
import { ListProvider } from './contexts/ListContext';
import MovieList from './components/MovieList';
import ListDetails from './components/ListDetails';
import Notifications from './components/Notifications';

const Stack = createStackNavigator();

export default function App() {
  return (
      <SafeAreaProvider>
        <ListProvider>
          <NavigationContainer>
            <StatusBar barStyle="light-content" />
            <Stack.Navigator initialRouteName="Login" screenOptions={{ cardStyle: { backgroundColor: '#1c1c1c'}}}>
              <Stack.Screen 
                name="Login" 
                component={Login} 
                options={{ headerShown: false }} 
              />
              <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{ 
                  title: 'My Movies',
                  headerStyle: { backgroundColor: '#07a1b5' },
                  headerTintColor: 'white',
                  headerLeft: null,
                }} 
              />
              <Stack.Screen 
                name="Movies" 
                component={MovieList} 
                options={{ 
                  title: 'Movies',
                  headerStyle: { backgroundColor: '#07a1b5' },
                  headerTintColor: 'white',
                  headerLeft: null,
                }} 
              />
              <Stack.Screen name="ListDetails" 
              component={ListDetails} 
              options={{ 
                title: 'List',
                headerStyle: { backgroundColor: '#07a1b5' },
                headerTintColor: 'white',
                headerLeft: null,
              }} 
              />
              <Stack.Screen name="Notifications"
              component={Notifications}
              options={{
                title: 'Notifications',
                headerStyle: { backgroundColor: '#07a1b5' },
                headerTintColor: 'white',
                headerLeft: null,
              }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </ListProvider>
      </SafeAreaProvider>
  );
}
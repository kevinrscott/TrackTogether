import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { db, auth } from '../config/firebaseConfig';
import { collection, query, getDocs, where, addDoc, doc, setDoc } from 'firebase/firestore';

const ListContext = createContext();

export const ListProvider = ({ children }) => {
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setContentList([]);
        setLoading(false);
        return;
      }

      const contentRef = collection(db, 'users', user.uid, 'lists');
      const q = query(contentRef);

      const querySnapshot = await getDocs(q);
      const lists = [];

      querySnapshot.forEach((doc) => {
        lists.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setContentList(lists);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching lists:", error);
      Alert.alert("Error", "Failed to get lists. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const createNewList = async (listName) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to create a list.");
        return false;
      }

      if (!listName || listName.trim() === '') {
        Alert.alert("Error", "List name cannot be empty.");
        return false;
      }

      const newList = {
        name: listName.trim(),
        userId: user.uid,
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "users", user.uid, "lists"), newList);
      
      setContentList([...contentList, {
        id: docRef.id,
        ...newList,
      }]);
      
      return true;
    } catch (error) {
      console.error("Error creating list:", error);
      Alert.alert("Error", "Failed to create new list. Please try again.");
      return false;
    }
  };

  const addMovieToList = async (listId, movie) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "You must be logged in to add a movie.");
        return false;
      }

      if (!movie || !movie.title) {
        Alert.alert("Error", "Movie details are missing.");
        return false;
      }

      const movieRef = collection(db, "users", user.uid, "lists", listId, "movies");
      const newMovie = {
        title: movie.title,
        year: movie.year,
        genre: movie.genre,
        rating: movie.rating,
        poster: movie.poster,
        description: movie.description || '',
      };

      const docRef = await addDoc(movieRef, newMovie);

      return true;
    } catch (error) {
      console.error("Error adding movie:", error);
      Alert.alert("Error", "Failed to add movie to list. Please try again.");
      return false;
    }
  };

  return (
    <ListContext.Provider value={{ contentList, loading, createNewList, addMovieToList, refreshLists: fetchLists }}>
      {children}
    </ListContext.Provider>
  );
};

export const useListContext = () => useContext(ListContext);

import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { db, auth } from '../config/firebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore';

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

      const listSnapshot = await getDocs(collection(db, "lists"));

      const userLists = [];

      for (const listDoc of listSnapshot.docs) {
        const usersRef = collection(listDoc.ref, "users");
        const usersSnapshot = await getDocs(usersRef);
  
        const userInList = usersSnapshot.docs.some(
          (userDoc) => userDoc.data().userId === user.uid
        );
  
        if (userInList) {
          userLists.push({
            id: listDoc.id,
            ...listDoc.data(),
          });
        }
      }

      setContentList(userLists);
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

      const listRef = await addDoc(collection(db, "lists"), {
        name: listName.trim(),
        createdAt: new Date(),
      })

      const usersRef = collection(listRef, "users")
      await addDoc(usersRef, {
        userId: user.uid,
        username: user.email
      });

      setContentList([...contentList, {
        id: listRef.id,
        name: listName.trim(),
        createdAt: new Date(),
      }]);
      
      return true;
    } catch (error) {
      console.error("Error creating list:", error);
      Alert.alert("Error", "Failed to create new list. Please try again.");
      return false;
    }
  };

  return (
    <ListContext.Provider value={{ contentList, loading, createNewList, refreshLists: fetchLists }}>
      {children}
    </ListContext.Provider>
  );
};

export const useListContext = () => useContext(ListContext);

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { db, auth } from "../config/firebaseConfig";
import {
  collection,
  query,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  addDoc
} from "firebase/firestore";
import Footer from "./Footer";
import Icon from "react-native-vector-icons/MaterialIcons";

const Notifications = ({ navigation }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const invitationsRef = collection(db, "users", user.uid, "invitations");
        const q = query(invitationsRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const invitationsList = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt:
                data.createdAt instanceof Timestamp
                  ? data.createdAt.toDate()
                  : new Date(),
            };
          });

          setInvitations(invitationsList);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching invitations:", error);
        setLoading(false);
      }
    };

    fetchInvitations();
  }, []);

  const handleAcceptInvitation = async (invitation) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const { listId } = invitation;

      const usersRef = collection(db, "lists", listId, 'users')

      await addDoc(usersRef, {
        userId: user.uid,
        username: user.email
      })

      const invitationRef = doc(db, "users", user.uid, "invitations", invitation.id);

      await deleteDoc(invitationRef);

      
    } catch (error) {
      console.error("Error accepting invitation:", error);
      Alert.alert("Error", "Failed to accept invitation. Please try again.");
    } 
  };

  const handleDeclineInvitation = async (invitation) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const invitationRef = doc(db, "users", user.uid, "invitations", invitation.id);

      await deleteDoc(invitationRef);
      
    } catch (error) {
      console.error("Error declining invitation:", error);
      Alert.alert("Error", "Could not decline invitation");
    } 
  };

  const renderInvitation = ({ item }) => {
    const formattedDate =
      item.createdAt instanceof Date
        ? item.createdAt.toLocaleDateString()
        : "Unknown date";

    return (
      <View style={styles.invitationContainer}>
        <View style={styles.invitationDetails}>
          <Text style={styles.invitationTitle}>
            {item.listName || "Shared List"}
          </Text>
          <Text style={styles.invitationText}>
            <Text style={styles.highlight}>
              {item.invitedByEmail || "Someone"}
            </Text>{" "}
            invited you to collaborate on their list
          </Text>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
        <View style={styles.invitationActions}>
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAcceptInvitation(item)}
              >
                <Icon name="check" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleDeclineInvitation(item)}
              >
                <Icon name="close" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Decline</Text>
              </TouchableOpacity>
            </>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#07a1b5" />
        </View>
      ) : invitations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="notifications-none" size={60} color="#c0c0c0" />
          <Text style={styles.noInvitationsText}>No pending invitations</Text>
        </View>
      ) : (
        <FlatList
          data={invitations}
          renderItem={renderInvitation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <Footer />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#1c1c1c",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "white",
    textAlign: "center",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noInvitationsText: {
    marginTop: 10,
    fontSize: 16,
    color: "#888",
  },
  listContent: {
    paddingBottom: 20,
  },
  invitationContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invitationDetails: {
    marginBottom: 12,
  },
  invitationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  invitationText: {
    fontSize: 15,
    color: "#555",
    marginBottom: 4,
  },
  highlight: {
    fontWeight: "600",
    color: "#07a1b5",
  },
  dateText: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
  invitationActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },
  acceptButton: {
    backgroundColor: "#07a1b5",
  },
  declineButton: {
    backgroundColor: "#ff4d4d",
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 4,
  },
});

export default Notifications;

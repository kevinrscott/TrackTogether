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
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  writeBatch,
  arrayUnion,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import Footer from "./Footer";
import Icon from "react-native-vector-icons/MaterialIcons";

const Notifications = ({ navigation }) => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Fetch invitations when component mounts
  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const invitationsRef = collection(db, "users", user.uid, "invitations");
        const q = query(invitationsRef, where("status", "==", "pending"));

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
      setProcessingId(invitation.id);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not authenticated");
        setProcessingId(null);
        return;
      }

      const { listId, invitedBy, listName } = invitation;

      // Get the original list document (from the owner)
      const listRef = doc(db, "users", invitedBy, "lists", listId);
      const listDoc = await getDoc(listRef);

      if (!listDoc.exists()) {
        Alert.alert("Error", "The shared list no longer exists");
        // Clean up the invalid invitation
        await deleteDoc(
          doc(db, "users", user.uid, "invitations", invitation.id)
        );
        setProcessingId(null);
        return;
      }

      const listData = listDoc.data();

      // Create a new list for the user (the invitee)
      const userListRef = doc(db, "users", user.uid, "lists", listId);

      // Check if the list already exists for the user
      const userListDoc = await getDoc(userListRef);
      if (userListDoc.exists()) {
        Alert.alert("Info", "You already have this list in your collection.");
        setProcessingId(null);
        return;
      }

      const itemsRef = collection(
        db,
        "users",
        invitedBy,
        "lists",
        listId,
        "items"
      );
      const itemsSnapshot = await getDocs(itemsRef);

      const listItems = itemsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const batch = writeBatch(db);

      // 1. Create the new list for the invitee (user) and set up sharedWith
      batch.set(userListRef, {
        ...listData,
        lastSyncedAt: new Date(),
        sharedWith: [
          ...(listData.sharedWith || []),
          { userId: user.uid, status: "accepted" },
        ],
      });

      // 2. Add the list items to the invitee's list
      listItems.forEach((item) => {
        const itemRef = doc(
          db,
          "users",
          user.uid,
          "lists",
          listId,
          "items",
          item.id
        );
        batch.set(itemRef, {
          ...item,
          lastSyncedAt: new Date(),
        });
      });

      // 3. Add this list to the user's sharedLists array
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        batch.update(userRef, {
          sharedLists: arrayUnion({
            listId: listId,
            name: listName || listData.name || "Shared List",
            owner: invitedBy,
            acceptedAt: new Date(),
          }),
        });
      }

      // 4. Update the invitation status to 'accepted'
      const invitationRef = doc(
        db,
        "users",
        user.uid,
        "invitations",
        invitation.id
      );
      batch.update(invitationRef, {
        status: "accepted",
        acceptedAt: new Date(),
      });

      // 5. Update the owner's list to include this user in sharedWith
      const ownerListRef = doc(db, "users", invitedBy, "lists", listId);
      batch.update(ownerListRef, {
        sharedWith: arrayUnion({
          userId: user.uid,
          email: user.email,
          status: "accepted",
          acceptedAt: new Date(),
        }),
      });

      // Commit batch
      await batch.commit();

      Alert.alert("Success", `You've joined "${listName || "Shared List"}"`, [
        {
          text: "View List",
          onPress: () => navigation?.navigate?.("ListDetails", { listId }),
        },
        { text: "OK" },
      ]);

      // Update local state to remove the invitation
      setInvitations(invitations.filter((inv) => inv.id !== invitation.id));
    } catch (error) {
      console.error("Error accepting invitation:", error);
      Alert.alert("Error", "Failed to accept invitation. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineInvitation = async (invitation) => {
    try {
      setProcessingId(invitation.id);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "User not authenticated");
        setProcessingId(null);
        return;
      }

      const batch = writeBatch(db);

      // 1. Update the list's sharedWith array to remove this user
      try {
        const listRef = doc(
          db,
          "users",
          invitation.invitedBy,
          "lists",
          invitation.listId
        );
        const listDoc = await getDoc(listRef);

        if (listDoc.exists()) {
          const listData = listDoc.data();
          const updatedSharedWith = (listData.sharedWith || []).filter(
            (sharedUser) => sharedUser.userId !== user.uid
          );

          batch.update(listRef, {
            sharedWith: updatedSharedWith,
          });
        }
      } catch (error) {
        console.log("Error updating list (may not exist):", error);
        // Continue with invitation deletion even if list update fails
      }

      // 2. Update the invitation status or delete it
      const invitationRef = doc(
        db,
        "users",
        user.uid,
        "invitations",
        invitation.id
      );
      batch.update(invitationRef, {
        status: "declined",
        declinedAt: new Date(),
      });

      await batch.commit();

      // Update local state
      setInvitations(invitations.filter((inv) => inv.id !== invitation.id));
    } catch (error) {
      console.error("Error declining invitation:", error);
      Alert.alert("Error", "Could not decline invitation");
    } finally {
      setProcessingId(null);
    }
  };

  const renderInvitation = ({ item }) => {
    const isProcessing = processingId === item.id;
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
          {isProcessing ? (
            <ActivityIndicator size="small" color="#07a1b5" />
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAcceptInvitation(item)}
                disabled={isProcessing}
              >
                <Icon name="check" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleDeclineInvitation(item)}
                disabled={isProcessing}
              >
                <Icon name="close" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>Decline</Text>
              </TouchableOpacity>
            </>
          )}
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

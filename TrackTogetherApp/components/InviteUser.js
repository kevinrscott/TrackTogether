import React, { useState } from 'react';
import { View, TextInput, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { db, auth } from '../config/firebaseConfig';
import { collection, getDocs, query, where, doc, updateDoc, getDoc, addDoc, arrayUnion } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/AntDesign';

const InviteUser = ({ listId, listName }) => {
    const [inviteEmail, setInviteEmail] = useState('');
    const [invitationStatus, setInvitationStatus] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSendInvitation = async () => {
        try {
            setIsLoading(true);
            setInvitationStatus('');
            
            if (!inviteEmail) {
                setInvitationStatus('Please enter an email.');
                setIsLoading(false);
                return;
            }
    
            const user = auth.currentUser;
            if (!user) {
                setInvitationStatus('User is not authenticated');
                setIsLoading(false);
                return;
            }
    
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', inviteEmail));
            const querySnapshot = await getDocs(q);
    
            if (querySnapshot.empty) {
                setInvitationStatus('User with this email not found.');
                setIsLoading(false);
                return;
            }
    
            const inviteeDoc = querySnapshot.docs[0];
            const inviteeId = inviteeDoc.id;
            
            if (inviteeId === user.uid) {
                setInvitationStatus('You cannot invite yourself.');
                setIsLoading(false);
                return;
            }
    
            const listRef = doc(db,'lists', listId);
            const listSnapshot = await getDoc(listRef);
    
            if (!listSnapshot.exists()) {
                setInvitationStatus('List not found.');
                setIsLoading(false);
                return;
            }
            
            const listData = listSnapshot.data();
            
            const sharedWithArray = listData.sharedWith || [];
            
            if (sharedWithArray.some(sharedUser => sharedUser.userId === inviteeId)) {
                setInvitationStatus('User is already invited to this list.');
                setIsLoading(false);
                return;
            }
    
            const invitationData = {
                listId: listId,
                listName: listName || listData.name || 'Shared List',
                invitedBy: user.uid,
                invitedByEmail: user.email,
                status: 'pending',
                createdAt: new Date(),
            };
    
            const inviteeInvitationsRef = collection(db, 'users', inviteeId, 'invitations');
            await addDoc(inviteeInvitationsRef, invitationData);
    
            setInvitationStatus('Invitation sent successfully!');
            setInviteEmail('');
            
            setTimeout(() => {
                setModalVisible(false);
            }, 1500);
            
        } catch (error) {
            console.error('Error sending invitation:', error);
            setInvitationStatus('Error: ' + (error.message || 'Failed to send invitation'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.inviteSection}>
            <TouchableOpacity 
                style={styles.button} 
                onPress={() => setModalVisible(true)}
                accessible={true}
                accessibilityLabel="Invite user to list"
                accessibilityHint="Opens dialog to invite a user by email"
            >
                <Icon style={styles.buttonIcon} name="adduser" size={30} color="#fff" />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalHeader}>Invite User to List</Text>
                        
                        <TextInput
                            style={styles.input}
                            placeholder="Enter email"
                            placeholderTextColor="#ccc"
                            value={inviteEmail}
                            onChangeText={setInviteEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        
                        {invitationStatus && (
                            <Text style={[
                                styles.invitationStatus,
                                invitationStatus.includes('successfully') ? styles.successStatus : styles.errorStatus
                            ]}>
                                {invitationStatus}
                            </Text>
                        )}

                        <TouchableOpacity 
                            style={[styles.sendButton, isLoading && styles.disabledButton]} 
                            onPress={handleSendInvitation}
                            disabled={isLoading}
                        >
                            <Text style={styles.sendButtonText}>
                                {isLoading ? 'Sending...' : 'Send Invite'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.cancelButton} 
                            onPress={() => setModalVisible(false)}
                            disabled={isLoading}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    inviteSection: {
        margin: 10,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: 320,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
        textAlign: 'center',
    },
    input: {
        height: 45,
        borderColor: '#07a1b5',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 15,
        paddingHorizontal: 15,
        color: '#333',
        fontSize: 16,
    },
    invitationStatus: {
        marginTop: 10,
        marginBottom: 10,
        fontSize: 14,
        textAlign: 'center',
    },
    successStatus: {
        color: '#4CAF50',
    },
    errorStatus: {
        color: '#F44336',
    },
    sendButton: {
        backgroundColor: '#07a1b5',
        paddingVertical: 12,
        borderRadius: 5,
        marginBottom: 10,
    },
    disabledButton: {
        backgroundColor: '#a0d8e0',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    cancelButton: {
        paddingVertical: 12,
        borderRadius: 5,
        backgroundColor: '#ddd',
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 16,
        textAlign: 'center',
    },
    button: {
        padding: 10,
        backgroundColor: '#07a1b5',
        borderRadius: 5,
    },
    buttonIcon: {
        paddingHorizontal: 10,
        color: '#fff',
    },
});

export default InviteUser;
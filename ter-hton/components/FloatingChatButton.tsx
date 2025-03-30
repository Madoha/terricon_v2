// components/FloatingChatButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '@/context/ChatContext';
import { useUser } from '@/context/UserContext';

const FloatingChatButton = () => {
    const { startChat } = useChat();
    const { role } = useUser();

    if (role !== 'USER') return null;

    return (
        <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => startChat(false)}
        >
            <Ionicons name="chatbubble-ellipses" size={24} color="white" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    floatingButton: {
        position: 'absolute',
        right: 20,
        bottom: 90,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 100,
    },
});

export default FloatingChatButton;
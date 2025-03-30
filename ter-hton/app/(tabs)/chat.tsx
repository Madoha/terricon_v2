import React, { useState, useEffect, useCallback } from "react";
import { View, Alert, TouchableOpacity, Text, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import io, { Socket } from "socket.io-client";
import UserChat from "../UserChat";
import PoliceDashboard from "../PoliceDashboard";
import { jwtDecode } from "jwt-decode";
import { useUser } from "@/context/UserContext";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from '@expo/vector-icons';
import api from "@/app/api/axios";

type Chat = {
    id: string;
    isAnonymous: boolean;
    user?: {
        id: string;
    };
};

const socket: Socket = io("http://192.168.0.163:4004", {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

const Chat: React.FC = () => {
    const { role, setRole } = useUser();
    const { userId, setUserId } = useUser();
    const { token } = useAuth();
    const [chatId, setChatId] = useState<string | null>(null);
    const [pendingChats, setPendingChats] = useState<Chat[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        socket.on("connect", () => console.log("WebSocket connected"));
        socket.on("connect_error", (error) => console.error("Connection error", error));

        return () => {
            socket.off("connect");
            socket.off("connect_error");
        };
    }, []);

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token) as { userId: string; role: string };
                setRole(decoded.role);
                setUserId(decoded.userId);
            } catch (error) {
                console.error("Token decode error", error);
            }
        }
    }, [token]);

    const startUserChat = async (isAnonymous: boolean) => {
        try {
            const response = await fetch("http://192.168.0.163:4004/chats", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ isAnonymous, userId }),
            });
            const chat = await response.json();
            setChatId(chat.id);
        } catch (error) {
            Alert.alert("Ошибка", "Не удалось создать чат");
            console.error("Create chat error:", error);
        }
    };

    const fetchUserPendingChats = useCallback(async () => {
        try {
            console.log("Fetching pending chats...");
            const response = await api.get("chats/pending-user", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const chats: Chat[] = response.data;
            setPendingChats(chats);
        } catch (error) {
            console.error("Fetch pending chats error:", error);
            Alert.alert("Ошибка", "Не удалось загрузить чаты");
        } finally {
            setLoading(false);
        }
    }, [token]);

    const joinChat = async (chatId: string) => {
        try {
            const response = await api.post("chats/join-user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ chatId }),
            });
            if (response.status === 200) {
                console.log("success")
                console.log(chatId)
                setSelectedChatId(chatId);
            } else {
                Alert.alert("Ошибка", "Не удалось присоединиться к чату");
            }
        } catch (error) {
            Alert.alert("Ошибка", "Не удалось присоединиться к чату");
            console.error("Join chat error:", error);
        }
    };

    const handleLeaveChat = () => {
        Alert.alert(
            "Выход из чата",
            "Вы уверены, что хотите выйти?",
            [
                { text: "Отмена", style: "cancel" },
                {
                    text: "Выйти",
                    onPress: () => {
                        setSelectedChatId(null); // Сбрасываем выбранный чат
                        setChatId(null); // Сбрасываем chatId
                        if (chatId && userId) {
                            socket.emit("leave-chat", { chatId, userId });
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        let isMounted = true;
        let intervalId: NodeJS.Timeout;

        const init = async () => {
            await fetchUserPendingChats();
            if (isMounted) {
                intervalId = setInterval(fetchUserPendingChats, 5000);
            }
        };

        init();

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [fetchUserPendingChats]);

    if (selectedChatId) {
        return (
            <View className="flex-1 px-4 mb-4 bg-white">
                <View className="p-4 flex-row items-center border-b border-gray-200">
                    <TouchableOpacity onPress={handleLeaveChat}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text className="ml-4 text-lg font-semibold">Чат</Text>
                </View>
                <UserChat chatId={selectedChatId} userId={userId!} isAnonymous={false} socket={socket} />
            </View>
        );
    }

    const FloatingChatButton = () => (
        <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => startUserChat(false)}
        >
            <Ionicons name="chatbubble-ellipses" size={24} color="white" />
        </TouchableOpacity>
    );

    if (role === "USER" && chatId) {
        return (
            <View className="flex-1 mb-4 bg-white">
                <View className="p-4 flex-row items-center border-b border-gray-200">
                    <TouchableOpacity onPress={handleLeaveChat}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text className="ml-4 text-lg font-semibold">Чат</Text>
                </View>
                <UserChat chatId={chatId} userId={userId!} isAnonymous={false} socket={socket} />
            </View>
        );
    }

    if (role === "POLICY") {
        return (
            <View className="flex-1 mb-4 bg-white">
                <View className="p-4 flex-row items-center border-b border-gray-200">
                    <TouchableOpacity onPress={handleLeaveChat}>
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text className="ml-4 text-lg font-semibold">Чат</Text>
                </View>
                <PoliceDashboard officerId={userId!} socket={socket} />
            </View>
        );
    }

    return (
        <View className="flex-1 justify-center bg-gray-100 mb-8">
            {role === "USER" && (
                <View className="flex-1">
                    <View className="flex-1 p-4">
                        {loading ? (
                            <View className="flex-1 items-center justify-center">
                                <ActivityIndicator size="large" color="#0000ff" />
                                <Text className="mt-2 text-gray-500">Загрузка чатов...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={pendingChats}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={pendingChats.length === 0 ? styles.emptyListContainer : null}
                                renderItem={({ item }) => (
                                    <View className="p-4 border-b border-gray-300 bg-white rounded-lg mb-2">
                                        <Text className="text-base text-gray-700">
                                            {item.isAnonymous ? "Анонимный пользователь" : `Пользователь ${item.user?.id}`}
                                        </Text>
                                        <TouchableOpacity
                                            className="mt-2 bg-blue-500 py-2 px-4 rounded-lg"
                                            onPress={() => joinChat(item.id)}
                                        >
                                            <Text className="text-white text-center font-medium">Присоединиться</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                ListEmptyComponent={
                                    <View className="flex-1 items-center justify-center">
                                        <Text className="text-center text-gray-500 mt-4">Нет ожидающих чатов</Text>
                                    </View>
                                }
                            />
                        )}
                    </View>
                    <FloatingChatButton />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    floatingButton: {
        position: 'absolute',
        right: 20,
        bottom: 20,
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
    },
    emptyListContainer: {
        flex: 1,
        justifyContent: 'center',
    },
});

export default Chat;
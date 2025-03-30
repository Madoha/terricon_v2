import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Create() {
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [logs, setLogs] = useState<string[]>([]);
    const [images, setImages] = useState<string[]>([]);

    useEffect(() => {
        const socket = new WebSocket('ws://192.168.0.105:8000/ws');

        socket.onopen = () => {
            console.log('WebSocket соединение установлено');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.log) {
                    setLogs(prevLogs => [...prevLogs, data.log].slice(-5)); // Ограничиваем до 5 последних логов
                }
                if (data.image) {
                    setImages(prevImages => [...prevImages, data.image].slice(-5)); // Ограничиваем до 5 последних изображений
                }
            } catch (error) {
                console.error('Ошибка парсинга сообщения WebSocket:', error);
            }
        };

        socket.onerror = (error) => {
            console.error('Ошибка WebSocket:', error);
        };

        socket.onclose = () => {
            console.log('WebSocket соединение закрыто');
        };

        return () => {
            socket.close();
        };
    }, []);

    const clearAll = () => {
        setLogs([]); // Очищаем логи
        setImages([]); // Очищаем изображения
    };

    const renderItem = ({ item, index }: { item: string; index: number }) => (
        <View className="mb-4 p-4 bg-white rounded-lg items-center">
            <Text className="text-base text-gray-600 text-center mb-2">{item}</Text>
            {images[index] ? (
                <Image
                    source={{ uri: images[index] }}
                    className="w-[300px] h-[300px]"
                    resizeMode="contain"
                    onError={(error) => console.log('Image loading error:', error.nativeEvent.error)} // Для отладки
                />
            ) : (
                <Text className="text-sm text-gray-500">Изображение отсутствует</Text>
            )}
        </View>
    );

    return (
        <View className="flex-1 w-full h-full items-center justify-center bg-white p-6">
            <Text className="text-2xl font-bold mb-5">Incident!</Text>

            {/* Кнопка Create Incident */}
            <Link
                href={{
                    pathname: '/incident-form',
                    params: { firstName, lastName },
                }}
                asChild
            >
                <TouchableOpacity
                    className="flex-row items-center justify-center bg-blue-500 py-3 px-6 rounded-lg w-full mb-2"
                >
                    <Ionicons name="send" size={20} color="white" />
                    <Text className="text-white text-base font-medium ml-2">Create Incident</Text>
                </TouchableOpacity>
            </Link>

            {/* Кнопка Detect */}
            <Link href="https://2e62-62-84-32-252.ngrok-free.app" asChild>
                <TouchableOpacity
                    className="flex-row items-center justify-center bg-blue-600 py-3 px-6 rounded-lg w-full mb-2"
                >
                    <Ionicons name="scan" size={20} color="white" />
                    <Text className="text-white text-base font-medium ml-2">Detect</Text>
                </TouchableOpacity>
            </Link>

            {/* Кнопка Clear All */}
            <TouchableOpacity
                className="flex-row items-center justify-center bg-red-500 py-3 px-6 rounded-lg w-full mb-4"
                onPress={clearAll}
            >
                <Ionicons name="trash" size={20} color="white" />
                <Text className="text-white text-base font-medium ml-2">Clear All</Text>
            </TouchableOpacity>

            {/* Отображение списка данных от WebSocket */}
            <View className="mt-5 w-full flex-1">
                {logs.length > 0 ? (
                    <FlatList
                        data={logs}
                        renderItem={renderItem}
                        keyExtractor={(item, index) => index.toString()}
                        className="w-full"
                    />
                ) : (
                    <Text className="text-base text-gray-500 text-center">Ожидание данных от детекции...</Text>
                )}
            </View>
        </View>
    );
}
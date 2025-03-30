import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { io, Socket } from 'socket.io-client'

interface EmergencyData {
    id: string
    title: string
    location: string
    problem: string
    solution: string
    solution_user: string
    timestamp: string
}

const socket: Socket = io("http://192.168.0.163:4004", {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
})

export default function EmergencyScreen() {
    const [emergencies, setEmergencies] = useState<EmergencyData[]>([])
    const [loading, setLoading] = useState(true)
    const [connected, setConnected] = useState(false)
    const insets = useSafeAreaInsets()

    useEffect(() => {
        const handleEmergencyUpdate = (data: EmergencyData) => {
            console.log('Получены данные о ЧП:', data)

            const newEmergency = {
                ...data,
                timestamp: new Date().toLocaleString('ru-RU')
            }

            setEmergencies(prev => [newEmergency, ...prev])
            setLoading(false)

            Alert.alert(
                `ЧП: ${data.title}`,
                `Место: ${data.location}\nПроблема: ${data.problem}\nРешение: ${data.solution}\nЧто делать: ${data.solution_user}`,
                [{ text: 'Понятно' }]
            )
        }

        const handleConnect = () => {
            console.log('Connected to socket server')
            setConnected(true)
        }

        const handleDisconnect = () => {
            console.log('Disconnected from socket server')
            setConnected(false)
        }

        // Подписываемся на события
        socket.on('emergencyUpdate', handleEmergencyUpdate)
        socket.on('connect', handleConnect)
        socket.on('disconnect', handleDisconnect)

        // Запрос истории ЧП при подключении
        const requestHistory = () => {
            socket.emit('requestHistory', { limit: 10 }, (response: EmergencyData[]) => {
                if (response && Array.isArray(response)) {
                    const formattedData = response.map(item => ({
                        ...item,
                        timestamp: new Date(item.timestamp).toLocaleString('ru-RU')
                    }))
                    setEmergencies(formattedData)
                    setLoading(false)
                }
            })
        }

        // Если уже подключен, запрашиваем историю сразу
        if (socket.connected) {
            requestHistory()
        } else {
            socket.once('connect', requestHistory)
        }

        // Отписка при размонтировании
        return () => {
            socket.off('emergencyUpdate', handleEmergencyUpdate)
            socket.off('connect', handleConnect)
            socket.off('disconnect', handleDisconnect)
        }
    }, [])

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text className="mt-4 text-lg font-semibold text-gray-700">
                    {connected ? 'Загрузка данных...' : 'Подключение к серверу...'}
                </Text>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
            <ScrollView className="px-4">
                <View className="flex-row justify-between items-center mt-6 mb-4">
                    <Text className="text-2xl font-bold text-gray-900">Экстренные оповещения</Text>
                    <View className="flex-row items-center">
                        <View className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} mr-2`} />
                    </View>
                </View>

                {emergencies.length === 0 ? (
                    <View className="items-center justify-center py-12">
                        <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                        <Text className="mt-4 text-lg font-medium text-gray-600">Активных ЧП нет</Text>
                        <Text className="mt-2 text-sm text-gray-400">
                            {connected ? 'Ожидаем новые оповещения' : 'Нет подключения к серверу'}
                        </Text>
                    </View>
                ) : (
                    emergencies.map(emergency => (
                        <View key={emergency.id} className="mb-4 overflow-hidden rounded-xl bg-white shadow-sm">
                            <View className="flex-col items-center justify-between p-4 border-b border-gray-100">
                                <View className="flex-row items-center">
                                    <Ionicons name="warning" size={24} color="#ef4444" />
                                    <Text className="ml-2 text-lg font-semibold text-gray-900">{emergency.title}</Text>
                                </View>
                                <Text className="text-xs text-gray-500 self-end">{emergency.timestamp}</Text>
                            </View>

                            <View className="p-4">
                                <View className="flex-row items-start mb-3">
                                    <Ionicons name="location-outline" size={18} color="#6b7280" className="mt-0.5" />
                                    <Text className="ml-2 text-base text-gray-700">{emergency.location}</Text>
                                </View>

                                <View className="mb-3">
                                    <Text className="text-sm font-medium text-gray-500">ПРОБЛЕМА</Text>
                                    <Text className="mt-1 text-gray-700">{emergency.problem}</Text>
                                </View>

                                <View className="mb-3">
                                    <Text className="text-sm font-medium text-gray-500">РЕАКЦИЯ СЛУЖБ</Text>
                                    <Text className="mt-1 text-gray-700">{emergency.solution}</Text>
                                </View>

                                <View className="p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                                    <Text className="text-sm font-medium text-red-800">ВАШИ ДЕЙСТВИЯ</Text>
                                    <Text className="mt-1 text-red-900">{emergency.solution_user}</Text>
                                </View>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    )
}
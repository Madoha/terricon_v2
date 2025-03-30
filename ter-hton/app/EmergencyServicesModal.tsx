import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, Linking, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/context/UserContext';
import {colorScheme} from "nativewind";

interface EmergencyService {
    name: string;
    address: string;
    phone: string;
    distance: number;
    coordinates: {
        latitude: number;
        longitude: number;
    };
}

const EMERGENCY_SERVICES: EmergencyService[] = [
    {
        name: 'Управление специализированной службы охраны',
        address: 'Астана, ул. Правительственная',
        phone: '+77172701111',
        coordinates: { latitude: 51.169741, longitude: 71.418250 },
        distance: 0
    },
];

const EmergencyServicesModal = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    // const { latitude, longitude } = useUser();
    const [nearestServices, setNearestServices] = useState<EmergencyService[]>([]);
    const FIXED_COORDINATES = {
        latitude: 51.169741,   // Замените на нужную широту
        longitude: 71.418250   // Замените на нужную долготу
    };

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    useEffect(() => {
        if (visible) {
            const servicesWithDistance = EMERGENCY_SERVICES.map(service => ({
                ...service,
                distance: calculateDistance(
                    FIXED_COORDINATES.latitude,
                    FIXED_COORDINATES.longitude,
                    service.coordinates.latitude,
                    service.coordinates.longitude
                )
            })).sort((a, b) => a.distance - b.distance);

            setNearestServices(servicesWithDistance.slice(0, 3));
        }
    }, [visible]);

    const callEmergencyService = (phone: string) => {
        Alert.alert(
            'Позвонить в службу',
            `Вы уверены, что хотите позвонить по номеру ${phone}?`,
            [
                { text: 'Отмена'},
                { text: 'Позвонить', onPress: () => Linking.openURL(`tel:${phone}`) }
            ]
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="bg-white rounded-lg p-6 w-11/12 max-h-[80%]">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-xl font-bold">Ближайшие экстренные службы</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {(latitude === null || longitude === null) ? (
                        <Text className="text-center text-gray-500 py-4">
                            Не удалось определить ваше местоположение
                        </Text>
                    ) : (
                        <ScrollView>
                            {nearestServices.map((service, index) => (
                                <View key={index} className="mb-4 border-b border-gray-200 pb-4">
                                    <Text className="font-bold text-lg">{service.name}</Text>
                                    <Text className="text-gray-600 mb-2">{service.address}</Text>
                                    <Text className="text-gray-500 mb-2">
                                        Расстояние: {service.distance.toFixed(2)} км
                                    </Text>
                                    <TouchableOpacity
                                        className="bg-green-500 rounded-lg py-2 px-4 flex-row items-center justify-center mt-2"
                                        onPress={() => callEmergencyService(service.phone)}
                                    >
                                        <Ionicons name="call" size={18} color="white" />
                                        <Text className="text-white font-medium ml-2">
                                            Позвонить: {service.phone}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default EmergencyServicesModal;
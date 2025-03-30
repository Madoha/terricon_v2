import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
    SafeAreaView
} from "react-native";
import {useEffect, useState} from "react";
import {useRouter} from "expo-router";
import {useAuth} from "@/context/AuthContext";
import {useUser} from "@/context/UserContext";
import {Ionicons} from '@expo/vector-icons';
import api from "@/app/api/axios";
import EmergencyServicesModal from '../EmergencyServicesModal';

export default function Profile() {
    const router = useRouter();
    const [userData, setUserData] = useState<{
        email: string;
        username: string;
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        region?: string;
        city?: string;
        address?: string;
        avatar?: string;
        createdAt?: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        username: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        region: '',
        city: '',
        address: '',
    });
    const {token, setToken} = useAuth();
    const {userId, setUserId} = useUser();
    const joinDate = userData?.createdAt ? new Date(userData.createdAt) : new Date();
    const currentDate = new Date(); // Текущая дата устройства
    const monthsSinceJoin = Math.floor(
        (currentDate - joinDate) / (1000 * 60 * 60 * 24 * 30)
    );
    const joinMonth = joinDate.toLocaleString('ru', {month: 'long'});
    const joinYear = joinDate.getFullYear();
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setIsLoading(true);
                if (!token || !userId) {
                    router.replace("/(auth)/login");
                    return;
                }

                const response = await api.get(`user/`, {
                    headers: {Authorization: `Bearer ${token}`},
                });

                setUserData(response.data);
                setEditData({
                    username: response.data.username || '',
                    firstName: response.data.firstName || '',
                    lastName: response.data.lastName || '',
                    phoneNumber: response.data.phoneNumber || '',
                    region: response.data.region || '',
                    city: response.data.city || '',
                    address: response.data.address || '',
                });
            } catch (error) {
                Alert.alert("Ошибка", "Не удалось загрузить профиль");
                console.error("Ошибка загрузки профиля:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();
    }, [token, userId]);

    const handleUpdateProfile = async () => {
        try {
            setIsLoading(true);
            const response = await api.put(`user/`, editData, {
                headers: {Authorization: `Bearer ${token}`},
            });

            setUserData(prev => ({...prev, ...editData}));
            setIsEditing(false);
            Alert.alert("Успех", "Профиль успешно обновлен");
        } catch (error) {
            Alert.alert("Ошибка", "Не удалось обновить профиль");
            console.error("Ошибка обновления:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await api.get("auth/logout", {
                headers: {Authorization: `Bearer ${token}`},
            });

            await setToken(null);
            setUserId(null);
            router.replace("/(auth)/login");
        } catch (error) {
            console.error("Ошибка выхода:", error);
            Alert.alert("Ошибка", "Не удалось выйти");
        } finally {
            setIsLoggingOut(false);
        }
    };

    if (isLoading) {
        return (
            <View className="flex-1 items-center justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#3b82f6"/>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-white">
            {/* Шапка профиля */}
            <View className="items-center pt-10 pb-6 bg-white">
                <View className="flex-row justify-end w-full px-6">
                    <TouchableOpacity onPress={() => setIsEditing(true)}>
                        <Ionicons name="settings" size={24} color="#3b82f6"/>
                    </TouchableOpacity>
                </View>

                <Image
                    source={{uri: userData?.avatar || "https://randomuser.me/api/portraits/men/1.jpg"}}
                    className="w-32 h-32 rounded-full border-4 border-blue-100 mb-4"
                />
                <Text className="text-2xl font-bold text-gray-800">
                    {userData?.username}
                </Text>
            </View>

            {/* Основная информация */}
            <View className="mx-4 my-6 bg-white rounded-xl p-6 shadow-sm">
                <Text className="text-xl font-bold text-gray-800 mb-4">Информация об аккаунте</Text>

                {(userData?.firstName || userData?.lastName) && (
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="person" size={20} color="#6b7280"/>
                        <Text className="text-gray-700 ml-3">
                            {userData?.firstName} {userData?.lastName}
                        </Text>
                    </View>
                )}

                <View className="flex-row items-center mb-4">
                    <Ionicons name="mail" size={20} color="#6b7280"/>
                    <Text className="text-gray-700 ml-3">{userData?.email}</Text>
                </View>

                {userData?.phoneNumber && (
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="call" size={20} color="#6b7280"/>
                        <Text className="text-gray-700 ml-3">{userData.phoneNumber}</Text>
                    </View>
                )}

                {(userData?.region || userData?.city || userData?.address) && (
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="location" size={20} color="#6b7280"/>
                        <Text className="text-gray-700 ml-3">
                            {[userData?.address, userData?.city, userData?.region].filter(Boolean).join(', ')}
                        </Text>
                    </View>
                )}

                {userData?.createdAt && (
                    <View className="flex-row items-center">
                        <Ionicons name="time" size={20} color="#6b7280"/>
                        <Text className="text-gray-700 ml-3">
                            {userData?.createdAt
                                ? new Date(userData.createdAt).toLocaleDateString('ru', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })
                                : 'Дата неизвестна'}
                        </Text>
                    </View>
                )}
            </View>

            <TouchableOpacity
                style={{
                    backgroundColor: '#007AFF',
                    padding: 10,
                    borderRadius: 5,
                }}
                onPress={() => setModalVisible(true)}
            >
                <Text style={{color: 'white', fontSize: 16}}>
                    Открыть экстренные службы
                </Text>
            </TouchableOpacity>

            <EmergencyServicesModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />

            {/* Модальное окно редактирования */}
            <Modal visible={isEditing} animationType="slide">
                <SafeAreaView className="flex-1">
                    <ScrollView className="flex-1 bg-gray-50 p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-bold text-gray-800">Редактировать профиль</Text>
                            <TouchableOpacity onPress={() => setIsEditing(false)}>
                                <Ionicons name="close" size={24} color="#6b7280"/>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            className="bg-white p-3 rounded-lg mb-3"
                            placeholder="Имя пользователя"
                            value={editData.username}
                            onChangeText={(text) => setEditData({...editData, username: text})}
                        />

                        <TextInput
                            className="bg-white p-3 rounded-lg mb-3"
                            placeholder="Имя"
                            value={editData.firstName}
                            onChangeText={(text) => setEditData({...editData, firstName: text})}
                        />

                        <TextInput
                            className="bg-white p-3 rounded-lg mb-3"
                            placeholder="Фамилия"
                            value={editData.lastName}
                            onChangeText={(text) => setEditData({...editData, lastName: text})}
                        />

                        <TextInput
                            className="bg-white p-3 rounded-lg mb-3"
                            placeholder="Номер телефона"
                            value={editData.phoneNumber}
                            onChangeText={(text) => setEditData({...editData, phoneNumber: text})}
                            keyboardType="phone-pad"
                        />

                        <TextInput
                            className="bg-white p-3 rounded-lg mb-3"
                            placeholder="Регион"
                            value={editData.region}
                            onChangeText={(text) => setEditData({...editData, region: text})}
                        />

                        <TextInput
                            className="bg-white p-3 rounded-lg mb-3"
                            placeholder="Город"
                            value={editData.city}
                            onChangeText={(text) => setEditData({...editData, city: text})}
                        />

                        <TextInput
                            className="bg-white p-3 rounded-lg mb-6"
                            placeholder="Адрес"
                            value={editData.address}
                            onChangeText={(text) => setEditData({...editData, address: text})}
                        />

                        <TouchableOpacity
                            className="bg-blue-600 rounded-lg py-3 px-6 items-center"
                            onPress={handleUpdateProfile}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="white"/>
                            ) : (
                                <Text className="text-white font-medium">Сохранить изменения</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            <Text className="text-gray-600 mt-2 text-center px-4">
                Вы присоединились к SafeConnect в {joinMonth} {joinYear} года. Прошло {monthsSinceJoin} месяцев с тех
                пор,
                а наша миссия всё та же — помогать вам лучше управлять финансами, словно на одном дыхании.
            </Text>

            {/* Кнопка выхода */}
            <TouchableOpacity
                className="mx-4 my-6 bg-red-50 border border-red-200 rounded-xl py-4 flex-row justify-center items-center"
                onPress={handleLogout}
                disabled={isLoggingOut}
            >
                <Ionicons name="log-out" size={20} color="#ef4444"/>
                <Text className="text-red-500 font-medium ml-2">
                    {isLoggingOut ? "Выход..." : "Выйти"}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
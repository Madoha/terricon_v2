import React, {useState, useEffect, useCallback} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    Image,
    ActivityIndicator,
    ScrollView,
    Platform
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Network from 'expo-network';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import api from "@/app/api/axios";
import {useUser} from "@/context/UserContext";

interface MediaAsset {
    uri: string;
    type: 'image' | 'video';
    id: string;
}

interface LocationData {
    coords: {
        latitude: number;
        longitude: number;
    };
    address: string;
    timestamp: number;
}

const IncidentForm = () => {
    const [description, setDescription] = useState('');
    const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
    const [location, setLocation] = useState<LocationData | null>(null);
    const [manualAddress, setManualAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isAddressFocused, setIsAddressFocused] = useState(false);
    const [isManualAddress, setIsManualAddress] = useState(false);
    const addressCache = new Map<string, string>();
    const [isAnonymous, setIsAnonymous] = useState(false);
    const { setCoordinates } = useUser();

    const {firstName, lastName} = useLocalSearchParams<{
        firstName?: string;
        lastName?: string;
    }>();
    const router = useRouter();

    // Проверка интернет-соединения
    const checkConnection = useCallback(async () => {
        const {isInternetReachable} = await Network.getNetworkStateAsync();
        if (!isInternetReachable) {
            Alert.alert('Ошибка', 'Нет интернет-соединения');
            return false;
        }
        return true;
    }, []);

    const generateId = () => Math.random().toString(36).substring(2, 9);

    // Получение адреса через OpenStreetMap
    const getAddressFromOSM = useCallback(async (lat: number, lng: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            return data.display_name || 'Адрес не найден';
        } catch (error) {
            console.error('Ошибка OSM:', error);
            return 'Не удалось определить адрес';
        }
    }, []);

    // Основная функция определения адреса
    const getNearestAddress = useCallback(async (latitude: number, longitude: number) => {
        try {
            // Пробуем сначала через expo-location
            try {
                const addressList = await Location.reverseGeocodeAsync({latitude, longitude});
                if (addressList.length > 0) {
                    const parts = [
                        addressList[0].street,
                        addressList[0].streetNumber,
                        addressList[0].city,
                        addressList[0].region,
                        addressList[0].postalCode,
                        addressList[0].country
                    ].filter(Boolean);
                    return parts.join(', ');
                }
            } catch (e) {
                console.log('Ошибка expo-location, пробуем OSM...');
            }

            // Если не сработало, пробуем через OSM
            return await getAddressFromOSM(latitude, longitude);
        } catch (error) {
            console.error('Ошибка геокодирования:', error);
            return 'Не удалось определить адрес';
        }
    }, [getAddressFromOSM]);

    // Получение координат по адресу
    const getCoordinatesFromAddress = useCallback(async (address: string) => {
        try {
            const coordinates = await Location.geocodeAsync(address);
            if (coordinates.length > 0) {
                return {
                    latitude: coordinates[0].latitude,
                    longitude: coordinates[0].longitude
                };
            }
            return null;
        } catch (error) {
            console.error('Ошибка геокодирования:', error);
            return null;
        }
    }, []);

    // Получение текущего местоположения
    const getCurrentLocation = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMsg(null);

            if (!(await checkConnection())) return;

            const {status} = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Доступ к геолокации запрещен');
                return;
            }

            const locationData = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            // Сохраняем координаты в контекст
            setCoordinates(
                locationData.coords.latitude,
                locationData.coords.longitude
            );

            setLocation(prev => ({
                coords: locationData.coords,
                address: prev?.address || 'Определение адреса...',
                timestamp: Date.now()
            }));

            const address = await getNearestAddress(
                locationData.coords.latitude,
                locationData.coords.longitude
            );

            setLocation({
                coords: locationData.coords,
                address,
                timestamp: Date.now()
            });
            setManualAddress(address);
            setIsManualAddress(false);
        } catch (error) {
            console.error('Ошибка:', error);
            setErrorMsg('Не удалось определить местоположение');
        } finally {
            setLoading(false);
        }
    }, [checkConnection, getNearestAddress]);

    // Обработчики поля ввода адреса
    const handleAddressFocus = useCallback(() => {
        setIsAddressFocused(true);
        if (location?.address === manualAddress) {
            setManualAddress('');
        }
    }, [location, manualAddress]);

    const handleAddressBlur = useCallback(async () => {
        setIsAddressFocused(false);

        if (manualAddress.trim()) {
            setIsManualAddress(true);
            const coords = await getCoordinatesFromAddress(manualAddress);
            if (coords) {
                setLocation({
                    coords,
                    address: manualAddress,
                    timestamp: Date.now()
                });
            }
        } else if (location?.address) {
            setManualAddress(location.address);
            setIsManualAddress(false);
        }
    }, [manualAddress, location, getCoordinatesFromAddress]);

    // Debounce для ручного ввода адреса
    useEffect(() => {
        const timer = setTimeout(() => {
            if (manualAddress.length > 3 && isAddressFocused) {
                handleAddressBlur();
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [manualAddress, isAddressFocused, handleAddressBlur]);

    // Работа с медиа
    const pickMedia = useCallback(async () => {
        try {
            const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Ошибка', 'Необходим доступ к медиатеке');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                allowsMultipleSelection: true,
                quality: 1,
            });

            if (!result.canceled && result.assets) {
                const newMedia = result.assets.map(asset => ({
                    uri: asset.uri,
                    type: asset.type as 'image' | 'video',
                    id: generateId(),
                }));
                setMediaList(prev => [...prev, ...newMedia]);
            }
        } catch (error: any) {
            setErrorMsg(`Ошибка выбора медиа: ${error.message}`);
        }
    }, []);

    const takeMedia = useCallback(async () => {
        try {
            const {status} = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Ошибка', 'Необходим доступ к камере');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.All,
                quality: 1,
            });

            if (!result.canceled && result.assets) {
                const newMedia = result.assets.map(asset => ({
                    uri: asset.uri,
                    type: asset.type as 'image' | 'video',
                    id: generateId(),
                }));
                setMediaList(prev => [...prev, ...newMedia]);
            }
        } catch (error: any) {
            setErrorMsg(`Ошибка съемки: ${error.message}`);
        }
    }, []);

    const removeMedia = useCallback((id: string) => {
        setMediaList(prev => prev.filter(media => media.id !== id));
    }, []);

    // Отправка формы
    // front
    const submitForm = useCallback(async () => {
        if (!description) {
            Alert.alert('Ошибка', 'Введите описание инцидента');
            return;
        }

        if (!manualAddress) {
            Alert.alert('Ошибка', 'Укажите адрес');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();

            // Добавляем данные как строки
            formData.append('description', description);
            formData.append('timestamp', new Date().toISOString()); // Преобразуем дату в строку
            formData.append('isAnonymous', String(isAnonymous));

            if (location) {
                formData.append('latitude', location.coords.latitude.toString());
                formData.append('longitude', location.coords.longitude.toString());
            }

            formData.append('address', manualAddress);

            if (firstName) formData.append('firstName', firstName);
            if (lastName) formData.append('lastName', lastName);

            // Добавляем медиафайлы
            mediaList.forEach((media, index) => {
                formData.append(`media`, {
                    uri: media.uri,
                    type: media.type === 'video' ? 'video/mp4' : 'image/jpeg',
                    name: `media_${index}_${media.uri.split('/').pop()}`,
                } as any);
            });

            const response = await api.post("incidents/", formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.status === 201) {
                Alert.alert('Успех', 'Инцидент успешно создан');
                resetForm();
                router.back();
            } else {
                throw new Error('Ошибка сервера');
            }
        } catch (error) {
            console.error('Ошибка отправки:', error);
            Alert.alert('Ошибка', 'Не удалось отправить данные');
        } finally {
            setLoading(false);
        }
    }, [description, isAnonymous, location, manualAddress, firstName, lastName, mediaList, router]);

    const resetForm = useCallback(() => {
        setDescription('');
        setMediaList([]);
        setLocation(null);
        setManualAddress('');
        setIsManualAddress(false);
    }, []);

    return (
        <ScrollView className="flex-1 p-4 bg-gray-50">
            <View className="flex-row items-center mb-6">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Ionicons name="arrow-back" size={24} color="#3b82f6"/>
                </TouchableOpacity>
                <Text className="text-xl font-bold ml-2 text-gray-800">Новый инцидент</Text>
            </View>

            <Text className="text-lg font-semibold mb-2 text-gray-700">Описание</Text>
            <TextInput
                className="border border-gray-300 rounded-lg p-4 h-32 bg-white text-gray-800 mb-4"
                placeholder="Опишите что произошло..."
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
            />

            <Text className="text-lg font-semibold mb-2 text-gray-700">Медиа</Text>
            <View className="flex-row space-x-2 mb-4 gap-2">
                <TouchableOpacity
                    className="bg-blue-500 rounded-lg py-3 px-4 flex-1 items-center flex-row justify-center"
                    onPress={pickMedia}
                >
                    <Ionicons name="images" size={20} color="white"/>
                    <Text className="text-white font-medium ml-2">Выбрать</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="bg-blue-600 rounded-lg py-3 px-4 flex-1 items-center flex-row justify-center"
                    onPress={takeMedia}
                >
                    <Ionicons name="camera" size={20} color="white"/>
                    <Text className="text-white font-medium ml-2">Снять</Text>
                </TouchableOpacity>
            </View>

            {mediaList.length > 0 && (
                <ScrollView horizontal className="py-4">
                    <View className="flex-row space-x-2 pr-2">
                        {mediaList.map(media => (
                            <View key={media.id} className="relative p-2">
                                {media.type === 'image' ? (
                                    <Image
                                        source={{uri: media.uri}}
                                        className="w-24 h-24 rounded-lg"
                                    />
                                ) : (
                                    <View className="w-24 h-24 bg-gray-200 rounded-lg justify-center items-center">
                                        <Ionicons name="videocam" size={32} color="#666"/>
                                    </View>
                                )}
                                <TouchableOpacity
                                    className="absolute -top-1 -right-1 bg-red-500 rounded-full w-6 h-6 justify-center items-center"
                                    onPress={() => removeMedia(media.id)}
                                >
                                    <Ionicons name="close" size={16} color="white"/>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}

            <Text className="text-lg font-semibold mb-2 text-gray-700">Адрес</Text>
            <TextInput
                className="border border-gray-300 rounded-lg p-4 bg-white text-gray-800 mb-2"
                placeholder="Введите адрес или используйте текущее местоположение"
                value={manualAddress}
                onChangeText={setManualAddress}
                onFocus={handleAddressFocus}
                onBlur={handleAddressBlur}
            />
            {location && !isManualAddress && (
                <View className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <Text className="text-blue-800 mt-1">
                        Координаты: {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                    </Text>
                </View>
            )}
            <TouchableOpacity
                className="bg-green-500 rounded-lg py-3 px-4 items-center mb-4 flex-row justify-center"
                onPress={getCurrentLocation}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator size="small" color="white"/>
                ) : (
                    <>
                        <Ionicons name="location" size={20} color="white" className="mr-2"/>
                        <Text className="text-white font-medium">Использовать текущее местоположение</Text>
                    </>
                )}
            </TouchableOpacity>

            {errorMsg && (
                <Text className="text-red-500 mb-4">{errorMsg}</Text>
            )}

            {/* Чекбокс подтверждения */}
            <View className="flex-row items-center mb-4">
                <TouchableOpacity
                    onPress={() => setIsAnonymous(!isAnonymous)}
                    className="mr-2 flex flex-row items-center gap-2"
                >
                    <Ionicons
                        name={isAnonymous ? "checkbox" : "square-outline"}
                        size={24}
                        color={isAnonymous ? "#3b82f6" : "#6b7280"}
                    />
                    <Text className="text-gray-700">Сохранить анонимность</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                className={`bg-blue-600 rounded-lg py-4 items-center`}
                onPress={submitForm}
            >
                <Text className="text-white font-bold text-lg">Создать инцидент</Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

export default IncidentForm;
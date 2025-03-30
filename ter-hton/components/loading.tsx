import { View, Text, ActivityIndicator } from 'react-native';

export const LoadingScreen = () => {
    return (
        <View className="flex-1 justify-center items-center bg-white">
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-lg">Loading...</Text>
        </View>
    );
};
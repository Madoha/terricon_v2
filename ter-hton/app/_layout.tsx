// app/_layout.tsx
import "../global.css";
import {Stack} from "expo-router";
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context";
import {DarkTheme, DefaultTheme, ThemeProvider} from "@react-navigation/native";
import {useColorScheme, Platform, View} from "react-native";
import {useFonts} from "expo-font";
import {AuthProvider} from "@/context/AuthContext";
import {LoadingScreen} from "@/components/loading";
import {UserProvider} from "@/context/UserContext";
import FloatingChatButton from "@/components/FloatingChatButton";
import EmergencyServicesModal from './EmergencyServicesModal';
import {useEffect} from "react";
import incidentForm from "@/app/incident-form";

function LayoutContent() {
    const colorScheme = useColorScheme();

    useEffect(() => {
        incidentForm()
    }, []);

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            {Platform.OS === 'android' ? (
                <View style={{flex: 1, paddingTop: 25}}>
                    <Stack screenOptions={{headerShown: false}}/>
                    {/*<FloatingChatButton />*/}
                </View>
            ) : (
                <SafeAreaProvider>
                    <SafeAreaView style={{flex: 1}}>
                        <Stack screenOptions={{headerShown: false}}/>
                        {/*<FloatingChatButton />*/}
                    </SafeAreaView>
                </SafeAreaProvider>
            )}
        </ThemeProvider>
    );
}

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

    if (!fontsLoaded) {
        return <LoadingScreen/>;
    }

    return (
        <AuthProvider>
            <UserProvider>
                <LayoutContent/>
            </UserProvider>
        </AuthProvider>
    );
}
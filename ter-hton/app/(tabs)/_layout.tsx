import {Tabs, Redirect} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useAuth} from "@/context/AuthContext";
import {useUser} from "@/context/UserContext";
import {ActivityIndicator, View} from "react-native";

export default function TabLayout() {
    // @ts-ignore
    const {isAuthenticated, isLoading} = useAuth();
    const {role} = useUser();

    if (isLoading) {
        return (
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <ActivityIndicator size="large"/>
            </View>
        );
    }

    // if (!isAuthenticated) {
    //     return <Redirect href="/login"/>;
    // }

    return (
        <Tabs
            screenOptions={{
                tabBarShowLabel: false,
                headerShown: false,
                tabBarStyle: {
                    borderTopWidth: 0,
                    position: "absolute",
                    elevation: 0,
                    height: 40,
                    paddingBottom: 8,
                },
                tabBarActiveTintColor: "#0066CC", // Синий цвет для активной иконки
                tabBarInactiveTintColor: "#888", // Серый цвет для неактивных иконок
            }}
        >
            <Tabs.Screen
                name='index'
                options={{
                    title: 'Home',
                    tabBarIcon: ({size, color}) => (
                        <Ionicons name="home" size={size} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name='chat'
                options={{
                    title: 'Chat',
                    tabBarIcon: ({size, color}) => (
                        <Ionicons name="chatbubble" size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name='create'
                options={{
                    title: 'Create',
                    tabBarIcon: ({size, color}) => (
                        <Ionicons name="add-circle" size={size} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name='notifications'
                options={{
                    title: 'Notifications',
                    tabBarIcon: ({size, color}) => (
                        <Ionicons name="notifications" size={size} color={color}/>
                    ),
                }}
            />
            <Tabs.Screen
                name='profile'
                options={{
                    title: 'Profile',
                    tabBarIcon: ({size, color}) => (
                        <Ionicons name="person-circle" size={size} color={color}/>
                    ),
                }}
            />
        </Tabs>
    );
}
import {Redirect} from "expo-router";
import {ActivityIndicator, View} from "react-native";
import {useAuth} from "@/context/AuthContext";

export default function Index() {
  // @ts-ignore
    const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
    );
  }


  return <Redirect href="/(tabs)/profile" />;
}

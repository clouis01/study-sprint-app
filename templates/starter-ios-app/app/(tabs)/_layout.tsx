import { Octicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { cssInterop } from "nativewind";
import { View } from "react-native";
import { HapticTab } from "@/components/haptic-tab";

cssInterop(Octicons, {
  className: {
    target: "style",
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarBackground: () => (
          <View className="flex-1 border-background border-t bg-background" />
        ),
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          paddingTop: 10,
          elevation: 0, // Android
          shadowOpacity: 0, // iOS
          borderTopWidth: 0, // iOS fallback
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: () => (
            <Octicons name="home" size={24} className="text-foreground" />
          ),
        }}
      />
    </Tabs>
  );
}

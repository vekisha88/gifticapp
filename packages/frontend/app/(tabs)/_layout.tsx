import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { Keyboard, StyleProp, ViewStyle, StatusBar } from "react-native"; // Add StatusBar
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import commonStyles, { colors } from "../../styles/commonStyles"; // Import colors

type TabName = "buy" | "claim";

const TABS_CONFIG: {
  name: TabName;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { name: "buy", title: "Buy Gifts", icon: "gift-outline" },
  { name: "claim", title: "Claim Gifts", icon: "wallet-outline" },
];

const getTabBarStyle = (
  isKeyboardVisible: boolean,
  insets: { bottom: number }
): StyleProp<ViewStyle> => ({
  display: isKeyboardVisible ? "none" : "flex",
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  elevation: 0,
  paddingBottom: insets.bottom,
  backgroundColor: colors.background, // Set dark background
});

export default function TabLayout() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const keyboardHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  return (
    <>
      <StatusBar
        backgroundColor={colors.background} // Dark background
        barStyle="light-content" // Light text/icons
      />
      <Tabs
        screenOptions={{
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: colors.background, // Dark header
          },
          headerTintColor: colors.text, // Light text in header
          tabBarStyle: getTabBarStyle(isKeyboardVisible, insets),
          tabBarActiveTintColor: colors.primary, // Bright blue for active tab
          tabBarInactiveTintColor: colors.placeholder, // Muted color for inactive tabs
        }}
      >
        {TABS_CONFIG.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name={tab.icon} size={size} color={color} />
              ),
            }}
          />
        ))}
      </Tabs>
    </>
  );
}
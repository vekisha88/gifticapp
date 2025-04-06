import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Platform,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { dimensions, shadows, spacing, typography } from './styles';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

export interface TabBarItem {
  key: string;
  label: string;
  icon: string;
}

interface TabBarProps {
  tabs: TabBarItem[];
  activeTab: string;
  onTabPress: (tabKey: string) => void;
  style?: StyleProp<ViewStyle>;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
  style,
}) => {
  const { colors, isDark } = useTheme();

  const getTabIcon = (icon: string, isActive: boolean) => {
    const color = isActive ? colors.primary : colors.textSecondary;
    const size = 22;

    switch (icon) {
      case 'home':
        return <Ionicons name="home" size={size} color={color} />;
      case 'chart':
        return <Ionicons name="stats-chart" size={size} color={color} />;
      case 'gift':
        return <FontAwesome5 name="gift" size={size-2} color={color} />;
      case 'profile':
        return <Ionicons name="person" size={size} color={color} />;
      default:
        return <Ionicons name="help-circle" size={size} color={color} />;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          ...Platform.select({
            ios: isDark ? {} : shadows.medium,
            android: {},
          }),
        },
        style,
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            {getTabIcon(tab.icon, isActive)}
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? colors.primary : colors.textSecondary,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    height: dimensions.tabBarHeight,
    paddingBottom: Platform.OS === 'ios' ? spacing.small : 0,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.small,
  },
  tabLabel: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
});

export default TabBar; 
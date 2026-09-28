import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  Sparkles,
  Wallet,
  Users,
  User,
} from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface TabConfig {
  name: string;
  label: string;
  icon: React.ComponentType<any>;
}

const TAB_CONFIGS: TabConfig[] = [
  { name: 'index', label: 'Home', icon: Home },
  { name: 'card', label: 'Plans', icon: Sparkles },
  { name: 'wallet', label: 'Payment', icon: Wallet },
  { name: 'stats', label: 'Teams', icon: Users },
  { name: 'profile', label: 'Account', icon: User },
];

/**
 * Individual Seed-Type Tab Button
 * Uses a rounded "seed" pill indicator around the active icon
 */
const SeedTabItem = ({
  label,
  focused,
  IconComponent,
  onPress,
}: {
  label: string;
  focused: boolean;
  IconComponent: React.ComponentType<any>;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.05 : 1, {
      damping: 14,
      stiffness: 200,
    });
  }, [focused]);

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.92, { duration: 60 }),
      withSpring(focused ? 1.05 : 1, { damping: 12, stiffness: 220 })
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const activeGold = '#F59E0B';
  const inactiveSmoke = '#71717A';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      style={styles.tabTouchTarget}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        {/* Seed Pill Background for Active State */}
        <View style={[styles.seedPill, focused && styles.seedPillActive]}>
          <IconComponent
            size={19}
            color={focused ? activeGold : inactiveSmoke}
            strokeWidth={focused ? 2.3 : 1.8}
          />
        </View>

        {/* Tab Label */}
        <Text
          style={[
            styles.tabLabel,
            focused ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * Normal Grounded Bottom Navigation Bar (Seed Type)
 * Docked cleanly to the bottom edge with safe area clearance,
 * subtle top gold specular hairline, and balanced 5-tab distribution.
 */
const NormalSeedTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 4);

  // Check if current screen requests tab bar hidden
  const currentRoute = state.routes[state.index];
  const { options } = descriptors[currentRoute.key];
  if (options.tabBarStyle && (options.tabBarStyle as any).display === 'none') {
    return null;
  }

  return (
    <View
      style={[
        styles.barContainer,
        {
          paddingBottom: bottomPadding,
          height: 58 + bottomPadding,
        },
      ]}
    >
      {/* Top Hairline Light Guide */}
      <LinearGradient
        colors={[
          'rgba(245, 158, 11, 0)',
          'rgba(245, 158, 11, 0.25)',
          '#FDE047',
          'rgba(245, 158, 11, 0.25)',
          'rgba(245, 158, 11, 0)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topLightGuide}
      />

      {/* 5 Grounded Tabs */}
      <View style={styles.tabsRow}>
        {TAB_CONFIGS.map((tab) => {
          const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            if (routeIndex === -1) return;
            const route = state.routes[routeIndex];
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <SeedTabItem
              key={tab.name}
              label={tab.label}
              focused={isFocused}
              IconComponent={tab.icon}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <NormalSeedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="card" options={{ title: 'Plans' }} />
      <Tabs.Screen name="wallet" options={{ title: 'Payment' }} />
      <Tabs.Screen name="stats" options={{ title: 'Teams' }} />
      <Tabs.Screen name="profile" options={{ title: 'Account' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 11, 16, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.2)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 16,
  },
  topLightGuide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  tabTouchTarget: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // "Seed" (pill) Active Indicator
  seedPill: {
    width: 52,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  seedPillActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },

  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: '#FDE047',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#71717A',
    fontWeight: '500',
  },
});

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Home from '../screens/Homescreen/Home';
import Explore from '../screens/Explorescreen/Explore';
import Voice from '../screens/VoiceScreen/Voice';
import Tasks from '../screens/TasksScreen/Tasks';
import Memories from '../screens/MemoriesScreen/Memories';
import Apps from '../screens/AppsScreen/Apps';

const HomeScreen = () => <Home />;
const ExploreScreen = () => <Explore />;
const VoiceScreen = () => <Voice />;
const TasksScreen = () => <Tasks />;
const MemoriesScreen = () => <Memories />;
const AppsScreen = () => <Apps />;

export type TabParamList = {
  Home: undefined;
  Tasks: undefined;
  Voice: undefined;
  Memories: undefined;
  Apps: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  Home: 'home',
  Tasks: 'check-square',
  Voice: 'mic',
  Memories: 'cpu',
  Apps: 'grid',
};

const PRIMARY = '#A855F7';
const INACTIVE = 'rgba(255,255,255,0.4)';

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const CENTER_INDEX = 2;

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const isCenter = index === CENTER_INDEX;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCenter) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.centerWrap}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel="Voice"
              >
                <View style={[styles.centerButton, isFocused && styles.centerButtonActive]}>
                  <Feather name="mic" size={26} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={`${route.name} tab`}
            >
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <Feather
                  name={TAB_ICONS[route.name] ?? 'circle'}
                  size={22}
                  color={isFocused ? PRIMARY : INACTIVE}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const BottomNavigation = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Voice" component={VoiceScreen} />
      <Tab.Screen name="Memories" component={MemoriesScreen} />
      <Tab.Screen name="Apps" component={ExploreScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0C0C0C',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 48,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(168,85,247,0.18)',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  centerButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  centerButtonActive: {
    backgroundColor: '#9333EA',
    opacity: 1,
  },
});

export default BottomNavigation;

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { NavigationHelpers, ParamListBase, TabNavigationState } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Home from '../screens/Homescreen/Home';
import Chat from '../screens/Chatscreen/Chat';
import Explore from '../screens/Explorescreen/Explore';

// Placeholder components until actual screens are created
const HomeScreen = () => <Home />;
const ChatScreen = () => <Chat />;
const ExploreScreen = () => <Explore />;

type TabParamList = {
  Home: undefined;
  Chat: undefined;
  Explore: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const { width } = Dimensions.get('window');

const TabButton = ({ 
  label, 
  isFocused, 
  onPress 
}: { 
  label: string; 
  isFocused: boolean; 
  onPress: () => void;
}) => {
  const fadeAnim = React.useRef(new Animated.Value(isFocused ? 1 : 0.5)).current;
  const scaleAnim = React.useRef(new Animated.Value(isFocused ? 1.1 : 1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: isFocused ? 1 : 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: isFocused ? 1.1 : 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, [isFocused]);

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={`${label} tab`}
      onPress={onPress}
      style={styles.tab}
    >
      <Animated.Text
        style={[
          styles.label,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {label}
      </Animated.Text>
      <Animated.View 
        style={[
          styles.indicator,
          {
            opacity: fadeAnim,
            transform: [{ scale: fadeAnim }]
          }
        ]}
      />
    </TouchableOpacity>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      />
      <View style={styles.content}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

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

          return (
            <TabButton
              key={route.key}
              label={route.name}
              isFocused={isFocused}
              onPress={onPress}
            />
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
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: Platform.select({
      ios: 'rgba(0,0,0,0.7)',
      android: 'rgba(0,0,0,0.9)',
    }),
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 35,
  },
  content: {
    flexDirection: 'row',
    height: '100%',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  indicator: {
    position: 'absolute',
    bottom: 12,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});

export default BottomNavigation;

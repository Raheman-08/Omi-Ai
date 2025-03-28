import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import Splash from '../screens/SplashScreen/Splash';
import Onboard from '../screens/Onboarding/Onboard';
import Cloning from '../screens/Onboarding/Cloning';
import Verify from '../screens/Onboarding/Verify';
import Verified from '../screens/Onboarding/Verified';
import Signin from '../screens/Auth/Signin';
import Personalise from '../screens/Personalisation/Personalise';
import Home from '../screens/Homescreen/Home';
import Explore from '../screens/Explorescreen/Explore';
import Chat from '../screens/Chatscreen/Chat';
import BottomNavigation from './BottomNavigation';
const Stack = createNativeStackNavigator();

const StackNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName="Splash">
        <Stack.Screen name="Splash" component={Splash} />
        <Stack.Screen name="Onboarding" component={Onboard} />
        <Stack.Screen name="Cloning" component={Cloning} />
        <Stack.Screen name="Verify" component={Verify} />
        <Stack.Screen name="VerifySuccess" component={Verified} />
        <Stack.Screen name="Signin" component={Signin} />
        <Stack.Screen name="Personalise" component={Personalise} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Chat" component={Chat} />
        <Stack.Screen name="Explore" component={Explore} /> 
        <Stack.Screen name="Bottom" component={BottomNavigation} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default StackNavigation;
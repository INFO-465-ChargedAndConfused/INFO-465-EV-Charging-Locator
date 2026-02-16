import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import LogGlucoseScreen from './src/screens/glucose/LogGlucoseScreen';
import QuickLogScreen from './src/screens/QuickLogScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import GraphScreen from './src/screens/GraphScreen';
import HealthQuestScreen from './src/screens/HealthQuestScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LogMealScreen from './src/screens/LogMealScreen';
import LogExerciseScreen from './src/screens/LogExerciseScreen';
import AuroraChatScreen from './src/screens/AuroraChatScreen';
// import AuroraCallScreen from './src/screens/AuroraCallScreen'; // Temporarily disabled - has syntax errors
import CommunityScreen from './src/screens/CommunityScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import PredictionsScreen from './src/screens/PredictionsScreen';

// Import auth service
import authService from './src/services/authService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for main app
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'home';
          else if (route.name === 'Predictions') iconName = 'analytics';
          else if (route.name === 'Care Circle') iconName = 'people';
          else if (route.name === 'History') iconName = 'list';
          else if (route.name === 'Graph') iconName = 'bar-chart';
          else if (route.name === 'Goals') iconName = 'trophy';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#14B8A6',
        tabBarInactiveTintColor: '#9CA3AF',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Predictions" component={PredictionsScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Graph" component={GraphScreen} />
      <Tab.Screen name="Goals" component={HealthQuestScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();

    // Check auth status periodically to catch changes
    const interval = setInterval(checkAuthentication, 1000);

    return () => clearInterval(interval);
  }, []);

  const checkAuthentication = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#14B8A6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="LogMeal"
              component={LogMealScreen}
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="LogExercise"
              component={LogExerciseScreen}
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="AuroraChat"
              component={AuroraChatScreen}
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            {/* AuroraCallScreen temporarily removed - had syntax errors */}
            <Stack.Screen
              name="Insights"
              component={InsightsScreen}
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

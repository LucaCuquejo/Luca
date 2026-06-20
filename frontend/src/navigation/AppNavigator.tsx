import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/store';
import { loadStoredAuth } from '@/store/slices/authSlice';
import { Colors, Typography, Spacing } from '@/constants/theme';
import CrisisOverlay from '@/components/crisis/CrisisOverlay';

// Auth Screens
import WelcomeScreen from '@/screens/auth/WelcomeScreen';
import OnboardingScreen from '@/screens/auth/OnboardingScreen';

// Main Screens
import HomeScreen from '@/screens/main/HomeScreen';
import ChatbotScreen from '@/screens/main/ChatbotScreen';
import GoalsScreen from '@/screens/main/GoalsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  Home: { active: '🏠', inactive: '⬜' },
  Chat: { active: '💬', inactive: '🗨️' },
  Goals: { active: '🎯', inactive: '○' },
  Community: { active: '👥', inactive: '🫂' },
  Dashboard: { active: '📊', inactive: '📈' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.cardWhite,
          borderTopColor: Colors.border,
          height: 84,
          paddingBottom: Spacing.lg,
          paddingTop: Spacing.sm,
        },
        tabBarActiveTintColor: Colors.tealSoft,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: Typography.fontSize.xs,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22 }}>
            {focused
              ? TAB_ICONS[route.name]?.active
              : TAB_ICONS[route.name]?.inactive}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatbotScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen
        name="Community"
        component={PlaceholderScreen('Community', '👥', 'Community Hub coming soon')}
      />
      <Tab.Screen
        name="Dashboard"
        component={PlaceholderScreen('Dashboard', '📊', 'Your emotional health dashboard')}
      />
    </Tab.Navigator>
  );
}

function PlaceholderScreen(title: string, icon: string, message: string) {
  return function Screen() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Text style={{ fontSize: 48 }}>{icon}</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.textPrimary }}>{title}</Text>
        <Text style={{ fontSize: 15, color: Colors.textSecondary }}>{message}</Text>
      </View>
    );
  };
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Register" component={PlaceholderScreen('Register', '✉️', '')} />
      <Stack.Screen name="Login" component={PlaceholderScreen('Login', '🔑', '')} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);

  const showOnboarding = isAuthenticated && !user?.profile?.onboardingCompleted;

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthenticated ? (
            <Stack.Screen name="Auth" component={AuthStack} />
          ) : showOnboarding ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : (
            <Stack.Screen name="Main" component={MainTabs} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {/* Crisis overlay sits above everything */}
      <CrisisOverlay />
    </>
  );
}

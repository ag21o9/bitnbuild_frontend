
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();



function RootLayoutNav() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        console.log('Auth token found:', token);
        setInitialRoute('(tabs)');
      } else {
        console.log('No auth token found');
        setInitialRoute('login');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setInitialRoute('login');
    }
  };

  if (!initialRoute) {
    // Still checking auth status
    return null;
  }

  return (
    <Stack initialRouteName={initialRoute} screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay to ensure auth check completes
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootLayoutNav />
    </GestureHandlerRootView>
  );
}
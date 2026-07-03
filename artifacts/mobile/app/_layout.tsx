import { Fredoka_600SemiBold, Fredoka_700Bold } from "@expo-google-fonts/fredoka";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ListsProvider } from "@/context/ListsContext";
import { useColors } from "@/hooks/useColors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const Now_400Regular = require("@/assets/fonts/Now-Regular.otf");
const Now_500Medium = require("@/assets/fonts/Now-Medium.otf");
const Now_600SemiBold = require("@/assets/fonts/Now-SemiBold.otf");
const Now_700Bold = require("@/assets/fonts/Now-Bold.otf");
const NowAlt_900Black = require("@/assets/fonts/NowAlt-Black.otf");

function RootLayoutNav() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="mode-select"
        options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="editor"
        options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="result" options={{ headerShown: false }} />
      <Stack.Screen
        name="dice"
        options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
      />
      <Stack.Screen
        name="paywall"
        options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
      />
    </Stack>
  );
}

function AppProviders({ children }: { children: React.ReactNode }) {
  return <ListsProvider>{children}</ListsProvider>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Now_400Regular,
    Now_500Medium,
    Now_600SemiBold,
    Now_700Bold,
    NowAlt_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AppProviders>
                <RootLayoutNav />
              </AppProviders>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

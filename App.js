import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider } from './src/context/AuthContext';
import { VpnProvider }  from './src/context/VpnContext';

import ConsentScreen    from './src/screens/ConsentScreen';
import AuthScreen       from './src/screens/AuthScreen';
import ShieldScreen     from './src/screens/ShieldScreen';
import GhostScreen      from './src/screens/GhostScreen';
import DataScreen       from './src/screens/DataScreen';
import LedgerScreen     from './src/screens/LedgerScreen';
import PlansScreen      from './src/screens/PlansScreen';
import SettingsScreen   from './src/screens/SettingsScreen';
import DownloadScreen   from './src/screens/DownloadScreen';
import B2BPaymentScreen from './src/screens/B2BPaymentScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const PINK  = '#FF007F';
const BG    = '#040508';
const PANEL = '#0E111D';
const MUTED = '#5A5D6E';

// ── Splash ───────────────────────────────────────────────────────────────────

function SplashScreen({ onDone }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const ring1     = useRef(new Animated.Value(0)).current;
  const ring2     = useRef(new Animated.Value(0)).current;
  const ring3     = useRef(new Animated.Value(0)).current;
  const exitAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5,   useNativeDriver: true }),
    ]).start();

    const pulseRing = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();

    pulseRing(ring1, 0);
    pulseRing(ring2, 250);
    pulseRing(ring3, 500);

    const timer = setTimeout(() => {
      Animated.timing(exitAnim, { toValue: 0, duration: 500, useNativeDriver: true })
        .start(() => onDone());
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[sp.root, { opacity: exitAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <View style={sp.center}>
        <Animated.View style={[sp.ring, sp.ring3, { opacity: ring3 }]} />
        <Animated.View style={[sp.ring, sp.ring2, { opacity: ring2 }]} />
        <Animated.View style={[sp.ring, sp.ring1, { opacity: ring1 }]} />
        <Animated.View style={[sp.logoWrap, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={sp.logoIcon}>⬡</Text>
        </Animated.View>
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={sp.wordmark}>SENTINEL</Text>
          <Text style={sp.sub}>P R O T O C O L</Text>
        </Animated.View>
      </View>
      <Animated.Text style={[sp.tagline, { opacity: fadeAnim }]}>
        ZERO LOGS · ZERO TRACKING · YOUR YIELD
      </Animated.Text>
    </Animated.View>
  );
}

const sp = StyleSheet.create({
  root:     { flex: 1, backgroundColor: BG, justifyContent: 'center', alignItems: 'center' },
  center:   { alignItems: 'center', justifyContent: 'center' },
  ring:     { position: 'absolute', borderRadius: 200, borderWidth: 1 },
  ring1:    { width: 160, height: 160, borderColor: 'rgba(255,0,127,0.6)', backgroundColor: 'rgba(255,0,127,0.07)' },
  ring2:    { width: 220, height: 220, borderColor: 'rgba(255,0,127,0.35)' },
  ring3:    { width: 290, height: 290, borderColor: 'rgba(255,0,127,0.15)' },
  logoWrap: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#1A0015',
              borderWidth: 2, borderColor: PINK, alignItems: 'center', justifyContent: 'center',
              marginBottom: 24, zIndex: 10 },
  logoIcon: { fontSize: 48, color: PINK },
  wordmark: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold', letterSpacing: 6, textAlign: 'center', fontFamily: 'monospace' },
  sub:      { color: PINK, fontSize: 11, letterSpacing: 7, textAlign: 'center' },
  tagline:  { position: 'absolute', bottom: 60, color: MUTED, fontSize: 10, letterSpacing: 3, fontFamily: 'monospace' },
});

// ── Tab icons ─────────────────────────────────────────────────────────────────

const TAB_ICONS = {
  Shield: '⬡', Ghost: '👤', Data: '📡', Ledger: '📋', Plans: '💎', Config: '⚙️',
};

function TabIcon({ name, focused }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>
      {TAB_ICONS[name] || '●'}
    </Text>
  );
}

// ── Main tab navigator ────────────────────────────────────────────────────────

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: PANEL,
          borderTopColor:  'rgba(255,0,127,0.2)',
          borderTopWidth:  1,
          height:          Platform.OS === 'web' ? 64 : 70,
          paddingBottom:   Platform.OS === 'web' ? 8 : 12,
          paddingTop:      4,
        },
        tabBarActiveTintColor:   PINK,
        tabBarInactiveTintColor: MUTED,
        tabBarLabelStyle: { fontSize: 10, letterSpacing: 2, fontFamily: 'monospace', marginTop: 0 },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Shield" component={ShieldScreen} />
      <Tab.Screen name="Ghost"  component={GhostScreen} />
      <Tab.Screen name="Data"   component={DataScreen} />
      <Tab.Screen name="Ledger" component={LedgerScreen} />
      <Tab.Screen name="Plans"  component={PlansScreen} />
      <Tab.Screen name="Config" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// ── Root navigator ────────────────────────────────────────────────────────────

function RootNavigator({ initialRoute }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false, cardStyle: { backgroundColor: BG } }}
    >
      <Stack.Screen name="Consent"    component={ConsentScreen} />
      <Stack.Screen name="Auth"       component={AuthScreen} />
      <Stack.Screen name="Main"       component={MainTabs} />
      <Stack.Screen name="B2BPayment" component={B2BPaymentScreen}
        options={{ presentation: 'modal', cardStyle: { backgroundColor: BG } }} />
      <Stack.Screen name="Download"   component={DownloadScreen} />
    </Stack.Navigator>
  );
}

// ── App entry ─────────────────────────────────────────────────────────────────

export default function App() {
  const [splashDone, setSplashDone]     = useState(false);
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('@sentinel_consented').then(val => {
      setInitialRoute(val === 'true' ? 'Main' : 'Consent');
    });
  }, []);

  if (!splashDone) {
    return (
      <SplashScreen onDone={() => setSplashDone(true)} />
    );
  }

  if (!initialRoute) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={BG} />
        <AuthProvider>
          <VpnProvider>
            <NavigationContainer>
              <RootNavigator initialRoute={initialRoute} />
            </NavigationContainer>
          </VpnProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

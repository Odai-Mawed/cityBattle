import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toasts } from './src/components/Toasts';
import type { Route } from './src/navigation';
import { AchievementsScreen } from './src/screens/AchievementsScreen';
import { BattleScreen } from './src/screens/BattleScreen';
import { CityDetailScreen, CollectionScreen } from './src/screens/CollectionScreen';
import { CompareScreen } from './src/screens/CompareScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { QuizScreen } from './src/screens/QuizScreen';
import { ProgressProvider, useProgress } from './src/state/progress';
import { C } from './src/theme';

function Router() {
  const { loaded } = useProgress();
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [key, setKey] = useState(0);
  const nav = (r: Route) => {
    setKey((k) => k + 1);
    setRoute(r);
  };

  if (!loaded) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.accent2} size="large" />
      </View>
    );
  }

  switch (route.name) {
    case 'home':
      return <HomeScreen key={key} nav={nav} />;
    case 'battle':
      return <BattleScreen key={key} nav={nav} difficulty={route.difficulty} />;
    case 'quiz':
      return <QuizScreen key={key} nav={nav} />;
    case 'compare':
      return <CompareScreen key={key} nav={nav} a={route.a} b={route.b} />;
    case 'collection':
      return <CollectionScreen key={key} nav={nav} />;
    case 'city':
      return <CityDetailScreen key={key} nav={nav} id={route.id} />;
    case 'achievements':
      return <AchievementsScreen key={key} nav={nav} />;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ProgressProvider>
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <StatusBar style="light" />
          <Router />
          <Toasts />
        </View>
      </ProgressProvider>
    </SafeAreaProvider>
  );
}

import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GameButton, Header, ProgressBar, Screen } from '../components/ui';
import { ACHIEVEMENTS, levelInfo, useProgress } from '../state/progress';
import { C } from '../theme';
import type { Nav } from '../navigation';

export function AchievementsScreen({ nav }: { nav: Nav }) {
  const { progress, reset } = useProgress();
  const lvl = levelInfo(progress.xp);

  const confirmReset = () => {
    const msg = 'Willst du wirklich deinen gesamten Fortschritt löschen?';
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(msg)) reset();
      return;
    }
    Alert.alert('Fortschritt zurücksetzen', msg, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: reset },
    ]);
  };

  return (
    <Screen>
      <Header title="Erfolge & Profil" onBack={() => nav({ name: 'home' })} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profile}>
          <Text style={styles.lvl}>Level {lvl.level}</Text>
          <Text style={styles.title}>{lvl.title}</Text>
          <ProgressBar ratio={lvl.ratio} color={C.gold} height={10} />
          <Text style={styles.sub}>
            {progress.xp} XP gesamt · noch {lvl.needed - lvl.current} XP bis Level {lvl.level + 1}
          </Text>
          <View style={styles.grid}>
            <Cell v={progress.battles} l="Schlachten" />
            <Cell v={progress.wins} l="Siege" />
            <Cell v={progress.roundsWon} l="Runden gewonnen" />
            <Cell v={progress.quizBest} l="Blitz-Rekord" />
            <Cell v={progress.quizBestStreak} l="Beste Serie" />
            <Cell v={progress.compares} l="Vergleiche" />
          </View>
        </View>

        {ACHIEVEMENTS.map((a) => {
          const done = progress.achievements.includes(a.id);
          return (
            <View key={a.id} style={[styles.ach, done && styles.achDone]}>
              <Text style={[styles.achEmoji, !done && { opacity: 0.3 }]}>{done ? a.emoji : '🔒'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.achTitle, done && { color: C.gold }]}>{a.title}</Text>
                <Text style={styles.achDesc}>{a.desc}</Text>
              </View>
              {done ? <Text style={{ fontSize: 20 }}>✅</Text> : null}
            </View>
          );
        })}

        <GameButton small icon="🗑️" label="Fortschritt zurücksetzen" colors={['#4B1D1D', '#7F1D1D']} onPress={confirmReset} />
      </ScrollView>
    </Screen>
  );
}

function Cell({ v, l }: { v: number; l: string }) {
  return (
    <View style={styles.cell}>
      <Text style={styles.cellV}>{v.toLocaleString('de-DE')}</Text>
      <Text style={styles.cellL}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10, paddingBottom: 40 },
  profile: { padding: 16, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', gap: 8, marginBottom: 6 },
  lvl: { color: C.gold, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  title: { color: C.text, fontWeight: '900', fontSize: 28 },
  sub: { color: C.sub, fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  cell: {
    flexBasis: '31%',
    flexGrow: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
  },
  cellV: { color: C.text, fontWeight: '900', fontSize: 20 },
  cellL: { color: C.sub, fontSize: 11, fontWeight: '700', textAlign: 'center' },
  ach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: C.border,
  },
  achDone: { backgroundColor: 'rgba(255,213,79,0.1)', borderColor: C.gold },
  achEmoji: { fontSize: 30 },
  achTitle: { color: C.text, fontWeight: '900', fontSize: 16 },
  achDesc: { color: C.sub, fontSize: 13 },
});

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip, GameButton, ProgressBar, Pulse, Screen } from '../components/ui';
import { CITIES, STATS, cityOfTheDay } from '../data/cities';
import { Difficulty, OPPONENTS } from '../game/battle';
import { ACHIEVEMENTS, levelInfo, useProgress } from '../state/progress';
import { C } from '../theme';
import type { Nav } from '../navigation';

const SKYLINE = '🏢🏙️🌆🏰🗼🌉🏛️🕌⛩️🏟️';

export function HomeScreen({ nav }: { nav: Nav }) {
  const { progress } = useProgress();
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const lvl = levelInfo(progress.xp);
  const daily = cityOfTheDay();
  const best = STATS.reduce((a, b) => (daily.stats[a.key] >= daily.stats[b.key] ? a : b));

  const float = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const opp = OPPONENTS[difficulty];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.logoWrap,
            { transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }] },
          ]}
        >
          <Text style={styles.skyline}>{SKYLINE}</Text>
          <Text style={styles.logo}>
            CITY<Text style={{ color: C.accent2 }}>⚔️</Text>BATTLE
          </Text>
          <Text style={styles.tagline}>Welche Stadt regiert die Welt? 🌍</Text>
        </Animated.View>

        <Pressable onPress={() => nav({ name: 'achievements' })} style={styles.levelCard}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNum}>{lvl.level}</Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.levelTitle}>{lvl.title}</Text>
              <Text style={styles.levelXp}>
                {lvl.current}/{lvl.needed} XP
              </Text>
            </View>
            <ProgressBar ratio={lvl.ratio} color={C.gold} />
            <Text style={styles.statsLine}>
              🏆 {progress.wins} Siege · 🃏 {progress.unlocked.length}/{CITIES.length} Städte · ⚡ Rekord {progress.quizBest}
            </Text>
          </View>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚔️ Kartenschlacht</Text>
          <Text style={styles.sectionDesc}>
            Wähle eine Kategorie – der höhere Wert gewinnt die Karte des Gegners. Erobere neue Städte!
          </Text>
          <View style={styles.chips}>
            <Chip label="🐄 Leicht" active={difficulty === 'easy'} onPress={() => setDifficulty('easy')} color="#16A34A" />
            <Chip label="🚲 Normal" active={difficulty === 'normal'} onPress={() => setDifficulty('normal')} color="#2563EB" />
            <Chip label="🏙️ Schwer" active={difficulty === 'hard'} onPress={() => setDifficulty('hard')} color="#DC2626" />
          </View>
          <Pulse>
            <GameButton
              icon="⚔️"
              label="Schlacht starten"
              subtitle={`Gegner: ${opp.emoji} ${opp.name}`}
              colors={['#FF3D77', '#FF9A3D']}
              onPress={() => nav({ name: 'battle', difficulty })}
            />
          </Pulse>
        </View>

        <View style={{ gap: 12 }}>
          <GameButton
            icon="⚡"
            label="Blitz-Duell"
            subtitle="Welche Stadt hat mehr? 45 Sekunden, maximale Serie!"
            colors={['#7C3AED', '#2563EB']}
            onPress={() => nav({ name: 'quiz' })}
          />
          <GameButton
            icon="🔍"
            label="Städte-Vergleich"
            subtitle="Zwei Städte, vier Kategorien – wer gewinnt?"
            colors={['#0891B2', '#10B981']}
            onPress={() => nav({ name: 'compare' })}
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <GameButton
              style={{ flex: 1 }}
              small
              icon="🃏"
              label={`Sammlung ${progress.unlocked.length}/${CITIES.length}`}
              colors={['#334155', '#475569']}
              onPress={() => nav({ name: 'collection' })}
            />
            <GameButton
              style={{ flex: 1 }}
              small
              icon="🏆"
              label={`Erfolge ${progress.achievements.length}/${ACHIEVEMENTS.length}`}
              colors={['#334155', '#475569']}
              onPress={() => nav({ name: 'achievements' })}
            />
          </View>
        </View>

        <Pressable onPress={() => nav({ name: 'city', id: daily.id })}>
          <LinearGradient colors={daily.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.daily}>
            <View style={styles.dailyShade} />
            <Text style={styles.dailyLabel}>📅 STADT DES TAGES</Text>
            <Text style={styles.dailyName}>
              {daily.flag} {daily.name}
            </Text>
            <Text style={styles.dailyFact}>{daily.fact}</Text>
            <Text style={styles.dailyBest}>
              Stärke: {best.emoji} {best.label} ({daily.stats[best.key]})
            </Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.footer}>
          Die Werte (0–100) sind spielerische Schätzungen, inspiriert von öffentlichen Städte-Rankings.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 18, paddingBottom: 40 },
  logoWrap: { alignItems: 'center', marginTop: 10 },
  skyline: { fontSize: 24, letterSpacing: 2 },
  logo: { color: C.text, fontSize: 42, fontWeight: '900', letterSpacing: 2, marginTop: 4 },
  tagline: { color: C.sub, fontSize: 15, fontWeight: '600', marginTop: 4 },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: C.border,
  },
  levelBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF3C4',
  },
  levelNum: { fontSize: 24, fontWeight: '900', color: '#3B2A00' },
  levelTitle: { color: C.text, fontWeight: '900', fontSize: 17 },
  levelXp: { color: C.sub, fontWeight: '700', fontSize: 13 },
  statsLine: { color: C.sub, fontSize: 12, fontWeight: '600' },
  section: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,61,119,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,61,119,0.35)',
    gap: 12,
  },
  sectionTitle: { color: C.text, fontSize: 22, fontWeight: '900' },
  sectionDesc: { color: C.sub, fontSize: 14, lineHeight: 20 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  daily: { borderRadius: 22, padding: 16, overflow: 'hidden', gap: 4 },
  dailyShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  dailyLabel: { color: C.gold, fontWeight: '900', fontSize: 12, letterSpacing: 1.5 },
  dailyName: { color: '#fff', fontWeight: '900', fontSize: 26 },
  dailyFact: { color: '#fff', fontSize: 14, opacity: 0.92 },
  dailyBest: { color: '#fff', fontWeight: '800', fontSize: 13, marginTop: 6 },
  footer: { color: C.dim, fontSize: 11, textAlign: 'center' },
});

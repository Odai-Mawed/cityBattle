import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { GameButton, Header, ProgressBar, Pulse, Screen } from '../components/ui';
import { CITIES, City, STATS, StatInfo } from '../data/cities';
import { pick, shuffle } from '../game/random';
import { haptic } from '../haptics';
import { useProgress } from '../state/progress';
import { C } from '../theme';
import type { Nav } from '../navigation';

const DURATION = 45;

interface Question {
  a: City;
  b: City;
  stat: StatInfo;
}

function makeQuestion(): Question {
  for (;;) {
    const [a, b] = shuffle(CITIES).slice(0, 2);
    const stat = pick(STATS);
    if (Math.abs(a.stats[stat.key] - b.stats[stat.key]) >= 3) return { a, b, stat };
  }
}

export function QuizScreen({ nav }: { nav: Nav }) {
  const { update } = useProgress();
  const [phase, setPhase] = useState<'intro' | 'play' | 'over'>('intro');
  const [q, setQ] = useState<Question>(makeQuestion);
  const [time, setTime] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [answered, setAnswered] = useState<null | { picked: 'a' | 'b'; correct: boolean }>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const shake = useRef(new Animated.Value(0)).current;
  const recorded = useRef(false);

  const multiplier = 1 + Math.floor(streak / 3);

  useEffect(() => {
    if (phase !== 'play') return;
    const t = setInterval(() => setTime((v) => Math.max(0, +(v - 0.1).toFixed(1))), 100);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'play' && time <= 0) setPhase('over');
  }, [time, phase]);

  useEffect(() => {
    if (phase !== 'over' || recorded.current) return;
    recorded.current = true;
    update((p) => ({
      ...p,
      xp: p.xp + Math.round(score / 20),
      quizPlays: p.quizPlays + 1,
      quizBest: Math.max(p.quizBest, score),
      quizBestStreak: Math.max(p.quizBestStreak, bestStreak),
    }));
  }, [phase, score, bestStreak, update]);

  const start = () => {
    recorded.current = false;
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTime(DURATION);
    setAnswered(null);
    setQ(makeQuestion());
    setPhase('play');
  };

  const answer = useCallback(
    (side: 'a' | 'b') => {
      if (answered || phase !== 'play') return;
      const va = q.a.stats[q.stat.key];
      const vb = q.b.stats[q.stat.key];
      const correct = side === 'a' ? va > vb : vb > va;
      setAnswered({ picked: side, correct });
      if (correct) {
        haptic.win();
        const pts = 100 * multiplier;
        setScore((s) => s + pts);
        setStreak((s) => {
          const n = s + 1;
          setBestStreak((b) => Math.max(b, n));
          return n;
        });
        setTime((t) => Math.min(DURATION, t + 1.5));
        setFlash(`+${pts}${multiplier > 1 ? `  (x${multiplier})` : ''}  ⏱+1.5s`);
      } else {
        haptic.lose();
        setStreak(0);
        setTime((t) => Math.max(0, t - 3));
        setFlash('Falsch! ⏱−3s');
        Animated.sequence(
          [10, -10, 8, -8, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 50, useNativeDriver: true })),
        ).start();
      }
      setTimeout(() => {
        setAnswered(null);
        setFlash(null);
        setQ(makeQuestion());
      }, 850);
    },
    [answered, phase, q, multiplier, shake],
  );

  if (phase === 'intro') {
    return (
      <Screen>
        <Header title="Blitz-Duell" onBack={() => nav({ name: 'home' })} />
        <View style={styles.center}>
          <Text style={{ fontSize: 80 }}>⚡</Text>
          <Text style={styles.bigTitle}>Blitz-Duell</Text>
          <Text style={styles.text}>
            Zwei Städte, eine Kategorie. Tippe auf die Stadt mit dem höheren Wert!{'\n\n'}✅ Richtig: +100 Punkte und +1,5 s{'\n'}
            🔥 Alle 3 richtigen in Folge steigt dein Multiplikator{'\n'}❌ Falsch: −3 Sekunden und die Serie ist weg
          </Text>
          <Pulse>
            <GameButton icon="▶️" label={`Los geht's (${DURATION} s)`} colors={['#7C3AED', '#2563EB']} onPress={start} />
          </Pulse>
        </View>
      </Screen>
    );
  }

  if (phase === 'over') {
    return (
      <Screen>
        <Header title="Blitz-Duell" onBack={() => nav({ name: 'home' })} />
        <View style={styles.center}>
          <Text style={{ fontSize: 80 }}>⏰</Text>
          <Text style={styles.bigTitle}>Zeit ist um!</Text>
          <Text style={styles.score}>{score.toLocaleString('de-DE')} Punkte</Text>
          <Text style={styles.text}>
            🔥 Beste Serie: {bestStreak} · ⭐ +{Math.round(score / 20)} XP
          </Text>
          <GameButton icon="🔁" label="Nochmal!" colors={['#7C3AED', '#2563EB']} onPress={start} />
          <GameButton icon="🏠" label="Zum Menü" colors={['#334155', '#475569']} onPress={() => nav({ name: 'home' })} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Blitz-Duell" onBack={() => setPhase('over')} right={<Text style={styles.scoreSmall}>{score}</Text>} />
      <View style={{ paddingHorizontal: 16, gap: 6 }}>
        <ProgressBar ratio={time / DURATION} color={time < 10 ? C.lose : C.accent2} height={10} />
        <View style={styles.infoRow}>
          <Text style={styles.info}>⏱ {time.toFixed(1)} s</Text>
          <Text style={[styles.info, streak >= 3 && { color: C.gold }]}>
            🔥 Serie {streak} {multiplier > 1 ? `· x${multiplier}` : ''}
          </Text>
        </View>
      </View>

      <View style={styles.question}>
        <Text style={styles.qSmall}>Welche Stadt hat mehr…</Text>
        <Text style={[styles.qStat, { color: q.stat.color }]}>
          {q.stat.emoji} {q.stat.label}?
        </Text>
      </View>

      <Animated.View style={[styles.duel, { transform: [{ translateX: shake }] }]}>
        {(['a', 'b'] as const).map((side, i) => {
          const city = q[side];
          const v = city.stats[q.stat.key];
          const other = q[side === 'a' ? 'b' : 'a'].stats[q.stat.key];
          const isWinner = v > other;
          const reveal = !!answered;
          const border = reveal ? (isWinner ? C.win : C.lose) : 'rgba(255,255,255,0.25)';
          return (
            <React.Fragment key={city.id + side}>
              {i === 1 ? <Text style={styles.vs}>VS</Text> : null}
              <Pressable
                onPress={() => answer(side)}
                style={({ pressed }) => [{ flex: 1 }, pressed && { transform: [{ scale: 0.97 }] }]}
              >
                <LinearGradient colors={city.colors} style={[styles.duelCard, { borderColor: border }]}>
                  <View style={styles.shade} />
                  <Text style={{ fontSize: 46 }}>{city.flag}</Text>
                  <Text style={styles.duelName} numberOfLines={2}>
                    {city.name}
                  </Text>
                  <Text style={styles.duelCountry}>{city.country}</Text>
                  <Text style={styles.duelValue}>{reveal ? v : '?'}</Text>
                </LinearGradient>
              </Pressable>
            </React.Fragment>
          );
        })}
      </Animated.View>

      <View style={{ alignItems: 'center', minHeight: 40 }}>
        {flash ? <Text style={[styles.flash, { color: answered?.correct ? C.win : C.lose }]}>{flash}</Text> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'stretch', justifyContent: 'center', padding: 24, gap: 16 },
  bigTitle: { color: C.text, fontSize: 36, fontWeight: '900', textAlign: 'center' },
  text: { color: C.sub, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  score: { color: C.gold, fontSize: 40, fontWeight: '900', textAlign: 'center' },
  scoreSmall: { color: C.gold, fontWeight: '900', fontSize: 18 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  info: { color: C.text, fontWeight: '800', fontSize: 15 },
  question: { alignItems: 'center', marginTop: 24, marginBottom: 12 },
  qSmall: { color: C.sub, fontSize: 16, fontWeight: '700' },
  qStat: { fontSize: 30, fontWeight: '900', marginTop: 4 },
  duel: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  vs: { color: C.text, fontWeight: '900', fontSize: 18 },
  duelCard: {
    borderRadius: 22,
    padding: 14,
    alignItems: 'center',
    borderWidth: 3,
    minHeight: 240,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  duelName: { color: '#fff', fontWeight: '900', fontSize: 19, marginTop: 6, textAlign: 'center' },
  duelCountry: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  duelValue: { color: '#fff', fontWeight: '900', fontSize: 44, marginTop: 10 },
  flash: { fontSize: 22, fontWeight: '900', marginTop: 16 },
});

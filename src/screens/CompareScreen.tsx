import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { RadarChart } from '../components/RadarChart';
import { Chip, GameButton, Header, Screen } from '../components/ui';
import { CITIES, CITY_MAP, STATS, cityTotal } from '../data/cities';
import { useProgress } from '../state/progress';
import { C } from '../theme';
import type { Nav } from '../navigation';

const COLOR_A = '#22D3EE';
const COLOR_B = '#FF3D77';

export function CompareScreen({ nav, a: initialA, b: initialB }: { nav: Nav; a?: string; b?: string }) {
  const { update } = useProgress();
  const [a, setA] = useState(initialA ?? 'berlin');
  const [b, setB] = useState(initialB ?? (initialA === 'wien' ? 'zuerich' : 'wien'));
  const counted = useRef(new Set<string>());

  const ca = CITY_MAP[a];
  const cb = CITY_MAP[b];

  useEffect(() => {
    const key = [a, b].sort().join('|');
    if (a === b || counted.current.has(key)) return;
    counted.current.add(key);
    update((p) => ({ ...p, compares: p.compares + 1 }));
  }, [a, b, update]);

  let winsA = 0;
  let winsB = 0;
  STATS.forEach((s) => {
    if (ca.stats[s.key] > cb.stats[s.key]) winsA++;
    else if (cb.stats[s.key] > ca.stats[s.key]) winsB++;
  });
  const verdict =
    winsA === winsB
      ? cityTotal(ca) === cityTotal(cb)
        ? '🤝 Absolutes Patt!'
        : `🤝 ${winsA}:${winsB} – nach Gesamtpunkten vorn: ${cityTotal(ca) > cityTotal(cb) ? ca.name : cb.name}`
      : `🏆 ${winsA > winsB ? ca.name : cb.name} gewinnt ${Math.max(winsA, winsB)}:${Math.min(winsA, winsB)}`;

  const random = () => {
    const ids = CITIES.map((c) => c.id);
    const x = ids[Math.floor(Math.random() * ids.length)];
    let y = x;
    while (y === x) y = ids[Math.floor(Math.random() * ids.length)];
    setA(x);
    setB(y);
  };

  return (
    <Screen>
      <Header title="Städte-Vergleich" onBack={() => nav({ name: 'home' })} />
      <ScrollView contentContainerStyle={styles.content}>
        <Picker label="Stadt A" color={COLOR_A} value={a} other={b} onChange={setA} />
        <Picker label="Stadt B" color={COLOR_B} value={b} other={a} onChange={setB} />

        <View style={styles.vsHeader}>
          <Text style={[styles.cityName, { color: COLOR_A }]} numberOfLines={1}>
            {ca.flag} {ca.name}
          </Text>
          <Text style={styles.vs}>VS</Text>
          <Text style={[styles.cityName, { color: COLOR_B, textAlign: 'right' }]} numberOfLines={1}>
            {cb.name} {cb.flag}
          </Text>
        </View>

        <RadarChart
          cities={[
            { city: ca, color: COLOR_A },
            { city: cb, color: COLOR_B },
          ]}
        />

        <View style={{ gap: 10 }}>
          {STATS.map((s) => {
            const va = ca.stats[s.key];
            const vb = cb.stats[s.key];
            return (
              <View key={s.key} style={styles.row}>
                <Text style={[styles.val, va >= vb && styles.valWin, { color: COLOR_A }]}>
                  {va}
                  {va > vb ? ' 👑' : ''}
                </Text>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={styles.statLabel}>
                    {s.emoji} {s.label}
                  </Text>
                  <View style={styles.bars}>
                    <View style={[styles.barHalf, { alignItems: 'flex-end' }]}>
                      <View style={[styles.bar, { width: `${va}%`, backgroundColor: COLOR_A, opacity: va >= vb ? 1 : 0.45 }]} />
                    </View>
                    <View style={styles.barHalf}>
                      <View style={[styles.bar, { width: `${vb}%`, backgroundColor: COLOR_B, opacity: vb >= va ? 1 : 0.45 }]} />
                    </View>
                  </View>
                </View>
                <Text style={[styles.val, vb >= va && styles.valWin, { color: COLOR_B, textAlign: 'right' }]}>
                  {vb > va ? '👑 ' : ''}
                  {vb}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.verdict}>
          <Text style={styles.verdictText}>{verdict}</Text>
          <Text style={styles.verdictSub}>
            Gesamt: {cityTotal(ca)} vs. {cityTotal(cb)} Punkte
          </Text>
        </View>

        <GameButton icon="🎲" label="Zufälliges Duell" colors={['#0891B2', '#10B981']} onPress={random} />
      </ScrollView>
    </Screen>
  );
}

function Picker({
  label,
  color,
  value,
  other,
  onChange,
}: {
  label: string;
  color: string;
  value: string;
  other: string;
  onChange: (id: string) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.pickerLabel, { color }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {[CITY_MAP[value], ...CITIES.filter((c) => c.id !== other && c.id !== value)].map((c) => (
          <Chip key={c.id} label={`${c.flag} ${c.name}`} active={c.id === value} color={color} onPress={() => onChange(c.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  pickerLabel: { fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  vsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  cityName: { flex: 1, fontSize: 20, fontWeight: '900' },
  vs: { color: C.text, fontWeight: '900', fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  val: { width: 72, fontSize: 20, fontWeight: '800', opacity: 0.6 },
  valWin: { opacity: 1, fontWeight: '900' },
  statLabel: { color: C.text, fontWeight: '700', fontSize: 14, marginBottom: 4 },
  bars: { flexDirection: 'row', width: '100%', gap: 4 },
  barHalf: { flex: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' },
  bar: { height: 10, borderRadius: 5 },
  verdict: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,213,79,0.12)',
    borderWidth: 1.5,
    borderColor: C.gold,
    alignItems: 'center',
  },
  verdictText: { color: C.gold, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  verdictSub: { color: C.sub, fontSize: 13, marginTop: 4 },
});

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { City, RARITY_INFO, STATS, StatKey, cityRarity } from '../data/cities';
import { haptic } from '../haptics';
import { C } from '../theme';

interface Props {
  city: City;
  /** Rückseite zeigen (verdeckte Karte). Wechsel wird mit Flip animiert. */
  hidden?: boolean;
  compact?: boolean;
  onPickStat?: (stat: StatKey) => void;
  highlight?: StatKey | null;
  blocked?: StatKey | null;
  bonus?: number;
  outcome?: 'win' | 'lose' | 'tie' | null;
  /** Werte als ??? anzeigen (z. B. gesperrte Stadt) */
  maskStats?: boolean;
  label?: string;
}

export function CityCard({ hidden = false, ...rest }: Props) {
  const [shownHidden, setShownHidden] = useState(hidden);
  const flip = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (hidden === shownHidden) return;
    Animated.timing(flip, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setShownHidden(hidden);
      Animated.spring(flip, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 10 }).start();
    });
  }, [hidden, shownHidden, flip]);

  return (
    <Animated.View style={{ transform: [{ scaleX: flip }] }}>
      {shownHidden ? <CardBack compact={rest.compact} label={rest.label} /> : <CardFront {...rest} />}
    </Animated.View>
  );
}

function CardBack({ compact, label }: { compact?: boolean; label?: string }) {
  return (
    <LinearGradient
      colors={['#2B1065', '#0E1A5C']}
      style={[styles.card, compact ? styles.compactBack : styles.fullBack, styles.backCenter]}
    >
      <View style={styles.backPattern}>
        <Text style={{ fontSize: compact ? 40 : 64 }}>🌆</Text>
        <Text style={styles.backTitle}>CITY BATTLE</Text>
        {label ? <Text style={styles.backLabel}>{label}</Text> : null}
      </View>
    </LinearGradient>
  );
}

function CardFront({
  city,
  compact,
  onPickStat,
  highlight,
  blocked,
  bonus = 0,
  outcome,
  maskStats,
  label,
}: Omit<Props, 'hidden'>) {
  const rarity = RARITY_INFO[cityRarity(city)];
  const border = outcome === 'win' ? C.win : outcome === 'lose' ? C.lose : outcome === 'tie' ? C.tie : rarity.color;

  return (
    <LinearGradient
      colors={city.colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor: border, borderWidth: outcome ? 3 : 2 }]}
    >
      <View style={styles.shade} />
      <View style={styles.topRow}>
        <View style={[styles.rarity, { backgroundColor: rarity.color }]}>
          <Text style={styles.rarityText}>
            {'★'.repeat(rarity.stars)} {rarity.label}
          </Text>
        </View>
        {label ? <Text style={styles.ownerLabel}>{label}</Text> : null}
        {bonus > 0 ? <Text style={styles.bonus}>+{bonus} ⚡</Text> : null}
      </View>

      <View style={styles.titleRow}>
        <Text style={[styles.flag, compact && { fontSize: 30 }]}>{city.flag}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, compact && { fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit>
            {city.name}
          </Text>
          <Text style={styles.meta}>
            {city.country} · {city.population.toLocaleString('de-DE')} Mio. Einw.
          </Text>
        </View>
      </View>

      <View style={{ gap: compact ? 4 : 7, marginTop: compact ? 6 : 10 }}>
        {STATS.map((s) => {
          const isBlocked = blocked === s.key;
          const isHi = highlight === s.key;
          const v = city.stats[s.key];
          const shown = v + bonus;
          const pickable = !!onPickStat && !isBlocked;
          return (
            <Pressable
              key={s.key}
              disabled={!pickable}
              onPress={
                pickable && onPickStat
                  ? () => {
                      haptic.bump();
                      onPickStat(s.key);
                    }
                  : undefined
              }
              style={({ pressed }) => [
                styles.statRow,
                compact && styles.statRowCompact,
                pickable && styles.statPickable,
                isHi && { backgroundColor: 'rgba(255,255,255,0.28)', borderColor: '#fff' },
                isBlocked && { opacity: 0.35 },
                pickable && pressed && { transform: [{ scale: 0.97 }] },
              ]}
              accessibilityRole={pickable ? 'button' : undefined}
              accessibilityLabel={`${s.label}: ${maskStats ? 'unbekannt' : shown}`}
            >
              <Text style={styles.statEmoji}>{isBlocked ? '🚧' : s.emoji}</Text>
              <Text style={[styles.statLabel, compact && { fontSize: 13 }]}>{s.label}</Text>
              <View style={styles.statBarWrap}>
                <View style={[styles.statBar, { width: maskStats ? '0%' : `${Math.min(100, v)}%`, backgroundColor: s.color }]} />
              </View>
              <Text style={[styles.statValue, compact && { fontSize: 16 }]}>{maskStats ? '??' : shown}</Text>
            </Pressable>
          );
        })}
      </View>

      {!compact ? (
        <Text style={styles.fact} numberOfLines={2}>
          💡 {maskStats ? 'Erobere diese Stadt in der Kartenschlacht, um sie freizuschalten.' : city.fact}
        </Text>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, padding: 14, overflow: 'hidden', borderColor: C.border, borderWidth: 2 },
  shade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,8,30,0.45)' },
  fullBack: { height: 340 },
  compactBack: { height: 220 },
  backCenter: { alignItems: 'center', justifyContent: 'center', borderColor: '#7C5CFF' },
  backPattern: { alignItems: 'center', gap: 6 },
  backTitle: { color: '#fff', fontWeight: '900', letterSpacing: 4, fontSize: 18 },
  backLabel: { color: C.sub, fontWeight: '700', marginTop: 4 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rarity: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  rarityText: { color: '#111', fontWeight: '900', fontSize: 11 },
  ownerLabel: { color: '#fff', fontWeight: '800', fontSize: 12, opacity: 0.85, marginLeft: 'auto' },
  bonus: { color: C.gold, fontWeight: '900', fontSize: 14, marginLeft: 'auto' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  flag: { fontSize: 40 },
  name: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 0.3 },
  meta: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  statRowCompact: { paddingVertical: 5 },
  statPickable: { borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.1)' },
  statEmoji: { fontSize: 18, width: 24, textAlign: 'center' },
  statLabel: { color: '#fff', fontWeight: '700', fontSize: 14, width: 112 },
  statBarWrap: { flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  statBar: { height: 8, borderRadius: 4 },
  statValue: { color: '#fff', fontWeight: '900', fontSize: 19, width: 38, textAlign: 'right' },
  fact: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 10, fontStyle: 'italic' },
});

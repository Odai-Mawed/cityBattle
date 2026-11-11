import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CityCard } from '../components/CityCard';
import { RadarChart } from '../components/RadarChart';
import { Chip, GameButton, Header, Screen } from '../components/ui';
import { CITIES, CITY_MAP, RARITY_INFO, STATS, StatKey, cityRarity, cityTotal } from '../data/cities';
import { useProgress } from '../state/progress';
import { C } from '../theme';
import type { Nav } from '../navigation';

type Sort = 'total' | StatKey;

export function CollectionScreen({ nav }: { nav: Nav }) {
  const { progress } = useProgress();
  const [sort, setSort] = useState<Sort>('total');

  const data = useMemo(() => {
    const val = (id: string) => (sort === 'total' ? cityTotal(CITY_MAP[id]) : CITY_MAP[id].stats[sort]);
    const unlocked = CITIES.filter((c) => progress.unlocked.includes(c.id)).sort((a, b) => val(b.id) - val(a.id));
    const locked = CITIES.filter((c) => !progress.unlocked.includes(c.id));
    return [...unlocked, ...locked];
  }, [progress.unlocked, sort]);

  return (
    <Screen>
      <Header title={`Sammlung ${progress.unlocked.length}/${CITIES.length}`} onBack={() => nav({ name: 'home' })} />
      <View style={styles.sortRow}>
        <Chip label="Σ Gesamt" active={sort === 'total'} onPress={() => setSort('total')} />
        {STATS.map((s) => (
          <Chip
            key={s.key}
            label={`${s.emoji} ${s.short}`}
            active={sort === s.key}
            color={s.color}
            onPress={() => setSort(s.key)}
          />
        ))}
      </View>
      <FlatList
        data={data}
        keyExtractor={(c) => c.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        renderItem={({ item, index }) => {
          const locked = !progress.unlocked.includes(item.id);
          const rarity = RARITY_INFO[cityRarity(item)];
          const v = sort === 'total' ? cityTotal(item) : item.stats[sort];
          return (
            <Pressable style={{ flex: 1 }} onPress={() => nav({ name: 'city', id: item.id })}>
              <LinearGradient
                colors={locked ? ['#1F2937', '#111827'] : item.colors}
                style={[styles.tile, { borderColor: locked ? '#374151' : rarity.color }]}
              >
                <View style={styles.shade} />
                {!locked ? <Text style={styles.rank}>#{index + 1}</Text> : null}
                <Text style={{ fontSize: 34, opacity: locked ? 0.4 : 1 }}>{locked ? '🔒' : item.flag}</Text>
                <Text style={styles.tileName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.tileRarity, { color: rarity.color }]}>{'★'.repeat(rarity.stars)}</Text>
                <Text style={styles.tileVal}>{locked ? '???' : v}</Text>
              </LinearGradient>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <Text style={styles.hint}>
            🔒 Gesperrte Städte eroberst du, indem du in der Kartenschlacht die Karte des Gegners gewinnst.
          </Text>
        }
      />
    </Screen>
  );
}

export function CityDetailScreen({ nav, id }: { nav: Nav; id: string }) {
  const { progress } = useProgress();
  const city = CITY_MAP[id];
  const locked = !progress.unlocked.includes(id);
  const rank = [...CITIES].sort((a, b) => cityTotal(b) - cityTotal(a)).findIndex((c) => c.id === id) + 1;

  return (
    <Screen>
      <Header title={city.name} onBack={() => nav({ name: 'collection' })} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
        <View style={{ gap: 14 }}>
          <CityCard city={city} maskStats={locked} />
          {!locked ? (
            <>
              <RadarChart cities={[{ city, color: city.colors[1] }]} size={240} />
              <Text style={styles.rankText}>
                🌍 Weltrang #{rank} von {CITIES.length} · Gesamt {cityTotal(city)} Punkte
              </Text>
              {STATS.map((s) => (
                <Text key={s.key} style={styles.desc}>
                  {s.emoji} <Text style={{ fontWeight: '800', color: C.text }}>{s.label}:</Text> {s.desc}
                </Text>
              ))}
            </>
          ) : (
            <Text style={styles.desc}>Diese Stadt ist noch gesperrt. Gewinne sie in einer Kartenschlacht!</Text>
          )}
          <GameButton
            icon="🔍"
            label="Mit anderer Stadt vergleichen"
            colors={['#0891B2', '#10B981']}
            onPress={() => nav({ name: 'compare', a: id })}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  tile: { borderRadius: 18, padding: 12, alignItems: 'center', borderWidth: 2, overflow: 'hidden', minHeight: 150 },
  shade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  rank: { position: 'absolute', top: 8, left: 10, color: '#fff', fontWeight: '900', fontSize: 12, opacity: 0.8 },
  tileName: { color: '#fff', fontWeight: '900', fontSize: 16, marginTop: 4 },
  tileRarity: { fontSize: 12, fontWeight: '900' },
  tileVal: { color: '#fff', fontWeight: '900', fontSize: 24, marginTop: 4 },
  hint: { color: C.dim, fontSize: 12, textAlign: 'center', marginTop: 10 },
  rankText: { color: C.gold, fontWeight: '900', fontSize: 15, textAlign: 'center' },
  desc: { color: C.sub, fontSize: 14, lineHeight: 20 },
});

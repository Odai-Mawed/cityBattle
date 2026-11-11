import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CityCard } from '../components/CityCard';
import { GameButton, Header, Pulse, Screen } from '../components/ui';
import { CITY_MAP, STAT_MAP } from '../data/cities';
import {
  BattleState,
  Difficulty,
  HAND_SIZE,
  MAX_ROUNDS,
  OPPONENTS,
  TURBO_BONUS,
  battleReducer,
  battleWinner,
  createBattle,
  finalXp,
  sideBonus,
} from '../game/battle';
import { pick } from '../game/random';
import { haptic } from '../haptics';
import { useProgress } from '../state/progress';
import { C } from '../theme';
import type { Nav } from '../navigation';

export function BattleScreen({ nav, difficulty }: { nav: Nav; difficulty: Difficulty }) {
  const { progress, update, notify } = useProgress();
  const [state, dispatch] = useReducer(battleReducer, undefined, () => createBattle(progress.unlocked, difficulty));
  const opp = OPPONENTS[difficulty];
  const [taunt, setTaunt] = useState<string | null>(null);
  const recorded = useRef(false);

  const playerCity = CITY_MAP[state.player[0]];
  const cpuCity = CITY_MAP[state.cpu[0]];
  const r = state.result;

  // Ergebnis-Popup-Animation
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state.phase !== 'reveal' || !r) return;
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, bounciness: 14, speed: 10 }).start();
    if (r.winner === 'player') {
      haptic.win();
      setTaunt(pick(opp.loseLines));
    } else if (r.winner === 'cpu') {
      haptic.lose();
      setTaunt(pick(opp.winLines));
    } else {
      haptic.bump();
      setTaunt('Unentschieden! Die Karten wandern in den Pott. 🍯');
    }
  }, [state.phase, r, pop, opp]);

  // Neu eroberte Städte direkt freischalten
  const handleNext = () => {
    if (r?.winner === 'player') {
      const gained = [r.cpuCity, ...state.pot].filter((id) => !progress.unlocked.includes(id));
      if (gained.length) {
        update((p) => ({ ...p, unlocked: Array.from(new Set([...p.unlocked, ...gained])) }));
        gained.forEach((id) =>
          notify({
            emoji: '🏴',
            title: `Neue Stadt erobert: ${CITY_MAP[id].name}!`,
            subtitle: 'Sie ist jetzt Teil deiner Sammlung.',
          }),
        );
      }
    }
    setTaunt(null);
    dispatch({ type: 'next' });
  };

  // Spielende verbuchen
  useEffect(() => {
    if (state.phase !== 'over' || recorded.current) return;
    recorded.current = true;
    const w = battleWinner(state);
    const xp = finalXp(state);
    update((p) => ({
      ...p,
      xp: p.xp + xp,
      battles: p.battles + 1,
      wins: p.wins + (w === 'player' ? 1 : 0),
      losses: p.losses + (w === 'cpu' ? 1 : 0),
      hardWins: p.hardWins + (w === 'player' && difficulty === 'hard' ? 1 : 0),
      flawlessWins: p.flawlessWins + (w === 'player' && state.roundsLost === 0 ? 1 : 0),
      roundsWon: p.roundsWon + state.roundsWon,
      greenWins: p.greenWins + state.greenWins,
    }));
    if (w === 'player') haptic.win();
    else haptic.lose();
  }, [state, update, difficulty]);

  const restart = () => {
    recorded.current = false;
    setTaunt(null);
    dispatch({ type: 'reset', state: createBattle(progress.unlocked, difficulty) });
  };

  if (state.phase === 'over') {
    return <BattleOver state={state} nav={nav} onRestart={restart} />;
  }

  const total = state.player.length + state.cpu.length + state.pot.length;
  const share = state.player.length / Math.max(1, state.player.length + state.cpu.length);
  const cpuHidden = !(state.phase === 'reveal' || state.spyActive);
  const outcomeFor = (side: 'player' | 'cpu') =>
    state.phase !== 'reveal' || !r ? null : r.winner === 'tie' ? 'tie' : r.winner === side ? 'win' : 'lose';

  return (
    <Screen>
      <Header
        title={`Runde ${Math.min(state.round, MAX_ROUNDS)}/${MAX_ROUNDS}`}
        onBack={() => nav({ name: 'home' })}
        right={<Text style={styles.potText}>{state.pot.length ? `🍯 ${state.pot.length}` : ''}</Text>}
      />

      {/* Tauziehen-Anzeige */}
      <View style={styles.tug}>
        <Text style={styles.tugLabel}>🧑 Du {state.player.length}</Text>
        <View style={styles.tugBar}>
          <View style={[styles.tugFill, { flex: share }]} />
          <View style={[styles.tugFillCpu, { flex: 1 - share }]} />
        </View>
        <Text style={styles.tugLabel}>
          {state.cpu.length} {opp.emoji}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {state.event ? (
          <View style={styles.event}>
            <Text style={{ fontSize: 26 }}>{state.event.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventTitle}>EVENT: {state.event.title}</Text>
              <Text style={styles.eventDesc}>{state.event.desc}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.oppRow}>
          <Text style={styles.oppName}>
            {opp.emoji} {opp.name}
          </Text>
          {taunt ? <Text style={styles.taunt}>„{taunt}“</Text> : null}
        </View>

        <CityCard
          city={cpuCity}
          hidden={cpuHidden}
          compact
          label={state.spyActive && state.phase !== 'reveal' ? '🔭 Spioniert' : opp.name}
          highlight={state.phase === 'reveal' || state.phase === 'cpuChose' ? state.chosen : null}
          bonus={state.phase === 'reveal' ? sideBonus(state, 'cpu') : 0}
          outcome={outcomeFor('cpu')}
        />

        <View style={styles.vsRow}>
          {state.phase === 'reveal' && r ? (
            <Animated.View style={[styles.resultBubble, { transform: [{ scale: pop }] }, resultColor(r.winner)]}>
              <Text style={styles.resultText}>
                {r.winner === 'player' ? '🎉 GEWONNEN!' : r.winner === 'cpu' ? '💥 VERLOREN' : '🤝 PATT'}
              </Text>
              <Text style={styles.resultSub}>
                {STAT_MAP[r.stat].emoji} {r.pv} : {r.cv}
                {state.event?.id === 'reverse' ? '  (niedriger gewinnt)' : ''}
                {r.xp ? `  · +${r.xp} XP` : ''}
              </Text>
            </Animated.View>
          ) : state.phase === 'cpuChose' && state.chosen ? (
            <View style={[styles.resultBubble, { backgroundColor: '#3B2A80' }]}>
              <Text style={styles.resultText}>
                {opp.emoji} wählt {STAT_MAP[state.chosen].emoji} {STAT_MAP[state.chosen].label}!
              </Text>
              <Text style={styles.resultSub}>Nutze ein Power-Up oder decke auf.</Text>
            </View>
          ) : (
            <Text style={styles.vs}>⚔️ Du bist dran – wähle eine Kategorie!</Text>
          )}
        </View>

        <CityCard
          city={playerCity}
          label="Deine Karte"
          onPickStat={state.phase === 'choose' ? (stat) => dispatch({ type: 'pick', stat }) : undefined}
          highlight={state.phase === 'choose' ? null : state.chosen}
          blocked={state.event?.blocked ?? null}
          bonus={sideBonus(state, 'player')}
          outcome={outcomeFor('player')}
        />

        {state.phase !== 'reveal' ? (
          <View style={styles.powerRow}>
            <PowerUp
              icon="🔭"
              label="Spion"
              hint="Gegnerkarte sehen"
              available={state.powerUps.spy && state.phase === 'choose'}
              used={!state.powerUps.spy}
              onPress={() => dispatch({ type: 'spy' })}
            />
            <PowerUp
              icon="⚡"
              label="Turbo"
              hint={`+${TURBO_BONUS} auf alles`}
              available={state.powerUps.turbo}
              used={!state.powerUps.turbo}
              onPress={() => dispatch({ type: 'turbo' })}
            />
            <PowerUp
              icon="🔄"
              label="Umzug"
              hint="Karte tauschen"
              available={state.powerUps.swap && state.player.length > 1}
              used={!state.powerUps.swap}
              onPress={() => dispatch({ type: 'swap' })}
            />
          </View>
        ) : null}

        {state.phase === 'cpuChose' ? (
          <Pulse>
            <GameButton
              icon="🃏"
              label="Aufdecken!"
              colors={['#FF3D77', '#FF9A3D']}
              onPress={() => dispatch({ type: 'reveal' })}
            />
          </Pulse>
        ) : null}
        {state.phase === 'reveal' ? (
          <Pulse>
            <GameButton icon="➡️" label="Nächste Runde" onPress={handleNext} />
          </Pulse>
        ) : null}

        <Text style={styles.footer}>{total} Karten im Spiel · Jede Power-Up einmal pro Schlacht</Text>
      </ScrollView>
    </Screen>
  );
}

function resultColor(w: string) {
  return { backgroundColor: w === 'player' ? '#15803D' : w === 'cpu' ? '#B91C1C' : '#A16207' };
}

function PowerUp({
  icon,
  label,
  hint,
  available,
  used,
  onPress,
}: {
  icon: string;
  label: string;
  hint: string;
  available: boolean;
  used: boolean;
  onPress: () => void;
}) {
  return (
    <GameButton
      style={{ flex: 1 }}
      small
      icon={used ? '✔️' : icon}
      label={label}
      subtitle={used ? 'benutzt' : hint}
      disabled={!available}
      colors={used ? ['#374151', '#1F2937'] : ['#4338CA', '#7C3AED']}
      onPress={onPress}
    />
  );
}

function BattleOver({ state, nav, onRestart }: { state: BattleState; nav: Nav; onRestart: () => void }) {
  const w = battleWinner(state);
  const xp = finalXp(state);
  const opp = OPPONENTS[state.difficulty];
  const conquered = useMemo(() => state.conquered.map((id) => CITY_MAP[id]).filter(Boolean), [state.conquered]);
  const line = useMemo(() => pick(w === 'player' ? opp.loseLines : opp.winLines), [w, opp]);
  const scale = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 16 }).start();
  }, [scale]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: 40 }]}>
        <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
          <Text style={{ fontSize: 90 }}>{w === 'player' ? '🏆' : w === 'cpu' ? '🏚️' : '🤝'}</Text>
          <Text style={[styles.overTitle, { color: w === 'player' ? C.win : w === 'cpu' ? C.lose : C.tie }]}>
            {w === 'player' ? 'SIEG!' : w === 'cpu' ? 'NIEDERLAGE' : 'UNENTSCHIEDEN'}
          </Text>
          <Text style={styles.overSub}>
            {w === 'player'
              ? `${opp.emoji} ${opp.name}: „${line}“`
              : w === 'cpu'
                ? `${opp.emoji} ${opp.name}: „${line}“`
                : 'Beide Städte bleiben stolz stehen.'}
          </Text>
        </Animated.View>

        <View style={styles.overStats}>
          <Stat label="Karten" value={`${state.player.length} : ${state.cpu.length}`} />
          <Stat label="Runden gewonnen" value={`${state.roundsWon}`} />
          <Stat label="Runden verloren" value={`${state.roundsLost}`} />
          <Stat label="XP verdient" value={`+${xp}`} highlight />
        </View>

        {conquered.length ? (
          <View style={styles.conquered}>
            <Text style={styles.conqTitle}>🏴 Eroberte Karten</Text>
            <Text style={styles.conqList}>{conquered.map((c) => `${c.flag} ${c.name}`).join('   ')}</Text>
          </View>
        ) : null}

        <GameButton icon="🔁" label="Revanche" colors={['#FF3D77', '#FF9A3D']} onPress={onRestart} />
        <GameButton icon="🏠" label="Zum Menü" colors={['#334155', '#475569']} onPress={() => nav({ name: 'home' })} />
        <Text style={styles.footer}>Du startest jede Schlacht mit {HAND_SIZE} zufälligen Karten aus deiner Sammlung.</Text>
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, highlight && { color: C.gold }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  potText: { color: C.gold, fontWeight: '900', fontSize: 16 },
  tug: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  tugLabel: { color: C.text, fontWeight: '900', fontSize: 14, minWidth: 54 },
  tugBar: { flex: 1, height: 12, borderRadius: 6, overflow: 'hidden', flexDirection: 'row', backgroundColor: '#333' },
  tugFill: { backgroundColor: C.accent2 },
  tugFillCpu: { backgroundColor: '#FF3D77' },
  event: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(251,191,36,0.15)',
    borderWidth: 1.5,
    borderColor: C.gold,
  },
  eventTitle: { color: C.gold, fontWeight: '900', fontSize: 14 },
  eventDesc: { color: C.text, fontSize: 13 },
  oppRow: { gap: 2 },
  oppName: { color: C.sub, fontWeight: '800', fontSize: 14 },
  taunt: { color: C.text, fontStyle: 'italic', fontSize: 13 },
  vsRow: { alignItems: 'center', minHeight: 56, justifyContent: 'center' },
  vs: { color: C.accent2, fontWeight: '900', fontSize: 16, textAlign: 'center' },
  resultBubble: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 18, alignItems: 'center' },
  resultText: { color: '#fff', fontWeight: '900', fontSize: 20, textAlign: 'center' },
  resultSub: { color: '#fff', fontWeight: '700', fontSize: 14, marginTop: 2 },
  powerRow: { flexDirection: 'row', gap: 8 },
  footer: { color: C.dim, fontSize: 12, textAlign: 'center' },
  overTitle: { fontSize: 44, fontWeight: '900', letterSpacing: 2 },
  overSub: { color: C.sub, fontSize: 15, textAlign: 'center', marginTop: 6, fontStyle: 'italic' },
  overStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  statBox: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  statValue: { color: C.text, fontSize: 26, fontWeight: '900' },
  statLabel: { color: C.sub, fontSize: 12, fontWeight: '700' },
  conquered: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: C.win },
  conqTitle: { color: C.win, fontWeight: '900', fontSize: 15, marginBottom: 6 },
  conqList: { color: C.text, fontSize: 15, lineHeight: 24 },
});

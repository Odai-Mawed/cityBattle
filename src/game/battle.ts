import { CITIES, CITY_MAP, STATS, StatKey, cityTotal } from '../data/cities';
import { pick, shuffle } from './random';

export type Difficulty = 'easy' | 'normal' | 'hard';
export type Side = 'player' | 'cpu';
export type Outcome = Side | 'tie';

export const MAX_ROUNDS = 20;
export const HAND_SIZE = 7;
export const TURBO_BONUS = 15;
export const UNDERDOG_BONUS = 10;

export interface Opponent {
  name: string;
  emoji: string;
  winLines: string[];
  loseLines: string[];
}

export const OPPONENTS: Record<Difficulty, Opponent> = {
  easy: {
    name: 'Dorf-Dieter',
    emoji: '🐄',
    winLines: ['Muuuh! Glück gehabt.', 'Bei uns im Dorf ist das normal.', 'Ha! Sogar der Traktor ist schneller.'],
    loseLines: ['Oh nein, mein Kuhstall!', 'In der Stadt ist alles so groß…', 'Das sag ich dem Bürgermeister!'],
  },
  normal: {
    name: 'Pendler-Paula',
    emoji: '🚲',
    winLines: ['Pünktlich wie die S-Bahn. Also… manchmal.', 'Ich kenne jede Abkürzung!', 'Zack, eingeparkt.'],
    loseLines: ['Mist, Schienenersatzverkehr.', 'Das war ein Platten!', 'Nächstes Mal nehme ich den Express.'],
  },
  hard: {
    name: 'Mega-Mogul Max',
    emoji: '🏙️',
    winLines: ['Ich kaufe deine Stadt einfach auf.', 'Skyline schlägt Kleinstadt.', 'Berechnet. Optimiert. Gewonnen.'],
    loseLines: ['Unmöglich! Mein Analyst ist gefeuert.', 'Das war nur ein Testlauf…', 'Ich verklage diese Statistik!'],
  },
};

export type EventId = 'reverse' | 'blocked' | 'doubleXp' | 'underdog';

export interface BattleEvent {
  id: EventId;
  emoji: string;
  title: string;
  desc: string;
  blocked?: StatKey;
}

function rollEvent(): BattleEvent | null {
  if (Math.random() > 0.28) return null;
  const id = pick<EventId>(['reverse', 'blocked', 'doubleXp', 'underdog']);
  switch (id) {
    case 'reverse':
      return { id, emoji: '🙃', title: 'Verkehrte Welt', desc: 'Diese Runde gewinnt der NIEDRIGERE Wert!' };
    case 'blocked': {
      const s = pick(STATS);
      const why: Record<StatKey, string> = {
        reach: 'Bahnstreik!',
        green: 'Parks wegen Unwetter gesperrt!',
        infra: 'Stromausfall!',
        life: 'Dauerregen über allen Städten!',
      };
      return { id, emoji: '🚧', title: why[s.key], desc: `${s.emoji} ${s.label} kann nicht gewählt werden.`, blocked: s.key };
    }
    case 'doubleXp':
      return { id, emoji: '🎉', title: 'Stadtfest', desc: 'Doppelte XP für den Rundensieg!' };
    case 'underdog':
      return { id, emoji: '🐭', title: 'Underdog-Bonus', desc: `Die kleinere Stadt bekommt +${UNDERDOG_BONUS} auf alle Werte.` };
  }
}

export interface RoundResult {
  stat: StatKey;
  pv: number;
  cv: number;
  winner: Outcome;
  playerCity: string;
  cpuCity: string;
  xp: number;
}

export interface BattleState {
  difficulty: Difficulty;
  player: string[];
  cpu: string[];
  pot: string[];
  round: number;
  turn: Side;
  phase: 'choose' | 'cpuChose' | 'reveal' | 'over';
  chosen: StatKey | null;
  event: BattleEvent | null;
  powerUps: { spy: boolean; turbo: boolean; swap: boolean };
  spyActive: boolean;
  turboActive: boolean;
  result: RoundResult | null;
  roundsWon: number;
  roundsLost: number;
  greenWins: number;
  xp: number;
  conquered: string[];
}

export function createBattle(unlocked: string[], difficulty: Difficulty): BattleState {
  const playerHand = shuffle(unlocked).slice(0, HAND_SIZE);
  let pool = CITIES.filter((c) => !playerHand.includes(c.id));
  if (difficulty === 'hard') {
    pool = [...pool].sort((a, b) => cityTotal(b) - cityTotal(a)).slice(0, Math.max(HAND_SIZE, Math.ceil(pool.length * 0.6)));
  } else if (difficulty === 'easy') {
    pool = [...pool].sort((a, b) => cityTotal(a) - cityTotal(b)).slice(0, Math.max(HAND_SIZE, Math.ceil(pool.length * 0.7)));
  }
  const cpuHand = shuffle(pool.map((c) => c.id)).slice(0, playerHand.length);
  return {
    difficulty,
    player: playerHand,
    cpu: cpuHand,
    pot: [],
    round: 1,
    turn: 'player',
    phase: 'choose',
    chosen: null,
    event: null,
    powerUps: { spy: true, turbo: true, swap: true },
    spyActive: false,
    turboActive: false,
    result: null,
    roundsWon: 0,
    roundsLost: 0,
    greenWins: 0,
    xp: 0,
    conquered: [],
  };
}

/** Bonus, der auf alle Werte einer Seite in dieser Runde addiert wird. */
export function sideBonus(state: BattleState, side: Side): number {
  const p = CITY_MAP[state.player[0]];
  const c = CITY_MAP[state.cpu[0]];
  if (!p || !c) return 0;
  let bonus = 0;
  if (state.event?.id === 'underdog') {
    const mine = side === 'player' ? p : c;
    const theirs = side === 'player' ? c : p;
    if (mine.population < theirs.population) bonus += UNDERDOG_BONUS;
  }
  if (side === 'player' && state.turboActive) bonus += TURBO_BONUS;
  return bonus;
}

export function value(state: BattleState, side: Side, stat: StatKey): number {
  const id = side === 'player' ? state.player[0] : state.cpu[0];
  return CITY_MAP[id].stats[stat] + sideBonus(state, side);
}

function cpuChoose(state: BattleState): StatKey {
  const city = CITY_MAP[state.cpu[0]];
  const options = STATS.map((s) => s.key).filter((k) => k !== state.event?.blocked);
  const reverse = state.event?.id === 'reverse';
  const sorted = [...options].sort((a, b) => (reverse ? city.stats[a] - city.stats[b] : city.stats[b] - city.stats[a]));
  const smart = state.difficulty === 'hard' ? 1 : state.difficulty === 'normal' ? 0.65 : 0.25;
  return Math.random() < smart ? sorted[0] : pick(options);
}

export function resolve(state: BattleState, stat: StatKey): RoundResult {
  const pv = value(state, 'player', stat);
  const cv = value(state, 'cpu', stat);
  const reverse = state.event?.id === 'reverse';
  let winner: Outcome = 'tie';
  if (pv !== cv) winner = (reverse ? pv < cv : pv > cv) ? 'player' : 'cpu';
  const xp = winner === 'player' ? (state.event?.id === 'doubleXp' ? 20 : 10) : 0;
  return { stat, pv, cv, winner, playerCity: state.player[0], cpuCity: state.cpu[0], xp };
}

function startRound(state: BattleState): BattleState {
  const next: BattleState = {
    ...state,
    chosen: null,
    result: null,
    spyActive: false,
    turboActive: false,
    event: state.round === 1 ? null : rollEvent(),
    phase: 'choose',
  };
  if (next.turn === 'cpu') {
    next.chosen = cpuChoose(next);
    next.phase = 'cpuChose';
  }
  return next;
}

export type BattleAction =
  | { type: 'pick'; stat: StatKey }
  | { type: 'reveal' }
  | { type: 'next' }
  | { type: 'spy' }
  | { type: 'turbo' }
  | { type: 'swap' }
  | { type: 'reset'; state: BattleState };

export function battleReducer(state: BattleState, action: BattleAction): BattleState {
  switch (action.type) {
    case 'reset':
      return action.state;
    case 'pick': {
      if (state.phase !== 'choose' || action.stat === state.event?.blocked) return state;
      return { ...state, chosen: action.stat, phase: 'reveal', result: resolve(state, action.stat) };
    }
    case 'reveal': {
      if (state.phase !== 'cpuChose' || !state.chosen) return state;
      return { ...state, phase: 'reveal', result: resolve(state, state.chosen) };
    }
    case 'spy':
      if (!state.powerUps.spy || state.phase !== 'choose') return state;
      return { ...state, spyActive: true, powerUps: { ...state.powerUps, spy: false } };
    case 'turbo':
      if (!state.powerUps.turbo || (state.phase !== 'choose' && state.phase !== 'cpuChose')) return state;
      return { ...state, turboActive: true, powerUps: { ...state.powerUps, turbo: false } };
    case 'swap': {
      if (!state.powerUps.swap || state.player.length < 2) return state;
      if (state.phase !== 'choose' && state.phase !== 'cpuChose') return state;
      const [top, ...rest] = state.player;
      return { ...state, player: [...rest, top], powerUps: { ...state.powerUps, swap: false } };
    }
    case 'next': {
      if (state.phase !== 'reveal' || !state.result) return state;
      const r = state.result;
      const player = state.player.slice(1);
      const cpu = state.cpu.slice(1);
      let pot = state.pot;
      const conquered = [...state.conquered];
      if (r.winner === 'player') {
        player.push(r.playerCity, r.cpuCity, ...pot);
        conquered.push(r.cpuCity, ...pot);
        pot = [];
      } else if (r.winner === 'cpu') {
        cpu.push(r.cpuCity, r.playerCity, ...pot);
        pot = [];
      } else {
        pot = [...pot, r.playerCity, r.cpuCity];
      }
      const next: BattleState = {
        ...state,
        player,
        cpu,
        pot,
        conquered: Array.from(new Set(conquered)),
        round: state.round + 1,
        turn: r.winner === 'tie' ? state.turn : r.winner,
        roundsWon: state.roundsWon + (r.winner === 'player' ? 1 : 0),
        roundsLost: state.roundsLost + (r.winner === 'cpu' ? 1 : 0),
        greenWins: state.greenWins + (r.winner === 'player' && r.stat === 'green' ? 1 : 0),
        xp: state.xp + r.xp,
      };
      if (player.length === 0 || cpu.length === 0 || next.round > MAX_ROUNDS) {
        return { ...next, phase: 'over', result: null, chosen: null, event: null };
      }
      return startRound(next);
    }
  }
}

export function battleWinner(state: BattleState): Outcome {
  if (state.player.length === state.cpu.length) return 'tie';
  return state.player.length > state.cpu.length ? 'player' : 'cpu';
}

export function finalXp(state: BattleState): number {
  const w = battleWinner(state);
  const bonus = { easy: 0, normal: 25, hard: 60 }[state.difficulty];
  if (w === 'player') return state.xp + 100 + bonus;
  if (w === 'tie') return state.xp + 50;
  return state.xp + 20;
}

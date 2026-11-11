import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CITIES, STARTER_CITY_IDS } from '../data/cities';

export interface Progress {
  xp: number;
  battles: number;
  wins: number;
  losses: number;
  hardWins: number;
  flawlessWins: number;
  roundsWon: number;
  greenWins: number;
  unlocked: string[];
  quizPlays: number;
  quizBest: number;
  quizBestStreak: number;
  compares: number;
  achievements: string[];
}

export const DEFAULT_PROGRESS: Progress = {
  xp: 0,
  battles: 0,
  wins: 0,
  losses: 0,
  hardWins: 0,
  flawlessWins: 0,
  roundsWon: 0,
  greenWins: 0,
  unlocked: STARTER_CITY_IDS,
  quizPlays: 0,
  quizBest: 0,
  quizBestStreak: 0,
  compares: 0,
  achievements: [],
};

// ---------- Level ----------

const TITLES = [
  'Dorfkind',
  'Kleinstädter',
  'Pendler',
  'Stadtentdecker',
  'Kiez-Kenner',
  'Stadtplaner',
  'Bürgermeister',
  'Metropolen-Mogul',
  'Weltstadt-Legende',
];

/** XP, die man insgesamt braucht, um `level` zu erreichen (Level 1 = 0 XP). */
export function xpForLevel(level: number): number {
  return 75 * (level - 1) * level;
}

export function levelInfo(xp: number) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return {
    level,
    title: TITLES[Math.min(level - 1, TITLES.length - 1)],
    current: xp - base,
    needed: next - base,
    ratio: (xp - base) / (next - base),
  };
}

// ---------- Erfolge ----------

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  check: (p: Progress) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_win', emoji: '🥇', title: 'Erster Sieg', desc: 'Gewinne deine erste Kartenschlacht.', check: (p) => p.wins >= 1 },
  { id: 'veteran', emoji: '🎖️', title: 'Veteran', desc: 'Spiele 10 Kartenschlachten.', check: (p) => p.battles >= 10 },
  {
    id: 'hard_win',
    emoji: '🏙️',
    title: 'Mogul-Bezwinger',
    desc: 'Besiege Mega-Mogul Max (Schwer).',
    check: (p) => p.hardWins >= 1,
  },
  {
    id: 'flawless',
    emoji: '💎',
    title: 'Makellos',
    desc: 'Gewinne eine Schlacht ohne eine einzige verlorene Runde.',
    check: (p) => p.flawlessWins >= 1,
  },
  {
    id: 'green_thumb',
    emoji: '🌳',
    title: 'Grüner Daumen',
    desc: 'Gewinne 10 Runden mit Grünflächen.',
    check: (p) => p.greenWins >= 10,
  },
  { id: 'conqueror', emoji: '🗺️', title: 'Eroberer', desc: 'Schalte 16 Städte frei.', check: (p) => p.unlocked.length >= 16 },
  {
    id: 'collector',
    emoji: '🌍',
    title: 'Weltenbummler',
    desc: 'Schalte alle Städte frei.',
    check: (p) => p.unlocked.length >= CITIES.length,
  },
  {
    id: 'streak10',
    emoji: '🔥',
    title: 'On Fire',
    desc: 'Schaffe eine 10er-Serie im Blitz-Duell.',
    check: (p) => p.quizBestStreak >= 10,
  },
  {
    id: 'quiz_pro',
    emoji: '⚡',
    title: 'Blitzmerker',
    desc: 'Erreiche 2.500 Punkte im Blitz-Duell.',
    check: (p) => p.quizBest >= 2500,
  },
  { id: 'analyst', emoji: '🔍', title: 'Stadtanalyst', desc: 'Vergleiche 10 Städte-Paare.', check: (p) => p.compares >= 10 },
  { id: 'level7', emoji: '👑', title: 'Bürgermeister', desc: 'Erreiche Level 7.', check: (p) => levelInfo(p.xp).level >= 7 },
];

// ---------- Context ----------

export interface Toast {
  id: number;
  emoji: string;
  title: string;
  subtitle?: string;
}

interface Ctx {
  progress: Progress;
  loaded: boolean;
  update: (fn: (p: Progress) => Progress) => void;
  notify: (t: Omit<Toast, 'id'>) => void;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  reset: () => void;
}

const ProgressContext = createContext<Ctx | null>(null);
const KEY = 'citybattle.progress.v1';

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS);
  const [loaded, setLoaded] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const ref = useRef(progress);
  const toastId = useRef(0);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) {
          const saved = { ...DEFAULT_PROGRESS, ...JSON.parse(raw) } as Progress;
          saved.unlocked = Array.from(new Set([...STARTER_CITY_IDS, ...saved.unlocked])).filter((id) =>
            CITIES.some((c) => c.id === id),
          );
          ref.current = saved;
          setProgress(saved);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const notify = useCallback((t: Omit<Toast, 'id'>) => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((ts) => [...ts, { ...t, id }]);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const commit = useCallback((next: Progress) => {
    ref.current = next;
    setProgress(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const update = useCallback(
    (fn: (p: Progress) => Progress) => {
      const prev = ref.current;
      const next = fn(prev);
      const before = levelInfo(prev.xp).level;
      const after = levelInfo(next.xp).level;
      const earned = ACHIEVEMENTS.filter((a) => !next.achievements.includes(a.id) && a.check(next));
      if (earned.length) next.achievements = [...next.achievements, ...earned.map((a) => a.id)];
      commit(next);
      if (after > before) {
        const info = levelInfo(next.xp);
        notify({ emoji: '⬆️', title: `Level ${after} erreicht!`, subtitle: `Neuer Titel: ${info.title}` });
      }
      earned.forEach((a) => notify({ emoji: a.emoji, title: `Erfolg: ${a.title}`, subtitle: a.desc }));
    },
    [commit, notify],
  );

  const reset = useCallback(() => commit(DEFAULT_PROGRESS), [commit]);

  return (
    <ProgressContext.Provider value={{ progress, loaded, update, notify, toasts, dismissToast, reset }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}

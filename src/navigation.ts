import type { Difficulty } from './game/battle';

export type Route =
  | { name: 'home' }
  | { name: 'battle'; difficulty: Difficulty }
  | { name: 'quiz' }
  | { name: 'compare'; a?: string; b?: string }
  | { name: 'collection' }
  | { name: 'city'; id: string }
  | { name: 'achievements' };

export type Nav = (route: Route) => void;

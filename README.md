# CityBattle 🌍⚔️

Vergleicht Städte anhand von **Erreichbarkeit 🚆**, **Grünflächen 🌳**, **Infrastruktur 🏗️** und **Lebensqualität ❤️** – als Spiel.

Gebaut mit **React Native + Expo** (iOS, Android und Web).

## Spielmodi

### ⚔️ Kartenschlacht
Ein Quartett-ähnliches Kartenduell gegen einen von drei Gegnern:

| Gegner | Schwierigkeit | Strategie |
| --- | --- | --- |
| 🐄 Dorf-Dieter | Leicht | wählt meist zufällig, schwächere Karten |
| 🚲 Pendler-Paula | Normal | wählt oft ihren besten Wert |
| 🏙️ Mega-Mogul Max | Schwer | wählt immer optimal, starke Karten |

- Wer dran ist, wählt eine Kategorie. Der höhere Wert gewinnt beide Karten.
- Bei Gleichstand wandern die Karten in den **Pott 🍯**, den der nächste Rundensieger mitnimmt.
- **Power-ups**, je eins pro Schlacht: 🔭 *Spion* (Gegnerkarte sehen), ⚡ *Turbo* (+15 auf alle Werte), 🔄 *Umzug* (Karte tauschen).
- **Zufalls-Events**: 🙃 Verkehrte Welt (niedriger gewinnt), 🚧 Bahnstreik/Stromausfall (Kategorie gesperrt), 🎉 Stadtfest (doppelte XP), 🐭 Underdog-Bonus (die kleinere Stadt bekommt +10).
- **Eroberung**: Gewinnst du eine Stadt, die noch nicht in deiner Sammlung ist, wird sie freigeschaltet. Du startest mit den 9 deutschen Städten, insgesamt gibt es 32.

### ⚡ Blitz-Duell
45 Sekunden: Welche von zwei Städten hat den höheren Wert? Richtige Antworten geben Zeit und Punkte, eine Serie erhöht den Multiplikator, falsche Antworten kosten 3 Sekunden.

### 🔍 Städte-Vergleich
Zwei beliebige Städte mit Radar-Diagramm, Balken pro Kategorie und einem Urteil, welche Stadt gewinnt.

### 🃏 Sammlung, 🏆 Erfolge und Level
Sortierbare Kartensammlung mit Seltenheitsstufen (Gewöhnlich bis Legendär), 11 Erfolge, XP und Level-Titel vom *Dorfkind* bis zur *Weltstadt-Legende*. Dazu jeden Tag eine **Stadt des Tages**. Der Fortschritt wird lokal gespeichert (AsyncStorage).

## Starten

```bash
npm install
npx expo start        # danach im Terminal: i (iOS), a (Android), w (Web) oder QR-Code mit Expo Go scannen
npm run typecheck
npm run build:web     # statischer Web-Build nach dist/ (Netlify: siehe netlify.toml)
```

## Projektstruktur

```
App.tsx                      Router (Screen-Zustand), Provider
src/data/cities.ts           32 Städte mit Werten, Fakten, Seltenheit
src/game/battle.ts           Spiel-Engine der Kartenschlacht (reiner Reducer)
src/state/progress.tsx       XP, Level, Erfolge, Freischaltungen, Toasts
src/components/              CityCard (mit Flip-Animation), RadarChart, UI-Bausteine
src/screens/                 Home, Battle, Quiz, Compare, Collection, Achievements
```

## Hinweis zu den Daten
Die Werte (0–100) sind **spielerische Schätzungen**, inspiriert von öffentlichen Städte-Rankings zu Lebensqualität, Mobilität und Grünflächen. Sie sind keine offiziellen Messwerte.

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { City, STATS } from '../data/cities';

interface Props {
  cities: { city: City; color: string }[];
  size?: number;
}

/** Radar-/Spinnennetz-Diagramm der vier Kategorien. Skala 40–100, damit Unterschiede sichtbar sind. */
export function RadarChart({ cities, size = 260 }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 36;
  const MIN = 40;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / STATS.length;
  const point = (i: number, v: number) => {
    const t = Math.max(0, (v - MIN) / (100 - MIN));
    return [cx + Math.cos(angle(i)) * r * t, cy + Math.sin(angle(i)) * r * t];
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <Polygon
            key={f}
            points={STATS.map((_, i) => `${cx + Math.cos(angle(i)) * r * f},${cy + Math.sin(angle(i)) * r * f}`).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.14)"
            strokeWidth={1}
          />
        ))}
        {STATS.map((s, i) => {
          const x = cx + Math.cos(angle(i)) * r;
          const y = cy + Math.sin(angle(i)) * r;
          const lx = cx + Math.cos(angle(i)) * (r + 20);
          const ly = cy + Math.sin(angle(i)) * (r + 20);
          return (
            <G key={s.key}>
              <Line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.14)" strokeWidth={1} />
              <SvgText x={lx} y={ly + 6} fontSize={18} textAnchor="middle">
                {s.emoji}
              </SvgText>
            </G>
          );
        })}
        {cities.map(({ city, color }) => {
          const pts = STATS.map((s, i) => point(i, city.stats[s.key]));
          return (
            <G key={city.id}>
              <Polygon
                points={pts.map((p) => p.join(',')).join(' ')}
                fill={color}
                fillOpacity={0.28}
                stroke={color}
                strokeWidth={2.5}
              />
              {pts.map(([x, y], i) => (
                <Circle key={i} cx={x} cy={y} r={4} fill={color} />
              ))}
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

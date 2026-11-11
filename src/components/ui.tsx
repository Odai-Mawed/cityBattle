import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { haptic } from '../haptics';
import { BG_GRADIENT, C } from '../theme';

export function Screen({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill}>
      <SafeAreaView style={[{ flex: 1 }, style]} edges={['top', 'bottom', 'left', 'right']}>
        <View style={{ flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' }}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}

export function Header({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => {
          haptic.tap();
          onBack();
        }}
        style={styles.back}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Zurück"
      >
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={{ minWidth: 40, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

interface BtnProps {
  label: string;
  onPress: () => void;
  colors?: [string, string];
  icon?: string;
  subtitle?: string;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GameButton({
  label,
  onPress,
  colors = ['#7C5CFF', '#00C2FF'],
  icon,
  subtitle,
  disabled,
  small,
  style,
}: BtnProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 8 }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }], opacity: disabled ? 0.4 : 1 }, style]}>
      <Pressable
        disabled={disabled}
        onPressIn={() => to(0.95)}
        onPressOut={() => to(1)}
        onPress={() => {
          haptic.tap();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.btn, small && styles.btnSmall]}
        >
          {icon ? <Text style={[styles.btnIcon, small && { fontSize: 18 }]}>{icon}</Text> : null}
          <View style={{ flexShrink: 1 }}>
            <Text style={[styles.btnLabel, small && { fontSize: 15 }]}>{label}</Text>
            {subtitle ? <Text style={styles.btnSub}>{subtitle}</Text> : null}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  color = C.accent,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      style={[styles.chip, active && { backgroundColor: color, borderColor: color }]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
    >
      <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ ratio, color = C.accent2, height = 8 }: { ratio: number; color?: string; height?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: Math.max(0, Math.min(1, ratio)), duration: 600, useNativeDriver: false }).start();
  }, [ratio, anim]);
  return (
    <View style={{ height, borderRadius: height, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
      <Animated.View
        style={{
          height,
          borderRadius: height,
          backgroundColor: color,
          width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        }}
      />
    </View>
  );
}

/** Pulsiert sanft – für Call-to-Action-Elemente */
export function Pulse({ children, active = true }: { children: React.ReactNode; active?: boolean }) {
  const v = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!active) {
      v.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1.04, duration: 700, useNativeDriver: true }),
        Animated.timing(v, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, v]);
  return <Animated.View style={{ transform: [{ scale: v }] }}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: C.text, fontSize: 30, lineHeight: 32, marginTop: -3, fontWeight: '600' },
  headerTitle: { flex: 1, textAlign: 'center', color: C.text, fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
  btn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 18, gap: 14 },
  btnSmall: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, gap: 8, justifyContent: 'center' },
  btnIcon: { fontSize: 28 },
  btnLabel: { color: '#fff', fontSize: 19, fontWeight: '900', letterSpacing: 0.3 },
  btnSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2, fontWeight: '600' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  chipText: { color: C.sub, fontWeight: '700', fontSize: 14 },
});

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '../haptics';
import { Toast, useProgress } from '../state/progress';
import { C } from '../theme';

export function Toasts() {
  const { toasts, dismissToast } = useProgress();
  const insets = useSafeAreaInsets();
  const current = toasts[0];
  if (!current) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + 8 }]}>
      <ToastItem key={current.id} toast={current} onDone={() => dismissToast(current.id)} />
    </View>
  );
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const y = useRef(new Animated.Value(-120)).current;
  useEffect(() => {
    haptic.win();
    Animated.sequence([
      Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 12 }),
      Animated.delay(2200),
      Animated.timing(y, { toValue: -140, duration: 250, useNativeDriver: true }),
    ]).start(() => onDone());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Animated.View style={[styles.toast, { transform: [{ translateY: y }] }]}>
      <Text style={{ fontSize: 30 }}>{toast.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{toast.title}</Text>
        {toast.subtitle ? <Text style={styles.sub}>{toast.subtitle}</Text> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, alignItems: 'center', zIndex: 100 },
  toast: {
    width: '100%',
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#22195E',
    borderWidth: 2,
    borderColor: C.gold,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  title: { color: C.gold, fontWeight: '900', fontSize: 16 },
  sub: { color: C.text, fontSize: 13, marginTop: 2 },
});

import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, font, radius, space, touchMin } from '@/theme';

/** 画面の外枠：クリーム背景・中央寄せ（PCでも読みやすい最大幅） */
export function Screen({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) {
  const body = <View style={styles.inner}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.h1} accessibilityRole="header">
      {children}
    </Text>
  );
}
export function H2({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.h2} accessibilityRole="header">
      {children}
    </Text>
  );
}
export function P({ children, sub }: { children: ReactNode; sub?: boolean }) {
  return <Text style={[styles.p, sub && { color: colors.textSub }]}>{children}</Text>;
}

type ButtonVariant = 'primary' | 'accent' | 'outline' | 'danger';
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  icon,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  icon?: string;
}) {
  const v = buttonVariants[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border },
        pressed && !disabled && { opacity: 0.8 },
        disabled && { opacity: 0.45 },
      ]}
    >
      <Text style={[styles.buttonText, { color: v.fg }]}>
        {icon ? `${icon}  ` : ''}
        {label}
      </Text>
    </Pressable>
  );
}
const buttonVariants: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, fg: '#fff', border: colors.primary },
  accent: { bg: colors.accent, fg: '#fff', border: colors.accent },
  outline: { bg: colors.surface, fg: colors.primary, border: colors.primary },
  danger: { bg: colors.surface, fg: colors.danger, border: colors.danger },
};

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ label, tone = 'green' }: { label: string; tone?: 'green' | 'orange' | 'gray' | 'red' }) {
  const t = {
    green: [colors.primarySoft, colors.primaryDark],
    orange: [colors.accentSoft, '#A34D12'],
    gray: ['#EEEBE4', colors.textSub],
    red: [colors.dangerSoft, colors.danger],
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t[0] }]}>
      <Text style={[styles.badgeText, { color: t[1] }]}>{label}</Text>
    </View>
  );
}

/** 選択式のチップ（カテゴリ・地域の絞り込みなど） */
export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={[styles.chipText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  required,
  error,
  hint,
  ...input
}: TextInputProps & { label: string; required?: boolean; error?: string; hint?: string }) {
  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={{ color: colors.danger }}> （必須）</Text>}
      </Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#9AA39E"
        style={[styles.input, input.multiline && { minHeight: 110, textAlignVertical: 'top' }, error && { borderColor: colors.danger }]}
        {...input}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

/** 注意・お知らせ枠。未実装の機能は必ずこれで明示する */
export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'danger' }) {
  const t = {
    info: [colors.infoSoft, colors.info],
    warn: [colors.accentSoft, '#A34D12'],
    danger: [colors.dangerSoft, colors.danger],
  }[tone];
  return (
    <View style={[styles.notice, { backgroundColor: t[0], borderLeftColor: t[1] }]}>
      <Text style={[styles.noticeText, { color: colors.text }]}>{children}</Text>
    </View>
  );
}

export function Row({ children, gap = space.sm, wrap }: { children: ReactNode; gap?: number; wrap?: boolean }) {
  return <View style={{ flexDirection: 'row', gap, flexWrap: wrap ? 'wrap' : 'nowrap', alignItems: 'center' }}>{children}</View>;
}

export function Spacer({ h = space.md }: { h?: number }) {
  return <View style={{ height: h }} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  inner: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: space.md, paddingBottom: space.xl },
  h1: { fontSize: font.xxl, fontWeight: '800', color: colors.text, marginBottom: space.sm, lineHeight: font.xxl * 1.3 },
  h2: { fontSize: font.lg, fontWeight: '700', color: colors.text, marginTop: space.md, marginBottom: space.sm },
  p: { fontSize: font.md, color: colors.text, lineHeight: font.md * 1.7 },
  button: {
    minHeight: touchMin,
    borderRadius: radius.md,
    borderWidth: 2,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: space.xs,
  },
  buttonText: { fontSize: font.md, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    marginBottom: space.md,
  },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: font.xs, fontWeight: '700' },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipText: { fontSize: font.sm, color: colors.text, fontWeight: '600' },
  label: { fontSize: font.md, fontWeight: '700', color: colors.text, marginBottom: 6 },
  hint: { fontSize: font.sm, color: colors.textSub, marginBottom: 6 },
  input: {
    minHeight: touchMin,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: font.md,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: font.sm, marginTop: 4, fontWeight: '600' },
  notice: { borderLeftWidth: 5, borderRadius: radius.sm, padding: space.md, marginBottom: space.md },
  noticeText: { fontSize: font.sm, lineHeight: font.sm * 1.7 },
});

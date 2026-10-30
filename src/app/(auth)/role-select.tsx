import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NotYetConnected } from '@/components/StatusNotices';
import { Button, H1, P, Screen } from '@/components/ui';
import { colors, font, radius, space } from '@/theme';

const OPTIONS = [
  { key: 'kodomo_shokudo', icon: '🏠', title: '子ども食堂', desc: '支援を募集する団体の方。団体審査が必要です。' },
  { key: 'company', icon: '🏢', title: '企業', desc: '食品・物資・資金・社員ボランティアで支援。企業審査が必要です。' },
  { key: 'resident', icon: '🙋', title: '地域住民', desc: '個人として食材提供やボランティアで参加。本人確認が必要です。' },
] as const;

export default function RoleSelect() {
  const [role, setRole] = useState<string | null>(null);
  return (
    <Screen>
      <H1>どの立場で使いますか？</H1>
      <P sub>あとから変更するには、運営者への申請が必要です。</P>
      <NotYetConnected step="STEP 5" what="区分の保存" />
      {OPTIONS.map((o) => {
        const selected = role === o.key;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => setRole(o.key)}
            style={{
              flexDirection: 'row',
              gap: space.md,
              alignItems: 'center',
              padding: space.md,
              marginBottom: space.md,
              borderRadius: radius.lg,
              borderWidth: 2.5,
              borderColor: selected ? colors.primary : colors.border,
              backgroundColor: selected ? colors.primarySoft : colors.surface,
            }}
          >
            <Text style={{ fontSize: 40 }}>{o.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: font.lg, fontWeight: '800', color: colors.text }}>{o.title}</Text>
              <Text style={{ fontSize: font.sm, color: colors.textSub, marginTop: 4 }}>{o.desc}</Text>
            </View>
          </Pressable>
        );
      })}
      <Button label="この区分で進む" variant="accent" disabled={!role} onPress={() => router.push('/verification')} />
    </Screen>
  );
}

import { Href, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { DemoBanner } from '@/components/StatusNotices';
import { Card, H1, H2, Notice, P, Screen } from '@/components/ui';
import { colors, font, radius, space } from '@/theme';

const MENU: { icon: string; label: string; href: Href }[] = [
  { icon: '🔍', label: '募集をさがす', href: '/requests' },
  { icon: '✏️', label: '募集をつくる', href: '/requests/new' },
  { icon: '📋', label: '申込の管理', href: '/applications' },
  { icon: '🔔', label: 'お知らせ', href: '/notifications' },
  { icon: '📜', label: '支援履歴', href: '/history' },
  { icon: '👤', label: 'マイページ', href: '/mypage' },
];

export default function Home() {
  return (
    <Screen>
      <H1>ホーム</H1>
      <DemoBanner />
      <Notice tone="warn">
        本人確認・団体審査がまだ完了していません。審査が承認されると、募集の作成や支援の申込ができます。
      </Notice>
      <Card>
        <Pressable onPress={() => router.push('/verification')} accessibilityRole="button">
          <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.primary }}>▶ 本人確認・団体審査を申請する</Text>
        </Pressable>
      </Card>

      <H2>メニュー</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {MENU.map((m) => (
          <Pressable
            key={m.label}
            accessibilityRole="button"
            onPress={() => router.push(m.href)}
            style={({ pressed }) => ({
              width: '47%',
              minHeight: 110,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontSize: 34 }}>{m.icon}</Text>
            <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.text, marginTop: 6 }}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
      <P sub>※ 表示されるメニューは、STEP 5 以降で利用者区分ごとに切り替わります。</P>
    </Screen>
  );
}

import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, H2, P, Row, Screen, Spacer } from '@/components/ui';
import { colors, font, radius, space } from '@/theme';

// トップページ（ログイン前）
export default function Top() {
  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.logo}>🍙</Text>
        <Text style={styles.title}>こども食堂レスキュー</Text>
        <Text style={styles.lead}>地域みんなで、子どもたちの食を支える。</Text>
        <Text style={styles.sdg}>SDGs 目標2「飢餓をゼロに」</Text>
      </View>

      <Button label="はじめる（新規登録）" variant="accent" onPress={() => router.push('/signup')} />
      <Button label="ログイン" variant="outline" onPress={() => router.push('/login')} />
      <Button label="支援の募集を見てみる" variant="outline" onPress={() => router.push('/requests')} />

      <H2>できること</H2>
      {[
        ['🏠', '子ども食堂', '食材・資金・人手が足りないときに募集を出せます。'],
        ['🏢', '企業', '余剰食品の提供、資金支援、社員ボランティアで参加できます。'],
        ['🙋', '地域住民', '家庭の食材や寄付、ボランティアで支えられます。'],
      ].map(([icon, who, text]) => (
        <Card key={who}>
          <Row gap={space.md}>
            <Text style={{ fontSize: 32 }}>{icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.who}>{who}</Text>
              <P sub>{text}</P>
            </View>
          </Row>
        </Card>
      ))}

      <H2>安心してつかうために</H2>
      <P sub>
        子ども食堂・企業は書類による審査を行い、承認された団体だけが募集を出せます。食品は賞味期限・消費期限、保存状態、アレルゲンを確認してから受け渡します。
      </P>

      <Spacer h={space.lg} />
      <Row gap={space.md} wrap>
        <Text style={styles.link} onPress={() => router.push('/terms')} accessibilityRole="link">
          利用規約
        </Text>
        <Text style={styles.link} onPress={() => router.push('/privacy')} accessibilityRole="link">
          プライバシーポリシー
        </Text>
      </Row>
      <P sub>本アプリは高校生による試作版です。</P>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: space.lg,
    alignItems: 'center',
    marginTop: space.lg,
    marginBottom: space.lg,
  },
  logo: { fontSize: 56 },
  title: { fontSize: font.xxl, fontWeight: '800', color: '#fff', marginTop: space.sm },
  lead: { fontSize: font.md, color: '#fff', marginTop: space.sm, textAlign: 'center' },
  sdg: {
    marginTop: space.md,
    backgroundColor: colors.accent,
    color: '#fff',
    fontWeight: '700',
    fontSize: font.sm,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  who: { fontSize: font.lg, fontWeight: '700', color: colors.text },
  link: { color: colors.primary, fontSize: font.md, textDecorationLine: 'underline' },
});

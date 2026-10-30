import { Text, View } from 'react-native';
import { NotYetConnected } from '@/components/StatusNotices';
import { Card, H1, H2, P, Screen } from '@/components/ui';
import { colors, font, radius, space } from '@/theme';

const STATS = [
  ['審査待ち', '—'],
  ['未対応の通報', '—'],
  ['公開中の募集', '—'],
  ['今月の支援完了', '—'],
];

export default function AdminDashboard() {
  return (
    <Screen>
      <H1>管理者ダッシュボード</H1>
      <NotYetConnected step="STEP 8" what="管理者機能" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginBottom: space.md }}>
        {STATS.map(([label, v]) => (
          <View key={label} style={{ width: '47%', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: space.md }}>
            <Text style={{ fontSize: font.sm, color: colors.textSub }}>{label}</Text>
            <Text style={{ fontSize: font.xxl, fontWeight: '800', color: colors.primary }}>{v}</Text>
          </View>
        ))}
      </View>
      <H2>実装予定の機能</H2>
      <Card>
        <P>・本人確認・団体審査の書類確認と承認／却下（理由つき）</P>
        <P>・通報された募集の確認と非公開化</P>
        <P>・利用者の利用停止</P>
        <P>・管理者の操作履歴（だれが・いつ・何をしたか）の閲覧</P>
      </Card>
      <P sub>承認・却下などの操作はサーバー側（Edge Functions）で行い、すべて操作履歴に記録します。</P>
    </Screen>
  );
}

import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NotYetConnected } from '@/components/StatusNotices';
import { Button, Card, H1, H2, P, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, font, radius, space } from '@/theme';

type Stats = { pendingVerifications: number; openReports: number; openRequests: number; completedThisMonth: number };

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [v, r, q, c] = await Promise.all([
        supabase!.from('verification_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase!.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase!.from('support_requests').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase!.from('applications').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('updated_at', monthStart.toISOString()),
      ]);
      setStats({
        pendingVerifications: v.count ?? 0,
        openReports: r.count ?? 0,
        openRequests: q.count ?? 0,
        completedThisMonth: c.count ?? 0,
      });
    })();
  }, []);

  const tiles: [string, number | undefined, (() => void) | undefined][] = [
    ['審査待ち', stats?.pendingVerifications, () => router.push('/admin/verifications')],
    ['未対応の通報', stats?.openReports, undefined],
    ['公開中の募集', stats?.openRequests, undefined],
    ['今月の支援完了', stats?.completedThisMonth, undefined],
  ];

  return (
    <Screen>
      <H1>管理者ダッシュボード</H1>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginBottom: space.md }}>
        {tiles.map(([label, v, onPress]) => (
          <Pressable
            key={label}
            accessibilityRole={onPress ? 'button' : undefined}
            onPress={onPress}
            style={{ width: '47%', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: onPress ? colors.primary : colors.border, padding: space.md }}
          >
            <Text style={{ fontSize: font.sm, color: colors.textSub }}>{label}</Text>
            <Text style={{ fontSize: font.xxl, fontWeight: '800', color: colors.primary }}>{v ?? '—'}</Text>
            {onPress && <Text style={{ fontSize: font.xs, color: colors.primary, fontWeight: '700' }}>▶ 確認する</Text>}
          </Pressable>
        ))}
      </View>

      <Button label="本人確認・団体審査を行う" onPress={() => router.push('/admin/verifications')} />

      <H2>今後の管理機能</H2>
      <NotYetConnected step="STEP 8〜9" what="通報対応・利用停止・操作履歴の閲覧" />
      <Card>
        <P sub>承認・却下などの操作はサーバー側の関数で行い、すべて操作履歴（admin_audit_logs）に自動で記録されます。</P>
      </Card>
    </Screen>
  );
}

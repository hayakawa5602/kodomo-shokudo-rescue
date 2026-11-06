import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { RequestCard } from '@/components/RequestCard';
import { NotConfigured } from '@/components/StatusNotices';
import { Badge, Card, H1, H2, P, Screen } from '@/components/ui';
import { Application, fetchMyApplications } from '@/lib/applications';
import { useAuth } from '@/lib/auth';
import { fetchMyRequests } from '@/lib/requests';
import { APPLICATION_STATUS_LABEL, CATEGORY_ICON, CATEGORY_LABEL, SupportRequest } from '@/lib/types';
import { colors, font, radius, space } from '@/theme';

// 支援履歴：完了した支援の一覧と、子ども食堂なら自分が出した募集の一覧
export default function History() {
  const { session, profile } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [reqs, setReqs] = useState<SupportRequest[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const [a, r] = await Promise.all([
        fetchMyApplications().catch(() => []),
        profile?.role === 'kodomo_shokudo' ? fetchMyRequests(session.user.id) : Promise.resolve([]),
      ]);
      setApps(a);
      setReqs(r);
      setLoaded(true);
    })();
  }, [session, profile?.role]);

  const completed = apps.filter((a) => a.status === 'completed');
  const counts = { food: 0, fund: 0, volunteer: 0 };
  for (const a of completed) if (a.support_requests) counts[a.support_requests.category]++;

  return (
    <Screen>
      <H1>支援履歴</H1>
      <NotConfigured />
      {!loaded && <P sub>読み込み中…</P>}
      {loaded && (
        <>
          <View style={{ flexDirection: 'row', gap: space.sm, marginBottom: space.md }}>
            {(['food', 'volunteer', 'fund'] as const).map((c) => (
              <View key={c} style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: space.sm, alignItems: 'center' }}>
                <Text style={{ fontSize: font.xs, color: colors.textSub }}>{CATEGORY_ICON[c]} {CATEGORY_LABEL[c].replace('（ボランティア）', '')}</Text>
                <Text style={{ fontSize: font.xl, fontWeight: '800', color: colors.primary }}>{counts[c]}</Text>
                <Text style={{ fontSize: font.xs, color: colors.textSub }}>件 完了</Text>
              </View>
            ))}
          </View>

          <H2>完了した支援</H2>
          {completed.length === 0 && <P sub>完了した支援はまだありません。</P>}
          {completed.map((a) => (
            <Card key={a.id}>
              <Badge label={APPLICATION_STATUS_LABEL[a.status]} />
              <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.text, marginTop: 4 }}>{a.support_requests?.title}</Text>
              <P sub>
                {profile?.role === 'kodomo_shokudo' ? `支援者：${a.profiles?.display_name ?? '—'}` : `子ども食堂の募集`}　{new Date(a.updated_at).toLocaleDateString('ja-JP')}
              </P>
            </Card>
          ))}

          {profile?.role === 'kodomo_shokudo' && (
            <>
              <H2>出した募集（{reqs.length}件）</H2>
              {reqs.length === 0 && <P sub>まだ募集を出していません。</P>}
              {reqs.map((r) => (
                <RequestCard key={r.id} r={r} />
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}

import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ApplicationCard } from '@/components/ApplicationCard';
import { NotConfigured } from '@/components/StatusNotices';
import { H1, H2, Notice, P, Screen } from '@/components/ui';
import { Application, fetchMyApplications } from '@/lib/applications';
import { useAuth } from '@/lib/auth';
import { dbErrorMessage } from '@/lib/requests';

// 申込管理：子ども食堂は「届いた申込」、企業・住民は「自分の申込」
export default function Applications() {
  const { session, profile } = useAuth();
  const { applied } = useLocalSearchParams<{ applied?: string }>();
  const [items, setItems] = useState<Application[] | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setItems(await fetchMyApplications());
    } catch (e: any) {
      setError(dbErrorMessage(e?.message ?? String(e)));
    }
  };
  useEffect(() => {
    if (session) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  const me = session?.user.id;
  const received = (items ?? []).filter((a) => a.support_requests?.owner_id === me);
  const mine = (items ?? []).filter((a) => a.applicant_id === me);
  const active = (xs: Application[]) => xs.filter((a) => a.status === 'applied' || a.status === 'approved');
  const past = (xs: Application[]) => xs.filter((a) => a.status !== 'applied' && a.status !== 'approved');

  return (
    <Screen>
      <H1>申込の管理</H1>
      <NotConfigured />
      {applied === '1' && <Notice tone="info">申込を送りました。子ども食堂が確認すると、お知らせが届きます。</Notice>}
      {error !== '' && <Notice tone="danger">{error}</Notice>}
      {items === null && error === '' && <P sub>読み込み中…</P>}

      {profile?.role === 'kodomo_shokudo' && items && (
        <>
          <H2>届いた申込（対応が必要）</H2>
          {active(received).length === 0 && <P sub>対応が必要な申込はありません。</P>}
          {active(received).map((a) => (
            <ApplicationCard key={a.id} a={a} mode="owner" onChanged={load} />
          ))}
          {past(received).length > 0 && (
            <>
              <H2>対応済みの申込</H2>
              {past(received).map((a) => (
                <ApplicationCard key={a.id} a={a} mode="owner" onChanged={load} />
              ))}
            </>
          )}
        </>
      )}

      {profile?.role !== 'kodomo_shokudo' && items && (
        <>
          <H2>自分の申込</H2>
          {mine.length === 0 && <P sub>まだ申込はありません。「募集をさがす」から支援先を見つけてください。</P>}
          {active(mine).map((a) => (
            <ApplicationCard key={a.id} a={a} mode="applicant" onChanged={load} />
          ))}
          {past(mine).length > 0 && (
            <>
              <H2>終了した申込</H2>
              {past(mine).map((a) => (
                <ApplicationCard key={a.id} a={a} mode="applicant" onChanged={load} />
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}

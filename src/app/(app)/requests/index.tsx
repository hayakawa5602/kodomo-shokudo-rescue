import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { RequestCard } from '@/components/RequestCard';
import { Button, Chip, Field, H1, Notice, P, Row, Screen, Spacer } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { fetchOpenRequests, showDemoRequests } from '@/lib/requests';
import { CATEGORY_ICON, CATEGORY_LABEL, RequestCategory, SupportRequest } from '@/lib/types';
import { colors, font, space } from '@/theme';

// 支援募集一覧：カテゴリ別・地域別・キーワードで絞り込み
export default function RequestList() {
  const { profile } = useAuth();
  const [source, setSource] = useState<SupportRequest[] | null>(null);
  const [category, setCategory] = useState<RequestCategory | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    fetchOpenRequests().then(setSource);
  }, []);

  const regions = useMemo(() => Array.from(new Set((source ?? []).map((r) => r.region))), [source]);

  const list = (source ?? []).filter(
    (r) =>
      r.status === 'open' &&
      (!category || r.category === category) &&
      (!region || r.region === region) &&
      (!keyword.trim() || (r.title + r.description + r.orgName).includes(keyword.trim())),
  );

  return (
    <Screen>
      <H1>支援の募集</H1>
      {showDemoRequests && <Notice tone="warn">【デモ】と付いた募集は架空のデモデータです。申込はできません。</Notice>}
      {profile?.role === 'kodomo_shokudo' && profile.verification_status === 'approved' && (
        <Button label="✏️ 募集をつくる" variant="accent" onPress={() => router.push('/requests/new')} />
      )}
      <Field label="キーワード" placeholder="例：お米、調理" value={keyword} onChangeText={setKeyword} />

      <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.text, marginBottom: 6 }}>種類</Text>
      <Row wrap>
        <Chip label="すべて" selected={!category} onPress={() => setCategory(null)} />
        {(Object.keys(CATEGORY_LABEL) as RequestCategory[]).map((c) => (
          <Chip key={c} label={`${CATEGORY_ICON[c]} ${CATEGORY_LABEL[c]}`} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </Row>
      <Spacer h={space.md} />
      <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.text, marginBottom: 6 }}>地域</Text>
      <Row wrap>
        <Chip label="すべて" selected={!region} onPress={() => setRegion(null)} />
        {regions.map((r) => (
          <Chip key={r} label={r} selected={region === r} onPress={() => setRegion(r)} />
        ))}
      </Row>
      <Spacer h={space.lg} />

      {source === null ? (
        <P sub>読み込み中…</P>
      ) : (
        <>
          <P sub>{list.length}件の募集</P>
          <Spacer h={space.sm} />
          {list.map((r) => (
            <RequestCard key={r.id} r={r} />
          ))}
          {list.length === 0 && <P sub>条件に合う募集はありません。条件を変えてみてください。</P>}
        </>
      )}
    </Screen>
  );
}

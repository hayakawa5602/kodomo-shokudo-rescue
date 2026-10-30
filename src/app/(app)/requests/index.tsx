import { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { RequestCard } from '@/components/RequestCard';
import { DemoBanner } from '@/components/StatusNotices';
import { Chip, Field, H1, P, Row, Screen, Spacer } from '@/components/ui';
import { DEMO_REQUESTS } from '@/demo/requests';
import { CATEGORY_ICON, CATEGORY_LABEL, RequestCategory } from '@/lib/types';
import { colors, font, space } from '@/theme';

// 支援募集一覧：カテゴリ別・地域別・キーワードで絞り込み（ここは実際に動作する）
export default function RequestList() {
  const [category, setCategory] = useState<RequestCategory | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  // STEP 6 で Supabase からの取得に置き換える
  const source = DEMO_REQUESTS;
  const regions = useMemo(() => Array.from(new Set(source.map((r) => r.region))), [source]);

  const list = source.filter(
    (r) =>
      r.status === 'open' &&
      (!category || r.category === category) &&
      (!region || r.region === region) &&
      (!keyword.trim() || (r.title + r.description + r.orgName).includes(keyword.trim())),
  );

  return (
    <Screen>
      <H1>支援の募集</H1>
      <DemoBanner />
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

      <P sub>{list.length}件の募集</P>
      <Spacer h={space.sm} />
      {list.map((r) => (
        <RequestCard key={r.id} r={r} />
      ))}
      {list.length === 0 && <P sub>条件に合う募集はありません。条件を変えてみてください。</P>}
    </Screen>
  );
}

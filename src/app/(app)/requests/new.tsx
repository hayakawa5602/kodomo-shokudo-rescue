import { useState } from 'react';
import { Text } from 'react-native';
import { NotYetConnected } from '@/components/StatusNotices';
import { Button, Chip, Field, H1, H2, Notice, P, Row, Screen } from '@/components/ui';
import { CATEGORY_ICON, CATEGORY_LABEL, HANDOVER_LABEL, REGIONS, RequestCategory, STORAGE_LABEL } from '@/lib/types';
import { RequestDraft, validateRequest } from '@/lib/validation';
import { colors, font } from '@/theme';

const empty: RequestDraft = {
  title: '', category: '', region: '', description: '', deadline: '', foodItems: '', quantity: '',
  storage: '', allergens: [], handover: [], targetAmount: '', volunteerDate: '', volunteerCount: '',
};

function Err({ msg }: { msg?: string }) {
  return msg ? <Text style={{ color: colors.danger, fontSize: font.sm, fontWeight: '600', marginBottom: 8 }}>{msg}</Text> : null;
}

// 募集作成：審査承認済みの子ども食堂のみ利用可（DB側のRLSでも制限）
export default function NewRequest() {
  const [d, setD] = useState<RequestDraft>(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ok, setOk] = useState(false);
  const set = <K extends keyof RequestDraft>(k: K, v: RequestDraft[K]) => setD((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const e = validateRequest(d);
    setErrors(e);
    setOk(Object.keys(e).length === 0);
  };

  return (
    <Screen>
      <H1>募集をつくる</H1>
      <NotYetConnected step="STEP 6" what="募集の保存・公開" />
      <Notice tone="info">募集を出せるのは、団体審査が承認された子ども食堂だけです。</Notice>

      <H2>何を募集しますか？</H2>
      <Row wrap>
        {(Object.keys(CATEGORY_LABEL) as RequestCategory[]).map((c) => (
          <Chip key={c} label={`${CATEGORY_ICON[c]} ${CATEGORY_LABEL[c]}`} selected={d.category === c} onPress={() => set('category', c)} />
        ))}
      </Row>
      <Err msg={errors.category} />

      <Field label="タイトル" required placeholder="例：お米とお野菜を募集しています" value={d.title} onChangeText={(v) => set('title', v)} error={errors.title} maxLength={60} />
      <Field label="くわしい内容" required multiline hint="何人分か、何に使うかなどを具体的に" value={d.description} onChangeText={(v) => set('description', v)} error={errors.description} />
      <Field label="締切日" required placeholder="2026-12-31" value={d.deadline} onChangeText={(v) => set('deadline', v)} error={errors.deadline} />

      <P>地域（必須）</P>
      <Row wrap>
        {REGIONS.map((r) => (
          <Chip key={r} label={r} selected={d.region === r} onPress={() => set('region', r)} />
        ))}
      </Row>
      <Err msg={errors.region} />

      {d.category === 'food' && (
        <>
          <H2>🥕 食材の条件</H2>
          <Field label="ほしい食材" required value={d.foodItems} onChangeText={(v) => set('foodItems', v)} error={errors.foodItems} />
          <Field label="量の目安" value={d.quantity} onChangeText={(v) => set('quantity', v)} />
          <P>受け取れる保存状態（必須）</P>
          <Row wrap>
            {Object.entries(STORAGE_LABEL).map(([k, v]) => (
              <Chip key={k} label={v} selected={d.storage === k} onPress={() => set('storage', k)} />
            ))}
          </Row>
          <Err msg={errors.storage} />
          <P>受け渡し方法（必須・複数可）</P>
          <Row wrap>
            {Object.entries(HANDOVER_LABEL).map(([k, v]) => (
              <Chip
                key={k}
                label={v}
                selected={d.handover.includes(k)}
                onPress={() => set('handover', d.handover.includes(k) ? d.handover.filter((x) => x !== k) : [...d.handover, k])}
              />
            ))}
          </Row>
          <Err msg={errors.handover} />
        </>
      )}

      {d.category === 'fund' && (
        <>
          <H2>💰 資金の条件</H2>
          <Notice tone="warn">資金の受け取り（決済）は、法的確認が完了するまで有効になりません。募集の掲載のみ準備できます。</Notice>
          <Field label="目標金額（円）" required keyboardType="number-pad" value={d.targetAmount} onChangeText={(v) => set('targetAmount', v.replace(/[^0-9]/g, ''))} error={errors.targetAmount} />
        </>
      )}

      {d.category === 'volunteer' && (
        <>
          <H2>🤝 ボランティアの条件</H2>
          <Field label="活動日" required placeholder="2026-12-20" value={d.volunteerDate} onChangeText={(v) => set('volunteerDate', v)} error={errors.volunteerDate} />
          <Field label="募集人数" required keyboardType="number-pad" value={d.volunteerCount} onChangeText={(v) => set('volunteerCount', v.replace(/[^0-9]/g, ''))} error={errors.volunteerCount} />
        </>
      )}

      <Button label="入力内容をチェック" variant="accent" onPress={submit} />
      {ok && <Notice tone="info">入力内容に問題はありません（まだ保存はされません）。</Notice>}
    </Screen>
  );
}

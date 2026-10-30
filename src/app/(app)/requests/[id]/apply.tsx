import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Checkbox } from '@/components/Checkbox';
import { DemoBanner, NotYetConnected } from '@/components/StatusNotices';
import { Button, Chip, Field, H1, H2, Notice, P, Row, Screen } from '@/components/ui';
import { DEMO_REQUESTS } from '@/demo/requests';
import { ALLERGENS, HANDOVER_LABEL, STORAGE_LABEL } from '@/lib/types';
import { FoodOfferDraft, validateFoodOffer } from '@/lib/validation';

export default function Apply() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = DEMO_REQUESTS.find((x) => x.id === id);
  const [d, setD] = useState<FoodOfferDraft>({
    itemName: '', quantity: '', expiryType: '', expiryDate: '', storage: '', allergens: [], unopened: false, handover: '',
  });
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ok, setOk] = useState(false);
  const set = <K extends keyof FoodOfferDraft>(k: K, v: FoodOfferDraft[K]) => setD((p) => ({ ...p, [k]: v }));

  if (!r) return <Screen><H1>募集が見つかりません</H1></Screen>;

  const submit = () => {
    const e = r.category === 'food' ? validateFoodOffer(d) : {};
    if (r.category === 'volunteer' && message.trim().length < 5) e.message = '参加にあたっての一言を入力してください';
    setErrors(e);
    setOk(Object.keys(e).length === 0);
  };

  return (
    <Screen>
      <H1>支援を申し込む</H1>
      <P sub>{r.title}</P>
      <DemoBanner />
      <NotYetConnected step="STEP 7" what="申込の送信" />

      {r.category === 'food' && (
        <>
          <H2>提供する食品の確認</H2>
          <Field label="品名" required value={d.itemName} onChangeText={(v) => set('itemName', v)} error={errors.itemName} />
          <Field label="数量" required placeholder="例：5kg × 2袋" value={d.quantity} onChangeText={(v) => set('quantity', v)} error={errors.quantity} />
          <P>期限の種類（必須）</P>
          <Row wrap>
            <Chip label="賞味期限" selected={d.expiryType === 'best_before'} onPress={() => set('expiryType', 'best_before')} />
            <Chip label="消費期限" selected={d.expiryType === 'use_by'} onPress={() => set('expiryType', 'use_by')} />
          </Row>
          {errors.expiryType && <Notice tone="danger">{errors.expiryType}</Notice>}
          <Field label="期限の日付" required placeholder="2026-12-31" value={d.expiryDate} onChangeText={(v) => set('expiryDate', v)} error={errors.expiryDate} />
          <P>保存状態（必須）</P>
          <Row wrap>
            {Object.entries(STORAGE_LABEL).map(([k, v]) => (
              <Chip key={k} label={v} selected={d.storage === k} onPress={() => set('storage', k)} />
            ))}
          </Row>
          {errors.storage && <Notice tone="danger">{errors.storage}</Notice>}
          <P>アレルゲン（特定原材料・含まれるものをすべて選ぶ）</P>
          <Row wrap>
            {ALLERGENS.map((a) => (
              <Chip
                key={a}
                label={a}
                selected={d.allergens.includes(a)}
                onPress={() => set('allergens', d.allergens.includes(a) ? d.allergens.filter((x) => x !== a) : [...d.allergens, a])}
              />
            ))}
          </Row>
          <P>受け渡し方法（必須）</P>
          <Row wrap>
            {(r.handover ?? []).map((h) => (
              <Chip key={h} label={HANDOVER_LABEL[h]} selected={d.handover === h} onPress={() => set('handover', h)} />
            ))}
          </Row>
          {errors.handover && <Notice tone="danger">{errors.handover}</Notice>}
          <Checkbox label="未開封の食品です" checked={d.unopened} onChange={(v) => set('unopened', v)} error={errors.unopened} />
        </>
      )}

      <Field
        label={r.category === 'volunteer' ? '参加にあたっての一言' : '子ども食堂へのメッセージ（任意）'}
        required={r.category === 'volunteer'}
        multiline
        value={message}
        onChangeText={setMessage}
        error={errors.message}
      />
      <Button label="申込内容をチェック" variant="accent" onPress={submit} />
      {ok && <Notice tone="info">入力内容に問題はありません（まだ送信はされません）。</Notice>}
    </Screen>
  );
}

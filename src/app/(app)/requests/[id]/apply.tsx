import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/Checkbox';
import { Button, Chip, Field, H1, H2, Notice, P, Row, Screen } from '@/components/ui';
import { applyToRequest } from '@/lib/applications';
import { useAuth } from '@/lib/auth';
import { dbErrorMessage, fetchRequest, isDemoId } from '@/lib/requests';
import { ALLERGENS, HANDOVER_LABEL, STORAGE_LABEL, SupportRequest } from '@/lib/types';
import { FoodOfferDraft, validateFoodOffer } from '@/lib/validation';

export default function Apply() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuth();
  const [r, setR] = useState<SupportRequest | null | undefined>(undefined);
  const [d, setD] = useState<FoodOfferDraft>({
    itemName: '', quantity: '', expiryType: '', expiryDate: '', storage: '', allergens: [], unopened: false, handover: '',
  });
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const set = <K extends keyof FoodOfferDraft>(k: K, v: FoodOfferDraft[K]) => setD((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    fetchRequest(id).then(setR);
  }, [id]);

  if (r === undefined) return <Screen><P sub>読み込み中…</P></Screen>;
  if (!r || isDemoId(r.id) || r.category === 'fund') return <Screen><H1>この募集には申し込めません</H1></Screen>;

  const canApply =
    !!profile && (profile.role === 'company' || profile.role === 'resident') && profile.verification_status === 'approved' && !profile.is_suspended && r.status === 'open';

  const submit = async () => {
    const e = r.category === 'food' ? validateFoodOffer(d) : {};
    if (r.category === 'volunteer' && message.trim().length < 5) e.message = '参加にあたっての一言を入力してください';
    if (message.length > 500) e.message = 'メッセージは500文字以内にしてください';
    setErrors(e);
    setServerError('');
    if (Object.keys(e).length > 0 || !session) return;
    setBusy(true);
    try {
      await applyToRequest(session.user.id, r.id, r.category, message, d);
      router.replace({ pathname: '/applications', params: { applied: '1' } });
    } catch (err: any) {
      setServerError(dbErrorMessage(err?.message ?? String(err)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <H1>支援を申し込む</H1>
      <P sub>{r.title}（{r.orgName}）</P>
      {!canApply && <Notice tone="warn">申し込むには、企業または地域住民として登録し、本人確認・団体審査の承認を受けている必要があります。</Notice>}

      {r.category === 'food' && (
        <>
          <H2>提供する食品の確認</H2>
          <Notice tone="info">未開封で、期限内の食品だけ提供できます。受け取った食堂が安全に使えるよう、正確に入力してください。</Notice>
          <Field label="品名" required value={d.itemName} onChangeText={(v) => set('itemName', v)} error={errors.itemName} maxLength={100} />
          <Field label="数量" required placeholder="例：5kg × 2袋" value={d.quantity} onChangeText={(v) => set('quantity', v)} error={errors.quantity} maxLength={100} />
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
        maxLength={500}
      />
      {serverError !== '' && <Notice tone="danger">{serverError}</Notice>}
      <Button label={busy ? '送信中…' : '申し込む'} variant="accent" onPress={submit} disabled={busy || !canApply} />
    </Screen>
  );
}

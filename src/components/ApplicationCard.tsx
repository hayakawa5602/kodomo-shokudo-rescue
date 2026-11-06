import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, Button, Card, Field, Notice, P, Row } from './ui';
import { Application, Contact, fetchContact, updateApplicationStatus } from '@/lib/applications';
import { dbErrorMessage } from '@/lib/requests';
import { APPLICATION_STATUS_LABEL, ApplicationStatus, CATEGORY_ICON, CATEGORY_LABEL, HANDOVER_LABEL, ROLE_LABEL, STORAGE_LABEL } from '@/lib/types';
import { colors, font } from '@/theme';

const TONE: Record<ApplicationStatus, 'green' | 'orange' | 'gray' | 'red'> = {
  applied: 'orange',
  approved: 'green',
  completed: 'green',
  rejected: 'red',
  cancelled: 'gray',
};

function Line({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <Text style={{ fontSize: font.sm, color: colors.text, marginBottom: 2 }}>
      <Text style={{ color: colors.textSub }}>{label}：</Text>
      {value}
    </Text>
  );
}

/** 申込1件のカード。mode=owner は募集者（子ども食堂）、applicant は申込者の見え方 */
export function ApplicationCard({ a, mode, onChanged }: { a: Application; mode: 'owner' | 'applicant'; onChanged: () => void }) {
  const [note, setNote] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [contact, setContact] = useState<Contact | null>(null);
  const req = a.support_requests;
  const showContact = a.status === 'approved' || a.status === 'completed';

  useEffect(() => {
    if (showContact) {
      fetchContact(mode === 'owner' ? a.applicant_id : req?.owner_id ?? '').then(setContact);
    }
  }, [showContact, mode, a.applicant_id, req?.owner_id]);

  const change = async (status: ApplicationStatus, decisionNote?: string) => {
    setBusy(true);
    setError('');
    try {
      await updateApplicationStatus(a.id, status, decisionNote);
      setRejecting(false);
      onChanged();
    } catch (e: any) {
      setError(dbErrorMessage(e?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <Row wrap>
        {req && <Badge label={`${CATEGORY_ICON[req.category]} ${CATEGORY_LABEL[req.category]}`} />}
        <Badge label={APPLICATION_STATUS_LABEL[a.status]} tone={TONE[a.status]} />
      </Row>
      <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/requests/[id]', params: { id: a.request_id } })}>
        <Text style={{ fontSize: font.lg, fontWeight: '800', color: colors.text, marginTop: 6 }}>{req?.title ?? '（募集）'}</Text>
      </Pressable>
      <P sub>
        {mode === 'owner'
          ? `申込者：${a.profiles?.display_name ?? '—'}（${ROLE_LABEL[a.profiles?.role ?? 'resident']}）`
          : `募集：📍${req?.region ?? ''}`}
        　{new Date(a.created_at).toLocaleDateString('ja-JP')}
      </P>

      {req?.category === 'food' && (
        <View style={{ marginVertical: 6 }}>
          <Line label="品名" value={a.item_name} />
          <Line label="数量" value={a.offer_quantity} />
          <Line label={a.expiry_kind === 'use_by' ? '消費期限' : '賞味期限'} value={a.expiry_date} />
          <Line label="保存状態" value={a.storage ? STORAGE_LABEL[a.storage] : null} />
          <Line label="アレルゲン" value={a.allergens.length ? a.allergens.join('・') : 'なし'} />
          <Line label="受け渡し" value={a.handover ? HANDOVER_LABEL[a.handover] : null} />
        </View>
      )}
      {a.message && <Line label="メッセージ" value={a.message} />}
      {a.status === 'rejected' && a.decision_note && <Notice tone="danger">見送りの理由：{a.decision_note}</Notice>}

      {showContact && (
        <Notice tone="info">
          {contact
            ? `相手の連絡先　${contact.contact_name ?? ''}　☎ ${contact.phone ?? '—'}　${contact.address ?? ''}`
            : '相手の連絡先を読み込み中…'}
        </Notice>
      )}
      {error !== '' && <Notice tone="danger">{error}</Notice>}

      {mode === 'owner' && a.status === 'applied' && !rejecting && (
        <Row>
          <View style={{ flex: 1 }}>
            <Button label="承認する" onPress={() => change('approved')} disabled={busy} />
          </View>
          <View style={{ flex: 1 }}>
            <Button label="見送る" variant="danger" onPress={() => setRejecting(true)} disabled={busy} />
          </View>
        </Row>
      )}
      {mode === 'owner' && rejecting && (
        <>
          <Field label="見送りの理由（申込者に伝わります）" value={note} onChangeText={setNote} multiline maxLength={500} />
          <Button label="見送りにする" variant="danger" onPress={() => change('rejected', note)} disabled={busy || note.trim().length < 2} />
          <Button label="やめる" variant="outline" onPress={() => setRejecting(false)} />
        </>
      )}
      {mode === 'owner' && a.status === 'approved' && <Button label="受け渡し完了にする" onPress={() => change('completed')} disabled={busy} />}
      {mode === 'applicant' && (a.status === 'applied' || a.status === 'approved') && (
        <Button label="申込を取り消す" variant="outline" onPress={() => change('cancelled')} disabled={busy} />
      )}
    </Card>
  );
}

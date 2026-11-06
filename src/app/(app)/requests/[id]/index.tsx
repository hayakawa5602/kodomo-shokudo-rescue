import { router, useLocalSearchParams } from 'expo-router';
import { Fragment, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Badge, Button, Card, Field, H1, H2, Notice, P, Row, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { dbErrorMessage, fetchRequest, isDemoId, reportRequest, setRequestStatus } from '@/lib/requests';
import {
  CATEGORY_ICON,
  CATEGORY_LABEL,
  HANDOVER_LABEL,
  REQUEST_STATUS_LABEL,
  STORAGE_LABEL,
  SupportRequest,
} from '@/lib/types';
import { colors, font } from '@/theme';

function Item({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: font.sm, color: colors.textSub }}>{label}</Text>
      <Text style={{ fontSize: font.md, color: colors.text, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuth();
  const [r, setR] = useState<SupportRequest | null | undefined>(undefined);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<{ tone: 'info' | 'danger'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => fetchRequest(id).then(setR);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (r === undefined) {
    return (
      <Screen>
        <P sub>読み込み中…</P>
      </Screen>
    );
  }
  if (!r) {
    return (
      <Screen>
        <H1>募集が見つかりません</H1>
        <P sub>削除されたか、公開が停止された可能性があります。</P>
        <Button label="一覧に戻る" variant="outline" onPress={() => router.replace('/requests')} />
      </Screen>
    );
  }

  const demo = isDemoId(r.id);
  const isOwner = !!session && r.ownerId === session.user.id;
  const canApply =
    !!profile && !demo && !isOwner && r.status === 'open' && r.category !== 'fund' &&
    (profile.role === 'company' || profile.role === 'resident') && profile.verification_status === 'approved' && !profile.is_suspended;

  const changeStatus = async (status: 'open' | 'closed' | 'completed') => {
    setBusy(true);
    setMsg(null);
    try {
      await setRequestStatus(r.id, status);
      await load();
      setMsg({ tone: 'info', text: `募集を「${REQUEST_STATUS_LABEL[status]}」にしました。` });
    } catch (e: any) {
      setMsg({ tone: 'danger', text: dbErrorMessage(e?.message ?? String(e)) });
    } finally {
      setBusy(false);
    }
  };

  const sendReport = async () => {
    if (!session) return;
    setBusy(true);
    setMsg(null);
    try {
      await reportRequest(session.user.id, r.id, reason);
      setReporting(false);
      setReason('');
      setMsg({ tone: 'info', text: '通報を受け付けました。運営者が確認します。' });
    } catch (e: any) {
      setMsg({ tone: 'danger', text: dbErrorMessage(e?.message ?? String(e)) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      {demo && <Notice tone="warn">【デモ】架空のデモデータです。申込はできません。</Notice>}
      <Row wrap>
        <Badge label={`${CATEGORY_ICON[r.category]} ${CATEGORY_LABEL[r.category]}`} tone={r.category === 'fund' ? 'orange' : 'green'} />
        <Badge label={REQUEST_STATUS_LABEL[r.status]} tone={r.status === 'open' ? 'green' : 'gray'} />
      </Row>
      <H1>{r.title}</H1>
      <P sub>
        {r.orgName}　📍{r.region}
      </P>

      <Card>
        <P>{r.description}</P>
      </Card>

      <Card>
        <Item label="締切" value={r.deadline} />
        {r.category === 'food' && (
          <Fragment>
            <Item label="ほしい食材" value={r.foodItems} />
            <Item label="量の目安" value={r.quantity} />
            <Item label="保存状態" value={r.storage && STORAGE_LABEL[r.storage]} />
            <Item label="受け渡し方法" value={r.handover?.map((h) => HANDOVER_LABEL[h]).join('・')} />
          </Fragment>
        )}
        {r.category === 'fund' && <Item label="目標金額" value={r.targetAmount ? `${r.targetAmount.toLocaleString()}円` : undefined} />}
        {r.category === 'volunteer' && (
          <Fragment>
            <Item label="活動日" value={r.volunteerDate} />
            <Item label="募集人数" value={r.volunteerCount ? `${r.volunteerCount}人` : undefined} />
          </Fragment>
        )}
      </Card>

      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      {/* 募集者本人の操作 */}
      {isOwner && (
        <Card>
          <H2>この募集の管理</H2>
          <Button label="届いた申込を見る" onPress={() => router.push('/applications')} />
          {r.status === 'open' && <Button label="募集を終了する" variant="outline" onPress={() => changeStatus('closed')} disabled={busy} />}
          {r.status === 'closed' && <Button label="募集を再開する" variant="outline" onPress={() => changeStatus('open')} disabled={busy} />}
          {r.status !== 'completed' && <Button label="支援完了にする" variant="outline" onPress={() => changeStatus('completed')} disabled={busy} />}
        </Card>
      )}

      {/* 支援者の操作 */}
      {!isOwner && r.category === 'fund' && <Notice tone="warn">資金支援の決済は、法的確認が完了するまで利用できません。</Notice>}
      {canApply && (
        <Button label="この募集に支援を申し込む" variant="accent" onPress={() => router.push({ pathname: '/requests/[id]/apply', params: { id: r.id } })} />
      )}
      {!session && !demo && r.status === 'open' && r.category !== 'fund' && (
        <Button label="申し込むにはログイン" variant="accent" onPress={() => router.push('/login')} />
      )}
      {session && !isOwner && !demo && !canApply && r.status === 'open' && r.category !== 'fund' && (
        <Notice tone="info">
          {profile?.role === 'kodomo_shokudo'
            ? '子ども食堂のアカウントからは申し込めません。'
            : '支援を申し込むには、本人確認・団体審査の承認が必要です。'}
        </Notice>
      )}

      {session && !isOwner && !demo && (
        <>
          <H2>不適切な募集の通報</H2>
          {!reporting ? (
            <Button label="🚩 この募集を通報する" variant="danger" onPress={() => setReporting(true)} />
          ) : (
            <>
              <Field label="通報の理由" multiline value={reason} onChangeText={setReason} placeholder="例：営利目的の勧誘に見える、内容が事実と異なる" maxLength={500} />
              <Button label="通報する" variant="danger" disabled={reason.trim().length < 5 || busy} onPress={sendReport} />
              <Button label="やめる" variant="outline" onPress={() => setReporting(false)} />
            </>
          )}
        </>
      )}
    </Screen>
  );
}

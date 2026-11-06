import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Badge, Button, Card, Field, H1, Notice, P, Row, Screen } from '@/components/ui';
import { dbErrorMessage } from '@/lib/requests';
import { supabase } from '@/lib/supabase';
import { REQUEST_STATUS_LABEL, RequestStatus } from '@/lib/types';
import { colors, font } from '@/theme';

type Report = {
  id: string;
  request_id: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  created_at: string;
  support_requests: { title: string; status: RequestStatus; owner_id: string } | null;
  profiles: { display_name: string } | null;
};

// 管理者：通報の確認。募集を非公開にする（同じ募集への通報はまとめて対応済みになる）か、問題なしとして閉じる
export default function AdminReports() {
  const [items, setItems] = useState<Report[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: 'info' | 'danger'; text: string } | null>(null);

  const load = async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('reports')
      .select('id, request_id, reason, status, created_at, support_requests!reports_request_id_fkey(title, status, owner_id), profiles!reports_reporter_id_fkey(display_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: true });
    if (error) setMsg({ tone: 'danger', text: dbErrorMessage(error.message) });
    setItems((data as unknown as Report[]) ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  const act = async (r: Report, hide: boolean) => {
    if (!supabase) return;
    setBusy(r.id);
    setMsg(null);
    const note = (notes[r.id] ?? '').trim();
    const { error } = hide
      ? await supabase.rpc('admin_set_request_hidden', { p_request_id: r.request_id, p_hidden: true, p_note: note })
      : await supabase.rpc('admin_dismiss_report', { p_report_id: r.id, p_note: note });
    setBusy(null);
    if (error) {
      setMsg({ tone: 'danger', text: dbErrorMessage(error.message) });
      return;
    }
    setMsg({ tone: 'info', text: hide ? '募集を非公開にしました。' : '通報を「問題なし」として閉じました。' });
    await load();
  };

  return (
    <Screen>
      <H1>通報の確認</H1>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      {items === null && <P sub>読み込み中…</P>}
      {items?.length === 0 && <P sub>未対応の通報はありません。</P>}
      {items?.map((r) => (
        <Card key={r.id}>
          <Row wrap>
            <Badge label={`募集：${REQUEST_STATUS_LABEL[r.support_requests?.status ?? 'open']}`} tone={r.support_requests?.status === 'hidden' ? 'red' : 'green'} />
            <P sub>{new Date(r.created_at).toLocaleString('ja-JP')}</P>
          </Row>
          <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/requests/[id]', params: { id: r.request_id } })}>
            <Text style={{ fontSize: font.lg, fontWeight: '800', color: colors.primary, marginTop: 6, textDecorationLine: 'underline' }}>
              {r.support_requests?.title ?? '（募集）'}
            </Text>
          </Pressable>
          <P sub>通報者：{r.profiles?.display_name ?? '（退会済み）'}</P>
          <Notice tone="warn">理由：{r.reason}</Notice>
          <Field label="対応メモ（操作履歴に残ります）" value={notes[r.id] ?? ''} onChangeText={(v) => setNotes({ ...notes, [r.id]: v })} maxLength={500} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Button label="募集を非公開にする" variant="danger" onPress={() => act(r, true)} disabled={busy !== null} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="問題なし" variant="outline" onPress={() => act(r, false)} disabled={busy !== null} />
            </View>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

import { useEffect, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Badge, Button, Card, Field, H1, H2, Notice, P, Row, Screen } from '@/components/ui';
import { authErrorMessage } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { ROLE_LABEL, UserRole } from '@/lib/types';
import { BUCKET } from '@/lib/verification';
import { colors, font } from '@/theme';

type Pending = {
  id: string;
  user_id: string;
  document_paths: string[];
  created_at: string;
  profiles: { display_name: string; role: UserRole; is_minor: boolean; region: string | null } | null;
};
type Private = { contact_name: string | null; phone: string | null; address: string | null };

// 管理者：審査待ちの申請を確認し、承認／却下する
// 承認・却下は admin_review_verification（DB関数）で行う。関数の中で管理者かどうかを再確認し、操作履歴を残す。
export default function AdminVerifications() {
  const [items, setItems] = useState<Pending[] | null>(null);
  const [privates, setPrivates] = useState<Record<string, Private>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  const load = async () => {
    if (!supabase) return;
    const { data, error: e } = await supabase
      .from('verification_requests')
      .select('id, user_id, document_paths, created_at, profiles!verification_requests_user_id_fkey(display_name, role, is_minor, region)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (e) {
      setError(authErrorMessage(e.message));
      return;
    }
    const list = (data as unknown as Pending[]) ?? [];
    setItems(list);
    if (list.length) {
      const { data: priv } = await supabase
        .from('profile_private')
        .select('id, contact_name, phone, address')
        .in('id', list.map((x) => x.user_id));
      const map: Record<string, Private> = {};
      for (const p of (priv ?? []) as (Private & { id: string })[]) map[p.id] = p;
      setPrivates(map);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openDoc = async (path: string) => {
    if (!supabase) return;
    const { data, error: e } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600);
    if (e || !data) {
      setError('書類を開けませんでした：' + (e?.message ?? ''));
      return;
    }
    Linking.openURL(data.signedUrl);
  };

  const review = async (id: string, approve: boolean) => {
    if (!supabase) return;
    const note = (notes[id] ?? '').trim();
    if (!approve && note.length < 5) {
      setError('却下する場合は、申請者に伝える理由を5文字以上で入力してください。');
      return;
    }
    setError('');
    setBusy(id);
    const { error: e } = await supabase.rpc('admin_review_verification', { p_request_id: id, p_approve: approve, p_note: note });
    setBusy(null);
    if (e) {
      setError(authErrorMessage(e.message));
      return;
    }
    setDone(approve ? '承認しました。申請者に通知を送りました。' : '却下しました。理由とともに申請者に通知を送りました。');
    await load();
  };

  return (
    <Screen>
      <H1>本人確認・団体審査</H1>
      {error !== '' && <Notice tone="danger">{error}</Notice>}
      {done !== '' && <Notice tone="info">{done}</Notice>}
      {items === null && <P sub>読み込み中…</P>}
      {items?.length === 0 && <P sub>審査待ちの申請はありません。</P>}
      {items?.map((it) => {
        const pv = privates[it.user_id];
        return (
          <Card key={it.id}>
            <Row wrap>
              <Badge label={ROLE_LABEL[it.profiles?.role ?? 'resident']} />
              {it.profiles?.is_minor && <Badge label="18歳未満" tone="orange" />}
              <P sub>{new Date(it.created_at).toLocaleString('ja-JP')} 申請</P>
            </Row>
            <H2>{it.profiles?.display_name ?? '（表示名なし）'}</H2>
            <P sub>名称：{pv?.contact_name ?? '—'}</P>
            <P sub>所在地：{pv?.address ?? '—'}（公開：{it.profiles?.region ?? '—'}）</P>
            <P sub>電話：{pv?.phone ?? '—'}</P>

            <P>提出書類（{it.document_paths.length}件）</P>
            {it.document_paths.map((p) => (
              <Pressable key={p} accessibilityRole="link" onPress={() => openDoc(p)} style={{ paddingVertical: 6 }}>
                <Text style={{ color: colors.primary, textDecorationLine: 'underline', fontSize: font.md }}>📄 {p.split('/').pop()}（10分間だけ開ける安全なリンク）</Text>
              </Pressable>
            ))}

            <Field label="申請者へのメモ（却下の場合は必須）" placeholder="例：活動実績の資料が確認できませんでした" value={notes[it.id] ?? ''} onChangeText={(v) => setNotes({ ...notes, [it.id]: v })} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button label={busy === it.id ? '処理中…' : '承認する'} onPress={() => review(it.id, true)} disabled={busy !== null} />
              </View>
              <View style={{ flex: 1 }}>
                <Button label="却下する" variant="danger" onPress={() => review(it.id, false)} disabled={busy !== null} />
              </View>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

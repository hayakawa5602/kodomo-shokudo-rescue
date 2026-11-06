import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Badge, Button, Card, Chip, Field, H1, Notice, P, Row, Screen } from '@/components/ui';
import { Profile, useAuth } from '@/lib/auth';
import { dbErrorMessage } from '@/lib/requests';
import { supabase } from '@/lib/supabase';
import { ROLE_LABEL, VERIFICATION_LABEL, UserRole } from '@/lib/types';

type Row_ = Profile & { created_at: string };
const TONE = { unsubmitted: 'gray', pending: 'orange', approved: 'green', rejected: 'red' } as const;

// 管理者：利用者一覧と利用停止／解除
export default function AdminUsers() {
  const { session } = useAuth();
  const [items, setItems] = useState<Row_[] | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [keyword, setKeyword] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: 'info' | 'danger'; text: string } | null>(null);

  const load = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, role, display_name, region, is_minor, verification_status, is_suspended, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    setItems((data as Row_[]) ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  const toggle = async (u: Row_) => {
    if (!supabase) return;
    setBusy(u.id);
    setMsg(null);
    const { error } = await supabase.rpc('admin_set_suspended', { p_user_id: u.id, p_suspended: !u.is_suspended, p_note: (notes[u.id] ?? '').trim() });
    setBusy(null);
    if (error) {
      setMsg({ tone: 'danger', text: dbErrorMessage(error.message) });
      return;
    }
    setMsg({ tone: 'info', text: u.is_suspended ? '利用停止を解除しました。' : '利用停止にしました。' });
    await load();
  };

  const list = (items ?? []).filter((u) => (!role || u.role === role) && (!keyword.trim() || u.display_name.includes(keyword.trim())));

  return (
    <Screen>
      <H1>利用者の管理</H1>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <Field label="表示名で検索" value={keyword} onChangeText={setKeyword} />
      <Row wrap>
        <Chip label="すべて" selected={!role} onPress={() => setRole(null)} />
        {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
          <Chip key={r} label={ROLE_LABEL[r]} selected={role === r} onPress={() => setRole(r)} />
        ))}
      </Row>
      <P sub>{list.length}人</P>
      {list.map((u) => (
        <Card key={u.id}>
          <Row wrap>
            <Badge label={ROLE_LABEL[u.role]} />
            <Badge label={VERIFICATION_LABEL[u.verification_status]} tone={TONE[u.verification_status]} />
            {u.is_suspended && <Badge label="利用停止中" tone="red" />}
            {u.is_minor && <Badge label="18歳未満" tone="orange" />}
          </Row>
          <P>{u.display_name}</P>
          <P sub>
            {u.region ?? '地域未設定'}　登録 {new Date(u.created_at).toLocaleDateString('ja-JP')}
          </P>
          {u.role !== 'admin' && u.id !== session?.user.id && u.display_name !== '退会済みユーザー' && (
            <View>
              <Field label="理由（操作履歴に残ります）" value={notes[u.id] ?? ''} onChangeText={(v) => setNotes({ ...notes, [u.id]: v })} maxLength={500} />
              <Button
                label={u.is_suspended ? '利用停止を解除する' : '利用停止にする'}
                variant={u.is_suspended ? 'outline' : 'danger'}
                onPress={() => toggle(u)}
                disabled={busy !== null || (!u.is_suspended && (notes[u.id] ?? '').trim().length < 2)}
              />
            </View>
          )}
        </Card>
      ))}
    </Screen>
  );
}

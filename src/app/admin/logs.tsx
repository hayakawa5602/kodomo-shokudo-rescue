import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Card, H1, P, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, font } from '@/theme';

type Log = { id: number; action: string; target_table: string; target_id: string | null; detail: Record<string, unknown>; created_at: string; profiles: { display_name: string } | null };

const ACTION_LABEL: Record<string, string> = {
  review_verification: '審査の承認／却下',
  hide_request: '募集を非公開に',
  unhide_request: '募集の非公開を解除',
  suspend_user: '利用停止',
  unsuspend_user: '利用停止を解除',
  dismiss_report: '通報を問題なしで閉じる',
  account_deleted: '退会',
};

// 管理者：操作履歴（追記専用。だれが・いつ・何をしたか）
export default function AdminLogs() {
  const [items, setItems] = useState<Log[] | null>(null);
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('admin_audit_logs')
      .select('id, action, target_table, target_id, detail, created_at, profiles!admin_audit_logs_admin_id_fkey(display_name)')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => setItems((data as unknown as Log[]) ?? []));
  }, []);

  return (
    <Screen>
      <H1>操作履歴</H1>
      <P sub>管理者の操作と退会は、すべて自動で記録されます。この一覧は編集・削除できません。</P>
      {items === null && <P sub>読み込み中…</P>}
      {items?.length === 0 && <P sub>記録はまだありません。</P>}
      {items?.map((l) => (
        <Card key={l.id}>
          <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.text }}>{ACTION_LABEL[l.action] ?? l.action}</Text>
          <P sub>
            {new Date(l.created_at).toLocaleString('ja-JP')}　{l.profiles?.display_name ?? '（本人）'}
          </P>
          {Object.keys(l.detail ?? {}).length > 0 && (
            <Text style={{ fontSize: font.xs, color: colors.textSub }}>
              {Object.entries(l.detail)
                .filter(([k]) => k !== 'user_id')
                .map(([k, v]) => `${k}: ${String(v)}`)
                .join('　')}
            </Text>
          )}
        </Card>
      ))}
    </Screen>
  );
}

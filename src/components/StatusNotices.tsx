import { Notice } from './ui';
import { isDemoMode } from '@/lib/supabase';

/** デモデータ表示中であることを常に明示する */
export function DemoBanner() {
  if (!isDemoMode) return null;
  return (
    <Notice tone="warn">
      【デモ表示中】ここに出ている団体・募集はすべて架空のデモデータです。実際の申込はできません。
    </Notice>
  );
}

/** まだサーバー接続を実装していない機能に表示する（動かない機能を完成品に見せないため） */
export function NotYetConnected({ step, what }: { step: string; what: string }) {
  return (
    <Notice tone="info">
      🛠 {what}は {step} で実装予定です。現在は画面と入力チェックのみ動作し、送信・保存は行われません。
    </Notice>
  );
}

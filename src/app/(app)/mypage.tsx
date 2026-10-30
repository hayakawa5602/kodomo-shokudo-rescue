import { router } from 'expo-router';
import { useState } from 'react';
import { NotYetConnected } from '@/components/StatusNotices';
import { Badge, Button, Card, H1, H2, Notice, P, Row, Screen } from '@/components/ui';
import { VERIFICATION_LABEL } from '@/lib/types';

export default function MyPage() {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <Screen>
      <H1>マイページ</H1>
      <NotYetConnected step="STEP 4〜5" what="登録情報の表示・変更" />
      <Card>
        <Row>
          <P>審査の状態：</P>
          <Badge label={VERIFICATION_LABEL.unsubmitted} tone="gray" />
        </Row>
      </Card>
      <Button label="本人確認・団体審査" variant="outline" onPress={() => router.push('/verification')} />
      <Button label="支援履歴" variant="outline" onPress={() => router.push('/history')} />
      <Button label="利用規約" variant="outline" onPress={() => router.push('/terms')} />
      <Button label="プライバシーポリシー" variant="outline" onPress={() => router.push('/privacy')} />
      <Button label="ログアウト（STEP 4で有効化）" variant="outline" disabled />

      <H2>退会（アカウント削除）</H2>
      {!confirmDelete ? (
        <Button label="退会の手続きへ" variant="danger" onPress={() => setConfirmDelete(true)} />
      ) : (
        <>
          <Notice tone="danger">
            退会すると、氏名・連絡先・本人確認書類は削除され、元に戻せません。進行中の支援がある場合は、先に完了または取り消しをしてください。支援の記録は個人が特定できない形で保存されます。
          </Notice>
          <NotYetConnected step="STEP 9" what="退会処理" />
          <Button label="退会する" variant="danger" disabled />
          <Button label="やめる" variant="outline" onPress={() => setConfirmDelete(false)} />
        </>
      )}
    </Screen>
  );
}

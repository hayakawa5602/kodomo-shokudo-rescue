import { router } from 'expo-router';
import { useState } from 'react';
import { ProfileStatus } from '@/components/ProfileStatus';
import { NotYetConnected } from '@/components/StatusNotices';
import { Button, Card, H1, H2, Notice, P, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function MyPage() {
  const { profile, session, signOut } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const logout = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <Screen>
      <H1>マイページ</H1>
      <Card>
        {profile && <ProfileStatus profile={profile} />}
        <P sub>メールアドレス：{session?.user.email}</P>
      </Card>
      <Button label="本人確認・団体審査" variant="outline" onPress={() => router.push('/verification')} />
      <Button label="支援履歴" variant="outline" onPress={() => router.push('/history')} />
      <Button label="利用規約" variant="outline" onPress={() => router.push('/terms')} />
      <Button label="プライバシーポリシー" variant="outline" onPress={() => router.push('/privacy')} />
      <Button label="ログアウト" onPress={logout} />

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

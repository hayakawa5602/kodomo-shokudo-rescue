import { router } from 'expo-router';
import { useState } from 'react';
import { ProfileStatus } from '@/components/ProfileStatus';
import { dbErrorMessage } from '@/lib/requests';
import { supabase } from '@/lib/supabase';
import { Button, Card, Field, H1, H2, Notice, P, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function MyPage() {
  const { profile, session, signOut } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const deleteAccount = async () => {
    if (!supabase) return;
    setBusy(true);
    setError('');
    const { error: e } = await supabase.rpc('delete_my_account');
    if (e) {
      setBusy(false);
      setError(dbErrorMessage(e.message));
      return;
    }
    await signOut();
    router.replace({ pathname: '/', params: { deleted: '1' } });
  };

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
          <Field label="確認のため「退会します」と入力" value={confirmText} onChangeText={setConfirmText} />
          {error !== '' && <Notice tone="danger">{error}</Notice>}
          <Button label={busy ? '処理中…' : '退会する'} variant="danger" onPress={deleteAccount} disabled={busy || confirmText.trim() !== '退会します' || profile?.role === 'admin'} />
          {profile?.role === 'admin' && <P sub>管理者アカウントは退会できません。</P>}
          <Button label="やめる" variant="outline" onPress={() => setConfirmDelete(false)} />
        </>
      )}
    </Screen>
  );
}

import { router } from 'expo-router';
import { useState } from 'react';
import { NotYetConnected } from '@/components/StatusNotices';
import { Button, Field, H1, Notice, Screen } from '@/components/ui';
import { isEmail } from '@/lib/validation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!isEmail(email)) e.email = 'メールアドレスの形が正しくありません';
    if (!password) e.password = 'パスワードを入力してください';
    setErrors(e);
    setChecked(Object.keys(e).length === 0);
  };

  return (
    <Screen>
      <H1>ログイン</H1>
      <NotYetConnected step="STEP 4" what="ログイン処理" />
      <Field label="メールアドレス" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errors.email} />
      <Field label="パスワード" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" error={errors.password} />
      <Button label="ログイン" onPress={submit} />
      {checked && <Notice tone="info">入力内容に問題はありません（まだサーバーには送信されません）。</Notice>}
      <Button label="ホーム画面の見た目を確認する" variant="outline" onPress={() => router.push('/home')} />
      <Button label="アカウントをお持ちでない方（新規登録）" variant="outline" onPress={() => router.replace('/signup')} />
    </Screen>
  );
}

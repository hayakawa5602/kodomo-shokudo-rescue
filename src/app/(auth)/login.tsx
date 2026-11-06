import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { NotConfigured } from '@/components/StatusNotices';
import { Button, Field, H1, Notice, Screen } from '@/components/ui';
import { authErrorMessage, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { isEmail } from '@/lib/validation';

export default function Login() {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) return <Redirect href="/home" />;

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!isEmail(email)) e.email = 'メールアドレスの形が正しくありません';
    if (!password) e.password = 'パスワードを入力してください';
    setErrors(e);
    setServerError('');
    if (Object.keys(e).length > 0 || !supabase) return;

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setServerError(authErrorMessage(error.message));
      return;
    }
    router.replace('/home');
  };

  return (
    <Screen>
      <H1>ログイン</H1>
      <NotConfigured />
      <Field label="メールアドレス" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" error={errors.email} />
      <Field label="パスワード" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" error={errors.password} onSubmitEditing={submit} />
      {serverError !== '' && <Notice tone="danger">{serverError}</Notice>}
      <Button label={busy ? 'ログイン中…' : 'ログイン'} onPress={submit} disabled={busy || !supabase} />
      <Button label="アカウントをお持ちでない方（新規登録）" variant="outline" onPress={() => router.replace('/signup')} />
    </Screen>
  );
}

import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Checkbox } from '@/components/Checkbox';
import { NotConfigured } from '@/components/StatusNotices';
import { setSignupDraft } from '@/lib/signupDraft';
import { Button, Field, H1, H2, Notice, P, Screen } from '@/components/ui';
import { isEmail, validatePassword } from '@/lib/validation';
import { colors, font } from '@/theme';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [isAdult, setIsAdult] = useState<boolean | null>(null);
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (!isEmail(email)) e.email = 'メールアドレスの形が正しくありません';
    const pw = validatePassword(password);
    if (pw) e.password = pw;
    if (password !== password2) e.password2 = 'パスワードが一致しません';
    if (isAdult === null) e.age = '年齢区分を選んでください';
    if (isAdult === false && !guardianConsent) e.guardian = '18歳未満の方は保護者の同意が必要です';
    if (!agree) e.agree = '利用規約とプライバシーポリシーへの同意が必要です';
    if (!displayName.trim()) e.displayName = '表示名を入力してください';
    else if (displayName.trim().length > 60) e.displayName = '表示名は60文字以内にしてください';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setSignupDraft({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      isMinor: isAdult === false,
      guardianConsent: isAdult === false && guardianConsent,
    });
    router.push('/role-select');
  };

  return (
    <Screen>
      <H1>新規登録</H1>
      <NotConfigured />
      <Field
        label="表示名"
        required
        hint="団体名・企業名、または地域住民の方はニックネーム。募集や申込で相手に表示されます"
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={60}
        error={errors.displayName}
      />
      <Field label="メールアドレス" required value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" error={errors.email} />
      <Field label="パスワード" required hint="10文字以上・英字と数字を含める" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} />
      <Field label="パスワード（確認）" required value={password2} onChangeText={setPassword2} secureTextEntry error={errors.password2} />

      <H2>年齢の確認</H2>
      <Checkbox label="18歳以上です" checked={isAdult === true} onChange={() => setIsAdult(true)} />
      <Checkbox label="18歳未満です" checked={isAdult === false} onChange={() => setIsAdult(false)} error={errors.age} />
      {isAdult === false && (
        <>
          <Notice tone="warn">
            18歳未満の方は、保護者の方と一緒にこの画面を確認してください。未成年の方は資金支援はできません。保護者の連絡先は次のステップで登録します。
          </Notice>
          <Checkbox label="保護者が利用に同意しています" checked={guardianConsent} onChange={setGuardianConsent} error={errors.guardian} />
        </>
      )}

      <H2>規約への同意</H2>
      <P sub>
        <Text style={{ color: colors.primary, textDecorationLine: 'underline', fontSize: font.md }} onPress={() => router.push('/terms')}>利用規約</Text>
        と
        <Text style={{ color: colors.primary, textDecorationLine: 'underline', fontSize: font.md }} onPress={() => router.push('/privacy')}>プライバシーポリシー</Text>
        を読みました。
      </P>
      <Checkbox label="同意します" checked={agree} onChange={setAgree} error={errors.agree} />

      <Button label="次へ（利用者区分を選ぶ）" variant="accent" onPress={submit} />
    </Screen>
  );
}

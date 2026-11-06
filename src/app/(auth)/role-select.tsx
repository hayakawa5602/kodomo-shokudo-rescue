import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { NotConfigured } from '@/components/StatusNotices';
import { Button, Card, H1, Notice, P, Screen } from '@/components/ui';
import { authErrorMessage } from '@/lib/auth';
import { clearSignupDraft, getSignupDraft } from '@/lib/signupDraft';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/lib/types';
import { colors, font, radius, space } from '@/theme';

const OPTIONS: { key: Exclude<UserRole, 'admin'>; icon: string; title: string; desc: string }[] = [
  { key: 'kodomo_shokudo', icon: '🏠', title: '子ども食堂', desc: '支援を募集する団体の方。団体審査が必要です。' },
  { key: 'company', icon: '🏢', title: '企業', desc: '食品・物資・資金・社員ボランティアで支援。企業審査が必要です。' },
  { key: 'resident', icon: '🙋', title: '地域住民', desc: '個人として食材提供やボランティアで参加。本人確認が必要です。' },
];

/** メール内のリンクを開いたあとに戻ってくる場所（Web版のみ） */
function redirectUrl(): string | undefined {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
  const base = process.env.EXPO_PUBLIC_BASE_PATH ?? '';
  return `${window.location.origin}${base}/login`;
}

export default function RoleSelect() {
  const draft = getSignupDraft();
  const [role, setRole] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);

  // 登録完了（確認メール送信済み）
  if (sentTo) {
    return (
      <Screen>
        <H1>📩 確認メールを送りました</H1>
        <Card>
          <P>{sentTo} あてに確認メールを送りました。</P>
          <P>メールの中のリンクを開くと登録が完了し、ログインできるようになります。</P>
        </Card>
        <Notice tone="info">メールが届かないときは、迷惑メールフォルダも確認してください。</Notice>
        <Button label="ログイン画面へ" onPress={() => router.replace('/login')} />
      </Screen>
    );
  }

  // 新規登録画面を経由せずに来た場合（再読み込みなど）
  if (!draft) {
    return (
      <Screen>
        <H1>最初からやり直してください</H1>
        <P sub>安全のため、入力内容は画面を再読み込みすると消えます。</P>
        <Button label="新規登録画面へ" onPress={() => router.replace('/signup')} />
      </Screen>
    );
  }

  const submit = async () => {
    if (!role || !supabase) return;
    setBusy(true);
    setError('');
    const { data, error: err } = await supabase.auth.signUp({
      email: draft.email,
      password: draft.password,
      options: {
        emailRedirectTo: redirectUrl(),
        // ここで送った区分は、データベース側のトリガーで profiles に保存される。
        // 「admin」を送っても、トリガーが必ず「地域住民」に置き換える。
        data: {
          role,
          display_name: draft.displayName,
          is_minor: draft.isMinor,
          guardian_consent: draft.guardianConsent,
        },
      },
    });
    setBusy(false);
    if (err) {
      setError(authErrorMessage(err.message));
      return;
    }
    clearSignupDraft();
    if (data.session) {
      // メール確認がオフの設定のとき
      router.replace('/home');
    } else {
      // メール確認がオンのとき（登録済みアドレスでも、安全のため同じ画面を出す）
      setSentTo(draft.email);
    }
  };

  const minorBlocked = draft.isMinor && role !== null && role !== 'resident';

  return (
    <Screen>
      <H1>どの立場で使いますか？</H1>
      <P sub>あとから変更するには、運営者への申請が必要です。</P>
      <NotConfigured />
      {OPTIONS.map((o) => {
        const selected = role === o.key;
        const disabled = draft.isMinor && o.key !== 'resident';
        return (
          <Pressable
            key={o.key}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            onPress={() => !disabled && setRole(o.key)}
            style={{
              flexDirection: 'row',
              gap: space.md,
              alignItems: 'center',
              padding: space.md,
              marginBottom: space.md,
              borderRadius: radius.lg,
              borderWidth: 2.5,
              borderColor: selected ? colors.primary : colors.border,
              backgroundColor: selected ? colors.primarySoft : colors.surface,
              opacity: disabled ? 0.4 : 1,
            }}
          >
            <Text style={{ fontSize: 40 }}>{o.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: font.lg, fontWeight: '800', color: colors.text }}>{o.title}</Text>
              <Text style={{ fontSize: font.sm, color: colors.textSub, marginTop: 4 }}>
                {disabled ? '18歳未満の方は選べません' : o.desc}
              </Text>
            </View>
          </Pressable>
        );
      })}
      {error !== '' && <Notice tone="danger">{error}</Notice>}
      <Button
        label={busy ? '登録中…' : 'この区分で登録する'}
        variant="accent"
        disabled={!role || busy || minorBlocked || !supabase}
        onPress={submit}
      />
    </Screen>
  );
}

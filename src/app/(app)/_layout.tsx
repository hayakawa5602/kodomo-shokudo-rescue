import { Redirect, Stack, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

/** ログインしていなくても見られる画面（募集の一覧と詳細） */
function isPublic(segments: string[]): boolean {
  const s = segments.slice(1); // 先頭の "(app)" を除く
  if (s[0] !== 'requests') return false;
  if (s.length === 1) return true; // 一覧
  if (s.length === 2 && s[1] === '[id]') return true; // 詳細
  if (s.length === 3 && s[1] === '[id]' && s[2] === 'index') return true;
  return false;
}

// ログイン後の画面群。未ログインならログイン画面へ戻す。
// ※画面の出し分けは使いやすさのため。データの保護はDBのRLSで行っている。
export default function AppLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments() as string[];

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  if (!session && !isPublic(segments)) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="home" options={{ title: 'ホーム' }} />
      <Stack.Screen name="verification" options={{ title: '本人確認・団体審査' }} />
      <Stack.Screen name="requests/index" options={{ title: '支援の募集' }} />
      <Stack.Screen name="requests/new" options={{ title: '募集をつくる' }} />
      <Stack.Screen name="requests/[id]/index" options={{ title: '募集の詳細' }} />
      <Stack.Screen name="requests/[id]/apply" options={{ title: '支援を申し込む' }} />
      <Stack.Screen name="applications" options={{ title: '申込の管理' }} />
      <Stack.Screen name="notifications" options={{ title: 'お知らせ' }} />
      <Stack.Screen name="mypage" options={{ title: 'マイページ' }} />
      <Stack.Screen name="history" options={{ title: '支援履歴' }} />
    </Stack>
  );
}

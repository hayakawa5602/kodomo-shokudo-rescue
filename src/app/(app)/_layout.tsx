import { Stack } from 'expo-router';
import { colors } from '@/theme';

// ログイン後の画面群。STEP 4 で「未ログインならログイン画面へ戻す」処理を追加する。
export default function AppLayout() {
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

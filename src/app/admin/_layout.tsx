import { Stack } from 'expo-router';
import { colors } from '@/theme';

// 管理者専用。STEP 8 で「profiles.role = admin 以外は表示しない」ガードを追加する。
// ※画面を隠すのは使いやすさのため。本当の権限チェックはDBのRLSとEdge Functionsで行う。
export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ title: '管理者ダッシュボード' }} />
    </Stack>
  );
}

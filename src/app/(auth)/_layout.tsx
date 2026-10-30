import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700', color: colors.text },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="login" options={{ title: 'ログイン' }} />
      <Stack.Screen name="signup" options={{ title: '新規登録' }} />
      <Stack.Screen name="role-select" options={{ title: '利用者区分の選択' }} />
    </Stack>
  );
}

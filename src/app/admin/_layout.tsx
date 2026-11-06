import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { H1, P, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors } from '@/theme';

// 管理者専用。管理者以外には画面を出さない。
// ※本当の権限チェックはDBのRLSと管理者専用関数（is_admin()）で行っている。
export default function AdminLayout() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  if (!session) return <Redirect href="/login" />;
  if (profile?.role !== 'admin' || profile.is_suspended) {
    return (
      <Screen>
        <H1>このページは見られません</H1>
        <P sub>管理者専用のページです。</P>
      </Screen>
    );
  }

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

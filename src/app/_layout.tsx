import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { fontWeight: '700', color: colors.text },
          contentStyle: { backgroundColor: colors.bg },
          headerBackTitle: '戻る',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false, title: 'こども食堂レスキュー' }} />
        <Stack.Screen name="terms" options={{ title: '利用規約' }} />
        <Stack.Screen name="privacy" options={{ title: 'プライバシーポリシー' }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

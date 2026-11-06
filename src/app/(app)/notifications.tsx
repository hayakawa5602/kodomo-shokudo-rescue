import { Href, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NotConfigured } from '@/components/StatusNotices';
import { H1, P, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { colors, font, radius, space } from '@/theme';

type Notification = { id: string; kind: string; body: string; link: string | null; read_at: string | null; created_at: string };

// お知らせ：審査結果・申込の到着・承認／見送り・完了など。通知の作成はDB側のトリガーと管理者関数が行う。
export default function Notifications() {
  const { session, refreshProfile } = useAuth();
  const [items, setItems] = useState<Notification[] | null>(null);

  const load = async () => {
    if (!supabase || !session) return;
    const { data } = await supabase
      .from('notifications')
      .select('id, kind, body, link, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(50);
    setItems((data as Notification[]) ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id]);

  const open = async (n: Notification) => {
    if (supabase && !n.read_at) {
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', n.id);
      setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)) ?? null);
    }
    if (n.kind.startsWith('verification_')) await refreshProfile();
    if (n.link) router.push(n.link as Href);
  };

  return (
    <Screen>
      <H1>お知らせ</H1>
      <NotConfigured />
      {items === null && <P sub>読み込み中…</P>}
      {items?.length === 0 && <P sub>お知らせはまだありません。</P>}
      {items?.map((n) => (
        <Pressable
          key={n.id}
          accessibilityRole="button"
          onPress={() => open(n)}
          style={({ pressed }) => ({
            backgroundColor: n.read_at ? colors.surface : colors.primarySoft,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            padding: space.md,
            marginBottom: space.sm,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {!n.read_at && <Text style={{ color: colors.accent, fontSize: font.lg }}>●</Text>}
            <Text style={{ fontSize: font.md, color: colors.text, flex: 1, lineHeight: font.md * 1.5 }}>{n.body}</Text>
          </View>
          <Text style={{ fontSize: font.xs, color: colors.textSub, marginTop: 4 }}>{new Date(n.created_at).toLocaleString('ja-JP')}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

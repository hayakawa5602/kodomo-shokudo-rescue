import { Href, router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ProfileStatus } from '@/components/ProfileStatus';
import { DemoBanner } from '@/components/StatusNotices';
import { Card, H1, H2, Notice, P, Screen } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import { colors, font, radius, space } from '@/theme';

type MenuItem = { icon: string; label: string; href: Href; roles?: UserRole[] };
const MENU: MenuItem[] = [
  { icon: '🔍', label: '募集をさがす', href: '/requests' },
  { icon: '✏️', label: '募集をつくる', href: '/requests/new', roles: ['kodomo_shokudo'] },
  { icon: '📋', label: '申込の管理', href: '/applications' },
  { icon: '🔔', label: 'お知らせ', href: '/notifications' },
  { icon: '📜', label: '支援履歴', href: '/history' },
  { icon: '👤', label: 'マイページ', href: '/mypage' },
  { icon: '🛡️', label: '管理者画面', href: '/admin', roles: ['admin'] },
];

export default function Home() {
  const { profile, refreshProfile } = useAuth();
  useEffect(() => {
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const status = profile?.verification_status;
  const menu = MENU.filter((m) => !m.roles || (profile && m.roles.includes(profile.role)));

  return (
    <Screen>
      <H1>ホーム</H1>
      {profile ? (
        <Card>
          <ProfileStatus profile={profile} />
        </Card>
      ) : (
        <Notice tone="warn">登録情報を読み込めませんでした。再読み込みしてください。</Notice>
      )}

      {profile?.is_suspended && <Notice tone="danger">このアカウントは利用停止中です。運営者にお問い合わせください。</Notice>}
      {status && status !== 'approved' && profile?.role !== 'admin' && (
        <>
          <Notice tone={status === 'rejected' ? 'danger' : 'warn'}>
            {status === 'pending'
              ? '本人確認・団体審査の結果をお待ちください。承認されると、募集の作成や支援の申込ができます。'
              : status === 'rejected'
                ? '審査が承認されませんでした。お知らせで理由を確認し、もう一度申請してください。'
                : '本人確認・団体審査がまだです。承認されると、募集の作成や支援の申込ができます。'}
          </Notice>
          {status !== 'pending' && (
            <Card>
              <Pressable onPress={() => router.push('/verification')} accessibilityRole="button">
                <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.primary }}>▶ 本人確認・団体審査を申請する</Text>
              </Pressable>
            </Card>
          )}
        </>
      )}

      <DemoBanner />
      <H2>メニュー</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
        {menu.map((m) => (
          <Pressable
            key={m.label}
            accessibilityRole="button"
            onPress={() => router.push(m.href)}
            style={({ pressed }) => ({
              width: '47%',
              minHeight: 110,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ fontSize: 34 }}>{m.icon}</Text>
            <Text style={{ fontSize: font.md, fontWeight: '700', color: colors.text, marginTop: 6 }}>{m.label}</Text>
          </Pressable>
        ))}
      </View>
      <P sub>※ 募集・申込・通知などは STEP 6 以降で順に使えるようになります。</P>
    </Screen>
  );
}

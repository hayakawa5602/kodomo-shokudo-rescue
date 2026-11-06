import { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { UserRole, VerificationStatus } from './types';

export type Profile = {
  id: string;
  role: UserRole;
  display_name: string;
  region: string | null;
  is_minor: boolean;
  verification_status: VerificationStatus;
  is_suspended: boolean;
};

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!supabase || !s) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, role, display_name, region, is_minor, verification_status, is_suspended')
      .eq('id', s.user.id)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadProfile(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // onAuthStateChange の中で直接 await すると処理が止まることがあるため、少し遅らせて読み込む
      setTimeout(() => loadProfile(s), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value: AuthState = {
    session,
    profile,
    loading,
    refreshProfile: () => loadProfile(session),
    signOut: async () => {
      await supabase?.auth.signOut();
      setProfile(null);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

/** Supabase のエラー文を、利用者に分かる日本語に置き換える */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'メールアドレスまたはパスワードが違います。';
  if (m.includes('email not confirmed'))
    return 'メールアドレスの確認がまだです。届いた確認メールのリンクを開いてから、ログインしてください。';
  if (m.includes('rate limit') || m.includes('security purposes'))
    return '短時間に操作が続いたため、一時的に制限されています。しばらく待ってからもう一度お試しください。';
  if (m.includes('password') && m.includes('weak')) return 'パスワードが簡単すぎます。別のパスワードにしてください。';
  if (m.includes('already registered')) return 'このメールアドレスはすでに登録されています。ログインしてください。';
  if (m.includes('network') || m.includes('fetch')) return '通信できませんでした。インターネット接続を確認してください。';
  if (m.includes('signups not allowed')) return '現在、新規登録を受け付けていません。';
  return '処理できませんでした。時間をおいてもう一度お試しください。（' + message + '）';
}

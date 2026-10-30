import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// 注意：ここで使うのは「anon（公開用）キー」だけ。
// service_role キーは絶対にアプリ側に置かない（Edge Functions の環境変数でのみ使用）。
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;

// デモ表示中かどうか（Supabase未接続ならデモデータのみ表示）
export const isDemoMode = !isSupabaseConfigured || process.env.EXPO_PUBLIC_APP_ENV === 'demo';

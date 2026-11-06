import * as DocumentPicker from 'expo-document-picker';
import { supabase } from './supabase';
import { VerificationStatus } from './types';

export const BUCKET = 'verification-docs';
export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // バケット側の上限と同じ
const ALLOWED = ['image/jpeg', 'image/png', 'application/pdf'];

export type PickedFile = { name: string; uri: string; size?: number; mimeType?: string };

export type VerificationRequest = {
  id: string;
  user_id: string;
  document_paths: string[];
  status: VerificationStatus;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

/** 書類を選ぶ（画像・PDF、複数可） */
export async function pickDocuments(): Promise<{ files: PickedFile[]; error?: string }> {
  const res = await DocumentPicker.getDocumentAsync({ type: ALLOWED, multiple: true, copyToCacheDirectory: true });
  if (res.canceled) return { files: [] };
  const files: PickedFile[] = [];
  for (const a of res.assets) {
    if (a.size != null && a.size > MAX_FILE_BYTES) return { files: [], error: `${a.name} は5MBを超えています。小さくしてから選び直してください。` };
    if (a.mimeType && !ALLOWED.includes(a.mimeType)) return { files: [], error: `${a.name} は対応していない形式です（JPEG・PNG・PDFのみ）。` };
    files.push({ name: a.name, uri: a.uri, size: a.size ?? undefined, mimeType: a.mimeType ?? undefined });
  }
  return { files };
}

function safeName(name: string) {
  const ext = (name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
}

/** 書類をアップロードし、保存先のパス一覧を返す。パスは <ユーザーID>/<ファイル名>（RLSの条件） */
export async function uploadDocuments(userId: string, files: PickedFile[]): Promise<string[]> {
  if (!supabase) throw new Error('not configured');
  const paths: string[] = [];
  for (const f of files) {
    const blob = await (await fetch(f.uri)).blob();
    const path = `${userId}/${safeName(f.name)}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: f.mimeType, upsert: false });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

export async function fetchLatestRequest(userId: string): Promise<VerificationRequest | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('verification_requests')
    .select('id, user_id, document_paths, status, review_note, created_at, reviewed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as VerificationRequest) ?? null;
}

export type ContactInput = { contactName: string; address: string; phone: string; region: string };

/** 連絡先を保存し、審査を申請する */
export async function submitVerification(userId: string, contact: ContactInput, files: PickedFile[]) {
  if (!supabase) throw new Error('not configured');
  const paths = await uploadDocuments(userId, files);
  const p1 = await supabase
    .from('profile_private')
    .update({ contact_name: contact.contactName, address: contact.address, phone: contact.phone, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (p1.error) throw p1.error;
  const p2 = await supabase.from('profiles').update({ region: contact.region }).eq('id', userId);
  if (p2.error) throw p2.error;
  const p3 = await supabase.from('verification_requests').insert({ user_id: userId, document_paths: paths });
  if (p3.error) throw p3.error;
}

/** 所在地の文字列から市区町村（公開用）を取り出す。例「名古屋市東区出来町3-6-23」→「名古屋市東区」 */
export function extractRegion(address: string): string {
  const m = address.replace(/^愛知県/, '').match(/^(.+?[市郡].+?[区町村]|.+?[市区町村])/);
  return m ? m[1] : address.slice(0, 20);
}

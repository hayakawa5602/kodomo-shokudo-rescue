import { DEMO_REQUESTS } from '@/demo/requests';
import { isSupabaseConfigured, supabase } from './supabase';
import { Handover, RequestCategory, RequestStatus, Storage, SupportRequest } from './types';
import { RequestDraft } from './validation';

/** 架空のデモ募集も一覧に混ぜて表示するか（試作公開中は on） */
export const showDemoRequests = process.env.EXPO_PUBLIC_APP_ENV === 'demo' || !isSupabaseConfigured;
export const isDemoId = (id: string) => id.startsWith('demo-');

type Row = {
  id: string;
  owner_id: string;
  category: RequestCategory;
  title: string;
  description: string;
  region: string;
  deadline: string;
  status: RequestStatus;
  food_items: string | null;
  quantity: string | null;
  storage: Storage | null;
  handover: Handover[] | null;
  target_amount: number | null;
  volunteer_date: string | null;
  volunteer_count: number | null;
  created_at: string;
  profiles: { display_name: string } | null;
};

const COLS =
  'id, owner_id, category, title, description, region, deadline, status, food_items, quantity, storage, handover, target_amount, volunteer_date, volunteer_count, created_at, profiles!support_requests_owner_id_fkey(display_name)';

function toRequest(r: Row): SupportRequest {
  return {
    id: r.id,
    ownerId: r.owner_id,
    title: r.title,
    category: r.category,
    region: r.region,
    orgName: r.profiles?.display_name ?? '（団体名なし）',
    description: r.description,
    status: r.status,
    deadline: r.deadline,
    foodItems: r.food_items ?? undefined,
    quantity: r.quantity ?? undefined,
    storage: r.storage ?? undefined,
    handover: r.handover ?? undefined,
    targetAmount: r.target_amount ?? undefined,
    volunteerDate: r.volunteer_date ?? undefined,
    volunteerCount: r.volunteer_count ?? undefined,
  };
}

/** 公開中の募集（実データ＋必要ならデモ） */
export async function fetchOpenRequests(): Promise<SupportRequest[]> {
  let real: SupportRequest[] = [];
  if (supabase) {
    const { data } = await supabase.from('support_requests').select(COLS).eq('status', 'open').order('created_at', { ascending: false }).limit(100);
    real = ((data as unknown as Row[]) ?? []).map(toRequest);
  }
  return showDemoRequests ? [...real, ...DEMO_REQUESTS] : real;
}

export async function fetchRequest(id: string): Promise<SupportRequest | null> {
  if (isDemoId(id)) return DEMO_REQUESTS.find((r) => r.id === id) ?? null;
  if (!supabase) return null;
  const { data } = await supabase.from('support_requests').select(COLS).eq('id', id).maybeSingle();
  return data ? toRequest(data as unknown as Row) : null;
}

/** 自分が出した募集（子ども食堂） */
export async function fetchMyRequests(userId: string): Promise<SupportRequest[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('support_requests').select(COLS).eq('owner_id', userId).order('created_at', { ascending: false });
  return ((data as unknown as Row[]) ?? []).map(toRequest);
}

export async function createRequest(userId: string, d: RequestDraft): Promise<string> {
  if (!supabase) throw new Error('not configured');
  const row = {
    owner_id: userId,
    category: d.category,
    title: d.title.trim(),
    description: d.description.trim(),
    region: d.region,
    deadline: d.deadline,
    food_items: d.category === 'food' ? d.foodItems.trim() : null,
    quantity: d.category === 'food' && d.quantity.trim() ? d.quantity.trim() : null,
    storage: d.category === 'food' ? d.storage : null,
    handover: d.category === 'food' ? d.handover : null,
    target_amount: d.category === 'fund' ? Number(d.targetAmount) : null,
    volunteer_date: d.category === 'volunteer' ? d.volunteerDate : null,
    volunteer_count: d.category === 'volunteer' ? Number(d.volunteerCount) : null,
  };
  const { data, error } = await supabase.from('support_requests').insert(row).select('id').single();
  if (error) throw error;
  return data.id as string;
}

/** 募集の状態変更（募集者のみ。open→closed／completed、closed→open） */
export async function setRequestStatus(id: string, status: 'open' | 'closed' | 'completed') {
  if (!supabase) throw new Error('not configured');
  const { error } = await supabase.from('support_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function reportRequest(userId: string, requestId: string, reason: string) {
  if (!supabase) throw new Error('not configured');
  const { error } = await supabase.from('reports').insert({ reporter_id: userId, request_id: requestId, reason: reason.trim() });
  if (error) throw error;
}

/** DBのエラーを利用者向けの日本語に */
export function dbErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('row-level security') || m.includes('violates row-level security'))
    return 'この操作を行う権限がありません。審査が承認済みか、利用者区分が合っているかを確認してください。';
  if (m.includes('duplicate key') && m.includes('applications')) return 'この募集にはすでに申し込んでいます。';
  if (m.includes('duplicate key') && m.includes('reports')) return 'この募集はすでに通報済みです。';
  if (m.includes('この状態の変更はできません')) return 'この状態からは変更できません。画面を更新してください。';
  if (m.includes('check constraint') || m.includes('violates check')) return '入力内容に不備があります。必須項目や数値の範囲を確認してください。';
  if (m.includes('network') || m.includes('fetch')) return '通信できませんでした。インターネット接続を確認してください。';
  return '処理できませんでした。時間をおいてもう一度お試しください。（' + message + '）';
}

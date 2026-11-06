import { supabase } from './supabase';
import { ApplicationStatus, Handover, RequestCategory, Storage, UserRole } from './types';
import { FoodOfferDraft } from './validation';

export type Application = {
  id: string;
  request_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  message: string | null;
  decision_note: string | null;
  item_name: string | null;
  offer_quantity: string | null;
  expiry_kind: 'best_before' | 'use_by' | null;
  expiry_date: string | null;
  storage: Storage | null;
  allergens: string[];
  unopened: boolean | null;
  handover: Handover | null;
  created_at: string;
  updated_at: string;
  support_requests: { title: string; category: RequestCategory; owner_id: string; region: string } | null;
  profiles: { display_name: string; role: UserRole } | null; // 申込者
};

const COLS =
  'id, request_id, applicant_id, status, message, decision_note, item_name, offer_quantity, expiry_kind, expiry_date, storage, allergens, unopened, handover, created_at, updated_at, ' +
  'support_requests!applications_request_id_fkey(title, category, owner_id, region), profiles!applications_applicant_id_fkey(display_name, role)';

export type Contact = { contact_name: string | null; phone: string | null; address: string | null };

/** 自分に関係する申込をすべて取得（RLSにより、申込者本人・募集者・管理者の分だけ返る） */
export async function fetchMyApplications(): Promise<Application[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('applications').select(COLS).order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return (data as unknown as Application[]) ?? [];
}

export async function applyToRequest(
  userId: string,
  requestId: string,
  category: RequestCategory,
  message: string,
  food?: FoodOfferDraft,
) {
  if (!supabase) throw new Error('not configured');
  const row: Record<string, unknown> = { request_id: requestId, applicant_id: userId, message: message.trim() || null };
  if (category === 'food' && food) {
    Object.assign(row, {
      item_name: food.itemName.trim(),
      offer_quantity: food.quantity.trim(),
      expiry_kind: food.expiryType,
      expiry_date: food.expiryDate,
      storage: food.storage,
      allergens: food.allergens,
      unopened: food.unopened,
      handover: food.handover,
    });
  }
  const { error } = await supabase.from('applications').insert(row);
  if (error) throw error;
}

/** 状態変更。許される遷移かどうかはDBのトリガーが最終判断する */
export async function updateApplicationStatus(id: string, status: ApplicationStatus, decisionNote?: string) {
  if (!supabase) throw new Error('not configured');
  const patch: Record<string, unknown> = { status };
  if (decisionNote !== undefined) patch.decision_note = decisionNote.trim() || null;
  const { error } = await supabase.from('applications').update(patch).eq('id', id);
  if (error) throw error;
}

/** 承認後にだけ見られる相手の連絡先（RLSの is_counterparty で制御） */
export async function fetchContact(userId: string): Promise<Contact | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('profile_private').select('contact_name, phone, address').eq('id', userId).maybeSingle();
  return (data as Contact) ?? null;
}

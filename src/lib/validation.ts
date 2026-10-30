// 入力検証。画面側とDB側（CHECK制約・Edge Functions）の両方で同じルールをかける。
// 画面側の検証は「使いやすさ」のため、DB側の検証は「不正対策」のため。

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export function validatePassword(v: string): string | undefined {
  if (v.length < 10) return 'パスワードは10文字以上にしてください';
  if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v)) return '英字と数字の両方を含めてください';
  return undefined;
}

export const isDate = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + 'T00:00:00');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

export const isFutureOrToday = (v: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(v + 'T00:00:00') >= today;
};

export type RequestDraft = {
  title: string;
  category: 'food' | 'fund' | 'volunteer' | '';
  region: string;
  description: string;
  deadline: string;
  foodItems: string;
  quantity: string;
  storage: string;
  allergens: string[];
  handover: string[];
  targetAmount: string;
  volunteerDate: string;
  volunteerCount: string;
};

export function validateRequest(d: RequestDraft): Record<string, string> {
  const e: Record<string, string> = {};
  if (!d.title.trim()) e.title = 'タイトルを入力してください';
  else if (d.title.length > 60) e.title = 'タイトルは60文字以内にしてください';
  if (!d.category) e.category = '募集の種類を選んでください';
  if (!d.region) e.region = '地域を選んでください';
  if (d.description.trim().length < 20) e.description = '内容は20文字以上で具体的に書いてください';
  if (d.description.length > 1000) e.description = '内容は1000文字以内にしてください';
  if (!isDate(d.deadline)) e.deadline = '締切日を 2026-12-31 の形で入力してください';
  else if (!isFutureOrToday(d.deadline)) e.deadline = '締切日は今日以降にしてください';

  if (d.category === 'food') {
    if (!d.foodItems.trim()) e.foodItems = 'ほしい食材を入力してください';
    if (!d.storage) e.storage = '保存状態を選んでください';
    if (d.handover.length === 0) e.handover = '受け渡し方法を1つ以上選んでください';
  }
  if (d.category === 'fund') {
    const n = Number(d.targetAmount);
    if (!Number.isInteger(n) || n < 1000 || n > 10_000_000) e.targetAmount = '目標金額は1,000円〜1,000万円の整数で入力してください';
  }
  if (d.category === 'volunteer') {
    if (!isDate(d.volunteerDate)) e.volunteerDate = '活動日を 2026-12-31 の形で入力してください';
    const n = Number(d.volunteerCount);
    if (!Number.isInteger(n) || n < 1 || n > 100) e.volunteerCount = '人数は1〜100で入力してください';
  }
  return e;
}

/** 食材提供の申込時、提供者に確認してもらう項目 */
export type FoodOfferDraft = {
  itemName: string;
  quantity: string;
  expiryType: 'best_before' | 'use_by' | '';
  expiryDate: string;
  storage: string;
  allergens: string[];
  unopened: boolean;
  handover: string;
};

export function validateFoodOffer(d: FoodOfferDraft): Record<string, string> {
  const e: Record<string, string> = {};
  if (!d.itemName.trim()) e.itemName = '品名を入力してください';
  if (!d.quantity.trim()) e.quantity = '数量を入力してください';
  if (!d.expiryType) e.expiryType = '賞味期限か消費期限かを選んでください';
  if (!isDate(d.expiryDate)) e.expiryDate = '期限を 2026-12-31 の形で入力してください';
  else if (!isFutureOrToday(d.expiryDate)) e.expiryDate = '期限切れの食品は提供できません';
  if (!d.storage) e.storage = '保存状態を選んでください';
  if (!d.unopened) e.unopened = '未開封の食品のみ提供できます';
  if (!d.handover) e.handover = '受け渡し方法を選んでください';
  return e;
}

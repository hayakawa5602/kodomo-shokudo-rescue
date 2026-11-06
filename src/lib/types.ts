// アプリ全体で使う区分・状態の定義（DBの enum と一致させる）

export type UserRole = 'kodomo_shokudo' | 'company' | 'resident' | 'admin';
export const ROLE_LABEL: Record<UserRole, string> = {
  kodomo_shokudo: '子ども食堂',
  company: '企業',
  resident: '地域住民',
  admin: '管理者',
};

export type VerificationStatus = 'unsubmitted' | 'pending' | 'approved' | 'rejected';
export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  unsubmitted: '未申請',
  pending: '審査中',
  approved: '承認済み',
  rejected: '却下',
};

export type RequestCategory = 'food' | 'fund' | 'volunteer';
export const CATEGORY_LABEL: Record<RequestCategory, string> = {
  food: '食材',
  fund: '資金',
  volunteer: '人手（ボランティア）',
};
export const CATEGORY_ICON: Record<RequestCategory, string> = {
  food: '🥕',
  fund: '💰',
  volunteer: '🤝',
};

export type RequestStatus = 'open' | 'closed' | 'completed' | 'hidden';
export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  open: '募集中',
  closed: '募集終了',
  completed: '支援完了',
  hidden: '非公開（通報対応中）',
};

export type ApplicationStatus = 'applied' | 'approved' | 'rejected' | 'completed' | 'cancelled';
export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  applied: '申込済み（確認待ち）',
  approved: '承認',
  rejected: '見送り',
  completed: '受け渡し完了',
  cancelled: '取り消し',
};

export type Storage = 'room' | 'chilled' | 'frozen';
export const STORAGE_LABEL: Record<Storage, string> = {
  room: '常温',
  chilled: '冷蔵',
  frozen: '冷凍',
};

// 特定原材料（表示義務8品目）
export const ALLERGENS = ['えび', 'かに', 'くるみ', '小麦', 'そば', '卵', '乳', '落花生'] as const;

export const HANDOVER_LABEL = {
  bring: '食堂へ持ち込み',
  pickup: '食堂が受け取りに行く',
  delivery: '配送',
} as const;
export type Handover = keyof typeof HANDOVER_LABEL;

// 愛知県内の市区町村から開始（地域別検索用）
export const REGIONS = [
  '名古屋市千種区', '名古屋市東区', '名古屋市北区', '名古屋市西区', '名古屋市中村区',
  '名古屋市中区', '名古屋市昭和区', '名古屋市瑞穂区', '名古屋市熱田区', '名古屋市中川区',
  '名古屋市港区', '名古屋市南区', '名古屋市守山区', '名古屋市緑区', '名古屋市名東区',
  '名古屋市天白区', 'その他（愛知県内）',
] as const;

export type SupportRequest = {
  id: string;
  ownerId?: string;
  title: string;
  category: RequestCategory;
  region: string;
  orgName: string;
  description: string;
  status: RequestStatus;
  deadline: string; // YYYY-MM-DD
  // 食材
  foodItems?: string;
  quantity?: string;
  storage?: Storage;
  handover?: Handover[];
  // 資金
  targetAmount?: number;
  // 人手
  volunteerDate?: string;
  volunteerCount?: number;
};

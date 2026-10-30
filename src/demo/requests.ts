// ⚠️ デモデータ専用ファイル。架空の団体・内容です。本番データには絶対に混ぜないこと。
// Supabase 接続後は、このファイルは isDemoMode のときだけ使われます。
import { SupportRequest } from '@/lib/types';

export const DEMO_REQUESTS: SupportRequest[] = [
  {
    id: 'demo-1',
    title: '【デモ】お米とお野菜を募集しています',
    category: 'food',
    region: '名古屋市東区',
    orgName: 'デモ子ども食堂 ひだまり',
    description:
      '毎週土曜日に約40食を提供しています。お米と根菜類が不足しています。未開封・期限内のものに限ります。',
    status: 'open',
    deadline: '2026-11-30',
    foodItems: 'お米、にんじん、たまねぎ、じゃがいも',
    quantity: 'お米 30kg、野菜 各5kg程度',
    storage: 'room',
    handover: ['bring', 'pickup'],
  },
  {
    id: 'demo-2',
    title: '【デモ】年末イベントの調理ボランティア',
    category: 'volunteer',
    region: '名古屋市西区',
    orgName: 'デモ子ども食堂 みどりの家',
    description: '12月の年末イベントで、調理と配膳を手伝ってくださる方を募集します。調理経験は問いません。',
    status: 'open',
    deadline: '2026-12-10',
    volunteerDate: '2026-12-20',
    volunteerCount: 6,
  },
  {
    id: 'demo-3',
    title: '【デモ】冷蔵庫の買い替え資金',
    category: 'fund',
    region: '名古屋市北区',
    orgName: 'デモ子ども食堂 えがお',
    description: '業務用冷蔵庫が故障しました。食材を安全に保管するため、買い替え費用の支援をお願いします。',
    status: 'open',
    deadline: '2027-01-31',
    targetAmount: 150000,
  },
  {
    id: 'demo-4',
    title: '【デモ】冷凍の肉・魚',
    category: 'food',
    region: '名古屋市中区',
    orgName: 'デモ子ども食堂 ひだまり',
    description: 'たんぱく質のおかずを増やしたいため、冷凍の肉・魚を募集します。冷凍状態での受け渡しが必須です。',
    status: 'open',
    deadline: '2026-11-20',
    foodItems: '冷凍鶏肉、冷凍魚（切り身）',
    quantity: '各5kg程度',
    storage: 'frozen',
    handover: ['delivery', 'bring'],
  },
];

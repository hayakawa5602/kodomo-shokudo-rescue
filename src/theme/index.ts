// デザイントークン：温かみ・安心感・信頼感（緑・クリーム・オレンジ）
export const colors = {
  primary: '#2E7D4F', // メインの緑
  primaryDark: '#1F5C39',
  primarySoft: '#E3F1E7',
  accent: '#E8782A', // アクセントのオレンジ
  accentSoft: '#FDEBDD',
  bg: '#FFFBF3', // 淡いクリーム
  surface: '#FFFFFF',
  text: '#23302A',
  textSub: '#5B6A62',
  border: '#E4DED0',
  danger: '#C0392B',
  dangerSoft: '#FBE7E4',
  info: '#2A6FB0',
  infoSoft: '#E4EEF8',
} as const;

// 子どもや高齢者にも読みやすい大きめの文字
export const font = {
  xs: 13,
  sm: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 14, lg: 20, pill: 999 } as const;

// タップしやすい最小の高さ（アクセシビリティ指針の44pt以上）
export const touchMin = 52;

// 新規登録の入力内容を「新規登録画面」→「利用者区分の選択画面」へ受け渡すための一時置き場。
// パスワードをURLに載せないために、メモリ上だけで保持し、登録後すぐに消す。
export type SignupDraft = {
  email: string;
  password: string;
  displayName: string;
  isMinor: boolean;
  guardianConsent: boolean;
};

let draft: SignupDraft | null = null;

export const setSignupDraft = (d: SignupDraft) => {
  draft = d;
};
export const getSignupDraft = () => draft;
export const clearSignupDraft = () => {
  draft = null;
};

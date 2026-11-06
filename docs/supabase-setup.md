# Supabase の準備手順（STEP 3）

所要時間：約15分。無料プランで始められます。

## 1. アカウントとプロジェクトを作る

1. https://supabase.com を開き「Start your project」→ GitHub アカウントでサインイン
2. 「New project」を押す
3. 次のように入力
   - **Name**：`kodomo-shokudo-rescue`
   - **Database Password**：「Generate a password」で自動生成し、**パスワード管理アプリなど安全な場所に保存**（GitHubやチャットには書かない）
   - **Region**：`Northeast Asia (Tokyo)`
4. 「Create new project」を押し、2分ほど待つ

## 2. アプリに入れる値を確認する

左下の歯車（Project Settings）→「API」（または「API Keys」）を開き、次の2つを控えます。

| 項目 | 使う場所 | 共有してよいか |
|---|---|---|
| Project URL | `.env` の `EXPO_PUBLIC_SUPABASE_URL` | ○ |
| anon public（publishable）キー | `.env` の `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ○（公開前提のキー） |
| service_role（secret）キー | **使わない**（後でサーバー側の機能だけで使用） | **×絶対に共有・コミットしない** |

## 3. データベースを作る

1. 左メニュー「SQL Editor」→「New query」
2. `supabase/migrations/` の中のファイルを、**ファイル名の順に1つずつ**、中身を全部貼り付けて「Run」
   - `20261030000000_initial_schema.sql`（テーブル・権限）
   - `20261106000000_admin_reports_and_account_deletion.sql`（通報対応・退会）
3. 左メニュー「Table Editor」に `profiles`・`support_requests` などが表示されれば成功

> すでに1本目を実行済みのプロジェクトでは、新しく追加されたファイルだけを実行してください。

## 4. 認証の設定

「Authentication」→「Sign In / Providers」→「Email」が有効になっていることを確認します。
試作の間は「Confirm email」をオンのままにしてください（なりすまし登録の防止）。

### 確認メールのリンク先（URL Configuration）

「Authentication」→「URL Configuration」で次のように設定します。

- **Site URL**：`https://hayakawa5602.github.io/kodomo-shokudo-rescue/`
- **Redirect URLs**（「Add URL」で2つ追加）
  - `https://hayakawa5602.github.io/kodomo-shokudo-rescue/**`
  - `http://localhost:8081/**`（自分のパソコンで開発するとき用）

設定しないと、確認メールのリンクを押したときに「localhost」が開いてしまいます。

### 確認メールの注意（Supabase標準のメール送信）

Supabase標準のメール送信は、**そのSupabase組織のメンバーのメールアドレスにしか届きません**。また1時間に送れる通数にも上限があります。

- 先生ご自身のアドレスでのテスト → そのまま届きます
- 生徒や他の先生にテストしてもらう → 次のどちらかが必要です
  1. 「Authentication」→「Sign In / Providers」→「Email」の「Confirm email」をオフにする（試作中のみ。登録後すぐログインできる）
  2. 学校で使える送信用メール（SMTP）を「Authentication」→「Emails」→「SMTP Settings」に設定する

## 5. 最初の管理者を決める

管理者はアプリからは絶対に作れない設計です。

1. アプリで通常どおり新規登録する（STEP 4 完成後）
2. SQL Editor で次を実行（メールアドレスは管理者のものに置き換え）

```sql
select set_config('app.admin_action', 'on', false);
update public.profiles set role = 'admin', verification_status = 'approved'
where id = (select id from auth.users where email = 'admin@example.com');
select set_config('app.admin_action', 'off', false);
```

> 管理者は先生など、運営に責任を持つ大人に限定してください。

設定後、そのアカウントでログインし直すと、ホームに「管理者画面」が表示されます。

## 6. 審査の流れ（管理者）

1. 利用者がアプリの「本人確認・団体審査」から書類を提出すると、状態が「審査中」になる
2. 管理者は「管理者画面」→「本人確認・団体審査」で申請を確認する（書類は10分間だけ有効な安全なリンクで開く）
3. 「承認する」または理由を書いて「却下する」を押す。結果は本人の「お知らせ」に届く
4. 却下された利用者は、理由を見て再申請できる

管理者の操作は `admin_audit_logs` テーブルに自動で記録されます（Table Editor で確認できます）。

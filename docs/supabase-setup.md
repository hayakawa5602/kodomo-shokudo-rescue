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
2. `supabase/migrations/20261030000000_initial_schema.sql` の中身を全部貼り付けて「Run」
3. 左メニュー「Table Editor」に `profiles`・`support_requests` などが表示されれば成功

## 4. 認証の設定

「Authentication」→「Sign In / Providers」→「Email」が有効になっていることを確認します。
試作の間は「Confirm email」をオンのままにしてください（なりすまし登録の防止）。

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

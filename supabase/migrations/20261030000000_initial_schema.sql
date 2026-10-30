-- =====================================================================
-- こども食堂レスキュー 初期スキーマ（STEP 3）
-- 方針：
--  * すべてのテーブルで Row Level Security (RLS) を有効化
--  * 管理者権限・審査状態は利用者自身では変更できない（トリガーで防御）
--  * 審査の承認／却下は管理者専用の関数でのみ行い、操作履歴を必ず記録
--  * 連絡先などの個人情報は別テーブルに分け、必要な相手にだけ見せる
-- =====================================================================

-- ---------- 区分（enum） ----------
create type public.user_role as enum ('kodomo_shokudo', 'company', 'resident', 'admin');
create type public.verification_status as enum ('unsubmitted', 'pending', 'approved', 'rejected');
create type public.request_category as enum ('food', 'fund', 'volunteer');
create type public.request_status as enum ('open', 'closed', 'completed', 'hidden');
create type public.application_status as enum ('applied', 'approved', 'rejected', 'completed', 'cancelled');
create type public.storage_type as enum ('room', 'chilled', 'frozen');
create type public.expiry_type as enum ('best_before', 'use_by');
create type public.handover_type as enum ('bring', 'pickup', 'delivery');
create type public.report_status as enum ('open', 'resolved', 'dismissed');

-- ---------- 利用者プロフィール（公開してよい情報だけ） ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  display_name text not null check (char_length(display_name) between 1 and 60),
  region text check (char_length(region) <= 40),
  is_minor boolean not null default false,
  guardian_consent_at timestamptz,
  verification_status public.verification_status not null default 'unsubmitted',
  is_suspended boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  -- 未成年は保護者同意が必須、子ども食堂・企業の代表を未成年にしない
  constraint minor_needs_consent check (not is_minor or guardian_consent_at is not null),
  constraint minor_only_resident check (not is_minor or role = 'resident')
);

-- ---------- 非公開の連絡先（本人・管理者・承認済みの取引相手のみ） ----------
create table public.profile_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  contact_name text check (char_length(contact_name) <= 60),
  phone text check (phone ~ '^0[0-9-]{9,12}$'),
  address text check (char_length(address) <= 200),
  guardian_name text check (char_length(guardian_name) <= 60),
  guardian_phone text check (guardian_phone ~ '^0[0-9-]{9,12}$'),
  updated_at timestamptz not null default now()
);

-- ---------- 本人確認・団体審査の申請 ----------
create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  document_paths text[] not null check (array_length(document_paths, 1) between 1 and 5),
  status public.verification_status not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  reviewer_id uuid references public.profiles (id),
  review_note text check (char_length(review_note) <= 500),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
-- 同時に審査中の申請は1件まで
create unique index one_pending_verification on public.verification_requests (user_id) where status = 'pending';

-- ---------- 支援の募集 ----------
create table public.support_requests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  category public.request_category not null,
  title text not null check (char_length(title) between 1 and 60),
  description text not null check (char_length(description) between 20 and 1000),
  region text not null check (char_length(region) <= 40),
  deadline date not null,
  status public.request_status not null default 'open',
  -- 食材
  food_items text check (char_length(food_items) <= 200),
  quantity text check (char_length(quantity) <= 100),
  storage public.storage_type,
  handover public.handover_type[],
  -- 資金
  target_amount integer check (target_amount between 1000 and 10000000),
  -- 人手
  volunteer_date date,
  volunteer_count integer check (volunteer_count between 1 and 100),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint food_fields check (category <> 'food' or (food_items is not null and storage is not null and cardinality(handover) > 0)),
  constraint fund_fields check (category <> 'fund' or target_amount is not null),
  constraint volunteer_fields check (category <> 'volunteer' or (volunteer_date is not null and volunteer_count is not null))
);
create index support_requests_search on public.support_requests (status, category, region, deadline);

-- ---------- 支援の申込 ----------
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.support_requests (id) on delete cascade,
  applicant_id uuid not null references public.profiles (id) on delete cascade,
  status public.application_status not null default 'applied',
  message text check (char_length(message) <= 500),
  decision_note text check (char_length(decision_note) <= 500),
  -- 食材提供時の確認項目
  item_name text check (char_length(item_name) <= 100),
  offer_quantity text check (char_length(offer_quantity) <= 100),
  expiry_kind public.expiry_type,
  expiry_date date,
  storage public.storage_type,
  allergens text[] not null default '{}',
  unopened boolean,
  handover public.handover_type,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, applicant_id)
);

-- ---------- 通知 ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user on public.notifications (user_id, created_at desc);

-- ---------- 通報 ----------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  request_id uuid not null references public.support_requests (id) on delete cascade,
  reason text not null check (char_length(reason) between 5 and 500),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  unique (reporter_id, request_id)
);

-- ---------- 管理者の操作履歴（追記のみ） ----------
create table public.admin_audit_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- =====================================================================
-- ヘルパー関数
-- =====================================================================
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and not is_suspended);
$$;

create or replace function public.is_active_verified() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and verification_status = 'approved' and not is_suspended);
$$;

create or replace function public.my_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

-- 承認済みの申込でつながっている相手どうしか（連絡先の開示判定）
create or replace function public.is_counterparty(other uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from applications a join support_requests r on r.id = a.request_id
    where a.status in ('approved', 'completed')
      and ((a.applicant_id = auth.uid() and r.owner_id = other)
        or (r.owner_id = auth.uid() and a.applicant_id = other))
  );
$$;

-- =====================================================================
-- 新規登録時にプロフィールを作る（admin は絶対に付与しない）
-- =====================================================================
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r public.user_role;
  minor boolean := coalesce((new.raw_user_meta_data ->> 'is_minor')::boolean, false);
begin
  r := coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'resident')::public.user_role;
  if r = 'admin' then
    r := 'resident';
  end if;
  insert into profiles (id, role, display_name, is_minor, guardian_consent_at)
  values (
    new.id, r,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), '未設定'),
    minor,
    case when minor and (new.raw_user_meta_data ->> 'guardian_consent') = 'true' then now() end
  );
  insert into profile_private (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- 利用者が自分で変えてはいけない列を守る
create or replace function public.protect_profile_columns() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_setting('app.admin_action', true) = 'on' then
    return new; -- 管理者関数の中からの更新のみ許可
  end if;
  if new.role is distinct from old.role
     or new.verification_status is distinct from old.verification_status
     or new.is_suspended is distinct from old.is_suspended
     or new.is_demo is distinct from old.is_demo
     or new.is_minor is distinct from old.is_minor then
    raise exception '区分・審査状態は変更できません';
  end if;
  return new;
end $$;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- 申込の状態遷移を守る
create or replace function public.check_application_transition() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  owner uuid;
begin
  select owner_id into owner from support_requests where id = new.request_id;
  if new.request_id <> old.request_id or new.applicant_id <> old.applicant_id then
    raise exception '申込先・申込者は変更できません';
  end if;
  -- 申込内容（提供品の情報など）は、確認待ちの間に申込者本人だけが直せる
  if (new.message, new.item_name, new.offer_quantity, new.expiry_kind, new.expiry_date,
      new.storage, new.allergens, new.unopened, new.handover)
     is distinct from
     (old.message, old.item_name, old.offer_quantity, old.expiry_kind, old.expiry_date,
      old.storage, old.allergens, old.unopened, old.handover)
     and not (auth.uid() = new.applicant_id and old.status = 'applied') then
    raise exception '申込内容は変更できません';
  end if;
  if new.decision_note is distinct from old.decision_note and auth.uid() <> owner then
    raise exception '判断メモは募集者のみ記入できます';
  end if;
  if new.status = old.status then
    return new;
  end if;
  if auth.uid() = owner and (
       (old.status = 'applied' and new.status in ('approved', 'rejected'))
    or (old.status = 'approved' and new.status = 'completed')) then
    -- 申込者へ通知
    insert into notifications (user_id, kind, body, link)
    values (new.applicant_id, 'application_' || new.status,
      case new.status when 'approved' then '支援の申込が承認されました。受け渡しの詳細を確認してください。'
                      when 'rejected' then '支援の申込は今回見送りとなりました。'
                      else '受け渡しが完了しました。ご支援ありがとうございました。' end,
      '/applications');
    new.updated_at := now();
    return new;
  end if;
  if auth.uid() = new.applicant_id and old.status in ('applied', 'approved') and new.status = 'cancelled' then
    insert into notifications (user_id, kind, body, link)
    values (owner, 'application_cancelled', '支援の申込が取り消されました。', '/applications');
    new.updated_at := now();
    return new;
  end if;
  raise exception 'この状態の変更はできません';
end $$;
create trigger applications_transition before update on public.applications
  for each row execute function public.check_application_transition();

-- 申込が来たら募集者へ通知
create or replace function public.notify_new_application() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into notifications (user_id, kind, body, link)
  select owner_id, 'application_new', '「' || title || '」に支援の申込が届きました。', '/applications'
  from support_requests where id = new.request_id;
  return new;
end $$;
create trigger applications_notify after insert on public.applications
  for each row execute function public.notify_new_application();

-- 通知は既読にすることだけできる
create or replace function public.protect_notification() returns trigger
language plpgsql as $$
begin
  if new.user_id <> old.user_id or new.kind <> old.kind or new.body <> old.body
     or new.link is distinct from old.link or new.created_at <> old.created_at then
    raise exception '通知の内容は変更できません';
  end if;
  return new;
end $$;
create trigger notifications_protect before update on public.notifications
  for each row execute function public.protect_notification();

-- =====================================================================
-- 管理者専用の操作（サーバー側で権限確認し、必ず操作履歴を残す）
-- =====================================================================
create or replace function public.admin_review_verification(p_request_id uuid, p_approve boolean, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_user uuid;
  v_status public.verification_status := case when p_approve then 'approved' else 'rejected' end;
begin
  if not is_admin() then
    raise exception '権限がありません';
  end if;
  if not p_approve and coalesce(trim(p_note), '') = '' then
    raise exception '却下の場合は理由が必要です';
  end if;
  update verification_requests
     set status = v_status, reviewer_id = auth.uid(), review_note = p_note, reviewed_at = now()
   where id = p_request_id and status = 'pending'
  returning user_id into v_user;
  if v_user is null then
    raise exception '審査中の申請が見つかりません';
  end if;
  perform set_config('app.admin_action', 'on', true);
  update profiles set verification_status = v_status where id = v_user;
  perform set_config('app.admin_action', 'off', true);
  insert into notifications (user_id, kind, body, link) values (
    v_user, 'verification_' || v_status,
    case when p_approve then '本人確認・団体審査が承認されました。' else '本人確認・団体審査は承認されませんでした。理由：' || p_note end,
    '/verification');
  insert into admin_audit_logs (admin_id, action, target_table, target_id, detail)
  values (auth.uid(), 'review_verification', 'verification_requests', p_request_id,
          jsonb_build_object('approve', p_approve, 'note', p_note, 'user_id', v_user));
end $$;

create or replace function public.admin_set_request_hidden(p_request_id uuid, p_hidden boolean, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception '権限がありません';
  end if;
  update support_requests set status = (case when p_hidden then 'hidden' else 'open' end)::public.request_status, updated_at = now()
   where id = p_request_id;
  update reports set status = 'resolved' where request_id = p_request_id and status = 'open';
  insert into admin_audit_logs (admin_id, action, target_table, target_id, detail)
  values (auth.uid(), case when p_hidden then 'hide_request' else 'unhide_request' end,
          'support_requests', p_request_id, jsonb_build_object('note', p_note));
end $$;

create or replace function public.admin_set_suspended(p_user_id uuid, p_suspended boolean, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception '権限がありません';
  end if;
  if p_user_id = auth.uid() then
    raise exception '自分自身は停止できません';
  end if;
  perform set_config('app.admin_action', 'on', true);
  update profiles set is_suspended = p_suspended where id = p_user_id;
  perform set_config('app.admin_action', 'off', true);
  insert into admin_audit_logs (admin_id, action, target_table, target_id, detail)
  values (auth.uid(), case when p_suspended then 'suspend_user' else 'unsuspend_user' end,
          'profiles', p_user_id, jsonb_build_object('note', p_note));
end $$;

-- 関数は公開ロールから直接実行させない（必要なものだけ authenticated に許可）
revoke execute on all functions in schema public from public, anon;
grant execute on function public.is_admin(), public.is_active_verified(), public.my_role(),
  public.is_counterparty(uuid) to authenticated;
grant execute on function public.admin_review_verification(uuid, boolean, text),
  public.admin_set_request_hidden(uuid, boolean, text),
  public.admin_set_suspended(uuid, boolean, text) to authenticated; -- 中で is_admin() を確認

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.verification_requests enable row level security;
alter table public.support_requests enable row level security;
alter table public.applications enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.admin_audit_logs enable row level security;

-- profiles：表示名・地域・区分はログイン利用者に公開。更新は本人（保護列はトリガーで防御）
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- profile_private：本人・管理者・承認済みの相手のみ
create policy private_select on public.profile_private for select to authenticated
  using (id = auth.uid() or public.is_admin() or public.is_counterparty(id));
create policy private_update_self on public.profile_private for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- verification_requests：本人は申請と閲覧、管理者は閲覧（承認は関数経由のみ）
create policy verif_insert_self on public.verification_requests for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and reviewer_id is null);
create policy verif_select on public.verification_requests for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- support_requests：公開中のものは誰でも閲覧可（デモ以外）。作成は審査承認済みの子ども食堂のみ
create policy req_select_public on public.support_requests for select to anon, authenticated
  using (status in ('open', 'closed', 'completed'));
create policy req_select_owner_admin on public.support_requests for select to authenticated
  using (owner_id = auth.uid() or public.is_admin());
create policy req_insert on public.support_requests for insert to authenticated
  with check (owner_id = auth.uid() and public.my_role() = 'kodomo_shokudo'
              and public.is_active_verified() and status = 'open' and not is_demo
              and deadline >= current_date);
create policy req_update_owner on public.support_requests for update to authenticated
  using (owner_id = auth.uid() and status <> 'hidden')
  with check (owner_id = auth.uid() and status in ('open', 'closed', 'completed') and not is_demo);

-- applications：審査承認済みの企業・住民が、公開中の他団体の募集に申込可。
--               資金支援は決済が有効になるまで申込不可。未成年は食材・人手のみ。
create policy app_insert on public.applications for insert to authenticated
  with check (
    applicant_id = auth.uid() and status = 'applied'
    and public.is_active_verified()
    and public.my_role() in ('company', 'resident')
    and exists (
      select 1 from public.support_requests r
      where r.id = request_id and r.status = 'open' and r.owner_id <> auth.uid()
        and r.deadline >= current_date and r.category <> 'fund'
        and (r.category <> 'food' or (
              item_name is not null and offer_quantity is not null and expiry_kind is not null
              and expiry_date >= current_date and storage is not null and unopened is true
              and handover is not null))
    )
  );
create policy app_select on public.applications for select to authenticated
  using (applicant_id = auth.uid() or public.is_admin()
         or exists (select 1 from public.support_requests r where r.id = request_id and r.owner_id = auth.uid()));
create policy app_update on public.applications for update to authenticated
  using (applicant_id = auth.uid()
         or exists (select 1 from public.support_requests r where r.id = request_id and r.owner_id = auth.uid()));

-- notifications：本人のみ閲覧・既読化。作成はトリガー／管理者関数のみ
create policy notif_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notif_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reports：ログイン利用者は通報でき、自分の通報と管理者は閲覧可
create policy report_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open');
create policy report_select on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());

-- admin_audit_logs：管理者のみ閲覧。書き込みは管理者関数のみ（ポリシーなし＝直接は不可）
create policy audit_select on public.admin_audit_logs for select to authenticated using (public.is_admin());

-- =====================================================================
-- 本人確認書類の保存場所（非公開バケット）
-- パス規則： verification-docs/<user_id>/<ファイル名>
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verification-docs', 'verification-docs', false, 5242880,
        array['image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do nothing;

create policy verif_docs_upload on storage.objects for insert to authenticated
  with check (bucket_id = 'verification-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy verif_docs_read on storage.objects for select to authenticated
  using (bucket_id = 'verification-docs'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

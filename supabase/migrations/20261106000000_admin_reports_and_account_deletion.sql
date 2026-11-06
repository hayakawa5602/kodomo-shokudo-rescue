-- =====================================================================
-- STEP 8〜9：通報対応・退会（アカウント削除）
-- 既存の Supabase プロジェクトでは、このファイルを SQL Editor に貼って実行する（2本目）
-- =====================================================================

-- ---------- 通報を「問題なし」として閉じる（管理者） ----------
create or replace function public.admin_dismiss_report(p_report_id uuid, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception '権限がありません';
  end if;
  update reports set status = 'dismissed' where id = p_report_id and status = 'open';
  insert into admin_audit_logs (admin_id, action, target_table, target_id, detail)
  values (auth.uid(), 'dismiss_report', 'reports', p_report_id, jsonb_build_object('note', p_note));
end $$;
grant execute on function public.admin_dismiss_report(uuid, text) to authenticated;

-- ---------- 退会（アカウント削除） ----------
-- 方針（プライバシーポリシー第6条）：
--   氏名・連絡先・本人確認書類・通知は削除する。
--   支援の記録（募集・申込）は、不正防止と会計上の確認のため、個人を特定できない形で残す。
--   そのため profiles の行は「退会済みユーザー」として残し、ログイン情報（auth.users）だけを削除する。

-- profiles は auth.users の削除に連動して消えない（匿名化して残す）ようにする
alter table public.profiles drop constraint if exists profiles_id_fkey;

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth, storage as $$
declare
  me uuid := auth.uid();
  n_active integer;
begin
  if me is null then
    raise exception 'ログインが必要です';
  end if;
  if exists (select 1 from profiles where id = me and role = 'admin') then
    raise exception '管理者アカウントは退会できません。先に管理者権限を外してください';
  end if;

  -- 進行中の支援（確認待ち・承認済み）があれば退会できない
  select count(*) into n_active
    from applications a
    join support_requests r on r.id = a.request_id
   where a.status in ('applied', 'approved')
     and (a.applicant_id = me or r.owner_id = me);
  if n_active > 0 then
    raise exception '進行中の支援が % 件あります。先に完了または取り消しをしてください', n_active;
  end if;

  -- 公開中の募集は終了にする
  update support_requests set status = 'closed', updated_at = now() where owner_id = me and status = 'open';

  -- 本人確認書類・連絡先・通知・審査申請の書類パスを削除
  delete from storage.objects where bucket_id = 'verification-docs' and (storage.foldername(name))[1] = me::text;
  delete from profile_private where id = me;
  delete from notifications where user_id = me;
  update verification_requests set document_paths = '{}' where user_id = me;
  update reports set reporter_id = null where reporter_id = me;

  -- 表示名などを匿名化して記録だけ残す
  perform set_config('app.admin_action', 'on', true);
  update profiles
     set display_name = '退会済みユーザー', region = null, is_suspended = true, verification_status = 'unsubmitted'
   where id = me;
  perform set_config('app.admin_action', 'off', true);

  insert into admin_audit_logs (admin_id, action, target_table, target_id, detail)
  values (null, 'account_deleted', 'profiles', me, jsonb_build_object('by', 'self'));

  -- ログイン情報を削除（セッションも消える）
  delete from auth.users where id = me;
end $$;
grant execute on function public.delete_my_account() to authenticated;

-- 退会済みの profiles 行は、申込や募集の表示用に残るが、本人の操作はできない（auth.users がないため）

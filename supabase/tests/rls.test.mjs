import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
const db = new PGlite();
const stub = `
create role anon nologin; create role authenticated nologin;
create schema auth; create schema storage;
create table auth.users (id uuid primary key, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit int, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
grant usage on schema public, auth, storage to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
`;
await db.exec(stub);
await db.exec(readFileSync(new URL("../migrations/20261030000000_initial_schema.sql", import.meta.url), 'utf8'));
await db.exec(`grant select, insert, update, delete on all tables in schema public to authenticated; grant select on all tables in schema public to anon;`);

const U = { kodomo:'11111111-1111-1111-1111-111111111111', resident:'22222222-2222-2222-2222-222222222222', admin:'33333333-3333-3333-3333-333333333333', minor:'44444444-4444-4444-4444-444444444444' };
let pass=0, fail=0;
async function as(uid, sql, params=[]) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid||''}', false);`);
  await db.exec(uid ? 'set role authenticated' : 'set role anon');
  try { return await db.query(sql, params); } finally { await db.exec('reset role'); }
}
async function expectOk(name, fn) { try { const r = await fn(); pass++; console.log('✔', name); return r; } catch(e){ fail++; console.log('✘', name, '→', e.message); } }
async function expectErr(name, fn) { try { await fn(); fail++; console.log('✘', name, '→ エラーにならなかった'); } catch(e){ pass++; console.log('✔', name, '（拒否:', e.message.slice(0,40)+')'); } }
async function expectRows(name, fn, n) { const r = await fn(); if (r.rows.length===n){pass++;console.log('✔',name);} else {fail++;console.log('✘',name,'→ 件数',r.rows.length);} }

// 登録
await db.query(`insert into auth.users values ($1, '{"role":"kodomo_shokudo","display_name":"テスト食堂"}'), ($2, '{"role":"resident","display_name":"住民"}'), ($3, '{"role":"admin","display_name":"なりすまし"}'), ($4, '{"role":"resident","display_name":"未成年","is_minor":"true","guardian_consent":"true"}')`, [U.kodomo,U.resident,U.admin,U.minor]);
const r0 = await db.query(`select role from profiles where id=$1`, [U.admin]);
r0.rows[0].role==='resident' ? (pass++, console.log('✔ 登録時に admin を指定しても resident になる')) : (fail++, console.log('✘ admin が付与された'));
await expectErr('未成年＋保護者同意なしは登録不可', () => db.query(`insert into auth.users values ('55555555-5555-5555-5555-555555555555', '{"role":"resident","is_minor":"true"}')`));
await expectErr('未成年は子ども食堂区分で登録不可', () => db.query(`insert into auth.users values ('66666666-6666-6666-6666-666666666666', '{"role":"kodomo_shokudo","is_minor":"true","guardian_consent":"true"}')`));

await expectErr('利用者が自分の区分を admin に変更', () => as(U.resident, `update profiles set role='admin' where id=$1`, [U.resident]));
await expectErr('利用者が自分の審査状態を approved に変更', () => as(U.kodomo, `update profiles set verification_status='approved' where id=$1`, [U.kodomo]));
await expectOk('利用者が表示名を変更', () => as(U.kodomo, `update profiles set display_name='ひだまり食堂' where id=$1`, [U.kodomo]));

const foodReq = `insert into support_requests (owner_id, category, title, description, region, deadline, food_items, storage, handover) values ($1,'food','お米募集','毎週土曜日に約40食を提供しています。お米が不足しています。','名古屋市東区', current_date + 30, 'お米', 'room', '{bring}') returning id`;
await expectErr('審査前の子ども食堂は募集を作成できない', () => as(U.kodomo, foodReq, [U.kodomo]));

// 審査申請
const v1 = await expectOk('子ども食堂が審査を申請', () => as(U.kodomo, `insert into verification_requests (user_id, document_paths) values ($1, '{a.pdf}') returning id`, [U.kodomo]));
const v2 = await expectOk('住民が審査を申請', () => as(U.resident, `insert into verification_requests (user_id, document_paths) values ($1, '{b.jpg}') returning id`, [U.resident]));
await expectErr('申請者が自分で承認状態に書き換え', () => as(U.kodomo, `insert into verification_requests (user_id, document_paths, status) values ($1, '{a.pdf}', 'approved')`, [U.kodomo]));
await expectRows('他人の審査申請は見えない', () => as(U.resident, `select * from verification_requests where user_id=$1`, [U.kodomo]), 0);
await expectErr('一般利用者は承認関数を実行できない', () => as(U.resident, `select admin_review_verification($1, true, 'ok')`, [v2.rows[0].id]));

// 管理者はDB所有者が手動で設定
await db.query(`update profiles set role='admin' where id=$1`, [U.admin]).catch(async()=>{ await db.exec(`select set_config('app.admin_action','on',false)`); await db.query(`update profiles set role='admin' where id=$1`, [U.admin]); await db.exec(`select set_config('app.admin_action','off',false)`); });
await expectErr('却下には理由が必要', () => as(U.admin, `select admin_review_verification($1, false, '')`, [v1.rows[0].id]));
await expectOk('管理者が子ども食堂を承認', () => as(U.admin, `select admin_review_verification($1, true, '書類確認済み')`, [v1.rows[0].id]));
await expectOk('管理者が住民を承認', () => as(U.admin, `select admin_review_verification($1, true, '確認済み')`, [v2.rows[0].id]));
await expectRows('操作履歴が2件記録される', () => db.query(`select * from admin_audit_logs`), 2);
await expectRows('一般利用者は操作履歴を見られない', () => as(U.resident, `select * from admin_audit_logs`), 0);
await expectErr('一般利用者は操作履歴を書き込めない', () => as(U.resident, `insert into admin_audit_logs (action, target_table) values ('x','y')`));

const req = await expectOk('承認済み子ども食堂が食材募集を作成', () => as(U.kodomo, foodReq, [U.kodomo]));
const reqId = req.rows[0].id;
const fund = await as(U.kodomo, `insert into support_requests (owner_id, category, title, description, region, deadline, target_amount) values ($1,'fund','冷蔵庫','業務用冷蔵庫が故障したため買い替えの支援をお願いします。','名古屋市東区', current_date+30, 50000) returning id`, [U.kodomo]);
await expectErr('住民は募集を作成できない', () => as(U.resident, foodReq, [U.resident]));
await expectRows('ログインしていない人も公開中の募集を見られる', () => as(null, `select id from support_requests`), 2);

const apply = (extra) => `insert into applications (request_id, applicant_id, item_name, offer_quantity, expiry_kind, expiry_date, storage, unopened, handover) values ($1,$2,'お米','10kg','best_before', ${extra}, 'room', true, 'bring') returning id`;
await expectErr('期限切れの食品では申込できない', () => as(U.resident, apply('current_date - 1'), [reqId, U.resident]));
await expectErr('資金支援は決済有効化まで申込できない', () => as(U.resident, `insert into applications (request_id, applicant_id) values ($1,$2)`, [fund.rows[0].id, U.resident]));
await expectErr('未承認の未成年は申込できない', () => as(U.minor, apply('current_date + 10'), [reqId, U.minor]));
await expectRows('承認前は相手の連絡先が見えない', () => as(U.resident, `select * from profile_private where id=$1`, [U.kodomo]), 0);
const ap = await expectOk('承認済み住民が食材提供を申込', () => as(U.resident, apply('current_date + 10'), [reqId, U.resident]));
await expectRows('子ども食堂に申込通知が届く', () => as(U.kodomo, `select * from notifications where kind='application_new'`), 1);
await expectRows('他人の通知は見えない', () => as(U.resident, `select * from notifications where user_id=$1`, [U.kodomo]), 0);
await expectErr('申込者が自分で承認にする', () => as(U.resident, `update applications set status='approved' where id=$1`, [ap.rows[0].id]));
await expectErr('募集者が申込者の提供内容を書き換える', () => as(U.kodomo, `update applications set item_name='別物' where id=$1`, [ap.rows[0].id]));
await expectOk('子ども食堂が申込を承認', () => as(U.kodomo, `update applications set status='approved' where id=$1`, [ap.rows[0].id]));
await expectRows('承認後は相手の連絡先が見える', () => as(U.resident, `select * from profile_private where id=$1`, [U.kodomo]), 1);
await expectRows('申込者に承認通知が届く', () => as(U.resident, `select * from notifications where kind='application_approved'`), 1);
await expectErr('承認から申込済みに戻す', () => as(U.kodomo, `update applications set status='applied' where id=$1`, [ap.rows[0].id]));
await expectOk('受け渡し完了にする', () => as(U.kodomo, `update applications set status='completed' where id=$1`, [ap.rows[0].id]));
await expectErr('通知の本文を書き換える', () => as(U.resident, `update notifications set body='x' where user_id=$1`, [U.resident]));

await expectOk('募集を通報', () => as(U.resident, `insert into reports (reporter_id, request_id, reason) values ($1,$2,'内容が不審です')`, [U.resident, reqId]));
await expectOk('管理者が募集を非公開化', () => as(U.admin, `select admin_set_request_hidden($1, true, '確認のため')`, [reqId]));
await expectRows('非公開の募集は一般に見えない', () => as(null, `select id from support_requests where id=$1`, [reqId]), 0);
await expectErr('募集者が非公開を自分で解除', () => as(U.kodomo, `update support_requests set status='open' where id=$1`, [reqId]).then(r=>{ if(r.affectedRows===0) throw new Error('0行'); }));
await expectErr('管理者は自分自身を停止できない', () => as(U.admin, `select admin_set_suspended($1, true, 'x')`, [U.admin]));

console.log(`\n結果: ${pass} 件成功 / ${fail} 件失敗`);
process.exit(fail ? 1 : 0);

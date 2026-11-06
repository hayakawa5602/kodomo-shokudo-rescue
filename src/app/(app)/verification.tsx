import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { NotConfigured } from '@/components/StatusNotices';
import { Badge, Button, Card, Field, H1, H2, Notice, P, Row, Screen } from '@/components/ui';
import { authErrorMessage, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { VERIFICATION_LABEL } from '@/lib/types';
import {
  extractRegion,
  fetchLatestRequest,
  MAX_FILES,
  PickedFile,
  pickDocuments,
  submitVerification,
  VerificationRequest,
} from '@/lib/verification';
import { colors, font } from '@/theme';

const TONE = { unsubmitted: 'gray', pending: 'orange', approved: 'green', rejected: 'red' } as const;

const DOC_HINT: Record<string, string> = {
  kodomo_shokudo: '活動実績がわかる資料（チラシ・自治体への登録証明など）と、代表者の本人確認書類',
  company: '登記事項証明書または会社案内と、担当者の名刺',
  resident: '本人確認書類（運転免許証・学生証など）。マイナンバーが写っている面は提出しないでください',
  admin: '（管理者は申請不要です）',
};

// 本人確認・団体審査の申請画面
// 書類は非公開バケットにアップロードし、審査担当者（管理者）だけが閲覧できる。承認はサーバー側の関数でのみ行う。
export default function Verification() {
  const { session, profile, refreshProfile } = useAuth();
  const [latest, setLatest] = useState<VerificationRequest | null | undefined>(undefined);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');

  const userId = session?.user.id;

  useEffect(() => {
    if (!userId || !supabase) return;
    (async () => {
      const [req, priv] = await Promise.all([
        fetchLatestRequest(userId),
        supabase!.from('profile_private').select('contact_name, address, phone').eq('id', userId).maybeSingle(),
      ]);
      setLatest(req);
      if (priv.data) {
        setName(priv.data.contact_name ?? profile?.display_name ?? '');
        setAddress(priv.data.address ?? '');
        setPhone(priv.data.phone ?? '');
      } else {
        setName(profile?.display_name ?? '');
      }
      await refreshProfile();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const status = profile?.verification_status ?? 'unsubmitted';

  const choose = async () => {
    setServerError('');
    const { files: picked, error } = await pickDocuments();
    if (error) {
      setServerError(error);
      return;
    }
    const next = [...files, ...picked].slice(0, MAX_FILES);
    setFiles(next);
  };

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = '名称を入力してください';
    else if (name.trim().length > 60) e.name = '名称は60文字以内にしてください';
    if (!address.trim()) e.address = '所在地を入力してください';
    else if (address.trim().length > 200) e.address = '所在地は200文字以内にしてください';
    if (!/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/.test(phone.trim())) e.phone = '電話番号の形が正しくありません（例：052-123-4567）';
    if (files.length === 0) e.files = '書類を1つ以上選んでください';
    setErrors(e);
    setServerError('');
    if (Object.keys(e).length > 0 || !userId) return;

    setBusy(true);
    try {
      await submitVerification(
        userId,
        { contactName: name.trim(), address: address.trim(), phone: phone.trim(), region: extractRegion(address.trim()) },
        files,
      );
      setFiles([]);
      setLatest(await fetchLatestRequest(userId));
      await refreshProfile();
    } catch (err: any) {
      setServerError(authErrorMessage(err?.message ?? String(err)));
    } finally {
      setBusy(false);
    }
  };

  const canApply = status === 'unsubmitted' || status === 'rejected';

  return (
    <Screen>
      <H1>本人確認・団体審査</H1>
      <NotConfigured />
      <Card>
        <Row>
          <P>現在の状態：</P>
          <Badge label={VERIFICATION_LABEL[status]} tone={TONE[status]} />
        </Row>
        {status === 'pending' && latest && (
          <P sub>
            {new Date(latest.created_at).toLocaleDateString('ja-JP')} に申請済み。審査には数日かかることがあります。結果は「お知らせ」に届きます。
          </P>
        )}
        {status === 'approved' && <P sub>承認されています。募集の作成や支援の申込ができます。</P>}
        {status === 'rejected' && latest?.review_note && (
          <Notice tone="danger">前回の審査で承認されませんでした。理由：{latest.review_note}</Notice>
        )}
      </Card>

      {status === 'approved' && <Button label="ホームへ戻る" variant="outline" onPress={() => router.replace('/home')} />}

      {canApply && profile?.role !== 'admin' && (
        <>
          <H2>1. 基本情報</H2>
          <Field label="団体名・企業名・氏名" required value={name} onChangeText={setName} error={errors.name} maxLength={60} />
          <Field
            label="所在地"
            required
            hint="市区町村から番地まで。公開されるのは市区町村までです"
            value={address}
            onChangeText={setAddress}
            error={errors.address}
            maxLength={200}
          />
          <Field
            label="電話番号"
            required
            hint="審査と、承認された支援の相手にのみ表示されます"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            error={errors.phone}
          />

          <H2>2. 提出書類</H2>
          <P sub>{DOC_HINT[profile?.role ?? 'resident']}</P>
          <P sub>JPEG・PNG・PDF、1ファイル5MBまで、最大{MAX_FILES}件。</P>
          <Button label={`📎 書類を選ぶ（${files.length}/${MAX_FILES}）`} variant="outline" onPress={choose} disabled={files.length >= MAX_FILES || busy} />
          {files.map((f, i) => (
            <View key={f.uri + i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
              <Text style={{ fontSize: font.sm, color: colors.text, flex: 1 }} numberOfLines={1}>
                📄 {f.name}
                {f.size ? `（${(f.size / 1024 / 1024).toFixed(1)}MB）` : ''}
              </Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`${f.name} を取り消す`} onPress={() => setFiles(files.filter((_, j) => j !== i))}>
                <Text style={{ color: colors.danger, fontSize: font.sm, fontWeight: '700', padding: 6 }}>取り消す</Text>
              </Pressable>
            </View>
          ))}
          {errors.files && <Notice tone="danger">{errors.files}</Notice>}

          <Notice tone="info">提出された書類は審査担当者だけが閲覧でき、審査後は一定期間で削除します。</Notice>
          {serverError !== '' && <Notice tone="danger">{serverError}</Notice>}
          <Button label={busy ? '送信中…' : '審査を申請する'} variant="accent" onPress={submit} disabled={busy || !supabase} />
        </>
      )}
    </Screen>
  );
}

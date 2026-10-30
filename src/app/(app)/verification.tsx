import { useState } from 'react';
import { NotYetConnected } from '@/components/StatusNotices';
import { Badge, Button, Card, Field, H1, H2, Notice, P, Row, Screen } from '@/components/ui';
import { VERIFICATION_LABEL } from '@/lib/types';

// 本人確認・団体審査の申請画面
// 方式：書類のアップロード → 管理者が目視で審査 → 承認/却下（承認処理はサーバー側のみ）
export default function Verification() {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ok, setOk] = useState(false);

  const submit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = '名称を入力してください';
    if (!address.trim()) e.address = '所在地を入力してください';
    if (!/^0\d{1,4}-?\d{1,4}-?\d{3,4}$/.test(phone.trim())) e.phone = '電話番号の形が正しくありません（例：052-123-4567）';
    setErrors(e);
    setOk(Object.keys(e).length === 0);
  };

  return (
    <Screen>
      <H1>本人確認・団体審査</H1>
      <Card>
        <Row>
          <P>現在の状態：</P>
          <Badge label={VERIFICATION_LABEL.unsubmitted} tone="gray" />
        </Row>
      </Card>
      <NotYetConnected step="STEP 5" what="書類のアップロードと申請の送信" />

      <H2>1. 基本情報</H2>
      <Field label="団体名・企業名・氏名" required value={name} onChangeText={setName} error={errors.name} />
      <Field label="所在地" required hint="公開されるのは市区町村までです" value={address} onChangeText={setAddress} error={errors.address} />
      <Field label="電話番号" required hint="審査と、承認された支援の相手にのみ表示されます" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />

      <H2>2. 提出書類</H2>
      <P sub>子ども食堂：活動実績がわかる資料（チラシ・自治体への登録証明など）と代表者の本人確認書類</P>
      <P sub>企業：登記事項証明書または会社案内と担当者の名刺</P>
      <P sub>地域住民：本人確認書類（運転免許証など）。マイナンバーが写っている面は提出しないでください。</P>
      <Button label="📎 書類を選ぶ（STEP 5で有効化）" variant="outline" disabled />

      <Notice tone="info">提出された書類は審査担当者だけが閲覧でき、審査後は一定期間で削除します。</Notice>
      <Button label="入力内容をチェック" onPress={submit} />
      {ok && <Notice tone="info">入力内容に問題はありません（まだ送信はされません）。</Notice>}
    </Screen>
  );
}

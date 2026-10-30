import { router, useLocalSearchParams } from 'expo-router';
import { Fragment, useState } from 'react';
import { Text, View } from 'react-native';
import { DemoBanner, NotYetConnected } from '@/components/StatusNotices';
import { Badge, Button, Card, Field, H1, H2, Notice, P, Row, Screen } from '@/components/ui';
import { DEMO_REQUESTS } from '@/demo/requests';
import {
  CATEGORY_ICON,
  CATEGORY_LABEL,
  HANDOVER_LABEL,
  REQUEST_STATUS_LABEL,
  STORAGE_LABEL,
} from '@/lib/types';
import { colors, font } from '@/theme';

function Item({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: font.sm, color: colors.textSub }}>{label}</Text>
      <Text style={{ fontSize: font.md, color: colors.text, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = DEMO_REQUESTS.find((x) => x.id === id);
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');

  if (!r) {
    return (
      <Screen>
        <H1>募集が見つかりません</H1>
        <P sub>削除されたか、公開が停止された可能性があります。</P>
        <Button label="一覧に戻る" variant="outline" onPress={() => router.replace('/requests')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <DemoBanner />
      <Row wrap>
        <Badge label={`${CATEGORY_ICON[r.category]} ${CATEGORY_LABEL[r.category]}`} tone={r.category === 'fund' ? 'orange' : 'green'} />
        <Badge label={REQUEST_STATUS_LABEL[r.status]} />
      </Row>
      <H1>{r.title}</H1>
      <P sub>
        {r.orgName}　📍{r.region}
      </P>

      <Card>
        <P>{r.description}</P>
      </Card>

      <Card>
        <Item label="締切" value={r.deadline} />
        {r.category === 'food' && (
          <Fragment>
            <Item label="ほしい食材" value={r.foodItems} />
            <Item label="量の目安" value={r.quantity} />
            <Item label="保存状態" value={r.storage && STORAGE_LABEL[r.storage]} />
            <Item label="受け渡し方法" value={r.handover?.map((h) => HANDOVER_LABEL[h]).join('・')} />
          </Fragment>
        )}
        {r.category === 'fund' && <Item label="目標金額" value={r.targetAmount ? `${r.targetAmount.toLocaleString()}円` : undefined} />}
        {r.category === 'volunteer' && (
          <Fragment>
            <Item label="活動日" value={r.volunteerDate} />
            <Item label="募集人数" value={r.volunteerCount ? `${r.volunteerCount}人` : undefined} />
          </Fragment>
        )}
      </Card>

      {r.category === 'fund' ? (
        <Notice tone="warn">資金支援の決済は、法的確認が完了するまで利用できません。</Notice>
      ) : (
        <Button label="この募集に支援を申し込む" variant="accent" onPress={() => router.push({ pathname: '/requests/[id]/apply', params: { id: r.id } })} />
      )}

      <H2>不適切な募集の通報</H2>
      {!reporting ? (
        <Button label="🚩 この募集を通報する" variant="danger" onPress={() => setReporting(true)} />
      ) : (
        <>
          <NotYetConnected step="STEP 9" what="通報の送信" />
          <Field label="通報の理由" multiline value={reason} onChangeText={setReason} placeholder="例：営利目的の勧誘に見える、内容が事実と異なる" />
          <Button label="通報する" variant="danger" disabled={reason.trim().length < 5} />
        </>
      )}
    </Screen>
  );
}

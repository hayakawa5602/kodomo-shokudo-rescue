import { NotYetConnected } from '@/components/StatusNotices';
import { Badge, Card, H1, H2, P, Row, Screen } from '@/components/ui';
import { APPLICATION_STATUS_LABEL, ApplicationStatus } from '@/lib/types';

// 申込管理：子ども食堂は届いた申込を承認・見送り・完了にする／支援者は自分の申込状況を見る
const FLOW: ApplicationStatus[] = ['applied', 'approved', 'completed'];

export default function Applications() {
  return (
    <Screen>
      <H1>申込の管理</H1>
      <NotYetConnected step="STEP 7" what="申込の一覧と承認・見送り・完了の操作" />
      <H2>申込の流れ</H2>
      <Card>
        <Row wrap>
          {FLOW.map((s, i) => (
            <Row key={s}>
              <Badge label={APPLICATION_STATUS_LABEL[s]} tone={s === 'completed' ? 'green' : 'orange'} />
              {i < FLOW.length - 1 && <P sub>→</P>}
            </Row>
          ))}
        </Row>
        <P sub>子ども食堂が承認すると、はじめてお互いの連絡先と受け渡しの詳細が表示されます。見送りになった場合は理由とともに通知されます。</P>
      </Card>
      <H2>届いている申込</H2>
      <P sub>まだ申込はありません。</P>
    </Screen>
  );
}

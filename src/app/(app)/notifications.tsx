import { NotYetConnected } from '@/components/StatusNotices';
import { H1, P, Screen } from '@/components/ui';

// 通知：審査結果、申込の到着、承認・見送り、受け渡し完了、通報対応結果など
export default function Notifications() {
  return (
    <Screen>
      <H1>お知らせ</H1>
      <NotYetConnected step="STEP 9" what="お知らせの受信" />
      <P sub>お知らせはまだありません。</P>
    </Screen>
  );
}

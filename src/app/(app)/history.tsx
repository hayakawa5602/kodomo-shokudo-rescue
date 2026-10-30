import { NotYetConnected } from '@/components/StatusNotices';
import { H1, P, Screen } from '@/components/ui';

// 支援履歴：支援者は「行った支援」、子ども食堂は「出した募集と受けた支援」を一覧で見る
export default function History() {
  return (
    <Screen>
      <H1>支援履歴</H1>
      <NotYetConnected step="STEP 9" what="支援履歴の表示" />
      <P sub>まだ履歴はありません。</P>
    </Screen>
  );
}

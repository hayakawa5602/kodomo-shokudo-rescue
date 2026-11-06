import { Badge, Row, P } from './ui';
import { Profile } from '@/lib/auth';
import { ROLE_LABEL, VERIFICATION_LABEL } from '@/lib/types';

const TONE = { unsubmitted: 'gray', pending: 'orange', approved: 'green', rejected: 'red' } as const;

export function ProfileStatus({ profile }: { profile: Profile }) {
  return (
    <>
      <P>
        {profile.display_name} さん（{ROLE_LABEL[profile.role]}）
      </P>
      <Row>
        <P sub>審査の状態：</P>
        <Badge label={VERIFICATION_LABEL[profile.verification_status]} tone={TONE[profile.verification_status]} />
      </Row>
    </>
  );
}

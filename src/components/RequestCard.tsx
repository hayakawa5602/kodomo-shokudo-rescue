import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Badge, Row } from './ui';
import { CATEGORY_ICON, CATEGORY_LABEL, REQUEST_STATUS_LABEL, SupportRequest } from '@/lib/types';
import { colors, font, radius, space } from '@/theme';

export function RequestCard({ r }: { r: SupportRequest }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${r.title}、${r.orgName}、${r.region}`}
      onPress={() => router.push({ pathname: '/requests/[id]', params: { id: r.id } })}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: space.md,
        marginBottom: space.md,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Row wrap>
        <Badge label={`${CATEGORY_ICON[r.category]} ${CATEGORY_LABEL[r.category]}`} tone={r.category === 'fund' ? 'orange' : 'green'} />
        <Badge label={REQUEST_STATUS_LABEL[r.status]} tone={r.status === 'open' ? 'green' : 'gray'} />
      </Row>
      <Text style={{ fontSize: font.lg, fontWeight: '800', color: colors.text, marginTop: space.sm }}>{r.title}</Text>
      <View style={{ marginTop: 6 }}>
        <Text style={{ fontSize: font.sm, color: colors.textSub }}>
          {r.orgName}　📍{r.region}
        </Text>
        <Text style={{ fontSize: font.sm, color: colors.textSub, marginTop: 2 }}>締切：{r.deadline}</Text>
      </View>
    </Pressable>
  );
}

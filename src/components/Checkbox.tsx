import { Pressable, Text, View } from 'react-native';
import { colors, font, space } from '@/theme';

export function Checkbox({
  label,
  checked,
  onChange,
  error,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  return (
    <View style={{ marginBottom: space.sm }}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 10 }}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: error ? colors.danger : colors.primary,
            backgroundColor: checked ? colors.primary : colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {checked && <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text>}
        </View>
        <Text style={{ fontSize: font.md, color: colors.text, flex: 1 }}>{label}</Text>
      </Pressable>
      {error && <Text style={{ color: colors.danger, fontSize: font.sm, fontWeight: '600' }}>{error}</Text>}
    </View>
  );
}

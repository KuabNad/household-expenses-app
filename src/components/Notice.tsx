import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../utils/theme';

export function Notice({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Ionicons color={colors.warning} name="cloud-offline-outline" size={20} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#FFF4DF',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  text: { color: '#6E4B15', flex: 1, fontSize: 13, lineHeight: 18 },
});

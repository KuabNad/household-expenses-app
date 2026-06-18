import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { Screen } from '../components/Screen';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { friendlyError } from '../services/errors';
import type { HouseholdStackParamList } from '../types/navigation';
import { colors, radius, spacing } from '../utils/theme';

type Props = NativeStackScreenProps<HouseholdStackParamList, 'HouseholdSetup'>;

export function HouseholdSetupScreen({ navigation }: Props) {
  const { profile, logout } = useAuth();
  const { createHousehold } = useHousehold();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (name.trim().length < 2) {
      Alert.alert('Household name needed', 'Enter at least 2 characters.');
      return;
    }
    try {
      setLoading(true);
      await createHousehold(name);
    } catch (error) {
      Alert.alert('Could not create household', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      subtitle={`Welcome, ${profile?.displayName ?? 'there'}. Start a new shared space or join an existing one.`}
      title="Your household"
    >
      <View style={styles.card}>
        <View style={styles.icon}>
          <Ionicons color={colors.primary} name="home-outline" size={28} />
        </View>
        <Text style={styles.cardTitle}>Create a household</Text>
        <Text style={styles.body}>
          We will add the default categories and make an invite code for the next person.
        </Text>
        <AppInput
          autoCapitalize="words"
          label="Household name"
          onChangeText={setName}
          placeholder="Kuba and Laura"
          value={name}
        />
        <AppButton label="Create household" loading={loading} onPress={submit} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Already have an invite?</Text>
        <Text style={styles.body}>Use the 8-character code shared by a household member.</Text>
        <AppButton
          label="Join with invite code"
          onPress={() => navigation.navigate('JoinHousehold')}
          variant="secondary"
        />
      </View>

      <AppButton label="Log out" onPress={logout} variant="text" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    gap: spacing.md,
    padding: spacing.lg,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  body: { color: colors.muted, lineHeight: 21 },
});

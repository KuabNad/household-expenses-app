import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { Screen } from '../components/Screen';
import { useHousehold } from '../hooks/useHousehold';
import { friendlyError } from '../services/errors';
import type { HouseholdStackParamList } from '../types/navigation';
import { colors, spacing } from '../utils/theme';

type Props = NativeStackScreenProps<HouseholdStackParamList, 'JoinHousehold'>;

export function JoinHouseholdScreen({ navigation }: Props) {
  const { joinHousehold } = useHousehold();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (code.trim().length !== 8) {
      Alert.alert('Check the code', 'Invite codes contain 8 letters or numbers.');
      return;
    }
    try {
      setLoading(true);
      await joinHousehold(code);
    } catch (error) {
      Alert.alert('Could not join household', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <Text style={styles.title}>Join a household</Text>
      <Text style={styles.subtitle}>Ask a member for the invite code shown in Settings.</Text>
      <AppInput
        autoCapitalize="characters"
        autoCorrect={false}
        label="Invite code"
        maxLength={8}
        onChangeText={(value) => setCode(value.toUpperCase())}
        onSubmitEditing={submit}
        placeholder="ABCD2345"
        style={styles.code}
        value={code}
      />
      <AppButton label="Join household" loading={loading} onPress={submit} />
      <AppButton label="Back" onPress={() => navigation.goBack()} variant="text" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.muted, lineHeight: 21, marginBottom: spacing.lg },
  code: { fontSize: 22, fontWeight: '800', letterSpacing: 5, textAlign: 'center' },
});

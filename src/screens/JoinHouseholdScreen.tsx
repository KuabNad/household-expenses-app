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
      Alert.alert('Revisa el código', 'El código contiene 8 letras o números.');
      return;
    }
    try {
      setLoading(true);
      await joinHousehold(code);
    } catch (error) {
      Alert.alert('No se pudo unir al hogar', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <Text style={styles.title}>Únete a un hogar</Text>
      <Text style={styles.subtitle}>Pide a un miembro el código que aparece en Ajustes.</Text>
      <AppInput
        autoCapitalize="characters"
        autoCorrect={false}
        label="Código de invitación"
        maxLength={8}
        onChangeText={(value) => setCode(value.toUpperCase())}
        onSubmitEditing={submit}
        placeholder="ABCD2345"
        style={styles.code}
        value={code}
      />
      <AppButton label="Unirse al hogar" loading={loading} onPress={submit} />
      <AppButton label="Volver" onPress={() => navigation.goBack()} variant="text" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.muted, lineHeight: 21, marginBottom: spacing.lg },
  code: { fontSize: 22, fontWeight: '800', letterSpacing: 5, textAlign: 'center' },
});

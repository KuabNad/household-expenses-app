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
      Alert.alert('Nombre del hogar necesario', 'Introduce al menos 2 caracteres.');
      return;
    }
    try {
      setLoading(true);
      await createHousehold(name);
    } catch (error) {
      Alert.alert('No se pudo crear el hogar', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      subtitle={`Bienvenido, ${profile?.displayName ?? ''}. Crea un espacio compartido o únete a uno.`}
      title="Tu hogar"
    >
      <View style={styles.card}>
        <View style={styles.icon}>
          <Ionicons color={colors.primary} name="home-outline" size={28} />
        </View>
        <Text style={styles.cardTitle}>Crear un hogar</Text>
        <Text style={styles.body}>
          Añadiremos las categorías predeterminadas y crearemos un código de invitación.
        </Text>
        <AppInput
          autoCapitalize="words"
          label="Nombre del hogar"
          onChangeText={setName}
          placeholder="Kuba y Laura"
          value={name}
        />
        <AppButton label="Crear hogar" loading={loading} onPress={submit} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>¿Ya tienes una invitación?</Text>
        <Text style={styles.body}>Usa el código de 8 caracteres compartido por un miembro.</Text>
        <AppButton
          label="Unirse con código"
          onPress={() => navigation.navigate('JoinHousehold')}
          variant="secondary"
        />
      </View>

      <AppButton label="Cerrar sesión" onPress={logout} variant="text" />
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

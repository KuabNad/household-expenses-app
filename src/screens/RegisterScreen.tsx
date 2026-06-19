import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { Screen } from '../components/Screen';
import { useAuth } from '../hooks/useAuth';
import { friendlyError } from '../services/errors';
import type { AuthStackParamList } from '../types/navigation';
import { colors, spacing } from '../utils/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!displayName.trim() || !email.trim() || password.length < 6) {
      Alert.alert(
        'Revisa tus datos',
        'Añade tu nombre, un correo válido y una contraseña de al menos 6 caracteres.',
      );
      return;
    }
    try {
      setLoading(true);
      await register(displayName, email, password);
    } catch (error) {
      Alert.alert('No se pudo crear la cuenta', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.heading}>
        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.subtitle}>Después podrás crear un hogar o unirte a uno.</Text>
      </View>
      <View style={styles.form}>
        <AppInput
          autoCapitalize="words"
          autoComplete="name"
          label="Tu nombre"
          onChangeText={setDisplayName}
          placeholder="Kuba"
          value={displayName}
        />
        <AppInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="Correo electrónico"
          onChangeText={setEmail}
          placeholder="tu@ejemplo.com"
          value={email}
        />
        <AppInput
          autoCapitalize="none"
          autoComplete="new-password"
          label="Contraseña"
          onChangeText={setPassword}
          placeholder="Al menos 6 caracteres"
          secureTextEntry
          value={password}
        />
        <AppButton label="Crear cuenta" loading={loading} onPress={submit} />
        <AppButton label="Volver" onPress={() => navigation.goBack()} variant="text" />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  heading: { gap: spacing.sm, marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 15 },
  form: { gap: spacing.md },
});

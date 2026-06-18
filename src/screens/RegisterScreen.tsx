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
      Alert.alert('Check your details', 'Add your name, a valid email, and a 6+ character password.');
      return;
    }
    try {
      setLoading(true);
      await register(displayName, email, password);
    } catch (error) {
      Alert.alert('Could not create account', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.heading}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>You can create a household or join one next.</Text>
      </View>
      <View style={styles.form}>
        <AppInput
          autoCapitalize="words"
          autoComplete="name"
          label="Your name"
          onChangeText={setDisplayName}
          placeholder="Kuba"
          value={displayName}
        />
        <AppInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          value={email}
        />
        <AppInput
          autoCapitalize="none"
          autoComplete="new-password"
          label="Password"
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          secureTextEntry
          value={password}
        />
        <AppButton label="Create account" loading={loading} onPress={submit} />
        <AppButton label="Back to login" onPress={() => navigation.goBack()} variant="text" />
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

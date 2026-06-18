import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { Screen } from '../components/Screen';
import { friendlyError } from '../services/errors';
import { isFirebaseConfigured } from '../services/firebase';
import { useAuth } from '../hooks/useAuth';
import type { AuthStackParamList } from '../types/navigation';
import { colors, radius, spacing } from '../utils/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
    } catch (error) {
      Alert.alert('Could not log in', friendlyError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.brand}>
        <View style={styles.mark}>
          <Text style={styles.markText}>H</Text>
        </View>
        <Text style={styles.title}>Household Expenses</Text>
        <Text style={styles.subtitle}>Shared spending, without the spreadsheet archaeology.</Text>
      </View>

      {!isFirebaseConfigured ? (
        <View style={styles.configWarning}>
          <Text style={styles.configText}>
            Firebase is not configured yet. Copy .env.example to .env and add your project values.
          </Text>
        </View>
      ) : null}

      <View style={styles.form}>
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
          autoComplete="password"
          label="Password"
          onChangeText={setPassword}
          onSubmitEditing={submit}
          placeholder="Your password"
          secureTextEntry
          value={password}
        />
        <AppButton label="Log in" loading={loading} onPress={submit} />
        <AppButton
          label="Create an account"
          onPress={() => navigation.navigate('Register')}
          variant="text"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  brand: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  mark: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  markText: { color: colors.white, fontSize: 26, fontWeight: '900' },
  title: { color: colors.text, fontSize: 29, fontWeight: '900', letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21, textAlign: 'center' },
  form: { gap: spacing.md },
  configWarning: {
    backgroundColor: '#FFF4DF',
    borderRadius: radius.md,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  configText: { color: '#6E4B15', fontSize: 13, lineHeight: 18 },
});

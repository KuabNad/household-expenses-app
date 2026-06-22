import { Ionicons } from '@expo/vector-icons';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Notice } from '../components/Notice';
import { Screen } from '../components/Screen';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { isLocalMode } from '../services/runtime';
import { downloadLocalBackup, restoreLocalBackup } from '../services/localData';
import { colors, radius, spacing } from '../utils/theme';

export function SettingsScreen() {
  const { profile, logout } = useAuth();
  const { household, syncError } = useHousehold();

  const shareInvite = async () => {
    if (!household) return;
    await Share.share({
      message: `Únete a “${household.name}” en Gastos del hogar. Código: ${household.inviteCode}`,
    });
  };

  return (
    <Screen subtitle={profile?.email} title="Ajustes">
      {syncError ? <Notice message={syncError} /> : null}
      <View style={styles.card}>
        <Text style={styles.eyebrow}>HOGAR</Text>
        <Text style={styles.cardTitle}>{household?.name ?? 'Cargando…'}</Text>
        {isLocalMode ? (
          <Text style={styles.body}>
            Edición local para este Mac. No necesita internet ni una cuenta.
          </Text>
        ) : (
          <>
            <Text style={styles.body}>Comparte este código con una persona de confianza.</Text>
            <View style={styles.codeBox}>
              <Text selectable style={styles.code}>
                {household?.inviteCode ?? '--------'}
              </Text>
            </View>
            <AppButton label="Compartir invitación" onPress={shareInvite} variant="secondary" />
          </>
        )}
      </View>

      {isLocalMode ? (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>BACKUP LOCAL</Text>
          <Text style={styles.body}>
            Guarda una copia privada para poder recuperar tus datos si limpias el navegador o
            cambias de Mac.
          </Text>
          <AppButton
            label="Descargar backup"
            onPress={() => {
              void downloadLocalBackup().catch((error) =>
                Alert.alert(
                  'No se pudo crear el backup',
                  error instanceof Error ? error.message : 'Error desconocido.',
                ),
              );
            }}
            variant="secondary"
          />
          <AppButton
            label="Restaurar backup"
            onPress={() => {
              void restoreLocalBackup().catch((error) =>
                Alert.alert(
                  'No se pudo restaurar el backup',
                  error instanceof Error ? error.message : 'Error desconocido.',
                ),
              );
            }}
            variant="text"
          />
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.eyebrow}>MIEMBROS</Text>
        {Object.entries(household?.members ?? {}).map(([id, member]) => (
          <View key={id} style={styles.member}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{member.displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.memberText}>
              <Text style={styles.memberName}>{member.displayName}</Text>
              <Text style={styles.memberEmail}>{member.email}</Text>
            </View>
            {id === household?.createdBy ? (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerText}>Creador</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Ionicons color={colors.primary} name="shield-checkmark-outline" size={22} />
          <View style={styles.memberText}>
            <Text style={styles.memberName}>Datos privados del hogar</Text>
            <Text style={styles.memberEmail}>
              {isLocalMode
                ? 'Los datos se guardan únicamente en el almacenamiento local de este navegador en tu Mac.'
                : 'Las reglas de Firebase limitan los gastos y categorías a los miembros del hogar.'}
            </Text>
          </View>
        </View>
      </View>

      {!isLocalMode ? <AppButton label="Cerrar sesión" onPress={logout} variant="danger" /> : null}
      <Text style={styles.version}>
        Gastos del hogar v1.7.0 {isLocalMode ? '· Mac local' : ''}
      </Text>
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
  eyebrow: { color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  cardTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  body: { color: colors.muted, lineHeight: 20 },
  codeBox: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  code: { color: colors.primary, fontSize: 25, fontWeight: '900', letterSpacing: 5 },
  member: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  avatarText: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  memberText: { flex: 1, gap: 2 },
  memberName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  memberEmail: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  ownerBadge: { backgroundColor: colors.primaryLight, borderRadius: 12, padding: 7 },
  ownerText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  infoRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  version: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});

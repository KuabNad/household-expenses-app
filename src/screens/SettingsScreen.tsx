import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { Notice } from '../components/Notice';
import { Screen } from '../components/Screen';
import { useAuth } from '../hooks/useAuth';
import { useHousehold } from '../hooks/useHousehold';
import { isLocalMode } from '../services/runtime';
import { downloadLocalBackup, restoreLocalBackup } from '../services/localData';
import { colors, radius, spacing } from '../utils/theme';

export function SettingsScreen() {
  const { profile, logout } = useAuth();
  const {
    household,
    households,
    addMember,
    updateMember,
    createHousehold,
    createAdditionalHousehold,
    switchHousehold,
    clearHousehold,
    syncError,
  } = useHousehold();
  const [memberName, setMemberName] = useState('');
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingMemberName, setEditingMemberName] = useState('');
  const [householdName, setHouseholdName] = useState(household?.name ?? '');
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [clearOpen, setClearOpen] = useState(false);
  const [clearText, setClearText] = useState('');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    setHouseholdName(household?.name ?? '');
    setEditingMemberId(null);
    setClearOpen(false);
    setClearText('');
  }, [household?.id, household?.name]);

  const run = async (key: string, action: () => Promise<void>, title: string) => {
    try {
      setLoadingAction(key);
      await action();
    } catch (error) {
      Alert.alert(title, error instanceof Error ? error.message : 'Error desconocido.');
    } finally {
      setLoadingAction(null);
    }
  };

  const shareInvite = async () => {
    if (!household) return;
    await Share.share({
      message: `Únete a “${household.name}” en Gastos del hogar. Código: ${household.inviteCode}`,
    });
  };

  return (
    <Screen subtitle={isLocalMode ? 'Configuración local' : profile?.email} title="Ajustes">
      {syncError ? <Notice message={syncError} /> : null}

      <View style={styles.card}>
        <Text style={styles.eyebrow}>HOGAR</Text>
        {isLocalMode ? (
          <>
            <Text style={styles.body}>
              Selecciona un hogar. Cada hogar mantiene separados sus miembros, categorías,
              ingresos y gastos.
            </Text>
            <View style={styles.choiceRow}>
              {households.map((item) => (
                <AppButton
                  key={item.id}
                  label={item.name}
                  onPress={() =>
                    void run(
                      `switch-${item.id}`,
                      () => switchHousehold(item.id),
                      'No se pudo abrir el hogar',
                    )
                  }
                  style={styles.choiceButton}
                  variant={item.id === household?.id ? 'primary' : 'secondary'}
                />
              ))}
            </View>
            <View style={styles.subcard}>
              <AppInput
                autoCapitalize="words"
                label="Nombre del hogar actual"
                onChangeText={setHouseholdName}
                placeholder="Mi hogar"
                value={householdName}
              />
              <AppButton
                label="Guardar nombre"
                loading={loadingAction === 'rename-home'}
                onPress={() =>
                  void run(
                    'rename-home',
                    () => createHousehold(householdName),
                    'No se pudo cambiar el nombre',
                  )
                }
                variant="secondary"
              />
            </View>
            <View style={styles.subcard}>
              <AppInput
                autoCapitalize="words"
                label="Crear otro hogar"
                onChangeText={setNewHouseholdName}
                placeholder="Casa de vacaciones"
                value={newHouseholdName}
              />
              <AppButton
                label="Crear y abrir hogar"
                loading={loadingAction === 'new-home'}
                onPress={() =>
                  void run(
                    'new-home',
                    async () => {
                      await createAdditionalHousehold(newHouseholdName);
                      setNewHouseholdName('');
                    },
                    'No se pudo crear el hogar',
                  )
                }
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.cardTitle}>{household?.name ?? 'Cargando…'}</Text>
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
            El backup incluye todos los hogares. Guárdalo antes de vaciar datos o mover la app.
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
        {isLocalMode ? (
          <View style={styles.subcard}>
            <AppInput
              autoCapitalize="words"
              label="Añadir persona"
              onChangeText={setMemberName}
              placeholder="Laura"
              value={memberName}
            />
            <AppButton
              label="Añadir al hogar"
              loading={loadingAction === 'add-member'}
              onPress={() =>
                void run(
                  'add-member',
                  async () => {
                    await addMember(memberName);
                    setMemberName('');
                  },
                  'No se pudo añadir la persona',
                )
              }
              variant="secondary"
            />
          </View>
        ) : null}
        {Object.entries(household?.members ?? {}).map(([id, member]) => (
          <View key={id} style={styles.memberBlock}>
            <View style={styles.member}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{member.displayName.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.memberText}>
                <Text style={styles.memberName}>{member.displayName}</Text>
                {member.email ? <Text style={styles.memberEmail}>{member.email}</Text> : null}
              </View>
              {id === household?.createdBy ? (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerText}>Principal</Text>
                </View>
              ) : null}
              {isLocalMode ? (
                <Pressable
                  accessibilityLabel={`Editar ${member.displayName}`}
                  hitSlop={10}
                  onPress={() => {
                    setEditingMemberId(id);
                    setEditingMemberName(member.displayName);
                  }}
                >
                  <Ionicons color={colors.primary} name="pencil-outline" size={21} />
                </Pressable>
              ) : null}
            </View>
            {editingMemberId === id ? (
              <View style={styles.memberEditor}>
                <AppInput
                  autoCapitalize="words"
                  label="Nombre"
                  onChangeText={setEditingMemberName}
                  value={editingMemberName}
                />
                <View style={styles.actionRow}>
                  <AppButton
                    label="Cancelar"
                    onPress={() => setEditingMemberId(null)}
                    style={styles.flexButton}
                    variant="text"
                  />
                  <AppButton
                    label="Guardar"
                    loading={loadingAction === `member-${id}`}
                    onPress={() =>
                      void run(
                        `member-${id}`,
                        async () => {
                          await updateMember(id, editingMemberName);
                          setEditingMemberId(null);
                        },
                        'No se pudo cambiar el nombre',
                      )
                    }
                    style={styles.flexButton}
                  />
                </View>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {isLocalMode ? (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>ACCESO DESDE IPHONE</Text>
          <Text style={styles.body}>
            Mantén el Mac y el iPhone en la misma Wi‑Fi y deja abierta la ventana de Terminal.
            La dirección para el iPhone aparece allí al iniciar la app. Los cambios se guardan
            en este Mac y se actualizan automáticamente.
          </Text>
          <Text style={styles.warning}>
            No hay contraseña: cualquier persona conectada a esa Wi‑Fi que conozca la dirección
            puede ver y editar los datos.
          </Text>
        </View>
      ) : null}

      {isLocalMode ? (
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Vaciar “{household?.name}”</Text>
          <Text style={styles.body}>
            Elimina todos sus gastos, ingresos y categorías personalizadas. Conserva el hogar y
            sus miembros. Los otros hogares no cambian.
          </Text>
          {!clearOpen ? (
            <AppButton label="Vaciar este hogar" onPress={() => setClearOpen(true)} variant="danger" />
          ) : (
            <>
              <AppInput
                autoCapitalize="characters"
                label='Escribe "VACIAR" para confirmar'
                onChangeText={setClearText}
                value={clearText}
              />
              <AppButton
                disabled={clearText.trim().toUpperCase() !== 'VACIAR'}
                label="Eliminar todos los datos del hogar"
                loading={loadingAction === 'clear-home'}
                onPress={() =>
                  void run(
                    'clear-home',
                    async () => {
                      await clearHousehold();
                      setClearOpen(false);
                      setClearText('');
                    },
                    'No se pudo vaciar el hogar',
                  )
                }
                variant="danger"
              />
              <AppButton
                label="Cancelar"
                onPress={() => {
                  setClearOpen(false);
                  setClearText('');
                }}
                variant="text"
              />
            </>
          )}
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Ionicons color={colors.primary} name="shield-checkmark-outline" size={22} />
          <View style={styles.memberText}>
            <Text style={styles.memberName}>Datos privados del hogar</Text>
            <Text style={styles.memberEmail}>
              {isLocalMode
                ? 'La base de datos se guarda en este Mac. No se envía a Firebase ni a internet.'
                : 'Las reglas de Firebase limitan los gastos y categorías a los miembros del hogar.'}
            </Text>
          </View>
        </View>
      </View>

      {!isLocalMode ? <AppButton label="Cerrar sesión" onPress={logout} variant="danger" /> : null}
      <Text style={styles.version}>
        Gastos del hogar v1.8.0 {isLocalMode ? '· Mac local' : ''}
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
  dangerCard: {
    backgroundColor: '#FFF3F3',
    borderColor: '#E8C4C4',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  dangerTitle: { color: colors.danger, fontSize: 18, fontWeight: '900' },
  eyebrow: { color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  cardTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  body: { color: colors.muted, lineHeight: 20 },
  warning: { color: colors.warning, fontSize: 13, fontWeight: '700', lineHeight: 19 },
  codeBox: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  code: { color: colors.primary, fontSize: 25, fontWeight: '900', letterSpacing: 5 },
  subcard: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    gap: spacing.sm,
    padding: spacing.md,
  },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  choiceButton: { minWidth: 120 },
  memberBlock: { gap: spacing.sm },
  member: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  memberEditor: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    gap: spacing.sm,
    marginLeft: 52,
    padding: spacing.md,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  flexButton: { flex: 1 },
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

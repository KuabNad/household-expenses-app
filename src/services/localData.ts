import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';

export const LOCAL_STORAGE_KEY = 'household-expenses-local-v1';

export async function downloadLocalBackup() {
  let stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
  try {
    const response = await fetch('/api/data', { cache: 'no-store' });
    if (response.ok) {
      const envelope = (await response.json()) as { data?: unknown };
      if (envelope.data) stored = JSON.stringify(envelope.data);
    }
  } catch {
    // The browser copy remains available when the local server cannot be reached.
  }
  if (!stored) throw new Error('Todavía no hay datos locales para guardar.');
  const blob = new Blob([stored], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `gastos-hogar-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function restoreLocalBackup() {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: 'application/json',
  });
  if (result.canceled) return false;
  const asset = result.assets[0];
  const text = asset.file ? await asset.file.text() : await new ExpoFile(asset.uri).text();
  const parsed = JSON.parse(text) as Record<string, unknown>;
  const isLegacy =
    parsed.household &&
    Array.isArray(parsed.categories) &&
    Array.isArray(parsed.expenses) &&
    Array.isArray(parsed.monthlyIncomes);
  const isCurrent =
    parsed.version === 2 &&
    typeof parsed.activeHouseholdId === 'string' &&
    parsed.households &&
    typeof parsed.households === 'object';
  if (!isLegacy && !isCurrent) {
    throw new Error('El archivo no es un backup válido de Gastos del hogar.');
  }
  await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
  try {
    const response = await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed),
    });
    if (!response.ok) throw new Error('No se pudo guardar el backup en el Mac.');
  } catch {
    throw new Error('No se pudo restaurar el backup en el servidor local del Mac.');
  }
  window.location.reload();
  return true;
}

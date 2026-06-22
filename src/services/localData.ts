import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile } from 'expo-file-system';

export const LOCAL_STORAGE_KEY = 'household-expenses-local-v1';

export async function downloadLocalBackup() {
  const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
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
  if (
    !parsed.household ||
    !Array.isArray(parsed.categories) ||
    !Array.isArray(parsed.expenses) ||
    !Array.isArray(parsed.monthlyIncomes)
  ) {
    throw new Error('El archivo no es un backup válido de Gastos del hogar.');
  }
  await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
  window.location.reload();
  return true;
}

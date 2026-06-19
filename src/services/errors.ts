export function friendlyError(error: unknown) {
  const fallback = 'Algo salió mal. Comprueba tu conexión e inténtalo de nuevo.';
  if (!(error instanceof Error)) return fallback;

  const code = 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Ya existe una cuenta con este correo.',
    'auth/invalid-credential': 'El correo o la contraseña son incorrectos.',
    'auth/invalid-email': 'Introduce un correo electrónico válido.',
    'auth/network-request-failed': 'No hay conexión a internet.',
    'auth/weak-password': 'Usa una contraseña de al menos 6 caracteres.',
    'permission-denied': 'No tienes permiso para realizar esta acción.',
    'unavailable': 'El servicio no está disponible temporalmente.',
  };

  return messages[code.replace('firestore/', '')] ?? error.message ?? fallback;
}

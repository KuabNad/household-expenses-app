export function friendlyError(error: unknown) {
  const fallback = 'Something went wrong. Check your connection and try again.';
  if (!(error instanceof Error)) return fallback;

  const code = 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'An account already uses this email.',
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/network-request-failed': 'No internet connection. Please try again when online.',
    'auth/weak-password': 'Use a password with at least 6 characters.',
    'permission-denied': 'You do not have permission to do that.',
    'unavailable': 'The service is temporarily unavailable. Please try again.',
  };

  return messages[code.replace('firestore/', '')] ?? error.message ?? fallback;
}

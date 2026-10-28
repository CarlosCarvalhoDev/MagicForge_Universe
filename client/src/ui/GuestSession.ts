/** Guest credential stays in this browser; never log or include it in UI text. */
export function getGuestCredential(storage: Pick<Storage, 'getItem' | 'setItem'>, randomId: () => string): string {
  const key = 'magicforge_guest_credential_v1';
  const existing = storage.getItem(key);
  if (existing) return existing;
  const credential = randomId();
  storage.setItem(key, credential);
  return credential;
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { getGuestCredential } from '../src/ui/GuestSession.ts';

test('guest credential persists and is reused without creating another identity', () => {
  const values = new Map(); let created = 0;
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const random = () => { created++; return 'fixture-credential'; };
  assert.equal(getGuestCredential(storage, random), 'fixture-credential');
  assert.equal(getGuestCredential(storage, random), 'fixture-credential');
  assert.equal(created, 1);
});
test('unavailable storage fails instead of silently losing guest access', () => {
  const storage = { getItem: () => null, setItem: () => { throw new Error('Storage unavailable'); } };
  assert.throws(() => getGuestCredential(storage, () => 'fixture-credential'), /Storage unavailable/);
});

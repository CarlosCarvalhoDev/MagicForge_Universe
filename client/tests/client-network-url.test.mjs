import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveServerUrl } from '../src/network/NetworkConfig.ts';

test('resolveServerUrl respects explicitly passed serverUrl', () => {
  assert.equal(resolveServerUrl('ws://custom-domain.com:3000'), 'ws://custom-domain.com:3000');
});

test('resolveServerUrl respects VITE_SERVER_URL environment variable', () => {
  assert.equal(resolveServerUrl(undefined, 'ws://env-server.local:3000'), 'ws://env-server.local:3000');
});

test('resolveServerUrl dynamically resolves to window.location.hostname for localhost', () => {
  const win = { location: { protocol: 'http:', hostname: 'localhost' } };
  assert.equal(resolveServerUrl(undefined, undefined, win), 'ws://localhost:3000');
});

test('resolveServerUrl dynamically resolves to window.location.hostname for 127.0.0.1', () => {
  const win = { location: { protocol: 'http:', hostname: '127.0.0.1' } };
  assert.equal(resolveServerUrl(undefined, undefined, win), 'ws://127.0.0.1:3000');
});

test('resolveServerUrl dynamically resolves to window.location.hostname for LAN IPv4', () => {
  const win = { location: { protocol: 'http:', hostname: '192.168.18.42' } };
  assert.equal(resolveServerUrl(undefined, undefined, win), 'ws://192.168.18.42:3000');
});

test('resolveServerUrl dynamically uses wss: when protocol is https:', () => {
  const win = { location: { protocol: 'https:', hostname: 'play.magicforge.io' } };
  assert.equal(resolveServerUrl(undefined, undefined, win), 'wss://play.magicforge.io:3000');
});

test('resolveServerUrl falls back to 127.0.0.1 when running outside browser environment', () => {
  assert.equal(resolveServerUrl(undefined, undefined, undefined), 'ws://127.0.0.1:3000');
});

test('no hardcoded 192.168.1.12 remains in ClientNetwork.ts or NetworkConfig.ts', () => {
  const clientNetworkCode = readFileSync(resolve('client/src/network/ClientNetwork.ts'), 'utf8');
  const networkConfigCode = readFileSync(resolve('client/src/network/NetworkConfig.ts'), 'utf8');
  assert.equal(clientNetworkCode.includes('192.168.1.12'), false);
  assert.equal(networkConfigCode.includes('192.168.1.12'), false);
});

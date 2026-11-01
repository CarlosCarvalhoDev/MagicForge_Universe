/**
 * Network connection resolution helper.
 * Dynamically resolves the WebSocket gateway URL based on environment and runtime context.
 */

export interface NetworkWindowContext {
  location?: {
    protocol?: string;
    hostname?: string;
  };
}

export function resolveServerUrl(
  serverUrl?: string,
  envUrl?: string,
  win?: NetworkWindowContext
): string {
  if (serverUrl) {
    return serverUrl;
  }
  if (envUrl) {
    return envUrl;
  }

  const activeWindow: NetworkWindowContext | undefined =
    win !== undefined ? win : (typeof window !== 'undefined' ? window : undefined);

  if (activeWindow?.location?.hostname) {
    const protocol = activeWindow.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${activeWindow.location.hostname}:3000`;
  }

  return 'ws://127.0.0.1:3000';
}

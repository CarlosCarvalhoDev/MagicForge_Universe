declare module 'zzfx' {
  export const zzfx: (...parameters: (number | undefined)[]) => AudioBufferSourceNode | undefined;
  export const zzfxV: number;
  export const zzfxR: number;
  export const zzfxX: AudioContext | undefined;
}


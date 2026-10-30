import { zzfx } from 'zzfx';

/**
 * Gerenciador de áudio micro-procedural para o cliente Web.
 * Utiliza zzfx para síntese sonora pura em tempo de execução via Web Audio API,
 * sem downloads de arquivos de áudio externos.
 */
export class SoundManager {
  private static enabled: boolean = true;
  private static masterVolume: number = 0.6;
  private static initialized: boolean = false;

  /**
   * Ativa ou desativa a reprodução global de sons.
   */
  public static toggle(enable?: boolean): boolean {
    this.enabled = enable !== undefined ? enable : !this.enabled;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('magicforge_audio_enabled', String(this.enabled));
      }
    } catch {}
    return this.enabled;
  }

  public static isAudioEnabled(): boolean {
    return this.enabled;
  }

  public static setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  private static playSafe(...params: (number | undefined)[]): void {
    if (!this.enabled) return;
    if (typeof window === 'undefined') return;

    try {
      // Aplica o multiplicador de volume no primeiro parâmetro de zzfx (volume float)
      if (params.length > 0 && typeof params[0] === 'number') {
        params[0] = params[0] * this.masterVolume;
      }
      zzfx(...params);
    } catch {
      // Ignora silenciosamente se o AudioContext estiver bloqueado por política de autoplay
    }
  }

  /**
   * Ataque físico com espada ou corte melee.
   */
  public static playAttackMelee(): void {
    this.playSafe(1.2, 0.05, 350, 0.02, 0.08, 0.15, 1, 1.5, -4, 0, 0, 0, 0, 0, 0, 0.1, 0.05, 0.7, 0.04);
  }

  /**
   * Disparo de flecha ou projétil perfurante.
   */
  public static playArrowShot(): void {
    this.playSafe(0.8, 0.02, 580, 0.01, 0.05, 0.12, 1, 2.2, -8, 0, 0, 0, 0, 0, 0, 0.08, 0.02, 0.65, 0.05);
  }

  /**
   * Conjuração mágica padrão (luz / arcano).
   */
  public static playSpellCast(): void {
    this.playSafe(1.0, 0.05, 600, 0.15, 0.3, 0.4, 0, 1.2, 5, 0, 150, 0.08, 0.1, 0, 0, 0.1, 0.02, 0.8, 0.1);
  }

  /**
   * Conjuração Demoníaca: Fogo Vil e Energia Sombria do Demonólogo.
   */
  public static playDemonCast(): void {
    this.playSafe(1.3, 0.08, 220, 0.1, 0.35, 0.45, 2, 0.9, -6, 0, 60, 0.12, 0.15, 0.2, 0, 0.2, 0.08, 0.6, 0.12);
  }

  /**
   * Dreno de Almas: som contínuo e etéreo de sucção de vida.
   */
  public static playSoulDrain(): void {
    this.playSafe(0.9, 0.05, 420, 0.2, 0.4, 0.35, 3, 1.8, 4, 0, -80, 0.05, 0.2, 0.1, 0, 0.15, 0.04, 0.5, 0.15);
  }

  /**
   * Círculo Profano / Runa no Chão: pulsação rúnica grave.
   */
  public static playProfaneCircle(): void {
    this.playSafe(1.4, 0.1, 95, 0.25, 0.5, 0.6, 0, 0.7, -3, 0, 0, 0, 0, 0.3, 0, 0.25, 0.1, 0.45, 0.2);
  }

  /**
   * Metamorfose Infernal / Grito Abissal: rugido estridente com distorção.
   */
  public static playMetamorphosis(): void {
    this.playSafe(1.6, 0.12, 110, 0.3, 0.7, 0.8, 3, 0.6, -1.5, 0, 120, 0.15, 0.25, 0.5, 0, 0.3, 0.15, 0.4, 0.25);
  }

  /**
   * Coleta de Ouro ou Moedas caídas no chão.
   */
  public static playGoldPickup(): void {
    this.playSafe(1.0, 0.02, 920, 0.01, 0.08, 0.18, 0, 2.0, 12, 0, 0, 0, 0, 0, 0, 0.05, 0.01, 0.9, 0.02);
  }

  /**
   * Alerta de Boss de Fase / Rugido do Chefe de Mundo.
   */
  public static playBossAlert(): void {
    this.playSafe(1.5, 0.1, 130, 0.2, 0.6, 0.55, 3, 0.8, -2, 0, 0, 0, 0, 0.4, 0, 0.2, 0.1, 0.5, 0.15);
  }

  /**
   * Subida de Nível (Level Up) ou Reborn alcançado.
   */
  public static playLevelUp(): void {
    this.playSafe(1.3, 0.05, 440, 0.1, 0.45, 0.5, 0, 1.8, 8, 20, 200, 0.05, 0.15, 0, 0, 0.1, 0.05, 0.85, 0.1);
  }
}


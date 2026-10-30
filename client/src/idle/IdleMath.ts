import Decimal from 'break_eternity.js';

/**
 * Utilitário central de matemática e formatação para jogos Idle / Incrementais.
 * Utiliza break_eternity.js para suportar números astronômicos até 10^(10^308).
 */
export class IdleMath {
  public static readonly SUFFIXES: readonly string[] = [
    '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No',
    'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'ODc', 'NDc',
    'Vg', 'UVg', 'DVg', 'TVg', 'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OVg', 'NVg',
    'Tg', 'UTg', 'DTg', 'TTg', 'QaTg', 'QiTg', 'SxTg', 'SpTg', 'OTg', 'NTg',
    'Qd', 'UQd', 'DQd', 'TQd', 'QaQd', 'QiQd', 'SxQd', 'SpQd', 'OQd', 'NQd',
    'Qq', 'UQq', 'DQq', 'TQq', 'QaQq', 'QiQq', 'SxQq', 'SpQq', 'OQq', 'NQq',
    'Sg', 'USg', 'DSg', 'TSg', 'QaSg', 'QiSg', 'SxSg', 'SpSg', 'OSg', 'NSg',
    'St', 'USt', 'DSt', 'TSt', 'QaSt', 'QiSt', 'SxSt', 'SpSt', 'OSt', 'NSt',
    'Og', 'UOg', 'DOg', 'TOg', 'QaOg', 'QiOg', 'SxOg', 'SpOg', 'OOg', 'NOg',
    'Nn', 'UNn', 'DNn', 'TNn', 'QaNn', 'QiNn', 'SxNn', 'SpNn', 'ONn', 'NNn',
    'Ce'
  ];

  /**
   * Converte com segurança qualquer valor numérico ou string em instância Decimal.
   */
  public static d(value: number | string | Decimal | undefined | null): Decimal {
    if (value === undefined || value === null) return new Decimal(0);
    if (value instanceof Decimal) return value;
    try {
      return new Decimal(value);
    } catch {
      return new Decimal(0);
    }
  }

  /**
   * Formata valores para a HUD com sufixos clássicos de jogos idle (K, M, B, T...)
   * ou notação científica quando ultrapassar a tabela de sufixos.
   */
  public static format(value: number | string | Decimal | undefined | null, decimals: number = 2): string {
    const dec = this.d(value);

    // Valores nulos ou zero
    if (dec.eq(0)) return '0';

    // Valores negativos
    if (dec.lt(0)) return `-${this.format(dec.abs(), decimals)}`;

    // Menor que 1.000: número exato
    if (dec.lt(1000)) {
      return dec.lt(10) && dec.floor().neq(dec) ? dec.toFixed(decimals) : dec.toFixed(0);
    }

    const exp = dec.exponent;
    const tier = Math.floor(exp / 3);

    // Se estiver dentro da lista de sufixos suportados
    if (tier < this.SUFFIXES.length && this.SUFFIXES[tier]) {
      const scale = Decimal.pow(10, tier * 3);
      const scaled = dec.div(scale);
      return `${scaled.toFixed(decimals)} ${this.SUFFIXES[tier]}`;
    }

    // Notação científica para números extremos
    return dec.toExponential(decimals);
  }

  /**
   * Formatação compacta para dano flutuante de combate no Canvas (ex: +14.2K, +3.5M).
   */
  public static formatCombatDamage(damage: number | string | Decimal): string {
    const dec = this.d(damage);
    if (dec.lt(1000)) return dec.toFixed(0);
    return this.format(dec, 1);
  }

  /**
   * Cálculo de Combat Power (CP) Idle escalonado exponencialmente por Reborn.
   */
  public static calculateIdleCp(
    statsSum: number | Decimal,
    level: number,
    rebornCount: number = 0
  ): Decimal {
    const s = this.d(statsSum);
    const lvlDec = new Decimal(level);
    const base = s.times(15).plus(Decimal.pow(lvlDec, 1.8).times(120));
    const rebornMultiplier = Decimal.pow(1.5, rebornCount);
    return base.times(rebornMultiplier).floor();
  }

  /**
   * Cálculo do custo de expansão da mochila ou refino de item.
   */
  public static calculateCost(baseCost: number, tier: number, multiplier: number = 1.6): Decimal {
    return new Decimal(baseCost).times(Decimal.pow(multiplier, tier)).floor();
  }
}

import {
  type SkillDefinition, type S2CSkillUpgradeResultPayload,
  SKILL_MAX_LEVEL, getSkillLevel, getSkillUpgradeCost, getSkillUpgradeMultiplier, canUpgradeSkillPower,
  estimateUpgradeSeconds, type UpgradeFarmSample,
} from '@magicforge/shared';

export function setupSkillUpgrades(transport: {
  isReady(): boolean;
  send(skillId: string, expectedLevel: number): void;
  changed(): void;
  requestRates?(): void;
}) {
  let levels: Record<string, number> = {};
  let loaded = false;
  let pending: string | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let polling: ReturnType<typeof setInterval> | undefined;
  let sample: UpgradeFarmSample | null = null;
  let sampleReceivedAt = 0;
  const status = document.getElementById('skill-upgrade-status')!;

  function reset() {
    clearTimeout(timeout);
    clearInterval(polling);
    sample = null;
    levels = {};
    loaded = false;
    pending = undefined;
    status.textContent = 'Entre com um herói para evoluir as habilidades.';
    transport.changed();
  }

  return {
    reset,
    onOpen() {
      clearInterval(polling);
      if (!transport.requestRates || !transport.isReady()) return;
      transport.requestRates();
      polling = setInterval(() => { if (transport.isReady()) transport.requestRates?.(); }, 15000);
    },
    onClose() { clearInterval(polling); },
    onFarmSample(value: UpgradeFarmSample) {
      if (!transport.isReady()) return;
      sample = value;
      sampleReceivedAt = Date.now();
      transport.changed();
    },
    getLevel: (skillId: string) => getSkillLevel(levels, skillId),
    onSkillsUpdate(value?: Record<string, number>) {
      if (!loaded && value !== undefined) {
        status.textContent = 'Evolua as habilidades selecionadas com ouro e Pó Arcano. Cada nível aumenta a potência em 5%; custos iniciais em calibração.';
      }
      levels = { ...value };
      loaded = value !== undefined;
      transport.changed();
    },
    onResult(result: S2CSkillUpgradeResultPayload) {
      if (!transport.isReady()) return;
      levels = { ...result.skillLevels };
      loaded = true;
      if (pending === result.skillId) {
        pending = undefined;
        clearTimeout(timeout);
      }
      status.textContent = result.message;
      transport.changed();
    },
    createControls(skill: SkillDefinition, context: { equipped: boolean; heroLevel: number; gold: number; dust: number }) {
      const root = document.createElement('div');
      root.className = 'skill-upgrade-controls';
      const level = getSkillLevel(levels, skill.skillId);
      const cost = getSkillUpgradeCost(skill, level);
      const supported = canUpgradeSkillPower(skill);
      const summary = document.createElement('p');
      const bonus = Math.round((getSkillUpgradeMultiplier(level) - 1) * 100);
      summary.textContent = supported
        ? `Habilidade Nv. ${level}/${SKILL_MAX_LEVEL} · +${bonus}% de potência${cost ? ` → +${bonus + 5}%` : ' · Máximo'}`
        : 'Evolução indisponível: efeito de suporte em implementação.';
      const price = document.createElement('p');
      price.textContent = cost && supported
        ? `Melhoria: ${cost.gold.toLocaleString('pt-BR')} ouro + ${cost.dust} Pó Arcano. Você tem ${context.gold.toLocaleString('pt-BR')} ouro e ${context.dust} Pó Arcano.`
        : '';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn-upgrade-skill';
      button.disabled = !loaded || !transport.isReady() || !!pending || !context.equipped ||
        context.heroLevel < skill.unlockLevel || !supported || !cost || context.gold < cost.gold || context.dust < cost.dust;
      button.textContent = pending === skill.skillId ? 'Melhorando…' : !supported ? 'Evolução indisponível' :
        !cost ? 'Nível máximo' : context.heroLevel < skill.unlockLevel ? `Libera no Nv. ${skill.unlockLevel}` :
          !context.equipped ? 'Selecione para melhorar' : !loaded ? 'Aguardando servidor…' :
            context.gold < cost.gold || context.dust < cost.dust ? 'Recursos insuficientes' : `Melhorar para Nv. ${level + 1}`;
      button.addEventListener('click', () => {
        if (button.disabled || pending || !transport.isReady()) return;
        pending = skill.skillId;
        status.textContent = 'Aguardando confirmação da melhoria…';
        timeout = setTimeout(() => {
          // Leave purchases locked until a server reply or reconnect: a late ACK may still arrive.
          status.textContent = 'Sem confirmação do servidor. Reconecte antes de tentar outra melhoria.';
          transport.changed();
        }, 6000);
        transport.changed();
        transport.send(skill.skillId, level);
      });
      root.append(summary, price, button);
      if (cost && supported && context.equipped && context.heroLevel >= skill.unlockLevel) {
        const forecast = document.createElement('p');
        forecast.className = 'skill-upgrade-estimate';
        const estimate = estimateUpgradeSeconds(cost, context, Date.now() - sampleReceivedAt <= 30000 ? sample : null);
        const minutes = Math.max(1, Math.ceil((estimate.seconds ?? 0) / 60));
        const duration = minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}min` : `${minutes}min`;
        forecast.textContent = estimate.state === 'ready' ? 'Recursos disponíveis para melhorar agora.' :
          estimate.state === 'sampling' ? 'Previsão disponível após medir ao menos 1 minuto de caça.' :
            estimate.state === 'no-dust-rate' ? 'Sem taxa de Pó Arcano medida. Obtenha no farm ou na reciclagem; confira espaço na mochila.' :
              estimate.state === 'no-gold-rate' ? 'Sem taxa de ouro medida nesta caçada.' :
                `Pela média desta caçada: cerca de ${duration}. Drops e gastos podem mudar esse tempo.`;
        root.append(forecast);
      }
      return root;
    },
  };
}

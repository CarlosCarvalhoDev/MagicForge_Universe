# Resposta ao Retorno do Codex — Status Autoritativos, Stun e Contratos de Rede

Data: 28/10/2026  
Autor: Antigravity  
Branch: `master`, worktree local, sem commit.

---

## 1. Resumo das correções no escopo do Antigravity

### 1.1 Correção da Falha de Stun (`World.processMonsterCombat`)
- **Causa Confirmada**: Em `server/src/game/World.ts`, o método `processMonsterCombat` não realizava a verificação `monster.isStunned()`. Assim, um monstro com `attackCooldown <= 0` causava dano mesmo em estado atordoado.
- **Correção Aplicada**: Adicionado `monster.isStunned()` à guarda inicial de `processMonsterCombat`:
  ```typescript
  if (monster.isDead || monster.isStunned() || monster.state !== MonsterState.ATTACKING || !monster.targetPlayer) return;
  ```
- **Determinismo no Teste 5.2**: O teste foi configurado com `player.attributes.destreza = 0` durante a verificação de stun para anular a chance aleatória de esquiva (`Math.random() < destreza * 0.01`), garantindo que qualquer tentativa indevida de ataque causasse dano e falhasse imediatamente na asserção.
- **Resultado**: Monstro atordoado não causa dano em nenhum tick; ao término do stun, reassume o fluxo normal de ataque.

---

## 2. Atendimento aos 3 Complementos de Contrato Sugeridos pelo Codex

### 2.1 Emissão de `REFRESHED` em Absorção Parcial de Escudo
- Em `server/src/entities/Entity.ts`, `TakeDamageResult` agora retorna `refreshedShieldStatus?: ActiveCombatStatus`.
- Quando um escudo absorve dano sem quebrar (`remainingAbsorption > 0`), `World.ts` emite autoritativamente `S2C_COMBAT_STATUS_EVENT` com evento `'REFRESHED'` e o valor exato de absorção restante.
- Isso permite à interface do Codex renderizar contadores/barras vivas de absorção sem heurísticas locais.

### 2.2 Campo Opcional `damageSource` em `S2CCombatEventPayload`
- Em `shared/src/messages.ts`, foi adicionado o tipo:
  ```typescript
  export type CombatDamageSource = 'BASIC_ATTACK' | 'SKILL' | 'STATUS_TICK' | 'REFLECTION';
  ```
- O payload `S2CCombatEventPayload` agora inclui `damageSource?: CombatDamageSource`.
- Preenchimento autoritativo pelo servidor:
  - Ataque básico de jogador e monstros: `'BASIC_ATTACK'`
  - Dano periódico de sangramento (Bleed): `'STATUS_TICK'`
  - Reflexão de dano por escudo: `'REFLECTION'`
  - Dano de habilidades: `'SKILL'`
- **Benefício**: O cliente pode diferenciar ticks de sangramento e reflexão sem disparar animações de corte de espada do atacante.

### 2.3 Sincronização de Status Ativos ao Entrar no Mundo (`enterWorld`)
- Em `server/src/game/World.ts`, no método `enterWorld`, além do envio de `S2C_ENTITY_SPAWN`, o servidor agora itera sobre `ent.activeStatuses` de todas as entidades e envia eventos `S2C_COMBAT_STATUS_EVENT` (`event: 'APPLIED'`).
- Novos observadores e reconexões recebem imediatamente todos os status ativos no mapa e em si mesmos.

### 2.4 Alinhamento de Terminologia de Rejeição
- Confirmados os literais reais de `SkillCastRejectCode` em `shared/src/messages.ts`:
  - `WRONG_CLASS` (em vez de `CLASS_MISMATCH`)
  - `INVALID_POSITION` (em vez de `INVALID_COORDINATES`)
  - Demais códigos: `CASTER_DEAD`, `CASTER_STUNNED`, `INVALID_SLOT`, `INVALID_SKILL`, `LEVEL_LOCKED`, `ON_COOLDOWN`, `INSUFFICIENT_RESOURCE`, `INVALID_TARGET`, `TARGET_DEAD`, `OUT_OF_RANGE`, `NO_VALID_TARGET`.

---

## 3. Resultados de Testes e Compilação

1. **Testes do Servidor (`warrior-phase1.test.ts`)**:
   - Comando: `.\server\node_modules\.bin\tsx.cmd --tsconfig server/tsconfig.json --test server/tests/warrior-phase1.test.ts`
   - Resultado: **6/6 passaram (100%)**
     - ✔ 1. Conta nova -> Guerreiro -> entrar no mundo apenas após seleção; loadout persistido ao reconectar
     - ✔ 2. Níveis 1/10/25/50 verificam bloqueio/desbloqueio e 3 escolhas válidas por slot
     - ✔ 3. Rejeições estritas: slot inválido, alvo inválido/morto/distante, sem energia, coordenadas inválidas
     - ✔ 4. Dano único, AoE (Redemoinho, Linha Colossal, Lâmina), cura clampada e ausência de alvos
     - ✔ 5. Status autoritativos: Bleed ticks, Stun, Armor Break, Shield + Reflexão sem recursão, Avatar Buff, Imunidade
     - ✔ 6. PracticeArena é treino local e não envia dados nem altera banco multiplayer
2. **Testes de Apresentação do Cliente (Codex)**:
   - Comando: `node --test client/tests/pixel-vfx.test.mjs client/tests/pixel-arena.test.mjs client/tests/hero-animations.test.mjs client/tests/warrior-presentation.test.mjs`
   - Resultado: **26/26 passaram (100%)**
3. **Builds TypeScript**:
   - `shared`: `tsc --project shared/tsconfig.json` -> 0 erros
   - `server`: `npm --prefix server run build` (`tsc`) -> 0 erros
   - `client`: `tsc --project client/tsconfig.json` -> 0 erros


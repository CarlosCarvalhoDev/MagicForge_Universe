# 📜 Plano Mestre de Implementação: Demonólogo & Fundação Web Idle

**Projeto:** MagicForge: Universe  
**Slug da Tarefa:** `demonologist-idle-foundation`  
**Metodologia:** Ágil (Feature Branches, Test-Driven Development, Pyramid of Tests, Gate de Qualidade)  
**Status:** ⏸️ Aguardando Aprovação do Usuário (Phase 1 Checkpoint)

---

## 🎯 1. Escopo e Objetivos da Tarefa

Implementar a fundação dos sistemas de jogo idle web, a nova classe completa **Demonólogo** com animações de alta fidelidade e magias procedurais, acompanhados de uma suíte rigorosa de testes automatizados:

1. **Passo 1 (Idle Core):** Matemática de números astronômicos (`break_eternity.js`) e sintetizador procedural de áudio (`zzfx`).
2. **Passo 2 (Nova Classe - Demonólogo):** Configuração D&D 5E, 4 habilidades exclusivas, spritesheets completos (5 ciclos de animação) gerados e validados, integração ao cliente e servidor.
3. **Passo 3 (Efeitos Visuais e Magias):** Geração procedural de projéteis e círculos de evocação via Pixelbolt MCP e renderização em Canvas 2D.
4. **Governança & Qualidade:** Testes unitários (caixa branca), testes de animação/passada (caixa preta), simulação headless de combate automatizado e verificação estrita de build.

---

## 🌿 2. Estratégia de Branches Ágeis

Seguindo o manifesto ágil e as regras do `AGENTS.md` (sem conflitos com Codex e sem alterações destrutivas):

| Branch | Objetivo | Entregáveis |
|---|---|---|
| `feature/idle-math-audio` | Passo 1 | `client/src/idle/IdleMath.ts`, `client/src/audio/SoundManager.ts`, testes unitários |
| `feature/demonologist-class` | Passo 2 | Enum, D&D 5E stats, 4 skills, spritesheets 5 ciclos via LPC, testes de passada |
| `feature/demonologist-fx` | Passo 3 | Efeitos procedurais Pixelbolt, integração de projéteis em `GameRenderer.ts` |
| `integration/full-demonologist` | Consolidação | E2E headless combat simulation, validação unificada de build e merge final |

---

## 🛠️ 3. Especificação Detalhada por Passo

### 📦 Passo 1: Idle Core (Matemática & Áudio Micro-Procedural)
* **Arquivos a Criar:**
  * `client/src/idle/IdleMath.ts`:
    * Wrapper sobre `break_eternity.js` com conversão de tipos `number | string | Decimal`.
    * Formatação para HUD com sufixos clássicos (`K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc...`) e notação científica para valores $\ge 10^{93}$.
    * Fórmulas de escalonamento exponencial de Combat Power (CP), Ouro e DPS.
  * `client/src/audio/SoundManager.ts`:
    * Efeitos sintetizados em tempo de execução via `zzfx`:
      * `playAttackMelee()` / `playDemonCast()` (magia sombria)
      * `playGoldPickup()` (coleta de drop)
      * `playBossAlert()` (spawn de Boss da Fase 10)
      * `playLevelUp()` (subida de nível)
    * Controle de volume mestre e mute persistido em `localStorage`.
* **Arquivos a Modificar:**
  * `client/src/renderer/GameRenderer.ts`: Injetar chamadas de áudio nos eventos de ataque/dano e formatação de dano flutuante com `IdleMath`.
* **Bateria de Testes (Caixa Branca):**
  * `client/tests/idle-math.test.mjs`: Testar formatação de 0 a $10^{100}$, precisão de casas decimais, ordenação de sufixos e robustez contra inputs inválidos.

---

### 🔮 Passo 2: Nova Classe — O Demonólogo (`DEMONOLOGO`)
* **Identidade D&D 5E & Lore:**
  * Conjurador sombrio que barganha poder com entidades abissais da Bigorna Astral.
  * Atributos Primários: **Carisma (CHA)** e **Constituição (CON)**.
  * Recurso: Mana / Energia Vil.
  * Alcance: 11.0m (Ranged), intervalo: 1.4s, velocidade: 5.0.
* **4 Habilidades Oficiais (Cadastradas em `shared/src/skills.ts`):**
  1. *Slot 1 (Truque, Nv. 10):* **Seta de Fogo Vil** (projétil arcano de fogo verde, dano direto + DoT).
  2. *Slot 2 (Nv. 15):* **Dreno de Almas** (canalização com roubo de vida de 20%).
  3. *Slot 3 (Nv. 25):* **Círculo Profano** (área de solo que causa lentidão e amplifica dano sofrido pelos monstros).
  4. *Slot 4 (Ultimate, Nv. 40):* **Metamorfose Abissal** (transformação temporária com bônus massivo de dano e aura de fogo vil).
* **Pipeline de Assets & Spritesheets (LPC MCP):**
  * Gerar as folhas na grade canônica 512×512 (ou fatias coordenadas) para os 5 ciclos obrigatórios:
    1. `demonologo_idle.png` (respiração e postura de prontidão)
    2. `demonologo_walk.png` (**alternância rigorosa de passos esquerda/direita** com alinhamento de pivô)
    3. `demonologo_attack.png` / `cast` (gesto de conjuração e arremesso de magia)
    4. `demonologo_hit.png` (recuo de impacto)
    5. `demonologo_death.png` (dissolução em chamas sombrias)
  * Gerar retrato de seleção `client/public/assets/portraits/DEMONOLOGO.jpg`.
* **Arquivos a Modificar:**
  * `shared/src/entities.ts`: Adicionar `DEMONOLOGO` em `CharacterClass` e `CLASS_DEFINITIONS`.
  * `shared/src/skills.ts`: Adicionar as 4 habilidades na tabela mestre.
  * `client/src/renderer/HeroAnimations.ts`: Mapear `HERO_SHEETS.DEMONOLOGO`.
  * `client/index.html` e `client/src/ui/AuthSelection.ts`: Adicionar Demonólogo no seletor de criação de heróis.
* **Bateria de Testes (Caixa Preta):**
  * `client/tests/demonologist-animations.test.mjs`: Validar frames, resolução, FPS, alternância de passadas e alinhamento de coordenadas.

---

### ⚡ Passo 3: Efeitos Visuais & Magias Procedurais (Pixelbolt MCP)
* **Geração de Spritesheets de Efeitos:**
  * Compilar via Pixelbolt (`pixelbolt compile`):
    * `fx_fel_bolt.png`: Projétil esférico com cauda de partículas de fogo verde.
    * `fx_soul_drain.png`: Feixe de partículas espectrais conectando o monstro ao herói.
    * `fx_profane_circle.png`: Runa de convocação rotacionando no piso isométrico.
    * `fx_demon_aura.png`: Efeito de explosão e fumaça na ativação do Ultimate.
* **Integração no Canvas 2D:**
  * Extensão do sistema de projéteis e partículas em `client/src/renderer/GameRenderer.ts` para renderizar efeitos com blending aditivo (`ctx.globalCompositeOperation = 'lighter'`).
* **Testes de Renderização:**
  * Teste unitário e de regressão visual no Canvas headless validando ciclo de vida dos efeitos (`spawn -> update -> despawn`).

---

## 🧪 4. Pirâmide de Testes e Estratégia de Validação

```
           / \
          /   \     E2E / Headless Combat Simulation (1 teste integrado)
         /-----\
        /       \   Testes de Regressão Visual e Passada de Animação (8 testes)
       /---------\
      /           \ Testes Unitários: Matemática Idle, Skills e Auth (15+ testes)
     /-------------\
```

1. **Testes Unitários (Caixa Branca):**
   * Cobertura de cálculos com números hiper-grandes (`break_eternity.js`).
   * Validação de fórmulas de dano e tabelas de habilidades D&D 5E.
2. **Testes de Animação e Contratos (Caixa Preta):**
   * Validação estrita da regra de ouro do `AGENTS.md`: alternância real de pernas nas passadas do Demonólogo.
3. **Simulação Headless de Combate (E2E Automatizado):**
   * Script Node.js que instancia conexão WebSocket em `ws://localhost:3000`, autentica com a conta `admin`, entra na fase 1 com o Demonólogo e verifica o abate de mobs, coleta de drops e escalonamento de CP.

---

## 🚀 5. Como Iniciar e Testar o Jogo em Tempo Real (Guia Prático)

Para que o desenvolvedor possa visualizar o jogo imediatamente em tempo real:

### 1. Iniciar o Servidor Autoritativo (Terminal 1)
```powershell
npm run dev:server
```
* O servidor iniciará o loop autoritativo a 20Hz na porta `3000`.
* Health check disponível em: `http://localhost:3000/health`.

### 2. Iniciar o Cliente Web com Hot-Reload (Terminal 2)
```powershell
npm run dev:client
```
* O Vite iniciará o cliente na porta `5173`.
* Acesse no navegador: **`http://localhost:5173`**.

### 3. Credenciais de Acesso (Conta Admin Já Criada no SQLite)
* **Usuário:** `admin`
* **Senha:** `admin1234`
* **Email cadastrado:** `admin@magicforge.local`
* **Herói Pronto no Pedestal 1:** `AdminLord` (Guerreiro Nível 50, Reborn 1, 1.000.000 de Ouro).
* Os Pedestais 2 e 3 estão livres para criação de novos heróis (onde o Demonólogo entrará).

---

## ⏸️ CHECKPOINT DE APROVAÇÃO (Phase 1)

O plano acima detalha com precisão cirúrgica a arquitetura, regras de negócio D&D 5E, pipeline visual (LPC + Pixelbolt), áudio (`zzfx`), matemática (`break_eternity.js`) e a pirâmide de testes automatizados.

> **Você aprova o plano acima para iniciarmos a execução faseada (Passos 1, 2 e 3)?**  
> Digite **Y** (ou confirme) para iniciarmos a implementação com as branches ágeis e testes, ou indique qualquer ajuste desejado.


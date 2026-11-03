# Análise de Referências de Mercado — Idle & Incremental ARPGs

Este documento reúne o estudo aprofundado dos pilares de **game design, UX/UI, curvas matemáticas de progressão e arquitetura de sistemas** dos principais jogos do nicho de **Idle/Incremental RPGs** (referenciados em hubs como TopIdle, Steam e mobile stores), comparando-os com o estado atual e o ferramental do **MagicForge: Universe**.

---

## 1. O Loop Central (Core Gameplay Loop) no Gênero Idle RPG

Os jogos de ponta do gênero (como *Melvor Idle*, *Idle Slayer*, *Antimatter Dimensions*, *Leaf Blower Revolution*, *AFK Arena* e *Ragnarok Idle*) baseiam-se em um ciclo triplo de engajamento:

```
[ Farm Ativo / Idle ] ──► [ Acúmulo de Recursos ] ──► [ Upgrades & Reforço ]
         ▲                                                     │
         │                                                     ▼
[ Multiplicadores Permanentes ] ◄── [ Prestige / Reborn ] ◄── [ Paredão / Boss Gate ]
```

1. **Geração Contínua de Valor:** O jogador sempre progride, mesmo inativo.
2. **Paredão de DPS (Boss Gate):** O progresso linear é interrompido por um chefe com temporizador. Se o jogador não tiver DPS suficiente, ele não avança de mundo/fase.
3. **Decisão de Farm vs Desafio:** O jogador escolhe recuar para farmar recursos ou tentar o chefe.
4. **Camada de Reinício (Prestige / Reborn):** Quando os custos de evolução superam o ganho imediato, o jogador "renasce", trocando o progresso da fase por multiplicadores definitivos.

---

## 2. Padrões de Mecânicas & Regras de Negócio de Sucesso

### 2.1 Modelagem Matemática de Custos e Atributos
No gênero Idle, fórmulas puramente lineares tornam o jogo monótono rapidamente. Os jogos de topo utilizam crescimento exponencial suave para custos e progressões geométricas com bônus multiplicativos:

- **Custo de Evolução de Habilidade/Equipamento:**
  $$\text{Custo}(N) = \text{CustoBase} \times (\text{Multiplicador})^{N}$$
  *(Geralmente com multiplicador entre $1.07$ e $1.15$ para manter a sensação de acessibilidade nos primeiros níveis e exigir planejamento nos avanços).*
- **Poder de Combate (CP / Combat Power):**
  $$\text{CP} = (\text{Ataque} \times w_1) + (\text{Defesa} \times w_2) + (\text{HP} \times w_3) + (\text{CritChance} \times \text{CritDmg} \times w_4)$$
- **Notação de Grandes Números:**
  Quando valores ultrapassam $10^6$, adota-se abreviação rúnica/padrão: `1.45K`, `2.80M`, `15.97B`, `4.10T`, `1.20Qa`, `3.50Qi`.

### 2.2 Sistema de Prestígio (Reborn / Transcrescência)
- **Moeda de Reborn (Pontos de Alma / Fragmentos da Forja):** Obtida proporcionalmente à fase máxima alcançada e monstros abatidos.
- **Árvore de Talentos Permanentes:** 
  - +X% de Ouro permanente;
  - +Y% de Velocidade de Ataque / Redução de Cooldown;
  - Desbloqueio de slots extras de inventário e equipamentos;
  - Bônus de atributos passivos para todas as classes.

### 2.3 Simulação Offline (Ganhos Ausentes)
- **Abordagem Segura Autoritativa:** O servidor registra o `last_active_timestamp`.
- Ao reconectar:
  $$\text{TempoOffline} = \min(\text{Agora} - \text{last\_active}, \text{LimiteMaximoOffline})$$
  *(Limite comum no gênero: 8 a 12 horas para incentivar retorno diário).*
- Os ganhos são calculados pelo rendimento médio da fase em que o herói estava farmando (Ouro, XP, Drops comuns), sem necessidade de rodar 100% da física no servidor.

---

## 3. Padrões de Layout e Ergonomia de Interface (UX/UI)

Analisando a ergonomia dos maiores expoentes mobile do nicho:

| Componente | Boas Práticas de Mercado | Implementação MagicForge | Status no Projeto |
| :--- | :--- | :--- | :--- |
| **Zona do Polegar** | Comandos de ação rápida e combate posicionados nos 30% inferiores da tela. | Arco de combate em meia-lua (`btn-primary-attack` + 4 skills) e chat na base. | **Implementado e Calibrado** |
| **Informação de Topo** | Status do herói à esquerda e utilitários (moedas, sessões, zoom) à direita com separação estrita. | `#hero-status-card` (esq) e `#top-right-location-card` (dir) com margem livre sem colisão. | **Implementado e Calibrado** |
| **Menos Poluição Visual** | Menus secundários ocultos em abas laterais retráteis (gavetas/drawers). | Menu Tático retrátil à esquerda e Dock de Sistemas à direita. | **Implementado e Calibrado** |
| **Foco de Alvo e Chefão** | Barra de vida do alvo no terço superior central com temporizador de fase visível. | `#top-center-wave-card` com contador de monstros e aviso `[CHEFÃO]`. | **Implementado e Calibrado** |
| **Feedback Visual de Cooldown** | Contagem numérica translúcida sobreposta ao botão sem esconder o ícone original. | `.cooldown-overlay` translúcido rúnico com fonte Cinzel e radial gradient. | **Implementado e Calibrado** |

---

## 4. Comparativo Direto: Ferramental do MagicForge vs Melhores Práticas

| Pilar | Padrão dos Top Idle RPGs | Arquitetura Atual MagicForge | Oportunidade de Evolução |
| :--- | :--- | :--- | :--- |
| **Servidor / Automação** | Servidor autoritativo para evitar fraudes em inventário e tempo. | Servidor Node.js WebSocket rodando a 20Hz autoritativo (`server/`). | Adicionar módulo de cálculo de farm offline na reconexão (`C2SLoginPayload`). |
| **Combate** | Transição fluida entre auto-farm contínuo e combate manual ativo. | Toggle `AUTO ON` com busca de monstros por proximidade e disparo de habilidades. | Adicionar priorização configurável de skills no auto-farm (ex: curar com HP < 50%). |
| **Progressão de Fases** | Se o tempo do chefe esgotar, o jogador recua 1 fase automaticamente. | Sistema de ondas e chefão por mapa (`World.ts` e `GameLoop.ts`). | Adicionar temporizador de 30s nos chefões com recuo automático para farm se derrotado. |
| **Economia & Refino** | Refino de armas com chance de sucesso/falha e bônus de brilho visual. | Opcode `C2S_REFINE_EQUIPMENT` e `C2S_SOCKET_GEM` já no protocolo compartilhado. | Integrar partículas e efeitos de forja rúnica na interface do cliente. |
| **Colecionismo (Álbum / Cards)** | Cartas dropadas de monstros conferem bônus permanentes à conta. | Sistema de cartas e álbum rúnico integrado no banco SQLite e UI. | Expandir o catálogo visual de cartas por bioma (Floresta, Jotunheim, Cavernas). |

---

## 5. Próximos Passos Recomendados para o MagicForge

1. **Temporizador de Desafio do Chefão:** Implementar timer de 30 segundos nas fases de Chefão (ex: Fase 10/10). Se o tempo zerar, o jogo recua para a fase 9 de farm automático até o jogador tentar novamente.
2. **Sistema de Farm Ausente (Offline Rewards):** Armazenar `last_logout` no banco SQLite (`users` / `characters`) e entregar o resumo de ouro e XP ao logar.
3. **Formatador Universal de Notação Rúnica/Numérica:** Adicionar helper client-side para converter números gigantes (`15.970.000` -> `15.97M`).
4. **Filtro de Auto-Desmontagem (Auto-Salvage):** Permitir que o jogador marque no painel de Farm itens comuns/mágicos para virar pó arcano instantaneamente sem lotar o inventário.

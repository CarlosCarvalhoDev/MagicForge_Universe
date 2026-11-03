# Guia do Virtual Game Studio — MagicForge: Universe

Este guia detalha a integração completa da arquitetura **Claude Code Game Studios** adaptada e assimilada nativamente no **Google Antigravity / AG Kit** do projeto **MagicForge: Universe**.

---

## 1. Visão Geral da Arquitetura

O sistema transforma o assistente em um **estúdio de desenvolvimento de jogos completo**, estruturado em 3 níveis hierárquicos e integrado com o cliente Unity (`MagicForgeClient/`), o cliente Web (`client/`) e os MCPs de arte (PixelLab, ComfyUI, LPC Spritesheet, Pixelbolt).

```
                      [ Diretores (Tier 1) ]
           Creative Director  │  Technical Director  │  Producer
                              │
                    [ Leads & Design (Tier 2) ]
      Game Designer │ Systems Designer │ Art Director │ QA Lead │ Audio Director
                              │
                    [ Especialistas (Tier 3) ]
  Gameplay Programmer │ Unity Specialist │ Unity Shader │ Unity UI │ AI Programmer
  Level Designer │ Economy Designer │ Technical Artist │ Sound Designer │ QA Tester
```

---

## 2. Departamentos e Especialistas Disponíveis

Você pode acionar qualquer especialista explicitamente com `@<nome-do-agente>` ou deixar o orquestrador selecionar os agentes adequados:

### Direção e Produção (Tier 1)
* `@creative-director`: Guarda a visão geral, pilares do jogo, tom, coerência narrativa e limites de escopo.
* `@technical-director`: Define a arquitetura técnica, diretrizes de C# / TypeScript e orçamentos de desempenho (60 FPS).
* `@producer`: Planeja tarefas, rastreia dependências e valida os critérios de aceitação (*Definition of Done*).

### Design e Balanceamento (Tier 2 e 3)
* `@game-designer`: Projeta mecânicas centrais, controles, game feel e loops de gameplay.
* `@systems-designer`: Modela atributos, fórmulas matemáticas de combate, mitigação de dano, curvas de status e cooldowns.
* `@economy-designer`: Modela moedas, tabelas de drop (loot), precificação, sinks/faucets e progressão idle/reborn.
* `@level-designer`: Projeta mapas isométricos, fluxo de encontros, posicionamento de acampamentos de monstros e spawns.
* `@narrative-director` / `@writer`: Constrói a lore, diálogos de NPCs, descrições de itens e arcos de missões.

### Programação & Unity (Tier 3)
* `@unity-specialist`: Autoridade em Unity C#, MonoBehaviours, ScriptableObjects, Prefabs e arquitetura de componentes.
* `@unity-shader-specialist`: Shaders HLSL, ShaderGraph, iluminação 2D e efeitos visuais em sprites.
* `@unity-ui-specialist`: Interface com UI Toolkit e Canvas, prevenindo recálculos pesados e otimizando Draw Calls.
* `@unity-dots-specialist`: ECS, C# Job System e Burst para sistemas de alta performance.
* `@gameplay-programmer`: Máquinas de estados finitos (FSM), movimentação, controles e integração de habilidades.
* `@ai-programmer`: Comportamento de monstros, raio de perseguição (*aggro*), árvores de decisão e chefes de masmorra.

### Arte Técnica, Áudio e QA
* `@art-director` / `@technical-artist`: Ponte entre assets de IA (PixelLab / ComfyUI) e engine (fatiamento de spritesheets, pivôs isométricos, atlas).
* `@sound-designer` / `@audio-director`: Áudio espacial, gatilhos de impacto e paisagens sonoras.
* `@qa-lead` / `@qa-tester`: Testes de simulação automatizados (`npm test`), captura de evidências de bugs e regressão de combate.
* `@performance-analyst`: Auditoria de vazamentos de memória, alocação de GC em loops rápidos e contagem de draw calls.

---

## 3. Novos Comandos de Barra (Workflows)

| Comando | Função Principal | Agentes Envolvidos |
| :--- | :--- | :--- |
| `/gdd [sistema]` | Cria ou atualiza o Documento de Game Design de uma mecânica ou sistema | `creative-director`, `game-designer`, `systems-designer` |
| `/team-combat [habilidade/mecânica]` | Executa o pipeline completo de combate (Design → Código C# → VFX/SFX → Teste QA) | `game-designer`, `gameplay-programmer`, `unity-specialist`, `qa-tester` |
| `/balance [sistema]` | Audita e calibra fórmulas de dano, curvas de XP, economia e tempos de combate | `systems-designer`, `economy-designer`, `qa-tester` |
| `/playtest [cenário]` | Roda simulações de combate automatizadas e gera relatórios com evidências | `qa-lead`, `qa-tester`, `test-engineer` |
| `/unity-audit [pasta/script]` | Audita scripts Unity contra alocações de GC no Update, preservação de `.meta` e ScriptableObjects | `unity-specialist`, `performance-analyst`, `technical-director` |
| `/game-story [história]` | Implementa uma história de gameplay de ponta a ponta com verificação completa | `producer`, `lead-programmer`, `gameplay-programmer`, `qa-tester` |

---

## 4. Templates de Estúdio Disponíveis (`Docs/Templates/GameStudio/`)

Foram integrados 17 templates de classe mundial para documentação de jogos:
1. `game-design-document.md`: GDD completo com pilares, loops e sistemas.
2. `technical-design-document.md`: Especificação técnica de arquitetura de software e classes.
3. `level-design-document.md`: Layout de masmorras, zonas, encontros e curvas de dificuldade.
4. `economy-model.md`: Modelagem de moedas, taxas de drop e progressão econômica.
5. `difficulty-curve.md`: Progressão de poder do jogador versus escalonamento de inimigos.
6. `art-bible.md`: Bíblia de arte para consistência de paleta, estilo 2D ilustrado e silhuetas.
7. `sound-bible.md`: Identidade e requisitos sonoros.
8. `hud-design.md`: Especificação de UI e feedback visual em combate.
9. `narrative-character-sheet.md`: Fichas detalhadas de heróis e vilões.
10. `faction-design.md`: Organização de facções e alinhamentos no universo.
11. `test-plan.md` e `test-evidence.md`: Planejamento e registro formal de testes de QA.
12. `quick-design-new-system.md` e `quick-design-tuning.md`: Ajustes rápidos e calibrações pontuais.

---

## 5. Regras de Código de Gameplay Injetadas (`.agents/rules/`)

* **`gameplay-standards.md`**:
  * **Zero alocação no Update:** Sem `new`, sem Linq em loops rápidos; uso obrigatório de pooling.
  * **Zero números mágicos:** Todo balanceamento deve ficar em `ScriptableObject` ou arquivos de dados.
  * **Independência de FPS:** Todo movimento usa `Time.deltaTime`.
  * **Desacoplamento:** Lógica nunca acessa HUD diretamente; comunicação exclusiva por eventos/Action.
* **`unity-standards.md`**:
  * **Preservação de `.meta`:** Nunca recriar ou perder GUIDs do Unity.
  * **ScriptableObjects imutáveis em runtime:** Não alterar valores de assets SO durante a execução.

---

## 6. Exemplos Práticos de Uso

### Exemplo 1: Projetar e Implementar uma Nova Habilidade
> **Você digita:**  
> `/team-combat Criar habilidade 'Infernal Burst' para o Demonologista com dano em cone e efeito de queimadura`
>
> **O que o estúdio faz:**
> 1. O `@game-designer` e o `@systems-designer` definem a mecânica, ângulo do cone (60°), multiplicador de dano e dano residual (DoT).
> 2. O `@unity-specialist` implementa a classe C# ou ScriptableObject no Unity (`MagicForgeClient`), desacoplado da interface e sem alocações no loop.
> 3. O `@technical-artist` especifica o efeito de fogo (usando Pixelbolt / PixelLab se necessário).
> 4. O `@qa-tester` roda a suíte de testes (`npm test`) para garantir que nenhuma regressão de combate ocorreu.

### Exemplo 2: Calibrar a Economia ou Balanceamento de Monstros
> **Você digita:**  
> `/balance Ajustar curvas de DPS e HP dos monstros nos acampamentos da floresta para aumentar o tempo médio de combate em 20%`
>
> **O que o estúdio faz:**
> 1. O `@systems-designer` lê as tabelas em `client/tests/in-game-gameplay-simulation.test.mjs` e `MagicForgeClient/`.
> 2. Calcula as fórmulas matemáticas de TTK (*Time to Kill*) e propõe a tabela comparativa.
> 3. Executa a simulação para validar os novos valores sem quebrar a progressão.

### Exemplo 3: Auditoria de Performance no Unity
> **Você digita:**  
> `/unity-audit MagicForgeClient/Assets/Scripts/Combat`
>
> **O que o estúdio faz:**
> 1. O `@unity-specialist` e o `@performance-analyst` escaneiam os scripts em busca de alocações de GC, Linq em `Update`, chamadas pesadas de `GetComponent` ou referências quebradas de `.meta`.
> 2. Apresentam um relatório priorizado com as correções necessárias.

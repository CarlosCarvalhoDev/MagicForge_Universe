# Guerreiro V5 — sprites do cliente Web

As folhas estão em `client/public/assets/isometric/review/guerreiro_v5/`. Os renderizadores Web selecionam as ações direcionais dessa pasta. Os arquivos anteriores seguem disponíveis para comparação.

## Ações direcionais

| Folha | Ação | Grade | Célula |
| --- | --- | --- | --- |
| `guerreiro_idle_sheet.png` | Repouso em guarda | 4 × 8 | 222 × 222 px |
| `guerreiro_walk_sheet.png` | Caminhada revisada | 4 × 8 | 222 × 222 px |
| `guerreiro_attack_sheet.png` | Corte básico | 4 × 8 | 222 × 222 px |
| `guerreiro_hit_sheet.png` | Reação a impacto | 4 × 8 | 222 × 222 px |
| `guerreiro_death_sheet.png` | Derrota | 4 × 8 | 222 × 222 px |

As oito linhas seguem a ordem sul, sudoeste, oeste, noroeste, norte, nordeste, leste e sudeste. Os quatro quadros de cada ação são lidos da esquerda para a direita. Na caminhada, a primeira e a terceira colunas são os contatos alternados. A caneleira direita dourada e a esquerda azul ajudam a conferir o apoio. As linhas noroeste, norte, nordeste e leste foram refeitas em uma folha de referência mais próxima antes da montagem. A primeira versão permanece como `guerreiro_walk_candidate_sheet.png` para comparação. A fluidez das passagens e a estabilidade do pivô ainda precisam de avaliação em movimento.

## Conjurações

As folhas de habilidades usam quatro colunas por três linhas. Cada linha contém uma técnica em vista frontal, com preparação, execução, pico do efeito e recuperação. O renderizador pixel usa a folha da técnica ao receber uma conjuração confirmada, em qualquer direção. O enquadramento da arte continua frontal durante a conjuração. A ação direcional volta após o último quadro. Os indicadores de status, os alvos e os resultados do combate continuam vindo do servidor.

| Folha | Linhas de cima para baixo |
| --- | --- |
| `guerreiro_skills_slot_1_sheet.png` | Golpe Firme · Golpe Dilacerante · Corte de Ruptura |
| `guerreiro_skills_slot_2_sheet.png` | Retomar o Fôlego · Postura Ofensiva · Escudo Desarmador |
| `guerreiro_skills_slot_3_sheet.png` | Redemoinho de Aço · Baluarte Inquebrável · Golpe Colossal |
| `guerreiro_skills_slot_4_sheet.png` | Avatar da Guerra · Lâmina do Julgamento · Última Resistência Imortal |

## Direção de arte

As folhas foram criadas com o gerador de imagens integrado. Os prompts pediram pixel art em três quartos, câmera fixa a 45°, fundo transparente e o cavaleiro do retrato com armadura azul-escura e dourada, elmo com penacho, capa azul, espada na mão direita e escudo de leão no braço esquerdo. As poses de cada ação foram descritas quadro a quadro. Para as técnicas, os motivos dos ícones guiaram a arte. O arco dourado do Golpe Firme, os cortes carmesim do Dilacerante e a lâmina celeste do Julgamento são exemplos.

A montagem técnica ajusta as células a uma grade inteira e preserva a transparência. A validação de fluidez em sessão jogável e a eventual integração no Unity ficam para uma etapa posterior.

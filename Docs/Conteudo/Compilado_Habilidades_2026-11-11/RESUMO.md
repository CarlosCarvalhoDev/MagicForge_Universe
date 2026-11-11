# Compilado de habilidades e imagens — 11/11/2026

[Abra a galeria visual portátil](GALERIA.html). Envie esse HTML ao colega: as 28 imagens estão embutidas, sem necessidade de internet ou caminhos locais.

## Estado confirmado

**Guerreiro, Bárbaro, Clérigo e Mago** têm os 12 efeitos implementados de acordo com o catálogo atual. São 48 habilidades nessas quatro classes. Balanceamento final e arte completa ainda são pendências. **Arqueiro, Monge e Bruxo** continuam parcialmente implementados; constar no catálogo ou passar na guarda de disponibilidade não comprova o efeito completo.

| Classe | Mecânica | Caminhos canônicos presentes | Artes distintas existentes | Caminhos ausentes |
| --- | --- | --- | --- | --- |
| Guerreiro | 12/12 efeitos | 0/12 | 4 | 12 |
| Bárbaro | 12/12 efeitos | 12/12 | 4 | 0 |
| Clérigo | 12/12 efeitos | 0/12 | 4 | 12 |
| Mago | 12/12 efeitos | 0/12 | 4 | 12 |
| Arqueiro | Parcial | 0/12 | 4 | 12 |
| Monge | Parcial | 0/12 | 4 | 12 |
| Bruxo | Parcial | 0/12 | 4 | 12 |

**Contagem conferida:** 84 habilidades canônicas, 68 arquivos PNG Web, 28 hashes distintos, 12 caminhos canônicos presentes e 72 ausentes. Os 12 caminhos presentes do Bárbaro repetem quatro ilustrações. Há quatro artes legadas por classe; o HUD procura o nome canônico, não o alias antigo. Não confundir caminhos faltantes com uma quantidade definitiva de imagens a gerar: o reaproveitamento depende de revisão semântica.

Os slots são liberados nos níveis **1, 10, 25 e 50**, três escolhas por slot.

## As 84 habilidades

### Guerreiro

Sangramento, ruptura de armadura, proteção/reflexão, empurrão, buffs e resistência.

Evidência de implementação: [entrega anterior](../../../Docs/ENTREGA_GUERREIRO_BARBARO_2026-11-05.md).

| Habilidade | ID canônico | Slot / nível | PNG canônico |
| --- | --- | --- | --- |
| Golpe Firme | `guerreiro_truque_1` | 1 / 1 | Ausente |
| Golpe Dilacerante | `guerreiro_truque_2` | 1 / 1 | Ausente |
| Corte de Ruptura | `guerreiro_truque_3` | 1 / 1 | Ausente |
| Retomar o Fôlego | `guerreiro_nv1_1` | 2 / 10 | Ausente |
| Postura Ofensiva | `guerreiro_nv1_2` | 2 / 10 | Ausente |
| Escudo Desarmador | `guerreiro_nv1_3` | 2 / 10 | Ausente |
| Redemoinho de Aço | `guerreiro_nv2_1` | 3 / 25 | Ausente |
| Baluarte Inquebrável | `guerreiro_nv2_2` | 3 / 25 | Ausente |
| Golpe Colossal | `guerreiro_nv2_3` | 3 / 25 | Ausente |
| Avatar da Guerra | `guerreiro_nv3_1` | 4 / 50 | Ausente |
| Lâmina do Julgamento | `guerreiro_nv3_2` | 4 / 50 | Ausente |
| Última Resistência Imortal | `guerreiro_nv3_3` | 4 / 50 | Ausente |

### Bárbaro

Lentidão, dreno, enfraquecimento, carga/salto, sangramento, proteção, execução e aura da Matilha.

Evidência de implementação: [entrega anterior](../../../Docs/ENTREGA_GUERREIRO_BARBARO_2026-11-05.md).

| Habilidade | ID canônico | Slot / nível | PNG canônico |
| --- | --- | --- | --- |
| Cutilada Selvagem | `barbaro_truque_1` | 1 / 1 | Presente, arte compartilhada |
| Pisotão Sísmico | `barbaro_truque_2` | 1 / 1 | Presente, arte compartilhada |
| Mordida Voraz | `barbaro_truque_3` | 1 / 1 | Presente, arte compartilhada |
| Fúria Primitiva | `barbaro_nv1_1` | 2 / 10 | Presente, arte compartilhada |
| Rugido Desmoralizador | `barbaro_nv1_2` | 2 / 10 | Presente, arte compartilhada |
| Carga do Juggernaut | `barbaro_nv1_3` | 2 / 10 | Presente, arte compartilhada |
| Banho de Sangue | `barbaro_nv2_1` | 3 / 25 | Presente, arte compartilhada |
| Pele Rochosa Ancestral | `barbaro_nv2_2` | 3 / 25 | Presente, arte compartilhada |
| Salto dos Titãs | `barbaro_nv2_3` | 3 / 25 | Presente, arte compartilhada |
| Cólera do Vulcão | `barbaro_nv3_1` | 4 / 50 | Presente, arte compartilhada |
| Guilhotina do Cataclismo | `barbaro_nv3_2` | 4 / 50 | Presente, arte compartilhada |
| Matilha Espectral Ancestral | `barbaro_nv3_3` | 4 / 50 | Presente, arte compartilhada |

### Clérigo

Dano sagrado, cura, bênção, marca, áreas periódicas, Arma Espiritual e proteção.

Evidência de implementação: [entrega anterior](../../../Docs/ENTREGA_CLERIGO_NIVEL50_2026-11-05.md).

| Habilidade | ID canônico | Slot / nível | PNG canônico |
| --- | --- | --- | --- |
| Chama Sagrada | `clerigo_truque_1` | 1 / 1 | Ausente |
| Tributo aos Mortos | `clerigo_truque_2` | 1 / 1 | Ausente |
| Golpe Orientador | `clerigo_truque_3` | 1 / 1 | Ausente |
| Palavra de Cura | `clerigo_nv1_1` | 2 / 10 | Ausente |
| Bênção da Batalha (Bless) | `clerigo_nv1_2` | 2 / 10 | Ausente |
| Raio Guia Fulgurante | `clerigo_nv1_3` | 2 / 10 | Ausente |
| Espíritos Guardiões | `clerigo_nv2_1` | 3 / 25 | Ausente |
| Arma Espiritual Flutuante | `clerigo_nv2_2` | 3 / 25 | Ausente |
| Santuário Consagrado | `clerigo_nv2_3` | 3 / 25 | Ausente |
| Coluna do Fogo Sagrado | `clerigo_nv3_1` | 4 / 50 | Ausente |
| Intervenção Divina: Graça | `clerigo_nv3_2` | 4 / 50 | Ausente |
| Raio do Sol da Aurora | `clerigo_nv3_3` | 4 / 50 | Ausente |

### Mago

Fogo/gelo/choque, escudo/reflexão, projéteis, áreas, cadeia, aceleração, cometas e congelamento.

Evidência de implementação: [entrega anterior](../../../Docs/ENTREGA_MAGO_NIVEL50_2026-11-05.md).

| Habilidade | ID canônico | Slot / nível | PNG canônico |
| --- | --- | --- | --- |
| Dardo de Fogo | `mago_truque_1` | 1 / 1 | Ausente |
| Raio de Gelo | `mago_truque_2` | 1 / 1 | Ausente |
| Toque Chocante | `mago_truque_3` | 1 / 1 | Ausente |
| Mísseis Arcanos | `mago_nv1_1` | 2 / 10 | Ausente |
| Escudo Arcano Espelhado | `mago_nv1_2` | 2 / 10 | Ausente |
| Orbe de Chamas Devoradoras | `mago_nv1_3` | 2 / 10 | Ausente |
| Nevasca Glacial | `mago_nv2_1` | 3 / 25 | Ausente |
| Relâmpago em Cadeia | `mago_nv2_2` | 3 / 25 | Ausente |
| Mente Acelerada (Haste) | `mago_nv2_3` | 3 / 25 | Ausente |
| Bola de Fogo Apocalíptica | `mago_nv3_1` | 4 / 50 | Ausente |
| Chuva de Cometas Arcanos | `mago_nv3_2` | 4 / 50 | Ausente |
| Estase do Zero Absoluto | `mago_nv3_3` | 4 / 50 | Ausente |

### Arqueiro

Catálogo e execução básica existem; efeitos específicos ainda não tiveram o mesmo fechamento das quatro classes acima.

| Habilidade | ID canônico | Slot / nível | PNG canônico |
| --- | --- | --- | --- |
| Tiro Certeiro | `arqueiro_truque_1` | 1 / 1 | Ausente |
| Flecha Venenosa | `arqueiro_truque_2` | 1 / 1 | Ausente |
| Tiro Desacelerador | `arqueiro_truque_3` | 1 / 1 | Ausente |
| Marca do Caçador | `arqueiro_nv1_1` | 2 / 10 | Ausente |
| Rajada Tripla | `arqueiro_nv1_2` | 2 / 10 | Ausente |
| Armadilha de Espinhos | `arqueiro_nv1_3` | 2 / 10 | Ausente |
| Chuva de Flechas | `arqueiro_nv2_1` | 3 / 25 | Ausente |
| Flecha Espectral Perfuradora | `arqueiro_nv2_2` | 3 / 25 | Ausente |
| Manto da Furtividade | `arqueiro_nv2_3` | 3 / 25 | Ausente |
| Flecha da Fênix Solar | `arqueiro_nv3_1` | 4 / 50 | Ausente |
| Bombardeio das Tempestades | `arqueiro_nv3_2` | 4 / 50 | Ausente |
| Fera Guardiã Astral | `arqueiro_nv3_3` | 4 / 50 | Ausente |

### Monge

Catálogo e execução básica existem; efeitos específicos e buffs ainda pendentes.

| Habilidade | ID canônico | Slot / nível | PNG canônico |
| --- | --- | --- | --- |
| Palma de Chi | `monge_truque_1` | 1 / 1 | Ausente |
| Chute do Vendaval | `monge_truque_2` | 1 / 1 | Ausente |
| Golpe no Ponto Vital | `monge_truque_3` | 1 / 1 | Ausente |
| Rajada de Golpes | `monge_nv1_1` | 2 / 10 | Ausente |
| Passo do Vento Evasivo | `monge_nv1_2` | 2 / 10 | Ausente |
| Cura do Lótus Celestial | `monge_nv1_3` | 2 / 10 | Ausente |
| Golpe Atordoante Celestial | `monge_nv2_1` | 3 / 25 | Ausente |
| Sopro do Dragão de Chi | `monge_nv2_2` | 3 / 25 | Ausente |
| Dança das Sombras Ilusórias | `monge_nv2_3` | 3 / 25 | Ausente |
| Palma dos Cinco Pontos | `monge_nv3_1` | 4 / 50 | Ausente |
| Ascensão do Dragão Dourado | `monge_nv3_2` | 4 / 50 | Ausente |
| Domo do Vazio Sereno | `monge_nv3_3` | 4 / 50 | Ausente |

### Bruxo

Há execução básica e dreno híbrido em Toque Vampírico; a classe inteira ainda não está concluída.

| Habilidade | ID canônico | Slot / nível | PNG canônico |
| --- | --- | --- | --- |
| Rajada Mística | `bruxo_truque_1` | 1 / 1 | Ausente |
| Toque Necrótico Drenante | `bruxo_truque_2` | 1 / 1 | Ausente |
| Orbe de Praga Sombria | `bruxo_truque_3` | 1 / 1 | Ausente |
| Maldição de Bruxaria | `bruxo_nv1_1` | 2 / 10 | Ausente |
| Armadura Gélida de Agathys | `bruxo_nv1_2` | 2 / 10 | Ausente |
| Tentáculos de Hadar | `bruxo_nv1_3` | 2 / 10 | Ausente |
| Fome Voraz de Hadar | `bruxo_nv2_1` | 3 / 25 | Ausente |
| Toque Vampírico da Alma | `bruxo_nv2_2` | 3 / 25 | Ausente |
| Salto das Brumas Etéreas | `bruxo_nv2_3` | 3 / 25 | Ausente |
| Singularidade do Vazio | `bruxo_nv3_1` | 4 / 50 | Ausente |
| Lorde Demônio Maior | `bruxo_nv3_2` | 4 / 50 | Ausente |
| Palavra de Poder: Agonia | `bruxo_nv3_3` | 4 / 50 | Ausente |

## Arquivos e limitações

- [GALERIA.html](GALERIA.html): 28 ilustrações agrupadas por classe, nomes de arquivos, aliases equivalentes e lista das 84 escolhas. Portátil/offline.
- [manifesto.json](manifesto.json): paths, dimensões, SHA-256, agrupamento por arte e estado de cada habilidade; inclui a guarda de disponibilidade sem confundi-la com efeito completo.
- [gerar_compilado.cjs](gerar_compilado.cjs): gerador reproduzível do pacote.
- Web: `client/public/assets/skills/`. Unity: `MagicForgeClient/Assets/Art/Skills/`, com 56 PNGs e 28 hashes distintos. Ligações em cenas/prefabs e paridade de execução Unity não foram auditadas.

Artes de Monge/Bruxo e as realocações sugeridas na proposta de 05/11 precisam de revisão visual. Os nomes antigos da proposta podem divergir dos arquivos reais: usar os caminhos efetivamente listados neste manifesto. Não foi aplicada correção de moldura/watermark nem aprovado automaticamente nenhum reaproveitamento. Ícone não equivale a animação/VFX. A Matilha Espectral está implementada como aura de dano periódico, sem lobos com IA independente.

## Ordem sugerida ao colega

1. Revisar as quatro artes existentes de Guerreiro, Clérigo e Mago e propor associações aos IDs canônicos, pois a mecânica está pronta e os caminhos atuais faltam.
2. Revisar o reaproveitamento/repetição do Bárbaro e produzir identidade própria para as alternativas.
3. Gerar rascunhos das escolhas restantes, com legibilidade em 32/48/64 px; reservar uma pasta nova e não sobrescrever assets atuais.
4. Revisar Monge/Bruxo e demais artes, sem considerar que seus efeitos de combate estão todos prontos.
5. Integrar arte e mapeamento em lote separado, preservando layout, GUIDs e nomes canônicos.

## Verificação e reprodução

Auditoria local na branch `master`, em `E:/MagicForge_Universe`. Foram lidos catálogo, guarda de disponibilidade, execução do servidor e documentos de entrega. PNGs inventariados por cabeçalho e SHA-256. Não foi feita busca no remoto, execução de novos testes de combate ou alteração no banco, código, imagens e arquivos Unity. As validações deste bloco são consistência de contagens/caminhos/hashes e renderização da galeria. Alterações locais anteriores foram preservadas. Sem commit/push.

Para regenerar: exportar `Object.values(SKILLS_DATABASE)` deduplicado por `skillId`, com `effectAvailableGuard: isSkillEffectAvailable(s)`, para `scratch/runtime/skill-catalogue-2026-11-11.json` usando `node --import tsx` a partir de `server`; depois, da raiz, executar `node Docs/Conteudo/Compilado_Habilidades_2026-11-11/gerar_compilado.cjs`.

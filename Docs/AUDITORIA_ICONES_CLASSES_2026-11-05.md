# Auditoria de ícones de habilidades — 05/11/2026

Esta é uma auditoria de arquivos e referências, feita na branch `master` do workspace `E:/MagicForge_Universe`. Não altera assets, habilidades, layout ou mapeamento. O trabalho de mecânica de fusão ocorre em paralelo, em outros arquivos reservados ao agente principal.

## Resultado

- `shared/src/skills.ts`: **84 habilidades canônicas**, distribuídas em sete classes, 12 por classe. Existem **112 chaves** no objeto porque 28 são aliases legados; não são 112 habilidades distintas.
- `client/public/assets/skills/`: **68 PNGs**, todos **512×512** pelo cabeçalho PNG. Há **28 hashes SHA-256 distintos**: número de arquivos não equivale a número de artes próprias.
- **72 caminhos canônicos ausentes**. Somente BARBARO tem os 12 caminhos canônicos presentes. Isso não significa que seja necessário gerar 72 artes novas: há imagens existentes que podem ser reaproveitadas após revisão semântica.
- Os 12 arquivos canônicos do Bárbaro repetem as quatro imagens legadas dessa classe. Há cobertura de caminhos, mas não 12 artes distintas.

## Referência efetivamente usada

O HUD e o Grimório em `client/src/main.ts` constroem o caminho `/assets/skills/${s.skillId}.png`. O fallback em caso de erro é um emoji. Os aliases como `clerigo_2` resolvem para objetos com `skillId` canônico; a existência de `clerigo_2.png` por si só não garante que o HUD encontre a imagem atual.

O código de `getDefaultSkillsForClass` em `shared/src/skills.ts` seleciona `<classe>_truque_1`, `<classe>_nv1_1`, `<classe>_nv2_1`, `<classe>_nv3_1`. Os desbloqueios atuais no catálogo e em `SLOT_CONFIGS` são 1, 10, 25 e 50; a tabela antiga 10/20/35/50 em `Docs/SISTEMA_SKILLS_BALANCEAMENTO_E_PROMPTS_DND5E.md` está divergente. Não usar a documentação antiga para alterar níveis ou mecânicas como parte de uma tarefa de arte.

## Cobertura por classe

| Classe | Skills canônicas | PNG canônico presente | Caminhos ausentes | PNGs legados por slot |
| --- | ---: | ---: | ---: | ---: |
| GUERREIRO | 12 | 0 | 12 | 4 |
| BARBARO | 12 | 12 | 0 | 4 |
| ARQUEIRO | 12 | 0 | 12 | 4 |
| CLERIGO | 12 | 0 | 12 | 4 |
| MAGO | 12 | 0 | 12 | 4 |
| MONGE | 12 | 0 | 12 | 4 |
| BRUXO | 12 | 0 | 12 | 4 |

## Caminhos que faltam

Cada linha abaixo corresponde a um arquivo que a interface procura e não encontrou no diretório de ícones. O nome entre parênteses vem do código atual, e não de uma proposta de rebatismo.

### GUERREIRO

- `client/public/assets/skills/guerreiro_truque_1.png` — Golpe Firme; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/guerreiro_truque_2.png` — Golpe Dilacerante; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/guerreiro_truque_3.png` — Corte de Ruptura; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/guerreiro_nv1_1.png` — Retomar o Fôlego; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/guerreiro_nv1_2.png` — Postura Ofensiva; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/guerreiro_nv1_3.png` — Escudo Desarmador; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/guerreiro_nv2_1.png` — Redemoinho de Aço; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/guerreiro_nv2_2.png` — Baluarte Inquebrável; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/guerreiro_nv2_3.png` — Golpe Colossal; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/guerreiro_nv3_1.png` — Avatar da Guerra; slot 4, desbloqueio Nv. 50.
- `client/public/assets/skills/guerreiro_nv3_2.png` — Lâmina do Julgamento; slot 4, desbloqueio Nv. 50.
- `client/public/assets/skills/guerreiro_nv3_3.png` — Última Resistência Imortal; slot 4, desbloqueio Nv. 50.

### BARBARO

Nenhum caminho canônico ausente. Rever a reutilização das quatro artes nas 12 habilidades, sem substituir os arquivos existentes nesta tarefa.

### ARQUEIRO

- `client/public/assets/skills/arqueiro_truque_1.png` — Tiro Certeiro; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/arqueiro_truque_2.png` — Flecha Venenosa; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/arqueiro_truque_3.png` — Tiro Desacelerador; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/arqueiro_nv1_1.png` — Marca do Caçador; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/arqueiro_nv1_2.png` — Rajada Tripla; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/arqueiro_nv1_3.png` — Armadilha de Espinhos; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/arqueiro_nv2_1.png` — Chuva de Flechas; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/arqueiro_nv2_2.png` — Flecha Espectral Perfuradora; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/arqueiro_nv2_3.png` — Manto da Furtividade; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/arqueiro_nv3_1.png` — Flecha da Fênix Solar; slot 4, desbloqueio Nv. 50.
- `client/public/assets/skills/arqueiro_nv3_2.png` — Bombardeio das Tempestades; slot 4, desbloqueio Nv. 50.
- `client/public/assets/skills/arqueiro_nv3_3.png` — Fera Guardiã Astral; slot 4, desbloqueio Nv. 50.

### CLERIGO

- `client/public/assets/skills/clerigo_truque_1.png` — Chama Sagrada; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/clerigo_truque_2.png` — Tributo aos Mortos; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/clerigo_truque_3.png` — Golpe Orientador; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/clerigo_nv1_1.png` — Palavra de Cura; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/clerigo_nv1_2.png` — Bênção da Batalha (Bless); slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/clerigo_nv1_3.png` — Raio Guia Fulgurante; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/clerigo_nv2_1.png` — Espíritos Guardiões; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/clerigo_nv2_2.png` — Arma Espiritual Flutuante; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/clerigo_nv2_3.png` — Santuário Consagrado; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/clerigo_nv3_1.png` — Coluna do Fogo Sagrado; slot 4, desbloqueio Nv. 50.
- `client/public/assets/skills/clerigo_nv3_2.png` — Intervenção Divina: Graça; slot 4, desbloqueio Nv. 50.
- `client/public/assets/skills/clerigo_nv3_3.png` — Raio do Sol da Aurora; slot 4, desbloqueio Nv. 50.

### MAGO

- `client/public/assets/skills/mago_truque_1.png` — Dardo de Fogo; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/mago_truque_2.png` — Raio de Gelo; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/mago_truque_3.png` — Toque Chocante; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/mago_nv1_1.png` — Mísseis Arcanos; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/mago_nv1_2.png` — Escudo Arcano Espelhado; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/mago_nv1_3.png` — Orbe de Chamas Devoradoras; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/mago_nv2_1.png` — Nevasca Glacial; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/mago_nv2_2.png` — Relâmpago em Cadeia; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/mago_nv2_3.png` — Mente Acelerada (Haste); slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/mago_nv3_1.png` — Bola de Fogo Apocalíptica; slot 4, desbloqueio Nv. 50.
- `client/public/assets/skills/mago_nv3_2.png` — Chuva de Cometas Arcanos; slot 4, desbloqueio Nv. 50.
- `client/public/assets/skills/mago_nv3_3.png` — Estase do Zero Absoluto; slot 4, desbloqueio Nv. 50.

### MONGE

- `client/public/assets/skills/monge_truque_1.png` — Palma de Chi; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/monge_truque_2.png` — Chute do Vendaval; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/monge_truque_3.png` — Golpe no Ponto Vital; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/monge_nv1_1.png` — Rajada de Golpes; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/monge_nv1_2.png` — Passo do Vento Evasivo; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/monge_nv1_3.png` — Cura do Lótus Celestial; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/monge_nv2_1.png` — Golpe Atordoante Celestial; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/monge_nv2_2.png` — Sopro do Dragão de Chi; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/monge_nv2_3.png` — Dança das Sombras Ilusórias; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/monge_nv3_1.png` — Palma dos Cinco Pontos; slot 4, desbloqueio Nv. 50.
- `client/public/assets/skills/monge_nv3_2.png` — Ascensão do Dragão Dourado; slot 4, desbloqueio Nv. 50.
- `client/public/assets/skills/monge_nv3_3.png` — Domo do Vazio Sereno; slot 4, desbloqueio Nv. 50.

### BRUXO

- `client/public/assets/skills/bruxo_truque_1.png` — Rajada Mística; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/bruxo_truque_2.png` — Toque Necrótico Drenante; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/bruxo_truque_3.png` — Orbe de Praga Sombria; slot 1, desbloqueio Nv. 1.
- `client/public/assets/skills/bruxo_nv1_1.png` — Maldição de Bruxaria; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/bruxo_nv1_2.png` — Armadura Gélida de Agathys; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/bruxo_nv1_3.png` — Tentáculos de Hadar; slot 2, desbloqueio Nv. 10.
- `client/public/assets/skills/bruxo_nv2_1.png` — Fome Voraz de Hadar; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/bruxo_nv2_2.png` — Toque Vampírico da Alma; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/bruxo_nv2_3.png` — Salto das Brumas Etéreas; slot 3, desbloqueio Nv. 25.
- `client/public/assets/skills/bruxo_nv3_1.png` — Singularidade do Vazio; slot 4, desbloqueio Nv. 50.
- `client/public/assets/skills/bruxo_nv3_2.png` — Lorde Demônio Maior; slot 4, desbloqueio Nv. 50.
- `client/public/assets/skills/bruxo_nv3_3.png` — Palavra de Poder: Agonia; slot 4, desbloqueio Nv. 50.

## Artes existentes para revisão antes de gerar

Os grupos abaixo são equivalentes **byte a byte**, pelo SHA-256. A igualdade de hash prova duplicação de arquivo; não prova que uma mesma ilustração represente corretamente todas as habilidades ligadas a ela.

- `01_guerreiro_ataque_poderoso.png` = `guerreiro_1.png`.

- `02_guerreiro_retomar_o_folego.png` = `guerreiro_2.png`.

- `03_guerreiro_golpe_amplo.png` = `guerreiro_3.png`.

- `04_guerreiro_avatar_da_furia.png` = `guerreiro_4.png`.

- `05_clerigo_chama_sagrada.png` = `clerigo_1.png`.

- `06_clerigo_arma_espiritual.png` = `clerigo_2.png`.

- `07_clerigo_guardioes_espirituais.png` = `clerigo_3.png`.

- `08_clerigo_coluna_de_chamas_divinas.png` = `clerigo_4.png`.

- `09_mago_raio_de_fogo.png` = `mago_1.png`.

- `10_mago_lamina_flamejante_arcana.png` = `mago_2.png`.

- `11_mago_bola_de_fogo.png` = `mago_3.png`.

- `12_mago_desintegracao_arcana.png` = `mago_4.png`.

- `13_arqueiro_disparo_perfurante_com_marca.png` = `arqueiro_1.png`.

- `14_arqueiro_flecha_espinhosa_enredante.png` = `arqueiro_2.png`.

- `15_arqueiro_saraivada_relampago.png` = `arqueiro_3.png`.

- `16_arqueiro_aljava_celere_tempestade_de_flechas.png` = `arqueiro_4.png`.

- `17_barbaro_ataque_descuidado.png` = `barbaro_1.png` = `barbaro_nv1_3.png` = `barbaro_truque_1.png` = `barbaro_truque_3.png`.

- `18_barbaro_furia_totemica_do_urso.png` = `barbaro_2.png` = `barbaro_nv1_1.png` = `barbaro_nv1_2.png` = `barbaro_nv2_2.png` = `barbaro_nv3_3.png`.

- `19_barbaro_salto_sismico_brutal.png` = `barbaro_3.png` = `barbaro_nv2_3.png` = `barbaro_nv3_2.png` = `barbaro_truque_2.png`.

- `20_barbaro_furia_imortal_do_berserker.png` = `barbaro_4.png` = `barbaro_nv2_1.png` = `barbaro_nv3_1.png`.

- `21_monge_rajada_de_golpes.png` = `monge_1.png`.

- `22_monge_passo_do_vento_e_defesa_paciente.png` = `monge_2.png`.

- `23_monge_ataque_atordoante_do_dragao.png` = `monge_3.png`.

- `24_monge_palma_vibratoria_dos_mil_sois.png` = `monge_4.png`.

- `25_bruxo_rajada_mistica_agonizante.png` = `bruxo_1.png`.

- `26_bruxo_bruxaria_e_toque_vampirico.png` = `bruxo_2.png`.

- `27_bruxo_fome_de_hadar.png` = `bruxo_3.png`.

- `28_bruxo_chama_sinistra_do_patrono_abissal.png` = `bruxo_4.png`.

### Amostra visual inspecionada

Foram abertas somente estas três imagens para observar estilo e semântica, sem modificá-las:

- `guerreiro_1.png`: espada em golpe com energia e fundo escuro, moldura dourada.
- `clerigo_2.png`: martelo espiritual luminoso; não corresponde automaticamente a `clerigo_nv1_1`, que hoje é Palavra de Cura.
- `mago_2.png`: projéteis/lâminas de energia azul e fogo. Sua posição numérica legada não valida associação com a habilidade atual do segundo slot.

Amostra confirma ícones quadrados ilustrados, moldura dourada e leitura por silhueta; não substitui a revisão visual das 28 artes únicas. O guia geral de sprites isométricos não deve ser aplicado literalmente a esses ícones de interface. Não confundir PNG de ícone com animação de conjuração, sprite do personagem ou efeito de combate.

## Prioridade de trabalho sugerida

1. Conferir a identidade visual das 28 artes únicas e montar manifesto de reaproveitamento: arquivo existente, skillId canônico candidato, justificativa, estado de revisão. Não associar por número de slot apenas.
2. Dar cobertura visual às quatro escolhas padrão de cada uma das seis classes sem caminhos canônicos, reaproveitando somente associações semanticamente corretas.
3. Criar ícones próprios para as alternativas ainda sem arte e revisar repetições do Bárbaro, sem apresentar cópias como artes novas.
4. Validar legibilidade a 32/48/64 px, enquadramento, contraste, distinção entre habilidades e nomes exatos dos arquivos. Dimensões 512×512 refletem o padrão atual, não uma conclusão sobre qualidade final de cada asset.
5. Integrar um mapeamento explícito ou novos caminhos somente em etapa de código separada, com reserva de arquivos e revisão do colaborador. Esta auditoria não muda o cliente para carregar aliases.

## Reprodução e limites

- Leitura em Node com `node --import tsx -`, cwd `server`, carregando `../shared/src/skills.ts` e comparando somente entradas cuja chave coincide com `skillId`.
- Inventário de PNGs por `fs.readdirSync`; dimensões pelos bytes IHDR 16–23; SHA-256 por `crypto.createHash`.
- Asserções executadas na verificação: 84 canônicas, 112 chaves, 68 PNGs, 28 hashes únicos, 12 caminhos presentes e 72 ausentes; todas confirmadas nesta captura.
- Caminhos conhecidos de assets Unity e de documentação isométrica existem; não foi auditado o carregamento de ícones no Unity.
- Não houve build, geração de imagens, importação de assets, mudança de GUID/meta, edição de código ou teste em aparelho. Imagens existentes não foram renomeadas, sobrescritas ou publicadas.
- Auditoria é um retrato de 05/11/2026. Reexecutar a contagem antes de integrar um lote produzido por outra IA.

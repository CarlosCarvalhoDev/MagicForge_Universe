# Catálogo visual de habilidades — 11/11/2026

Fonte: `Compilado_Habilidades_2026-11-11` (`manifesto.json`, `RESUMO.md` e as imagens embutidas de `GALERIA.html`).

As 84 entradas canônicas foram comparadas campo a campo com `shared/src/skills.ts`. Os nomes, descrições, níveis de liberação, custos, recursos, recargas, alcances, geometrias declaradas e demais campos do catálogo coincidem. A atualização visual não altera IDs, aliases, balanceamento ou o estado de implementação dos efeitos.

O cliente Web usa `client/public/assets/skills/illustrated/<skillId>.png` na apresentação, criação de heróis, Grimório e barra de combate. A galeria forneceu 28 PNGs de 512 × 512 verificados por SHA-256. Os 56 demais foram gerados com a ferramenta integrada de imagem em sete atlas de oito células, conferidos visualmente e recortados para 512 × 512. O protótipo Unity não tem associação dinâmica ao catálogo Web; nenhum GUID, cena ou sprite referenciado do Unity foi alterado.

## Associação das artes fornecidas

| Galeria | ID canônico |
| --- | --- |
| ARTE-01 | `guerreiro_truque_1` |
| ARTE-02 | `guerreiro_nv1_1` |
| ARTE-03 | `guerreiro_nv2_1` |
| ARTE-04 | `guerreiro_nv3_1` |
| ARTE-05 | `clerigo_truque_1` |
| ARTE-06 | `clerigo_nv2_2` |
| ARTE-07 | `clerigo_nv2_1` |
| ARTE-08 | `clerigo_nv3_1` |
| ARTE-09 | `mago_truque_1` |
| ARTE-10 | `mago_nv1_3` |
| ARTE-11 | `mago_nv3_1` |
| ARTE-12 | `mago_nv1_1` |
| ARTE-13 | `arqueiro_nv1_1` |
| ARTE-14 | `arqueiro_nv1_3` |
| ARTE-15 | `arqueiro_nv2_1` |
| ARTE-16 | `arqueiro_nv3_2` |
| ARTE-17 | `barbaro_truque_1` |
| ARTE-18 | `barbaro_nv1_1` |
| ARTE-19 | `barbaro_nv2_3` |
| ARTE-20 | `barbaro_nv3_1` |
| ARTE-21 | `monge_nv1_1` |
| ARTE-22 | `monge_nv1_2` |
| ARTE-23 | `monge_nv2_1` |
| ARTE-24 | `monge_nv3_1` |
| ARTE-25 | `bruxo_truque_1` |
| ARTE-26 | `bruxo_nv2_2` |
| ARTE-27 | `bruxo_nv2_1` |
| ARTE-28 | `bruxo_nv3_2` |

## Geração das artes complementares

Direção comum: atlas de quatro colunas por duas linhas, quadrados de RPG com moldura de ouro envelhecido, fundo escuro, ação pictórica luminosa, silhueta legível em 64 px, sem texto, cada célula isolada. A ordem abaixo é da esquerda para a direita, de cima para baixo.

- **guerreiro:** `guerreiro_truque_2`, `guerreiro_truque_3`, `guerreiro_nv1_2`, `guerreiro_nv1_3`, `guerreiro_nv2_2`, `guerreiro_nv2_3`, `guerreiro_nv3_2`, `guerreiro_nv3_3`.
- **barbaro:** `barbaro_truque_2`, `barbaro_truque_3`, `barbaro_nv1_2`, `barbaro_nv1_3`, `barbaro_nv2_1`, `barbaro_nv2_2`, `barbaro_nv3_2`, `barbaro_nv3_3`.
- **clerigo:** `clerigo_truque_2`, `clerigo_truque_3`, `clerigo_nv1_1`, `clerigo_nv1_2`, `clerigo_nv1_3`, `clerigo_nv2_3`, `clerigo_nv3_2`, `clerigo_nv3_3`.
- **mago:** `mago_truque_2`, `mago_truque_3`, `mago_nv1_2`, `mago_nv2_1`, `mago_nv2_2`, `mago_nv2_3`, `mago_nv3_2`, `mago_nv3_3`.
- **arqueiro:** `arqueiro_truque_1`, `arqueiro_truque_2`, `arqueiro_truque_3`, `arqueiro_nv1_2`, `arqueiro_nv2_2`, `arqueiro_nv2_3`, `arqueiro_nv3_1`, `arqueiro_nv3_3`.
- **monge:** `monge_truque_1`, `monge_truque_2`, `monge_truque_3`, `monge_nv1_3`, `monge_nv2_2`, `monge_nv2_3`, `monge_nv3_2`, `monge_nv3_3`.
- **bruxo:** `bruxo_truque_2`, `bruxo_truque_3`, `bruxo_nv1_1`, `bruxo_nv1_2`, `bruxo_nv1_3`, `bruxo_nv2_3`, `bruxo_nv3_1`, `bruxo_nv3_3`.

### Assuntos dos prompts por célula

- **guerreiro:** `truque_2`: three blood-red sword slashes; `truque_3`: sword fracturing a steel breastplate in purple sparks; `nv1_2`: forward charging knight red motion trail; `nv1_3`: steel shield knocking a weapon aside; `nv2_2`: runic gold shield dome around a knight; `nv2_3`: blade buried in a fiery cracked floor; `nv3_2`: giant golden sword descending point first; `nv3_3`: kneeling knight inside expanding orange fire rings.
- **barbaro:** `truque_2`: boot stomping a stone shockwave; `truque_3`: spectral fangs draining scarlet life; `nv1_2`: roaring barbarian with jagged sound waves; `nv1_3`: barbarian charging forward axe lowered; `nv2_1`: spinning axe and crimson blood arcs; `nv2_2`: fist encased in granite plates; `nv3_2`: massive descending execution axe and broken rock; `nv3_3`: pack of blue spectral wolves.
- **clerigo:** `truque_2`: black bell ringing with violet grave mist; `truque_3`: radiant flail striking a star of light; `nv1_1`: open hand releasing green and gold healing light; `nv1_2`: three radiant sigils encircling allies; `nv1_3`: golden ray burning a guiding star into the ground; `nv2_3`: gold protective sanctuary with holy circle; `nv3_2`: celestial hand descending in a veil of light; `nv3_3`: sunlight bursting forward from dawn over an altar.
- **mago:** `truque_2`: jagged ice ray with snow particles; `truque_3`: hand emitting forked violet lightning; `nv1_2`: silver mirror barrier reflecting an arcane bolt; `nv2_1`: white blue blizzard vortex with ice crystals; `nv2_2`: bright chain lightning jumping across three conduits; `nv2_3`: floating hourglass with accelerating blue runes; `nv3_2`: meteor shower of violet comets; `nv3_3`: still heart of frost inside frozen clockwork.
- **arqueiro:** `truque_1`: single silver arrow striking a target center; `truque_2`: green poisoned arrow with dripping venom; `truque_3`: arrow trailing blue slowing frost; `nv1_2`: three arrows fired in a fan; `nv2_2`: transparent purple arrow piercing armor; `nv2_3`: camouflaged green cloak fading into leaves; `nv3_1`: arrow transforming into a blazing phoenix; `nv3_3`: astral guardian hawk with emerald wings.
- **monge:** `truque_1`: open palm surrounded by blue chi; `truque_2`: martial artist whirlwind kick in turquoise; `truque_3`: two fingers striking a glowing pressure point; `nv1_3`: pink lotus radiating restorative chi; `nv2_2`: cyan dragon head exhaling a cone of chi; `nv2_3`: three shadow doubles of a martial artist; `nv3_2`: gold dragon ascending in a spiral; `nv3_3`: tranquil violet void dome and meditating silhouette.
- **bruxo:** `truque_2`: skeletal hand drawing a life ribbon; `truque_3`: green and purple plague orb; `nv1_1`: purple cursed eye marked with hex runes; `nv1_2`: blue icy armor with long crystalline thorns; `nv1_3`: writhing violet tentacles erupting out of shadow; `nv2_3`: cloaked figure teleporting into violet mist; `nv3_1`: black hole compressing rings of starlight; `nv3_3`: shattered violet mask pierced by sound ripples.

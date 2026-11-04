# Guia do Design System & Padrões de UI Rúnica
**MagicForge: Universe — Referência Canônica de Interface (Web Client & Assets)**

Este guia documenta as convenções visuais, tokens de estilo, anatomia de componentes e regras de layout consolidadas no cliente web do MagicForge: Universe. Qualquer nova tela, card, modal, HUD ou botão criado no projeto deve seguir estas diretrizes para manter a identidade de fantasia sombria forjada e a ergonomia responsiva intactas.

---

## 1. Filosofia Visual & Inspirações

O design do MagicForge: Universe combina a densidade tática de MMORPGs idle conceituados (*Ravox Idle, Play OT Idle, Lootera, RagnaIdle*) com a solidez de um grimório forjado em metal ancestral (*D&D 5E*):

* **Alto Contraste & Profundidade:** Fundos abissais escuros (`#04070f`, `#0a101c`) com iluminação quente de forja nos pontos de ação (`#f59e0b`, `#fbbf24`).
* **Molduras Rúnicas Físicas:** Todo elemento relevante possui cantoneiras esculpidas em metal dourado (`.svg`), chanfros sutis e borda forjada em relevo (`inset box-shadow`). Não usamos interfaces chapadas (*flat*) nem cards sem limites definidos.
* **Hierarquia Imersiva:** Títulos em tipografia cerimonial (*Cinzel*), dados numéricos densos e descrições em tipografia neutra e nítida (*system-ui / sans-serif*).
* **Zero Espaço Desperdiçado:** As telas terminam milímetros abaixo da ação principal, sem barras de rolagem fantasmas ou vazios desproporcionais.

---

## 2. Paleta de Cores & Tokens

### 2.1 Cores Primárias (Forja & Metal Rúnico)
| Token | Cor Hex | Uso Obrigatório |
| :--- | :--- | :--- |
| **Gold Primary** | `#f59e0b` | Acentos primários, barras de atributos principais, brilhos rúnicos |
| **Gold Light** | `#fef08a` | Títulos em destaque, texto ativo, estados de `:hover` |
| **Gold Deep** | `#d97706` | Bordas externas de cards, contornos de botões |
| **Bronze Dark** | `#b45309` | Degradês de base de botões forjados, sombras metálicas |
| **Amber Faint** | `rgba(245, 158, 11, 0.15)` | Fundos de cards selecionados, halos secundários |

### 2.2 Fundos Abissais (Pedra & Obsidiana)
| Token | Cor Hex / RGBA | Uso Obrigatório |
| :--- | :--- | :--- |
| **Abyss Pure** | `#04070f` | Fundo base global da tela |
| **Abyss Slate** | `rgba(15, 23, 42, 0.85)` | Fundo de badges, chips e itens do ticker |
| **Card Surface** | `rgba(20, 24, 40, 0.95)` | Gradiente inicial de cards e painéis |
| **Card Deep** | `rgba(8, 12, 23, 0.98)` | Gradiente final de cards e painéis |

### 2.3 Status & Feedbacks Táticos
| Token | Cor Hex | Significado |
| :--- | :--- | :--- |
| **Beacon Emerald** | `#10b981` | Servidor online (20Hz), conexões ativas, estados saudáveis |
| **Mana Astral** | `#3b82f6` | Pontos de Mana, Grimório, slots mágicos |
| **Blood Damage** | `#ef4444` | Pontos de Vida, alertas críticos, dano recebido |
| **Cosmic Void** | `#a855f7` | Chefes mundiais, mecânicas do vazio astral, Malakor |

---

## 3. Tipografia Canônica

O projeto adota duas famílias de fontes estritas:

```css
/* Títulos, Heráldica, Rótulos de Ação e Tags Nobres */
font-family: 'Cinzel', serif;

/* Textos densos, descrições, tabelas, atributos D&D e dados de rede */
font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Regras de Ouro Tipográficas:
1. **Nunca misture fontes em títulos:** Títulos principais (`h1`, `h2`, `h3`, `h4`) e botões nobres devem sempre usar `Cinzel` com `letter-spacing` proporcional (geralmente `0.05em` a `0.18em`).
2. **Textos densos precisam de respirabilidade:** Toda descrição de habilidade ou mecânica deve usar `system-ui` com `line-height` entre `1.4` e `1.55` para garantir leitura rápida sem cansar a vista.
3. **Caixa Alta com Moderação:** Reserve `text-transform: uppercase` para badges curtos, subtítulos em Cinzel e nomes de classes. Parágrafos longos nunca devem ser colocados em caixa alta.

---

## 4. Anatomia dos Elementos Rúnicos

### 4.1 As Quatro Cantoneiras Sagradas
Todo componente emoldurado consome os 4 SVGs universais localizados em `/assets/ui/frames/`:
* `corner-tl.svg` (Top-Left)
* `corner-tr.svg` (Top-Right)
* `corner-bl.svg` (Bottom-Left)
* `corner-br.svg` (Bottom-Right)

### 4.2 Tabela de Escala de Cantoneiras
Para manter o equilíbrio visual em diferentes tamanhos de tela, utilize os tamanhos padronizados abaixo:

| Tipo de Componente | Tamanho das Cantoneiras | Espessura da Borda | Outline Offset |
| :--- | :--- | :--- | :--- |
| **Tags / Badges Compactos** | `8px 8px` | `1px solid rgba(251, 191, 36, 0.45)` | Sem outline |
| **Botões de Ação & Inputs** | `12px 12px` | `1.5px solid rgba(251, 191, 36, 0.55)` | `-3px` (1px dourado tênue) |
| **Cards de Mecânica / Rankings** | `16px a 24px` | `1.5px solid #d97706` | `-5px` |
| **Vitrines & Painéis Mestres** | `36px a 40px` | `2px solid #d97706` | `-7px` |

### 4.3 Receita CSS: Card Rúnico Padrão
Sempre monte o background com as 4 cantoneiras nos cantos sobrepostos ao gradiente da superfície:

```css
.exemplo-card-runico {
  position: relative;
  border-radius: 6px;
  border: 1.5px solid #d97706;
  outline: 1px solid rgba(254, 240, 138, 0.3);
  outline-offset: -5px;
  background:
    url('/assets/ui/frames/corner-tl.svg') top left / 16px 16px no-repeat,
    url('/assets/ui/frames/corner-tr.svg') top right / 16px 16px no-repeat,
    url('/assets/ui/frames/corner-bl.svg') bottom left / 16px 16px no-repeat,
    url('/assets/ui/frames/corner-br.svg') bottom right / 16px 16px no-repeat,
    radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.12), transparent 70%),
    linear-gradient(165deg, rgba(20, 24, 40, 0.95) 0%, rgba(9, 13, 25, 0.98) 100%);
  box-shadow:
    inset 0 0 20px rgba(0, 0, 0, 0.85),
    0 10px 24px rgba(0, 0, 0, 0.6),
    0 0 16px rgba(245, 158, 11, 0.1);
  padding: 16px;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.exemplo-card-runico:hover {
  transform: translateY(-2px);
  border-color: #fbbf24;
  outline-color: rgba(254, 240, 138, 0.6);
  box-shadow:
    inset 0 0 20px rgba(245, 158, 11, 0.18),
    0 14px 32px rgba(0, 0, 0, 0.85),
    0 0 24px rgba(245, 158, 11, 0.25);
}
```

---

## 5. Padrões de Botões e Ações

### 5.1 Botão de Ação Rúnica Nobre (ex: Conhecer o Jogo, Início, Rever História)
Substitui completamente botões genéricos tipo "pílula":

```css
.btn-runico-acao {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 15px;
  min-height: 34px;
  background:
    url('/assets/ui/frames/corner-tl.svg') top left / 12px 12px no-repeat,
    url('/assets/ui/frames/corner-tr.svg') top right / 12px 12px no-repeat,
    url('/assets/ui/frames/corner-bl.svg') bottom left / 12px 12px no-repeat,
    url('/assets/ui/frames/corner-br.svg') bottom right / 12px 12px no-repeat,
    linear-gradient(180deg, rgba(35, 30, 48, 0.94) 0%, rgba(12, 16, 29, 0.98) 100%);
  border: 1.5px solid rgba(251, 191, 36, 0.55);
  outline: 1px solid rgba(254, 240, 138, 0.2);
  outline-offset: -3px;
  border-radius: 4px;
  color: #fef08a;
  font: 700 11px 'Cinzel', serif;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.7), 0 4px 14px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

.btn-runico-acao:hover {
  border-color: #fde047;
  outline-color: rgba(254, 240, 138, 0.45);
  color: #ffffff;
  transform: translateY(-1px);
  box-shadow: 0 0 16px rgba(245, 158, 11, 0.35);
}
```

### 5.2 Botão CTA Mestre (ex: Acessar Forja Astral)
* Utiliza gradiente vibrante de ouro forjado (`#f59e0b` a `#b45309`).
* Anel de pulso cósmico externo via animação `@keyframes ctaRingPulse`.
* Borda dourada brilhante e caixa de ícone chanfrada à direita.

---

## 6. Arquitetura de Layout & Regras Estruturais

### 6.1 Centralização Matemática do Cabeçalho (Masthead)
Ao montar cabeçalhos com logo à esquerda, badge à direita e botão central, nunca use `justify-content: space-between` solto, pois a diferença de largura entre os lados desloca o centro. Utilize **CSS Grid com colunas 1fr simétricas**:

```css
.forge-masthead {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  position: relative;
}

.forge-wordmark { justify-self: start; }
.btn-centro     { justify-self: center; }
.badge-direita  { justify-self: end; }
```
Dessa forma, o elemento central fica rigorosamente alinhado com o diamante rúnico do divisor inferior (`left: 50%; transform: translateX(-50%)`).

### 6.2 Linha Dupla de Destaque (Showcase + Ranking)
* **Desktop (Largura total 1260px):**
  - Coluna 1 (`minmax(0, 1fr)`): Vitrine de classes com seletor e palco do herói.
  - Coluna 2 (`340px` fixo): Card de Ranking / Pioneiros da Forja.
* **Mobile (Abaixo de 1080px):**
  - Converte-se automaticamente para coluna única (`1fr`), preservando a mesma riqueza sem espremer os dados.

### 6.3 Agrupamento de Ações no Rodapé
Em rodapés com textos explicativos e botões de ação:
* Agrupe os botões em um contêiner `.forge-footer-actions` com `display: flex; gap: 10px;`.
* No desktop, o texto fica à esquerda e os botões agrupados ficam juntos à direita.
* No mobile, o rodapé se converte para coluna única com os botões distribuídos simetricamente abaixo do texto.

---

## 7. Responsividade & Mobile First (Breakpoint Bible)

| Breakpoint | Escopo | Ajustes Obrigatórios |
| :--- | :--- | :--- |
| **> 1080px** | Desktop Expandido | 3 colunas em mecânicas, vitrine de classes ao lado do ranking (2 colunas). |
| **900px a 1080px** | Tablet / Desktop Médio | Vitrine e ranking empilham verticalmente. Mecânicas mantêm 3 colunas. |
| **720px a 900px** | Tablet Compacto | Mecânicas convertem para 1 coluna. Seletor de classes vira trilho horizontal com rolagem (`overflow-x: auto`). |
| **< 720px** | Mobile Padrão | Dimensões de badges reduzidas (`7.5px`), cantoneiras em `7px/8px`, padding compacto (`3px 6px`). |
| **< 480px** | Mobile Estreito | Títulos ajustados para 12-14px, botões compactos para evitar quebra de linha em telas de 360-390px. |

---

## 8. Checklist para Desenvolvedores & Designers

Antes de subir qualquer novo componente ou tela para o repositório, valide os 6 pontos abaixo:

1. [ ] **Cantoneiras Rúnicas:** Todos os cards e botões nobres utilizam os 4 SVGs de quina?
2. [ ] **Contraste de Tipografia:** Títulos utilizam `Cinzel` e textos informativos utilizam `system-ui`?
3. [ ] **Bordas & Outlines:** Borda de 1.5px ou 2px em ouro escuro (`#d97706` ou `rgba(251, 191, 36, 0.55)`) com outline interno de 1px?
4. [ ] **Terminação Vertical:** O contêiner termina alguns milímetros abaixo do botão principal sem deixar vazios ou scrolls artificiais?
5. [ ] **Responsividade Mobile:** Em 393px (iPhone), nenhum elemento vaza ou é cortado na borda direita?
6. [ ] **Ausência de Formatos Pílula:** Não foram utilizados botões redondos genéricos (`border-radius: 999px`) onde deveria haver moldura rúnica chanfrada?

---
*MagicForge: Universe — Documento mantido sob o padrão técnico de arte e engenharia do projeto.*

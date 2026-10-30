# Manual artístico — Idle RPG de fantasia

## 1. Objetivo visual

Criar uma identidade visual coerente para um RPG de fantasia em formato idle, jogável em navegadores desktop e dispositivos móveis.

Os personagens, itens, efeitos, cenários e interfaces devem parecer pertencer ao mesmo universo.

## 2. Direção artística

- Utilizar pixel art como estilo inicial.
- Priorizar silhuetas reconhecíveis.
- Manter proporções consistentes entre personagens.
- Utilizar paletas controladas e reutilizáveis.
- Preservar transparência nos sprites que precisem de fundo transparente.
- Evitar misturar pixel art com imagens suavizadas ou ilustrações de estilos incompatíveis.
- Priorizar legibilidade em telas pequenas.

## 3. Personagens

Cada personagem deve possuir uma ficha contendo:

- Identificador único.
- Nome.
- Categoria.
- Dimensões do quadro.
- Paleta utilizada.
- Direções disponíveis.
- Animações disponíveis.
- Ponto de referência do personagem.
- Arquivos de origem.
- Arquivos exportados.

Não criar variações de um personagem sem preservar suas características principais.

## 4. Animações

Cada animação deve declarar:

- Nome.
- Lista de quadros.
- Duração de cada quadro.
- Indicação de loop.
- Dimensões dos quadros.
- Ponto de referência.
- Condições de reprodução.

Priorizar inicialmente:

- idle
- walk
- attack
- hurt
- death

Criar somente as animações necessárias para o protótipo.

As animações devem ser verificadas visualmente antes de serem consideradas concluídas.

## 5. Efeitos visuais

Manter uma linguagem visual consistente para:

- Magia.
- Dano.
- Cura.
- Ataques.
- Recompensas.
- Evolução.
- Itens raros.
- Itens épicos.
- Itens lendários.

Os efeitos devem ser legíveis sem encobrir informações importantes da interface.

## 6. Organização de arquivos

- Utilizar nomes descritivos e identificadores estáveis.
- Manter receitas e arquivos de origem separados dos arquivos exportados.
- Não sobrescrever recursos existentes sem verificar suas referências.
- Preservar os metadados necessários para reproduzir as animações.
- Registrar a origem e a licença dos recursos de terceiros.
- Manter um inventário atualizado dos recursos disponíveis.

## 7. Processo de aprovação

Antes de integrar um novo recurso:

1. Gerar o arquivo.
2. Validar seu formato.
3. Verificar dimensões e transparência.
4. Visualizar todos os quadros.
5. Conferir a consistência com os recursos existentes.
6. Testar a reprodução no navegador.
7. Registrar o recurso no inventário.

A aprovação técnica não substitui a avaliação visual.

## 8. Regras para os agentes

- Ler este documento antes de criar ou modificar recursos visuais.
- Consultar referências existentes antes de desenhar um novo personagem.
- Não substituir sprites por emojis.
- Não utilizar imagens remotas como dependência obrigatória do jogo.
- Não criar animações com dimensões ou proporções inconsistentes.
- Não declarar um recurso concluído sem verificar o resultado.
- Não instalar ferramentas pagas nem utilizar APIs que exijam cobrança.1
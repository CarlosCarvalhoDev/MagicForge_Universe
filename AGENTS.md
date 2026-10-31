# MagicForge: Universe — Regras compartilhadas para agentes (Codex e Antigravity)

## 1. Objetivo
Este repositório contém o MagicForge: Universe, incluindo cliente Unity, cliente Web e documentação de arte. Codex e Google Antigravity podem atuar como colaboradores no MESMO repositório, desde que cada alteração respeite as regras abaixo.

## 2. Entenda o projeto antes de alterar
- Use a raiz do projeto `E:\MagicForge_Universe`.
- Identifique no repositório a organização real, versões, comandos de build e testes. Não presuma uma arquitetura que não foi verificada.
- Para trabalhos com arte, consulte `Docs/GUIA_PROMPTS_ASSETS_IA.md` e demais guias aplicáveis antes de editar.
- Caminhos conhecidos (verifique existência):
  - Unity: `MagicForgeClient/Assets/Textures/Sprites/`
  - Web: `client/public/assets/isometric/`
  - Docs: `Docs/Art/Isometric/`
- Não reescreva código não relacionado à tarefa.

## 3. Trabalho colaborativo — REGRA OBRIGATÓRIA
- Antes de editar: confira a branch, `git status`, arquivos modificados e tarefas em andamento.
- Nunca sobrescreva, reverta, descarte ou faça reset de alterações não commitadas do usuário ou do outro agente.
- Se o outro agente estiver editando os mesmos arquivos, PARE e informe o conflito ao usuário.
- Para tarefas simultâneas com risco de conflito, trabalhe em branches e Git worktrees distintos; cada agente edita sua própria pasta de worktree e depois as alterações são revisadas/integradas.
- Se ambos estiverem no MESMO diretório local, só execute tarefas paralelas com posse explícita de conjuntos de arquivos sem sobreposição, ou faça as tarefas sequencialmente.
- Nunca execute `git reset --hard`, `git clean -fd`, `git checkout -- .`, `git push --force`, migrações destrutivas, exclusões em massa ou comandos equivalentes sem aprovação explícita.
- Não faça commit, merge, rebase ou push sem solicitação ou autorização para aquela tarefa.
- Ao concluir, reporte arquivos alterados, testes realizados, pendências e riscos de integração.

## 4. Escopo e autonomia
- Pode pesquisar, ler, criar e editar somente os arquivos necessários ao objetivo solicitado.
- Pode realizar pequenas refatorações diretamente necessárias, preservando contratos existentes; explique toda mudança fora do foco imediato.
- Para mudanças grandes, definição de nova arquitetura, adição de dependências, exclusão de arquivos, alterações de banco, configurações de produção ou mudanças irreversíveis, solicite aprovação.
- Se houver dúvida entre implementar e alterar comportamento existente, mantenha o comportamento atual.
- Priorize mudanças incrementais e verificáveis.

## 5. Regras para Unity, Web e assets
- Preserve referências de GUID e os `.meta` existentes. Nunca duplique GUIDs de Unity.
- Não mova ou renomeie assets referenciados sem cuidar das referências e obter aprovação para alterações de escopo amplo.
- Imagens de gameplay e sprite sheets devem ter nomenclatura consistente e ser importadas conforme a grade real de cada arquivo; não deduza dimensões sem verificar.
- Para animações de caminhada, **confirme que pernas direita e esquerda se alternam de fato entre os quadros**. Repetir poses, inverter apenas o corpo todo ou deformar a imagem não é uma animação válida.
- Não apresente poses estáticas recicladas como sprites de animação finalizados.
- Não altere scripts C#/TypeScript apenas para importar imagens, salvo se isso fizer parte do pedido autorizado.
- Não configure Animator, prefabs ou cenas durante tarefas apenas de preparação de assets, salvo autorização.
- Reaproveite os padrões já existentes do projeto para FPS, pivôs, escala, texturas e nomes antes de estabelecer um novo padrão.

## 6. Qualidade, testes e segurança
- Antes de modificar, informe sucintamente o plano e os arquivos que pretende tocar.
- Execute os testes relevantes disponíveis para os arquivos realmente modificados; não invente resultados de testes.
- Se não puder testar (falta Unity/SDK/dependências), explique claramente a limitação.
- Proteja segredos, tokens, certificados, arquivos de ambiente e chaves de API. Não os copie para prompts, documentação, logs ou commits.
- Respeite `.gitignore` e evite incluir pastas geradas como `Library/`, `Temp/`, `obj/`, `bin/` e `node_modules/`, quando aplicável.

## 7. Relatório de entrega
Sempre finalize com:
1. Resumo objetivo do que foi feito.
2. Lista de arquivos criados/alterados.
3. Comandos de build/teste executados e resultados reais.
4. Pontos que dependem de aprovação ou validação manual.
5. Branch/worktree utilizado, caso aplicável.

**Princípio fundamental:** os dois agentes colaboram; nenhum deles tem permissão para apagar silenciosamente o trabalho do outro.

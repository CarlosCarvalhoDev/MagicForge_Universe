# MagicForge: Universe — Regras compartilhadas para agentes (Codex e Antigravity)

## 1. Objetivo

Este repositório contém o MagicForge: Universe, incluindo cliente Unity, cliente Web e documentação de arte.

Codex e Google Antigravity podem atuar como colaboradores no mesmo repositório, respeitando as regras de segurança, colaboração, qualidade e validação deste documento.

Os agentes devem contribuir para um jogo com identidade visual consistente, personagens detalhados, animações convincentes, efeitos visuais de qualidade e integração funcional com os clientes existentes.

**Prioridades do projeto:**
1. Preservar o trabalho existente e evitar conflitos entre agentes.
2. Produzir assets de qualidade, adequados ao estilo visual estabelecido.
3. Automatizar tarefas repetitivas sempre que isso for seguro e verificável.
4. Priorizar ferramentas gratuitas, locais e de código aberto.
5. Evitar serviços pagos, consumo de créditos e dependências desnecessárias.
6. Entregar resultados testados, organizados e prontos para revisão ou integração.

---

## 2. Entenda o projeto antes de alterar

- Use a raiz do projeto `E:\MagicForge_Universe`.
- Identifique no repositório a organização real, versões, comandos de build, testes e dependências. Não presuma uma arquitetura que não foi verificada.
- Consulte `README`, instruções locais, configurações e documentação aplicável antes de implementar mudanças.
- Para trabalhos com arte, consulte `Docs/GUIA_PROMPTS_ASSETS_IA.md` e demais guias pertinentes antes de gerar ou editar assets.
- Verifique se as ferramentas mencionadas neste documento já estão instaladas ou configuradas antes de propor uma instalação.

### Caminhos conhecidos — verificar existência

- Unity: `MagicForgeClient/Assets/Textures/Sprites/`
- Web: `client/public/assets/isometric/`
- Documentação de arte: `Docs/Art/Isometric/`
- Guia de prompts: `Docs/GUIA_PROMPTS_ASSETS_IA.md`

Esses caminhos são referências, não garantias sobre a estrutura atual.

Não crie novas pastas, pipelines ou convenções sem verificar se já existe uma solução equivalente no projeto.

Não reescreva código não relacionado à tarefa.

---

## 3. Trabalho colaborativo — REGRA OBRIGATÓRIA

Antes de editar qualquer arquivo:

1. Verifique a branch atual.
2. Execute `git status`.
3. Identifique arquivos modificados, não rastreados e alterações não commitadas.
4. Confira as instruções específicas do diretório em que trabalhará.
5. Verifique se outro agente está trabalhando nos mesmos arquivos ou componentes.
6. Informe sucintamente o plano e os arquivos que pretende modificar.

### Proteção do trabalho existente

- Nunca sobrescreva, reverta, descarte ou faça reset de alterações não commitadas do usuário ou do outro agente.
- Não presuma que alterações não commitadas são descartáveis, mesmo que pareçam incompletas.
- Se houver conflito de edição, pare e informe o usuário.
- Não substitua arquivos inteiros quando uma alteração localizada for suficiente.
- Preserve alterações existentes mesmo quando não forem relacionadas à tarefa atual.
- Não apague assets antigos apenas porque uma versão nova foi criada.

### Trabalho simultâneo

- Para tarefas simultâneas com risco de conflito, utilize branches e Git worktrees distintos.
- Cada agente deve editar sua própria pasta de worktree e, posteriormente, suas alterações devem ser revisadas antes da integração.
- Se ambos estiverem no mesmo diretório local, execute tarefas paralelas somente quando houver separação explícita dos arquivos envolvidos.
- Se não for possível garantir essa separação, execute as tarefas sequencialmente.

### Operações que exigem autorização explícita

Nunca execute sem aprovação específica:

- `git reset --hard`
- `git clean -fd`
- `git checkout -- .`
- `git push --force`
- Exclusões em massa.
- Migrações destrutivas.
- Substituições em massa de assets.
- Operações equivalentes que possam eliminar ou sobrescrever trabalho existente.

Não faça commit, merge, rebase ou push sem solicitação ou autorização para aquela tarefa.

Ao concluir, informe os arquivos alterados, testes realizados, pendências e riscos de integração.

---

## 4. Escopo, autonomia e decisões técnicas

Os agentes podem pesquisar, ler, criar e editar os arquivos necessários ao objetivo solicitado.

São permitidos:

- Ajustes localizados.
- Pequenas refatorações diretamente necessárias.
- Correções de bugs relacionadas à tarefa.
- Scripts auxiliares reversíveis.
- Automatizações locais.
- Documentação de processos.
- Testes e validações pertinentes.

Devem ser solicitadas aprovação ou instruções adicionais antes de:

- Alterações grandes de arquitetura.
- Introdução de dependências relevantes.
- Exclusão de arquivos ou substituição em massa.
- Alterações de banco de dados.
- Modificações de produção.
- Mudanças irreversíveis.
- Instalação de serviços que consumam créditos ou gerem cobranças.
- Envio de arquivos do projeto para serviços externos.
- Alterações globais na configuração de ferramentas ou agentes.

Se houver dúvida entre implementar uma nova abordagem e preservar o comportamento existente, mantenha o comportamento atual até que a decisão esteja clara.

Priorize mudanças incrementais, reversíveis e verificáveis.

---

## 5. Diretrizes para ferramentas de IA e automação

O objetivo é permitir que os agentes preparem e executem fluxos de trabalho para criação de arte, animação e integração, sem depender de intervenção manual desnecessária.

Entretanto, cada etapa deve ser validada. Não presuma que a geração de uma imagem garante uma animação correta, que uma ferramenta é compatível com o ambiente ou que uma integração MCP está funcionando.

### 5.1. Estratégia preferencial

Priorize a seguinte combinação, quando compatível com o ambiente existente:

1. **Google Antigravity:** coordenação das tarefas, planejamento, execução de ferramentas, edição de arquivos e validação do resultado.
2. **PixelLab MCP:** geração de pixel art, rotações 360° em múltiplas elevações, inpainting localizado e tilesets isométricos via endpoint remoto autorizado.
3. **ComfyUI local:** geração e processamento de imagens por meio de workflows locais.
4. **Comfy MCP:** integração entre agentes e ComfyUI, quando sua instalação e configuração forem viáveis.
5. **Sprite Maker (`tools/sprite-maker`):** alternativa local para organizar, criar, preparar, riggar e testar assets e animações 2D (`npm run tool:sprite-maker`).
6. **Gorest 2D Animation Spritesheet Generator (`tools/gorest-spritesheet-generator`):** gerador local de animações, loops e rotações em 3 linhas 360° orientado à consistência (`npm run tool:gorest`).
7. **Krita:** edição manual ou assistida de imagens, correção de detalhes e acabamento visual.
8. **Unity e cliente Web:** integração dos assets nos sistemas existentes, respeitando as particularidades de cada cliente.

Essas ferramentas são opções a serem avaliadas, não dependências obrigatórias.

Antes de instalar ou adotar qualquer uma delas, verifique:
- Se o projeto já possui uma ferramenta equivalente.
- Se a ferramenta continua mantida e funciona no sistema operacional utilizado.
- Se existe uma forma local e gratuita de utilizá-la.
- Se o fluxo de trabalho é compatível com a arquitetura do projeto.
- Se os arquivos produzidos podem ser exportados em formatos adequados.
- Se há limitações de licença, modelo, hardware ou dependências.
- Se a ferramenta pode ser utilizada de maneira reproduzível por outro agente.

Não instale todas as ferramentas por padrão. Escolha a menor combinação capaz de cumprir a tarefa.

### 5.2. Prioridade financeira

O padrão do projeto é **não gerar custos adicionais**.

- Priorize ferramentas gratuitas, de código aberto e executadas localmente.
- Não utilize APIs pagas, créditos de geração, assinaturas adicionais ou serviços com cobrança por uso sem autorização explícita.
- Não presuma que uma ferramenta é gratuita apenas porque seu código é aberto.
- Verifique se o modelo, serviço, workflow ou integração selecionada exige pagamento.
- Antes de executar um workflow, verifique se existem nós que enviam dados para APIs externas ou utilizam serviços pagos.
- Não substitua silenciosamente um modelo local por um serviço remoto.
- Não inicie tarefas que possam gerar cobrança sem informar o usuário.
- Se uma ferramenta exigir pagamento ou não puder funcionar sem créditos, procure uma alternativa local e gratuita.
- Se não existir uma alternativa viável, explique a limitação antes de prosseguir.

Não envie código proprietário, credenciais, arquivos privados ou assets não autorizados para serviços externos.

### 5.3. Hardware e compatibilidade

A configuração de referência disponível para o projeto inclui uma AMD Radeon RX 6600 com 8 GB de VRAM.

Essa configuração deve ser considerada ao avaliar modelos locais, sem presumir que todo modelo ou workflow será compatível.

Antes de selecionar um modelo:

1. Verifique os requisitos de memória e processamento.
2. Confirme a compatibilidade com a GPU, o backend e o sistema operacional.
3. Verifique se a versão instalada do framework oferece suporte adequado ao hardware.
4. Prefira modelos e configurações que possam funcionar dentro dos recursos disponíveis.
5. Se necessário, avalie CPU, resolução menor, lotes reduzidos ou outros ajustes compatíveis.
6. Teste com uma geração pequena antes de iniciar um processamento longo.

Não presuma que um modelo desenvolvido para GPUs NVIDIA funcionará adequadamente em uma GPU AMD no Windows.

Não recomende automaticamente workflows que exijam quantidades de VRAM muito superiores às disponíveis.

Se a geração local não for viável, explique a limitação e apresente alternativas gratuitas antes de propor qualquer serviço pago.

### 5.4. Integração com Antigravity via MCP

O projeto conta com servidores MCP integrados para automação de arte e gameplay:

- **PixelLab MCP (`https://api.pixellab.ai/mcp`):** 118 ferramentas registradas para criação de pixel art, inpainting por máscara, rotação 360° de personagens, geração de tilesets e objetos de mapa. Verificado via `npm run tool:pixellab:check`.
- **Pixelbolt MCP (`npx pixelbolt mcp`):** Criação local de partículas (faíscas, chamas, explosões), efeitos mágicos e ícones procedurais determinísticos.
- **LPC Spritesheet MCP (`lpc-spritesheet-mcp`):** Montagem local de personagens antropomórficos, armaduras, mantos e animações 4-way tradicionais.
- **Pixelorama MCP (`pixelorama-mcp`):** Inspeção e ajustes manuais de quadros pixel a pixel em projetos locais.
- **Comfy MCP (`comfy-mcp`):** Ponte local com o ComfyUI na porta 8188 via `comfy-cli`.

**Regra de Uso do PixelLab MCP:**
- A ferramenta utiliza créditos por tamanho de imagem (ex: 5 gerações até 96px, 6 até 208px, 9 até 256px).
- Antes de gerar lotes grandes, utilize `get_pro_flash_capabilities` para verificar custos e faça um teste com um único frame de validação, respeitando a **Seção 5.2 (Prioridade financeira)**.

Quando uma ferramenta oferecer MCP:

- Verifique a documentação oficial e a configuração real da integração.
- Confirme se o servidor MCP está instalado, inicializa corretamente e expõe as ferramentas necessárias.
- Faça um teste simples antes de iniciar uma tarefa completa.
- Não presuma que possuir MCP significa que o agente consegue executar todas as funções da ferramenta.
- Não invente nomes de ferramentas, parâmetros, comandos ou caminhos de configuração.
- Não modifique configurações globais do Antigravity ou de outros clientes sem autorização.
- Prefira configurações locais ao projeto quando forem compatíveis e seguras.
- Não exponha tokens, chaves de API ou outras credenciais nos arquivos de configuração versionados.
- Documente os pré-requisitos e o procedimento de execução quando uma nova integração for adotada pelo projeto.

Se o MCP não estiver disponível, verifique se a ferramenta possui CLI, API local ou outro método de automação antes de concluir que a integração é impossível.

Não declare uma integração funcional sem testá-la.

### 5.5. Ferramentas experimentais

Ferramentas comunitárias de geração de sprites, animações ou composição de cenas podem ser úteis, mas devem ser tratadas como experimentais até que sejam validadas no projeto.

Antes de utilizá-las em produção:

- Teste a instalação em um ambiente apropriado.
- Gere um asset de amostra.
- Verifique a qualidade e a consistência dos quadros.
- Confirme os formatos de saída.
- Confira se os resultados podem ser reproduzidos.
- Verifique licenças e requisitos dos modelos.
- Preserve os assets originais e compare os resultados.

Não torne uma ferramenta experimental uma dependência obrigatória do projeto sem autorização.

---

## 6. Pipeline de criação de assets com IA

Quando a tarefa envolver personagens, criaturas, equipamentos, cenários, efeitos visuais ou animações, siga este fluxo sempre que aplicável.

### Etapa 1 — Análise

Antes de gerar qualquer asset:

1. Consulte os guias de arte do projeto.
2. Examine assets semelhantes já existentes.
3. Identifique o estilo visual, a perspectiva, a paleta, a escala e a iluminação.
4. Verifique o tamanho, a transparência, o enquadramento e o formato esperados.
5. Identifique o destino do arquivo: Unity, cliente Web ou ambos.
6. Determine se o resultado solicitado é uma imagem estática, uma sequência de quadros, um spritesheet ou um efeito visual.

Não gere um asset sem compreender como ele será utilizado.

### Etapa 2 — Definição visual

Para cada asset importante, estabeleça as características necessárias antes de gerar as imagens.

Quando aplicável, registre:

- Nome e finalidade.
- Referências visuais autorizadas.
- Estilo artístico.
- Silhueta e proporções.
- Paleta de cores.
- Perspectiva e orientação.
- Iluminação e sombras.
- Fundo transparente ou cenário.
- Dimensões de saída.
- Estados e animações necessários.
- Restrições de integração.

Para personagens recorrentes, mantenha uma referência visual principal para reduzir variações de rosto, cabelo, armadura, roupa, proporções e equipamentos.

Não considere imagens geradas separadamente como um personagem consistente apenas porque possuem cores semelhantes.

### Etapa 3 — Geração e preparação

- Prefira workflows locais e gratuitos quando forem adequados.
- Utilize referências visuais para manter a identidade do personagem.
- Gere primeiro uma amostra pequena e valide o resultado.
- Preserve a imagem original ou a referência usada como base.
- Separe os arquivos-fonte dos arquivos processados e dos assets finais.
- Não sobrescreva assets existentes durante a geração.
- Não remova detalhes importantes para corrigir automaticamente problemas de recorte.
- Não apresente imagens com artefatos evidentes como assets finalizados.

Quando a ferramenta suportar o processo, automatize a geração, a organização dos arquivos e as validações simples.

A automação deve reduzir o trabalho repetitivo sem eliminar a revisão da qualidade.

### Etapa 4 — Consistência entre quadros

Em animações de personagens, preserve a identidade visual entre os quadros.

Verifique:

- Proporções corporais.
- Rosto, cabelo e silhueta.
- Armadura, roupas e equipamentos.
- Posição e formato das mãos.
- Anatomia e articulações.
- Perspectiva e iluminação.
- Tamanho aparente do personagem.
- Posição relativa dos pés.
- Continuidade da arma e de outros objetos.
- Ausência de elementos duplicados, desaparecidos ou deformados.

Não aceite uma sequência apenas porque todos os quadros parecem individualmente bonitos. Eles também precisam funcionar em conjunto.

### Etapa 5 — Validação e integração

Antes de considerar o asset concluído:

1. Abra o arquivo produzido e verifique se ele está íntegro.
2. Confirme dimensões, transparência, formato e qualidade.
3. Confira se os quadros estão organizados corretamente.
4. Teste a sequência em velocidade de reprodução apropriada.
5. Verifique cortes, deslocamentos, tremores e alterações de escala.
6. Confirme se o arquivo pode ser utilizado no destino pretendido.
7. Preserve os arquivos-fonte necessários para futuras correções.

Se o asset falhar, corrija ou gere novamente apenas o que for necessário.

Não substitua automaticamente um asset existente por um resultado de qualidade inferior.

---

## 7. Regras para personagens, spritesheets e animações

### 7.1. Estilo visual

O projeto deve preservar a identidade visual definida em seus guias e referências.

Quando a referência aprovada indicar fantasia 2D ilustrada, detalhada e moderna:

- Não converta automaticamente a arte para pixel art.
- Não adote estética retrô sem solicitação.
- Preserve a riqueza de detalhes e a legibilidade da silhueta.
- Evite mudanças arbitrárias de proporção, iluminação ou paleta.
- Mantenha coerência visual entre personagens, cenários, equipamentos e efeitos.

A referência visual do projeto prevalece sobre preferências genéricas de qualquer ferramenta de IA.

### 7.2. Caminhada e locomoção

Para animações de caminhada:

- Confirme que as pernas direita e esquerda se alternam de fato entre os quadros.
- Verifique o movimento dos braços e a transferência de peso.
- Confira se os pés mantêm contato plausível com o chão.
- Evite que o personagem deslize sem uma razão visual.
- Verifique a continuidade do corpo, da roupa e dos equipamentos.
- Não aceite quadros repetidos como se fossem uma animação completa.
- Não considere a inversão horizontal do personagem inteiro uma substituição suficiente para uma sequência de caminhada.
- Não considere deformações artificiais uma animação válida.

Quando a animação for em perspectiva isométrica, preserve a orientação e o volume do personagem conforme os padrões do projeto.

### 7.3. Combate e habilidades

Para ataques, esquivas, golpes especiais e habilidades:

- Verifique a preparação do movimento, a ação principal e a recuperação.
- Mantenha a arma conectada à mão de maneira visualmente coerente.
- Confira a direção e a trajetória do ataque.
- Verifique se os efeitos acompanham a ação.
- Evite efeitos que ocultem completamente o personagem ou a área importante da cena.
- Preserve a legibilidade dos movimentos.
- Não utilize o mesmo quadro estático para simular toda a ação.
- Diferencie animações de ataque, defesa, dano, morte e outras ações quando forem solicitadas.

### 7.4. Spritesheets

Antes de exportar ou integrar um spritesheet:

- Confirme a quantidade real de quadros.
- Identifique se a grade é regular ou se os quadros possuem dimensões variáveis.
- Verifique a largura, altura e transparência do arquivo.
- Confirme o espaçamento entre quadros, quando existir.
- Verifique se há recortes de armas, pés, cabelos ou efeitos.
- Confirme a ordem de reprodução.
- Verifique se os quadros não invadem as células vizinhas.
- Teste a extração de quadros com a ferramenta de destino.

Não deduza a grade apenas pela aparência da imagem.

Não suponha que todos os spritesheets utilizam o mesmo número de colunas ou o mesmo tamanho de célula.

Quando necessário, gere um arquivo de pré-visualização ou uma montagem dos quadros para inspeção.

### 7.5. Efeitos visuais

Para efeitos como golpes, explosões mágicas, rastros de armas, impactos, partículas e brilhos:

- Preserve a direção e a leitura visual da ação.
- Evite fundos opacos quando for necessária transparência.
- Verifique as bordas do efeito contra fundos claros e escuros.
- Evite halos, contornos e artefatos indesejados.
- Mantenha uma escala coerente com o personagem.
- Evite efeitos visualmente excessivos que prejudiquem a leitura do combate.
- Confirme que a sequência de quadros apresenta evolução temporal real.

Um efeito estático pode ser válido quando esse for o objetivo, mas não deve ser apresentado como uma animação concluída.

### 7.6. Proibição de falsa conclusão

Não declare um personagem, spritesheet ou animação como finalizado quando houver apenas:

- Uma pose estática.
- Quadros duplicados.
- Variações mínimas sem movimento funcional.
- Uma imagem recortada em várias células.
- Uma sequência que não pode ser reproduzida corretamente.
- Arquivos que ainda não foram verificados.
- Uma integração que não foi testada.

Informe exatamente o que foi produzido e o que ainda falta.

---

## 8. Regras específicas para Unity, Web e assets

### 8.1. Unity

- Preserve referências de GUID e arquivos `.meta` existentes.
- Nunca duplique GUIDs.
- Não mova ou renomeie assets referenciados sem tratar as referências.
- Não altere configurações de importação em massa sem autorização.
- Reaproveite os padrões existentes de FPS, pivôs, escala, texturas, filtros e nomenclatura.
- Não configure Animator, prefabs ou cenas durante tarefas apenas de preparação de assets, salvo autorização.
- Não altere scripts C# apenas para importar imagens, salvo se isso fizer parte do pedido autorizado.
- Verifique a importação no Unity quando o ambiente estiver disponível.

### 8.2. Cliente Web

- Identifique a tecnologia e a arquitetura efetivamente utilizadas antes de alterar o cliente.
- Preserve as convenções existentes de organização dos arquivos.
- Verifique como as imagens são carregadas e utilizadas pelo sistema.
- Não introduza uma biblioteca de renderização, animação ou processamento sem verificar se já existe uma solução equivalente.
- Não modifique scripts TypeScript apenas para importar imagens, salvo se isso fizer parte do pedido autorizado.
- Verifique caminhos relativos, nomes de arquivos, carregamento e transparência.
- Considere o desempenho, o tamanho dos arquivos e o tempo de carregamento.
- Teste a reprodução real dos sprites quando o ambiente permitir.

### 8.3. Compatibilidade entre clientes

Não presuma que um asset preparado para Unity funcionará automaticamente no cliente Web.

Verifique os formatos, as dimensões, os pivôs, a organização dos quadros e os requisitos de cada destino.

Quando o mesmo asset precisar atender aos dois clientes, prefira manter uma fonte organizada e gerar versões derivadas compatíveis, desde que isso não comprometa os padrões existentes.

Não duplique desnecessariamente arquivos pesados nem introduza processos de conversão sem necessidade.

### 8.4. Organização dos arquivos

- Siga a nomenclatura já adotada no projeto.
- Mantenha os assets-fonte separados dos arquivos finais e temporários.
- Não misture referências, resultados intermediários e assets aprovados.
- Não armazene modelos de IA, checkpoints ou caches pesados no repositório sem autorização.
- Não inclua pastas de cache, saídas temporárias ou imagens de teste em commits.
- Preserve os assets anteriores até que a substituição seja validada e autorizada, quando necessária.

Se não existir um padrão de nomenclatura adequado, proponha um antes de criar uma estrutura extensa.

---

## 9. Qualidade, testes e segurança

Antes de modificar qualquer arquivo, informe sucintamente o plano e os arquivos que pretende tocar.

### Testes

Execute os testes relevantes para os arquivos realmente modificados.

Dependendo da tarefa, isso pode incluir:

- Testes unitários.
- Build do cliente Web.
- Verificação de tipos.
- Testes de carregamento de assets.
- Validação de spritesheets.
- Reprodução de animações.
- Verificação de integridade dos arquivos.
- Testes de importação no Unity.
- Inspeção visual de imagens e sequências.

Não invente resultados.

Não declare que um build foi concluído se apenas iniciou o processo.

Se não puder testar por falta de Unity, SDK, dependências, GPU compatível ou outra limitação, explique claramente.

### Segurança

- Proteja segredos, tokens, certificados, arquivos de ambiente e chaves de API.
- Não os copie para prompts, documentação, logs ou commits.
- Não execute scripts baixados de fontes desconhecidas sem verificar seu conteúdo e sua procedência.
- Não desative antivírus, proteções do sistema ou controles de segurança para facilitar a execução de uma ferramenta.
- Não execute comandos destrutivos ou instaladores suspeitos sem avaliação.
- Respeite o `.gitignore`.
- Evite incluir pastas geradas como `Library/`, `Temp/`, `obj/`, `bin/` e `node_modules/`, quando aplicável.
- Não envie código ou assets do projeto para serviços externos sem autorização.

### Dependências

Antes de adicionar uma dependência:

1. Verifique se ela é realmente necessária.
2. Confira se o projeto já possui uma alternativa.
3. Avalie manutenção, licença, segurança e compatibilidade.
4. Considere o impacto no build e no ambiente dos outros agentes.
5. Solicite aprovação quando a mudança for relevante.

Prefira soluções simples, locais e reversíveis.

---

## 10. Critérios para considerar uma tarefa concluída

Uma tarefa só deve ser considerada concluída quando:

- O objetivo solicitado foi atendido.
- As alterações estão limitadas ao escopo autorizado.
- O trabalho preexistente foi preservado.
- Os arquivos produzidos foram verificados.
- Os testes aplicáveis foram executados, ou suas limitações foram documentadas.
- As dependências e os custos foram avaliados.
- As pendências foram identificadas.
- O resultado pode ser revisado por outro agente ou pelo usuário.

Para tarefas de arte, acrescente:

- Consistência visual verificada.
- Formato e dimensões conferidos.
- Animação inspecionada, quando aplicável.
- Compatibilidade com o destino avaliada.
- Arquivos-fonte preservados conforme necessário.

Não confunda a conclusão de uma etapa com a conclusão do projeto inteiro.

---

## 11. Relatório de entrega

Sempre finalize com um relatório objetivo contendo:

1. **Resumo:** o que foi feito.
2. **Arquivos:** lista de arquivos criados e alterados.
3. **Testes:** comandos executados e resultados reais.
4. **Validação visual:** quando houver imagens, spritesheets ou animações.
5. **Pendências:** o que ainda precisa ser feito.
6. **Aprovações:** pontos que dependem de autorização ou validação manual.
7. **Dependências e custos:** novas ferramentas, requisitos ou possíveis limitações.
8. **Git:** branch e worktree utilizados, quando aplicável.
9. **Integração:** riscos ou conflitos que outro agente precisa conhecer.

Se nada foi alterado, informe isso explicitamente.

Se uma ferramenta falhou, informe o erro relevante e as tentativas realizadas. Não o oculte para apresentar uma conclusão aparentemente bem-sucedida.

---

## 12. Princípio fundamental

**Os dois agentes colaboram; nenhum deles tem permissão para apagar silenciosamente o trabalho do outro.**

A automação deve aumentar a produtividade sem comprometer a segurança, a qualidade visual, a integridade do repositório ou a previsibilidade dos custos.

O objetivo não é apenas gerar arquivos rapidamente, mas produzir resultados consistentes, verificáveis, reutilizáveis e integrados corretamente ao MagicForge: Universe.
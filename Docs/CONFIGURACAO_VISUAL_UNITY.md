# 🎮 Guia de Configuração Visual no Unity (Adeus aos Cubos!)

Se você abriu a cena do Unity e viu um cubo cinza se movimentando, não se preocupe: isso é comum na fase de prototipagem matemática. 

Você **já possui modelos 3D profissionais e sprites 2D prontos dentro da sua pasta `Assets/`**! Este documento ensina como ativá-los em menos de 3 minutos.

---

## 1. Onde Estão os Seus Personagens Prontos

No seu projeto `MagicForgeClient/Assets`, você já tem:
1. **Personagem Humanoide 3D Completo (Zimni):**
   * Caminho: `Assets/Zimni/Fantasy character/Fantasy_character.prefab`
   * Já possui textura, malha 3D (mesh), espada, armadura e Animator Controller com animações de andar e atacar!
2. **Monstro Goblin 3D:**
   * Caminho: `Assets/Goblins -characters with animations/Goblins -characters with animations/models/prefab/`
   * Modelo 3D completo de Goblin com animações de corrida e golpe.
3. **Cavaleiro 2D (Spine2D):**
   * Caminho: `Assets/Spine2D Knight Character Animation Pack/Exports/Frame by frame/`
   * Dezenas de animações frame-a-frame (Idle, Walk, Attack, Dead) em PNG transparente com alta resolução.

---

## 2. Passo a Passo: Substituindo o Cubo pelo Guerreiro 3D

1. **Abra o Unity:**
   * Carregue a cena do seu jogo (em `Assets/Scenes/` ou `Assets/Zimni/Fantasy character/FantasyCharacter_demoScene.unity`).
2. **Localize o GameObject do Jogador:**
   * Na aba **Hierarchy** (à esquerda), selecione o objeto do seu herói (ex: `Player` ou `PlayerCube`).
3. **Desative ou Remova o Cubo Visual:**
   * No Inspector (à direita), desmarque ou remova os componentes **Mesh Filter** e **Mesh Renderer** (ou clique com o botão direito neles e escolha *Remove Component*).
   * **Importante:** Mantenha o `NavMeshAgent` e o `CharacterMovement.cs`.
4. **Adicione o Modelo 3D como Filho:**
   * Na aba **Project** (embaixo), navegue até `Assets/Zimni/Fantasy character/`.
   * Arraste o arquivo **`Fantasy_character.prefab`** e solte **DENTRO** do seu objeto `Player` na Hierarchy.
   * Certifique-se de que a posição do filho no Inspector esteja zerada: `Position: (X: 0, Y: 0, Z: 0)`.

---

## 3. Conectando a Rede e Interpolação ao Personagem

Criamos os scripts automáticos para cuidar de tudo:

1. **Selecione o GameObject do Jogador Principal:**
   * Clique em **Add Component** e busque por `UnityNetworkClient`.
   * Configure:
     * `Server Url`: `ws://localhost:3000`
     * `Character Name`: Seu nome (ex: `GuerreiroSupremo`)
     * `Character Class`: `GUERREIRO`
2. **Para Outros Jogadores e Monstros (Multiplayer):**
   * Adicione o componente `NetworkInterpolatedEntity` nos prefabs que representam outros jogadores ou monstros na cena.
   * Arraste o componente **Animator** do modelo 3D para o campo `Animator` do script.
   * O script irá ler as mensagens do servidor autoritativo de 20Hz e fazer a interpolação suave (`Vector3.Lerp` e `Quaternion.Slerp`) a 60 FPS com troca automática entre as animações de *Idle* e *Walk*!

---

## 4. Testando a Conexão em Tempo Real

1. Inicie o servidor em um terminal:
   ```powershell
   cd e:\MagicForge_Universe\server
   npm.cmd run dev
   ```
2. Dê **Play** no Unity!
3. O console do Unity exibirá:
   ```
   [REDE] Conectado com sucesso ao Servidor Autoritativo!
   [REDE] Login autenticado com sucesso no Servidor!
   ```
4. Ao clicar no chão da cena, seu personagem se moverá com validação autoritativa no servidor!

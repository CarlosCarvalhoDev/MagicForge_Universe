# 🗄️ Guia do Banco de Dados SQLite (Para quem veio do SQL Server)

Se você já conhece o **SQL Server** e o **SSMS (SQL Server Management Studio)**, você se sentirá 100% em casa!

O **SQLite** usa os mesmos comandos SQL que você já domina (`SELECT`, `INSERT`, `UPDATE`, `DELETE`, `WHERE`, `JOIN`). A única diferença é que em vez de um serviço pesado rodando no Windows, o banco de dados inteiro é **um único arquivo** super rápido salvo em:
📁 `e:\MagicForge_Universe\server\data\magicforge.db`

---

## 1. O "SSMS" do SQLite: DB Browser for SQLite

Para visualizar as tabelas, editar linhas na mão ou rodar comandos SQL com interface gráfica (igualzinho ao SSMS):

### Como Baixar e Usar (Grátis & Leve - ~20MB):
1. Acesse o site oficial: **[sqlitebrowser.org/dl](https://sqlitebrowser.org/dl/)**
2. Baixe a versão **"DB Browser for SQLite - Standard installer for 64-bit Windows"** (ou a versão *Portable* que não precisa nem instalar).
3. Abra o programa e clique no botão **"Open Database"** (Abrir Banco de Dados) no topo esquerdo.
4. Navegue até a pasta do seu servidor e selecione:
   `e:\MagicForge_Universe\server\data\magicforge.db`
5. Pronto! Você verá a estrutura de tabelas, índices e dados em tempo real.

---

## 2. Estrutura das Nossas Tabelas

### Tabela `accounts` (Contas dos Jogadores)
| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave Primária (ex: `acc_1729...`) |
| `username` | TEXT | Nome de login único (ex: `lordaventureiro`) |
| `created_at` | INTEGER | Timestamp de criação da conta |
| `last_login` | INTEGER | Timestamp do último acesso |

### Tabela `characters` (Personagens / Heróis)
| Coluna | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | TEXT | Chave Primária única do herói |
| `account_id` | TEXT | Chave Estrangeira ligada à tabela `accounts` |
| `name` | TEXT | Nome do herói no jogo |
| `class_type` | TEXT | Classe D&D (`GUERREIRO`, `CLERIGO`, `MAGO`, etc.) |
| `level` | INTEGER | Nível atual do personagem (inicia em 1) |
| `experience` | INTEGER | XP acumulado para o próximo nível |
| `gold` | INTEGER | Moedas de ouro acumuladas |
| `current_hp` / `max_hp` | INTEGER | Vida atual e Vida máxima |
| `pos_x`, `pos_y`, `pos_z` | REAL | Última posição salva no mundo 3D |
| `forca`, `destreza`, etc. | INTEGER | Os 6 Atributos D&D calculados |
| `combat_power` | INTEGER | O Combat Power (CP) oficial do herói |

---

## 3. Consultas SQL Prontas para Usar (Execute no DB Browser)

Abra a aba **"Execute SQL"** no DB Browser for SQLite e teste estes comandos:

### 1. Ver todos os personagens criados e seus atributos:
```sql
-- Seleciona todos os heróis com suas classes, níveis e Combat Power
SELECT 
    name AS [Herói], 
    class_type AS [Classe], 
    level AS [Nível], 
    combat_power AS [Combat Power],
    current_hp AS [Vida Atual],
    max_hp AS [Vida Máxima],
    gold AS [Ouro]
FROM characters
ORDER BY level DESC, combat_power DESC;
```

### 2. Ranking de Melhores Jogadores (Leaderboard):
```sql
-- Top 10 heróis mais fortes do servidor
SELECT 
    name, 
    class_type, 
    level, 
    combat_power 
FROM characters 
ORDER BY combat_power DESC 
LIMIT 10;
```

### 3. Aumentar o nível e ouro de um personagem manualmente (Modo Admin/GM):
```sql
-- Dá nível 10 e 5.000 de ouro para o LordAventureiro
UPDATE characters 
SET 
    level = 10,
    gold = 5000,
    max_hp = 300,
    current_hp = 300
WHERE name = 'LordAventureiro';
```

### 4. Consultar conta junto com o personagem (INNER JOIN clássico):
```sql
-- Junta a conta com o herói, igual no SQL Server
SELECT 
    a.username AS [Conta],
    c.name AS [Personagem],
    c.class_type AS [Classe],
    datetime(a.created_at / 1000, 'unixepoch', 'localtime') AS [Data Criacao]
FROM accounts a
INNER JOIN characters c ON a.id = c.account_id;
```

---

## 4. Onde a Persistência Ocorre no Código

O nosso servidor gerencia tudo automaticamente:
* **Ao Conectar / Logar:** [World.ts](file:///e:/MagicForge_Universe/server/src/game/World.ts) chama `db.loadOrCreatePlayer()`. Se você já jogou antes com aquele nome, o servidor resgata seu Nível, Atributos e Posição onde você parou!
* **Ao Desconectar:** [World.ts](file:///e:/MagicForge_Universe/server/src/game/World.ts) chama `db.savePlayer()` para gravar seu progresso no disco.
* **Ao Fechar o Servidor:** [index.ts](file:///e:/MagicForge_Universe/server/src/index.ts) chama `world.saveAllPlayers()` para não perder o progresso de ninguém.

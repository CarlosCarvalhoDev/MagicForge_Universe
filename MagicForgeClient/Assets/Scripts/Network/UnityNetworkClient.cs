using System;
using System.Text;
using System.Threading;
using System.Net.WebSockets;
using System.Threading.Tasks;
using UnityEngine;
using MagicForge.Core;
using MagicForge.Movement;

namespace MagicForge.Network
{
    /// <summary>
    /// Componente de conexão de rede do Unity com o Servidor Autoritativo 20Hz.
    /// Utiliza WebSockets nativos assíncronos do .NET / Unity.
    /// </summary>
    public class UnityNetworkClient : MonoBehaviour
    {
        [Header("Configuração do Servidor")]
        public string serverUrl = "ws://192.168.1.12:3000";
        public string characterName = "GuerreiroMobile";
        public string characterClass = "GUERREIRO";

        [Header("Status de Conexão")]
        public bool isConnected;
        public string myPlayerId;
        public int lastServerTick;

        [Header("Referências")]
        public CharacterMovement localMovement;
        public BaseStats localStats;

        private ClientWebSocket webSocket;
        private CancellationTokenSource cts;
        private int inputSequence = 0;

        async void Start()
        {
            if (localMovement == null) localMovement = GetComponent<CharacterMovement>();
            if (localStats == null) localStats = GetComponent<BaseStats>();

            await ConnectToServer();
        }

        public async Task ConnectToServer()
        {
            try
            {
                webSocket = new ClientWebSocket();
                cts = new CancellationTokenSource();

                Debug.Log($"<color=cyan>[REDE]</color> Conectando ao servidor: {serverUrl}...");
                await webSocket.ConnectAsync(new Uri(serverUrl), cts.Token);

                isConnected = true;
                Debug.Log("<color=green>[REDE]</color> Conectado com sucesso ao Servidor Autoritativo!");

                // Envia pacote de login
                SendLogin();

                // Inicia loop de escuta em background
                _ = ReceiveLoop();
            }
            catch (Exception ex)
            {
                Debug.LogError($"<color=red>[REDE]</color> Falha ao conectar: {ex.Message}");
            }
        }

        private async void SendLogin()
        {
            var login = new LoginRequestDTO
            {
                characterName = this.characterName,
                classType = this.characterClass,
                clientVersion = "1.0.0"
            };

            await SendPacket(Opcode.C2S_LOGIN, JsonUtility.ToJson(login));
        }

        public async void SendMoveDestination(Vector3 destination)
        {
            if (!isConnected) return;

            inputSequence++;
            var moveInput = new MoveInputDTO
            {
                targetPosition = Vector3DTO.FromUnityVector3(destination),
                currentClientPosition = Vector3DTO.FromUnityVector3(transform.position),
                inputSequence = this.inputSequence
            };

            await SendPacket(Opcode.C2S_MOVE_INPUT, JsonUtility.ToJson(moveInput));
        }

        public async void SendCastSkill(int slot, string targetId = null, Vector3? targetPosition = null)
        {
            if (!isConnected) return;

            var castSkill = new CastSkillRequestDTO
            {
                slot = slot,
                targetEntityId = targetId,
                targetPosition = targetPosition.HasValue ? Vector3DTO.FromUnityVector3(targetPosition.Value) : default
            };

            await SendPacket(Opcode.C2S_CAST_SKILL, JsonUtility.ToJson(castSkill));
        }

        public async void SendLootItem(string dropId)
        {
            if (!isConnected) return;
            var lootReq = new LootItemRequestDTO { dropId = dropId };
            await SendPacket(Opcode.C2S_LOOT_ITEM, JsonUtility.ToJson(lootReq));
        }

        public async void SendUseItem(int slotIndex)
        {
            if (!isConnected) return;
            var useReq = new UseItemRequestDTO { slotIndex = slotIndex };
            await SendPacket(Opcode.C2S_USE_ITEM, JsonUtility.ToJson(useReq));
        }

        public async void SendRequestDungeonInfo()
        {
            if (!isConnected) return;
            await SendPacket(Opcode.C2S_REQUEST_DUNGEON_INFO, "{}");
        }

        public async void SendEnterDungeon(string dungeonType = "BOSS_RUSH")
        {
            if (!isConnected) return;
            var req = new EnterDungeonDTO { dungeonType = dungeonType };
            await SendPacket(Opcode.C2S_ENTER_DUNGEON, JsonUtility.ToJson(req));
        }

        public async void SendBuyDungeonTicket()
        {
            if (!isConnected) return;
            await SendPacket(Opcode.C2S_BUY_DUNGEON_TICKET, "{}");
        }

        public async void SendLeaveDungeon()
        {
            if (!isConnected) return;
            await SendPacket(Opcode.C2S_LEAVE_DUNGEON, "{}");
        }

        private async Task SendPacket(Opcode op, string jsonData)
        {
            if (webSocket == null || webSocket.State != WebSocketState.Open) return;

            string packetJson = $"{{\"op\":{(int)op},\"timestamp\":{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()},\"data\":{jsonData}}}";
            byte[] bytes = Encoding.UTF8.GetBytes(packetJson);
            await webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, cts.Token);
        }

        private async Task ReceiveLoop()
        {
            byte[] buffer = new byte[8192];

            while (webSocket.State == WebSocketState.Open && !cts.IsCancellationRequested)
            {
                try
                {
                    var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), cts.Token);
                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        break;
                    }

                    string jsonMessage = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    ProcessIncomingPacket(jsonMessage);
                }
                catch (Exception ex)
                {
                    Debug.LogWarning($"<color=yellow>[REDE]</color> Erro na recepção do pacote: {ex.Message}");
                    break;
                }
            }

            isConnected = false;
            Debug.Log("<color=red>[REDE]</color> Conexão fechada com o servidor.");
        }

        private void ProcessIncomingPacket(string json)
        {
            try
            {
                // Extrai o opcode básico
                if (!json.Contains("\"op\":")) return;

                int opIndex = json.IndexOf("\"op\":") + 5;
                int opEnd = json.IndexOf(",", opIndex);
                if (opEnd == -1) opEnd = json.IndexOf("}", opIndex);
                int opCodeInt = int.Parse(json.Substring(opIndex, opEnd - opIndex).Trim());
                Opcode op = (Opcode)opCodeInt;

                switch (op)
                {
                    case Opcode.S2C_LOGIN_SUCCESS:
                        Debug.Log("<color=green>[REDE]</color> Login autenticado com sucesso no Servidor!");
                        break;

                    case Opcode.S2C_WORLD_SNAPSHOT:
                        // Em um projeto Unity completo com Newtonsoft.Json ou JsonUtility:
                        // Os snapshots de 20Hz alimentam os componentes NetworkInterpolatedEntity
                        lastServerTick++;
                        break;

                    case Opcode.S2C_COMBAT_EVENT:
                        Debug.Log("<color=yellow>[COMBATE]</color> Evento de combate recebido do servidor autoritativo.");
                        break;

                    case Opcode.S2C_PLAYER_EXP_UPDATE:
                        Debug.Log("<color=magenta>[PROGRESSÃO]</color> Experiência recebida do servidor!");
                        break;

                    case Opcode.S2C_PLAYER_LEVEL_UP:
                        Debug.Log("<color=yellow>[PROGRESSÃO]</color> LEVEL UP! Novo nível alcançado no Servidor Autoritativo!");
                        break;
                }
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[REDE] Erro ao processar pacote: {ex.Message}");
            }
        }

        private void OnDestroy()
        {
            cts?.Cancel();
            webSocket?.Dispose();
        }
    }
}

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
        public string serverUrl = "ws://localhost:3000";
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
            // O Unity processa snapshots autoritativos aqui para alimentar o interpolador
            // Em uma arquitetura de MMORPG, os dados são desempacotados e passados para o InterpolatorBuffer
        }

        private void OnDestroy()
        {
            cts?.Cancel();
            webSocket?.Dispose();
        }
    }
}

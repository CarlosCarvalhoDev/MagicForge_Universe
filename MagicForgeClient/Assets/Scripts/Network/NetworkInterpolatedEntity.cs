using System.Collections.Generic;
using UnityEngine;

namespace MagicForge.Network
{
    /// <summary>
    /// Componente que suaviza o movimento de entidades 3D e 2D no Unity
    /// interpolando snapshots autoritativos de 20Hz recebidos do servidor.
    /// </summary>
    public class NetworkInterpolatedEntity : MonoBehaviour
    {
        [Header("Configuração de Interpolação")]
        [Tooltip("Atraso de renderização em segundos (100ms = 2 ticks do servidor)")]
        public float renderDelay = 0.1f;

        [Header("Estado Sincronizado")]
        public string entityId;
        public string entityName;
        public int currentHp;
        public int maxHp;
        public bool isMoving;

        [Header("Referências")]
        public Animator animator;

        private struct TransformSnapshot
        {
            public float timestamp;
            public Vector3 position;
            public float yaw;
            public bool isMoving;
        }

        private readonly List<TransformSnapshot> snapshotBuffer = new List<TransformSnapshot>();
        private const int MaxBufferSize = 30;

        void Awake()
        {
            if (animator == null) animator = GetComponentInChildren<Animator>();
        }

        /// <summary>
        /// Chamado ao receber um novo snapshot de 20Hz do servidor para esta entidade
        /// </summary>
        public void OnReceiveServerSnapshot(EntitySnapshotDTO dto)
        {
            currentHp = dto.currentHp;
            maxHp = dto.maxHp;
            isMoving = dto.isMoving;

            Vector3 worldPos = dto.position.ToUnityVector3();

            snapshotBuffer.Add(new TransformSnapshot
            {
                timestamp = Time.time,
                position = worldPos,
                yaw = dto.headingYaw,
                isMoving = dto.isMoving
            });

            if (snapshotBuffer.Count > MaxBufferSize)
            {
                snapshotBuffer.RemoveAt(0);
            }
        }

        void Update()
        {
            if (snapshotBuffer.Count == 0) return;

            // Tempo alvo de renderização no passado (evita solavancos)
            float renderTime = Time.time - renderDelay;

            // Se só temos 1 snapshot, fixa nele
            if (snapshotBuffer.Count < 2)
            {
                transform.position = snapshotBuffer[0].position;
                transform.rotation = Quaternion.Euler(0, snapshotBuffer[0].yaw, 0);
                UpdateAnimator(snapshotBuffer[0].isMoving);
                return;
            }

            // Encontra os 2 snapshots que cercam o renderTime
            TransformSnapshot older = snapshotBuffer[0];
            TransformSnapshot newer = snapshotBuffer[snapshotBuffer.Count - 1];

            for (int i = snapshotBuffer.Count - 1; i >= 0; i--)
            {
                if (snapshotBuffer[i].timestamp <= renderTime)
                {
                    older = snapshotBuffer[i];
                    newer = (i + 1 < snapshotBuffer.Count) ? snapshotBuffer[i + 1] : newer;
                    break;
                }
            }

            float timeSpan = newer.timestamp - older.timestamp;
            float alpha = timeSpan > 0.0001f ? Mathf.Clamp01((renderTime - older.timestamp) / timeSpan) : 1f;

            // Interpolação suave de Posição (LERP)
            transform.position = Vector3.Lerp(older.position, newer.position, alpha);

            // Interpolação suave de Rotação (SLERP)
            Quaternion olderRot = Quaternion.Euler(0, older.yaw, 0);
            Quaternion newerRot = Quaternion.Euler(0, newer.yaw, 0);
            transform.rotation = Quaternion.Slerp(olderRot, newerRot, alpha);

            // Atualiza animações no Animator
            UpdateAnimator(newer.isMoving);
        }

        private void UpdateAnimator(bool moving)
        {
            if (animator == null) return;

            // Suporta os parâmetros mais comuns de Animator (Speed ou isMoving)
            if (HasParameter(animator, "isMoving"))
            {
                animator.SetBool("isMoving", moving);
            }
            if (HasParameter(animator, "Speed"))
            {
                animator.SetFloat("Speed", moving ? 5.0f : 0f);
            }
        }

        private bool HasParameter(Animator anim, string paramName)
        {
            foreach (var param in anim.parameters)
            {
                if (param.name == paramName) return true;
            }
            return false;
        }
    }
}

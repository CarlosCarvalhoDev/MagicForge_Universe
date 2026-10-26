using UnityEngine;
using UnityEngine.AI; // A Inteligência Artificial de Navegação da Unity

namespace MagicForge.Movement
{
    // Obriga o Unity a colocar o componente de GPS automático nesse cubo
    [RequireComponent(typeof(NavMeshAgent))]
    public class CharacterMovement : MonoBehaviour
    {
        private NavMeshAgent agent;

        void Awake()
        {
            agent = GetComponent<NavMeshAgent>();
            // Configurações do quão rápido o boneco corre
            agent.speed = 5f;
            agent.angularSpeed = 360f; // Vira rápido
            agent.acceleration = 12f;
            agent.stoppingDistance = 2f; // Para um pouco antes de bater de cara no monstro
        }

        public void MoveToTarget(Vector3 destination)
        {
            agent.isStopped = false;
            agent.SetDestination(destination); // Envia a coordenada pro GPS calcular a rota
        }

        public void StopMoving()
        {
            agent.isStopped = true;
            agent.ResetPath(); // Puxa o freio de mão e apaga a rota
        }
    }
}

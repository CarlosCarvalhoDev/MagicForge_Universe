using UnityEngine;
using MagicForge.Core;
using MagicForge.Movement;

namespace MagicForge.Combat
{
    public class AutoCombatController : MonoBehaviour
    {
        public BaseStats myStats; 
        public CharacterMovement movement; 
        
        [Header("Configuração de IA")]
        public float alcanceRadar = 30f; 
        public float tempoEntreAtaques = 1.5f; 
        
        private float cronometroAtaque;
        private EnemyStats alvoAtual;

        void Start()
        {
            if(movement == null) movement = GetComponent<CharacterMovement>();
        }

        void Update()
        {
            // Trava de segurança: Se o herói morreu, para de bater.
            if (myStats != null && myStats.vidaAtual <= 0) return;

            cronometroAtaque -= Time.deltaTime;

            if (alvoAtual == null)
            {
                ProcurarInimigoMaisProximo();
            }
            else
            {
                float distanciaAteMonstro = Vector3.Distance(transform.position, alvoAtual.transform.position);

                // A Mágica do Ranged vs Melee! 
                // Se o personagem tem uma classe e ela for Ranged, ele ataca a 10 metros de distância. Senão, 2.5m (Colado).
                float distanciaDeAtaqueDesejada = 2.5f;
                if (myStats.currentClass != null && myStats.currentClass.isRanged)
                {
                    distanciaDeAtaqueDesejada = 10f;
                }

                if (distanciaAteMonstro > distanciaDeAtaqueDesejada)
                {
                    movement.MoveToTarget(alvoAtual.transform.position);
                }
                else
                {
                    movement.StopMoving();

                    if (cronometroAtaque <= 0f)
                    {
                        AtacarAlvo();
                        cronometroAtaque = tempoEntreAtaques;
                    }
                }
            }
        }

        private void AtacarAlvo()
        {
            if (alvoAtual != null && myStats != null)
            {
                int dano = myStats.DanoBase; // Agora puxa a matemática inteligente!
                alvoAtual.TakeDamage(dano);
            }
        }

        private void ProcurarInimigoMaisProximo()
        {
            EnemyStats[] todosInimigos = FindObjectsByType<EnemyStats>(FindObjectsSortMode.None);
            float menorDistancia = Mathf.Infinity;
            EnemyStats maisProximo = null;

            foreach (var inimigo in todosInimigos)
            {
                float distancia = Vector3.Distance(transform.position, inimigo.transform.position);
                if (distancia < menorDistancia && distancia <= alcanceRadar)
                {
                    menorDistancia = distancia;
                    maisProximo = inimigo;
                }
            }

            alvoAtual = maisProximo;
        }
    }
}

using UnityEngine;
using MagicForge.Core; // Puxar o Status do Herói para roubar vida dele

namespace MagicForge.Combat
{
    /// <summary>
    /// IA muito agressiva do inimigo. Ele vai socar o herói se estiver perto!
    /// </summary>
    public class EnemyCombatController : MonoBehaviour
    {
        [Header("Quem sou eu")]
        public EnemyStats myStats;
        
        [Header("Poder do Inimigo")]
        public int danoDoInimigo = 15;
        public float distanciaAtaque = 3.5f; // Quão perto precisa chegar pra bater
        public float tempoEntreAtaques = 2f; // Bate a cada 2 segundos
        
        private float cronometroAtaque;
        private BaseStats alvoJogador;

        void Start()
        {
            // O inimigo é preguiçoso, ele não caça ativamente ainda. 
            // Ele só acha quem tem o script "BaseStats" (nosso Herói) e fica olhando pra ele.
            alvoJogador = FindFirstObjectByType<BaseStats>();
        }

        void Update()
        {
            // Se o inimigo já morreu ou se o herói já morreu, não faça nada.
            if (myStats != null && myStats.health <= 0) return;
            if (alvoJogador == null || alvoJogador.vidaAtual <= 0) return;

            cronometroAtaque -= Time.deltaTime;

            float distanciaAteHeroi = Vector3.Distance(transform.position, alvoJogador.transform.position);

            // Se o herói cometeu o erro de chegar muito perto, soque ele!
            if (distanciaAteHeroi <= distanciaAtaque)
            {
                if (cronometroAtaque <= 0f)
                {
                    PerformAttack();
                    cronometroAtaque = tempoEntreAtaques;
                }
            }
        }

        private void PerformAttack()
        {
            Debug.Log($"<color=orange>⚔️ [INIMIGO]</color> O {myStats.enemyName} atacou você cruelmente!");
            alvoJogador.TakeDamage(danoDoInimigo);
        }
    }
}

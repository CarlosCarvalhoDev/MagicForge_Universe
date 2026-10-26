using UnityEngine;

namespace MagicForge.Combat
{
    /// <summary>
    /// Status básico de um inimigo para podermos testar os ataques.
    /// </summary>
    public class EnemyStats : MonoBehaviour
    {
        public string enemyName = "Slime de Grama";
        public int health = 100;

        public void TakeDamage(int damage)
        {
            health -= damage;
            Debug.Log($"<color=red>💥 [ATAQUE]</color> O {enemyName} tomou {damage} de dano! (Vida: {health})");

            if (health <= 0)
            {
                Die();
            }
        }

        private void Die()
        {
            Debug.Log($"<color=black>☠️ [VITÓRIA]</color> O {enemyName} foi completamente derrotado!");
            // Destrói o cubo do inimigo da tela
            Destroy(gameObject);
        }
    }
}

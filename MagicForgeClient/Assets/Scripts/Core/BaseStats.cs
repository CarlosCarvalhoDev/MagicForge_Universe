using UnityEngine;

namespace MagicForge.Core
{
    // A lista de Elementos Mágicos
    public enum ElementType
    {
        None, Fogo, Agua, Natureza, Terra, Luz, Sombra
    }

    public class BaseStats : MonoBehaviour
    {
        [Header("Configuração Base")]
        public string characterName = "Herói Misterioso";
        public int level = 1;
        public CharacterClassSO currentClass;

        [Header("Atributos Primários (D&D)")]
        public int forca = 10;
        public int destreza = 10;
        public int constituicao = 10;
        public int inteligencia = 10;
        public int sabedoria = 10;
        public int carisma = 10;

        [Header("Status de Combate Calculados")]
        public int vidaAtual;
        public int VidaMaxima => constituicao * 10 + (level * 50);
        public float ChanceEsquiva => destreza * 0.1f; 

        // NOVO: Cálculo Dinâmico de Dano D&D!
        public int DanoBase
        {
            get
            {
                if (currentClass == null) return forca * 2 + (level * 5); 

                int modificador = 0;

                switch (currentClass.mainStat)
                {
                    case PrimaryStat.Forca: modificador = forca; break;
                    case PrimaryStat.Destreza: modificador = destreza; break;
                    case PrimaryStat.Inteligencia: modificador = inteligencia; break;
                    case PrimaryStat.Sabedoria: modificador = sabedoria; break;
                    case PrimaryStat.Carisma: modificador = carisma; break;
                    case PrimaryStat.ForcaECarisma: modificador = forca + carisma; break;
                }

                return (modificador * 3) + (level * 5);
            }
        }

        public int CombatPower
        {
            get
            {
                int cpAtributos = (forca + destreza + constituicao + inteligencia + sabedoria + carisma) * 15;
                int cpLevel = level * 100;
                return cpAtributos + cpLevel;
            }
        }

        private void Start()
        {
            if (currentClass != null && level == 1)
            {
                forca = currentClass.baseForca;
                destreza = currentClass.baseDestreza;
                constituicao = currentClass.baseConstituicao;
                inteligencia = currentClass.baseInteligencia;
                sabedoria = currentClass.baseSabedoria;
                carisma = currentClass.baseCarisma;
            }

            vidaAtual = VidaMaxima;
            Debug.Log($"<color=cyan>[STATUS]</color> {characterName} (Lvl {level}) inicializado! CP: {CombatPower}");
        }

        [ContextMenu("Simular Level Up")]
        public void LevelUp()
        {
            if (currentClass == null) return;
            level++;
            
            forca += currentClass.ganhoForcaPorLevel;
            destreza += currentClass.ganhoDestrezaPorLevel;
            constituicao += currentClass.ganhoConstituicaoPorLevel;
            inteligencia += currentClass.ganhoInteligenciaPorLevel;
            sabedoria += currentClass.ganhoSabedoriaPorLevel;
            carisma += currentClass.ganhoCarismaPorLevel;

            vidaAtual = VidaMaxima;
            Debug.Log($"<color=green>⬆️ [LEVEL UP!]</color> Nível {level}! Novo Dano Base: {DanoBase} | CP: {CombatPower}");
        }

        public void TakeDamage(int damage)
        {
            vidaAtual -= damage;
            Debug.Log($"<color=red>🩸 [DANO SOFRIDO]</color> {characterName} tomou {damage} de dano! (Vida: {vidaAtual}/{VidaMaxima})");

            if(vidaAtual <= 0)
            {
                vidaAtual = 0;
                Debug.Log($"<color=black>💀 [GAME OVER]</color> O Herói tombou em batalha!");
            }
        }
    }
}

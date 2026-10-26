using UnityEngine;

namespace MagicForge.Core
{
    // A lista de opções para o Menu da Unity
    public enum PrimaryStat { Forca, Destreza, Inteligencia, Sabedoria, Carisma, ForcaECarisma }

    [CreateAssetMenu(fileName = "Nova Classe RPG", menuName = "MagicForge/Classe de Personagem")]
    public class CharacterClassSO : ScriptableObject
    {
        [Header("Informações Básicas")]
        public string className;
        [TextArea] public string classDescription;
        [Tooltip("Retrato 2D de UI / Lore")]
        public Sprite classIcon;
        [Tooltip("Sprite Isométrica Top-Down 3/4 (45°) para o Mundo/Arena")]
        public Sprite isometricWorldSprite;
        public ElementType defaultElement;

        [Header("Sprite Sheets de Animação Isométrica (Multiple Slices)")]
        public Sprite[] idleFrames;
        public Sprite[] walkFrames;
        public Sprite[] attackFrames;
        public Sprite[] hitFrames;
        public Sprite[] deathFrames;

        [Header("Regras de Combate (D&D & Servidor 20Hz)")]
        [Tooltip("Qual atributo essa classe usa para calcular seu dano base?")]
        public PrimaryStat mainStat;
        
        [Tooltip("Marque se essa classe joga magias/flechas de longe.")]
        public bool isRanged;
        public float attackRange = 2.5f;
        public float attackIntervalSec = 1.5f;
        public float baseSpeed = 5.0f;

        [Header("Atributos Base Nível 1 (Sincronizado com shared/entities.ts)")]
        public int baseForca = 10;
        public int baseDestreza = 10;
        public int baseConstituicao = 10;
        public int baseInteligencia = 10;
        public int baseSabedoria = 10;
        public int baseCarisma = 10;

        [Header("Ganhos de Status por Level (Crescimento)")]
        public int ganhoForcaPorLevel;
        public int ganhoDestrezaPorLevel;
        public int ganhoConstituicaoPorLevel;
        public int ganhoInteligenciaPorLevel;
        public int ganhoSabedoriaPorLevel;
        public int ganhoCarismaPorLevel;

        [Header("Sistema de Evolução Linear")]
        public bool isTier1; 
        public CharacterClassSO evolutionOptionA; 
        public CharacterClassSO evolutionOptionB; 
    }
}

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
        public ElementType defaultElement;

        [Header("Regras de Combate (D&D)")]
        [Tooltip("Qual atributo essa classe usa para calcular seu dano base?")]
        public PrimaryStat mainStat;
        
        [Tooltip("Marque se essa classe joga magias/flechas de longe.")]
        public bool isRanged;

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

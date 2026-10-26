using UnityEngine;
using UnityEngine.UI;

namespace MagicForge.UI
{
    /// <summary>
    /// Gerencia a Interface de Batalha (Tela do Celular) com os botões das magias.
    /// </summary>
    public class BattleUIManager : MonoBehaviour
    {
        [Header("Informações do Personagem")]
        public Image portraitImage;
        public Slider healthBar;
        public Text cpText;

        [Header("Sistema de Combate (Limitação de 4 Slots)")]
        [Tooltip("Botão grande de ataque básico")]
        public Button basicAttackButton;
        
        [Tooltip("As 4 habilidades ativas equipadas pelo jogador")]
        public Button skillSlot1;
        public Button skillSlot2;
        public Button skillSlot3;
        public Button skillSlot4;

        // Método para ser chamado e atualizar a barra de vida/CP na tela
        public void UpdateUI(Core.BaseStats playerStats)
        {
            if (healthBar != null)
            {
                healthBar.maxValue = playerStats.VidaMaxima;
                healthBar.value = playerStats.vidaAtual;
            }

            if (cpText != null)
            {
                cpText.text = $"CP: {playerStats.CombatPower}";
            }
        }

        // Métodos que a Unity vai chamar quando você "tocar com o dedo" na tela do celular
        public void OnBasicAttackPressed()
        {
            Debug.Log("<color=red>[COMBATE]</color> Jogador usou Ataque Básico!");
        }

        public void OnSkillSlot1Pressed()
        {
            Debug.Log("<color=blue>[COMBATE]</color> Habilidade do Slot 1 disparada!");
        }

        public void OnSkillSlot2Pressed()
        {
            Debug.Log("<color=blue>[COMBATE]</color> Habilidade do Slot 2 disparada!");
        }

        public void OnSkillSlot3Pressed()
        {
            Debug.Log("<color=blue>[COMBATE]</color> Habilidade do Slot 3 disparada!");
        }

        public void OnSkillSlot4Pressed()
        {
            Debug.Log("<color=blue>[COMBATE]</color> Habilidade do Slot 4 disparada!");
        }
    }
}

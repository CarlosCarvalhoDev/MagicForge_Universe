# Caminhada V4 — orientação corporal aprovada

Em 27/10/2026, o usuário aprovou a orientação de `base-approved-source.png`: peito e quadril em três quartos para SE, cabeça acompanhando esse eixo, braço direito próximo à câmera levando o cajado à frente e braço esquerdo recuado. A aprovação foi da **pose-base**, não de um ciclo completo.

A V3 manteve demasiadamente a parte superior da pose de idle; corrigir somente a direção das botas não resolveu a coerência corporal. Ela não deve ser usada como modelo de tronco/braços para a V4.

Plano dos oito quadros, sem espelhar o corpo ou trocar a mão do cajado:

1. Contato esquerdo; direito atrás. Pose-base aprovada.
2. Flexão de apoio esquerdo; direito inicia o balanço.
3. Passagem do joelho direito; esquerdo apoia.
4. Extensão do direito antes do contato; esquerdo termina o apoio.
5. Contato direito; esquerdo atrás.
6. Flexão de apoio direito; esquerdo inicia o balanço.
7. Passagem do joelho esquerdo; direito apoia.
8. Extensão do esquerdo antes do contato; direito termina o apoio.

O cajado é carregado à frente com movimento discreto. Uma variação com balanço exagerado para a lateral foi descartada. Não congelar uma pose de idle nem permitir que ombros/quadril alternem para uma orientação frontal. A rotação pequena de contrapeso deve acontecer ao redor do mesmo eixo geral SE. As duas pernas avançam/recuam em trajetórias paralelas nessa diagonal, sem abrir passos em V.

Frames são desenhados individualmente com `image_gen.imagegen` em modo integrado de edição; o empacotamento técnico aplica a mesma redução proporcional para células de 512 px. A grade prevista é 4×2 a 12 FPS (667 ms/ciclo). O aceite depende da sequência em movimento, da continuidade das articulações e do fechamento 8→1; hashes e contagem de quadros não certificam a passada.

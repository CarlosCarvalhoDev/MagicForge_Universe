using System.Collections.Generic;
using UnityEngine;
using UnityEngine.AI;

namespace MagicForge.Core
{
    public enum EntityAnimState
    {
        Idle,
        Walk,
        Attack,
        Hit,
        Death
    }

    /// <summary>
    /// Controlador visual 2.5D Isométrico para Heróis e Monstros no Unity.
    /// Substitui automaticamente o MeshRenderer de cubo cinza por um SpriteRenderer Billboard
    /// com remoção automática de fundo preto (#000000 Chroma-Key) e animação por Sprite Sheets
    /// (Idle 5 FPS, Walk 9 FPS, Attack 11 FPS, Hit 10 FPS, Death 7 FPS).
    /// </summary>
    public class IsometricEntityVisual : MonoBehaviour
    {
        private static readonly Dictionary<int, Texture2D> ProcessedTextures = new Dictionary<int, Texture2D>();
        private static readonly Dictionary<int, Sprite> ProcessedSprites = new Dictionary<int, Sprite>();

        private SpriteRenderer spriteRenderer;
        private NavMeshAgent navAgent;

        private Sprite staticSprite;
        private Sprite[] idleFrames;
        private Sprite[] walkFrames;
        private Sprite[] attackFrames;
        private Sprite[] hitFrames;
        private Sprite[] deathFrames;
        private float walkFps = 9f;
        private float attackFps = 11f;

        private EntityAnimState currentState = EntityAnimState.Idle;
        private float animTimer;
        private float oneShotEndTime;
        private Vector3 lastPosition;
        private bool facingLeft;

        public void InitializeHero(CharacterClassSO classSO, Sprite floorTile = null)
        {
            SetupBillboardRenderer(1.65f);

            if (classSO != null)
            {
                staticSprite = PrepareSpriteChromaKey(classSO.isometricWorldSprite);
                idleFrames = PrepareSpriteArrayChromaKey(classSO.idleFrames);
                walkFrames = PrepareSpriteArrayChromaKey(classSO.walkFrames);
                walkFps = Mathf.Max(1f, classSO.walkFps);
                attackFrames = PrepareSpriteArrayChromaKey(classSO.attackFrames);
                // Existing cleric cast slices remain in attackFrames; use the sheet's cast timing.
                attackFps = classSO.attackFrames != null && classSO.attackFrames.Length > 0
                    && classSO.attackFrames[0] != null
                    && classSO.attackFrames[0].name.Contains("_cast_") ? 9f : 11f;
                hitFrames = PrepareSpriteArrayChromaKey(classSO.hitFrames);
                deathFrames = PrepareSpriteArrayChromaKey(classSO.deathFrames);
            }

            if (floorTile != null)
            {
                ApplyArenaFloorTile(floorTile);
            }

            UpdateVisualFrame(0f);
        }

        public void InitializeMonster(Sprite monsterSprite, float scale = 1.45f)
        {
            SetupBillboardRenderer(scale);
            staticSprite = PrepareSpriteChromaKey(monsterSprite);
            UpdateVisualFrame(0f);
        }

        private void SetupBillboardRenderer(float visualScale)
        {
            navAgent = GetComponent<NavMeshAgent>();
            lastPosition = transform.position;

            // Desativa o cubo cinza padrão para exibir apenas o sprite isométrico
            MeshRenderer cubeMesh = GetComponent<MeshRenderer>();
            if (cubeMesh != null)
            {
                cubeMesh.enabled = false;
            }

            Transform existingChild = transform.Find("IsometricSpriteBillboard");
            GameObject childObj;
            if (existingChild != null)
            {
                childObj = existingChild.gameObject;
            }
            else
            {
                childObj = new GameObject("IsometricSpriteBillboard");
                childObj.transform.SetParent(transform, false);
                childObj.transform.localPosition = new Vector3(0f, -0.35f, 0f);
            }

            // Ajusta escala compensando a escala do pai
            float parentScale = Mathf.Max(0.1f, transform.localScale.x);
            float normalizedScale = visualScale / parentScale;
            childObj.transform.localScale = new Vector3(normalizedScale, normalizedScale, normalizedScale);

            spriteRenderer = childObj.GetComponent<SpriteRenderer>();
            if (spriteRenderer == null)
            {
                spriteRenderer = childObj.AddComponent<SpriteRenderer>();
            }
            spriteRenderer.sortingOrder = 10;
        }

        public void PlayAttack(Vector3 targetPosition)
        {
            if (currentState == EntityAnimState.Death) return;

            float dx = targetPosition.x - transform.position.x;
            if (Mathf.Abs(dx) > 0.05f)
            {
                facingLeft = dx < 0f;
            }

            currentState = EntityAnimState.Attack;
            animTimer = 0f;
            int count = (attackFrames != null && attackFrames.Length > 0) ? attackFrames.Length : 6;
            oneShotEndTime = Time.time + (count / attackFps);
        }

        public void PlayHit()
        {
            if (currentState == EntityAnimState.Death) return;

            currentState = EntityAnimState.Hit;
            animTimer = 0f;
            int count = (hitFrames != null && hitFrames.Length > 0) ? hitFrames.Length : 2;
            oneShotEndTime = Time.time + count / 10f;
        }

        public void PlayDeath()
        {
            if (currentState == EntityAnimState.Death) return;
            currentState = EntityAnimState.Death;
            animTimer = 0f;
        }

        private void LateUpdate()
        {
            if (spriteRenderer == null) return;

            // Billboard olhando sempre para a câmera principal
            Camera cam = Camera.main;
            if (cam != null)
            {
                spriteRenderer.transform.rotation = cam.transform.rotation;
            }

            // Detecta movimento para alternar entre Idle e Walk e espelhar horizontalmente
            Vector3 delta = transform.position - lastPosition;
            float speedSq = (delta / Mathf.Max(0.0001f, Time.deltaTime)).sqrMagnitude;
            if (navAgent != null && navAgent.enabled)
            {
                speedSq = Mathf.Max(speedSq, navAgent.velocity.sqrMagnitude);
                if (Mathf.Abs(navAgent.velocity.x) > 0.1f)
                {
                    facingLeft = navAgent.velocity.x < 0f;
                }
            }
            else if (Mathf.Abs(delta.x) > 0.01f)
            {
                facingLeft = delta.x < 0f;
            }
            lastPosition = transform.position;

            spriteRenderer.flipX = facingLeft;

            if (currentState != EntityAnimState.Death)
            {
                if (currentState == EntityAnimState.Attack || currentState == EntityAnimState.Hit)
                {
                    if (Time.time >= oneShotEndTime)
                    {
                        currentState = speedSq > 0.1f ? EntityAnimState.Walk : EntityAnimState.Idle;
                        animTimer = 0f;
                    }
                }
                else
                {
                    EntityAnimState desired = speedSq > 0.1f ? EntityAnimState.Walk : EntityAnimState.Idle;
                    if (desired != currentState)
                    {
                        currentState = desired;
                        animTimer = 0f;
                    }
                }
            }

            UpdateVisualFrame(Time.deltaTime);
        }

        private void UpdateVisualFrame(float dt)
        {
            animTimer += dt;

            Sprite[] activeFrames = null;
            float fps = 5f;
            bool loop = true;

            switch (currentState)
            {
                case EntityAnimState.Idle:
                    activeFrames = idleFrames;
                    fps = 5f;
                    loop = true;
                    break;
                case EntityAnimState.Walk:
                    activeFrames = walkFrames;
                    fps = walkFps;
                    loop = true;
                    break;
                case EntityAnimState.Attack:
                    activeFrames = attackFrames;
                    fps = attackFps;
                    loop = false;
                    break;
                case EntityAnimState.Hit:
                    activeFrames = hitFrames;
                    fps = 10f;
                    loop = false;
                    break;
                case EntityAnimState.Death:
                    activeFrames = deathFrames;
                    fps = 7f;
                    loop = false;
                    break;
            }

            if (activeFrames != null && activeFrames.Length > 0)
            {
                int rawIndex = Mathf.FloorToInt(animTimer * fps);
                int frameIndex = loop ? (rawIndex % activeFrames.Length) : Mathf.Min(rawIndex, activeFrames.Length - 1);
                if (activeFrames[frameIndex] != null)
                {
                    spriteRenderer.sprite = activeFrames[frameIndex];
                    return;
                }
            }

            if (idleFrames != null && idleFrames.Length > 0 && idleFrames[0] != null)
            {
                spriteRenderer.sprite = idleFrames[0];
            }
            else if (staticSprite != null)
            {
                spriteRenderer.sprite = staticSprite;
            }
        }

        private static Sprite[] PrepareSpriteArrayChromaKey(Sprite[] source)
        {
            if (source == null || source.Length == 0) return source;
            Sprite[] result = new Sprite[source.Length];
            for (int i = 0; i < source.Length; i++)
            {
                result[i] = PrepareSpriteChromaKey(source[i]);
            }
            return result;
        }

        /// <summary>
        /// Remove o fundo preto sólido (#000000) em tempo de execução, preservando os recortes (rect/pivot)
        /// de cada célula do Sprite Sheet.
        /// </summary>
        private static Sprite PrepareSpriteChromaKey(Sprite original)
        {
            if (original == null || original.texture == null) return original;

            int spriteId = original.GetInstanceID();
            if (ProcessedSprites.TryGetValue(spriteId, out Sprite cachedSprite))
            {
                return cachedSprite;
            }

            Texture2D srcTex = original.texture;
            if (!srcTex.isReadable)
            {
                return original;
            }

            int texId = srcTex.GetInstanceID();
            if (!ProcessedTextures.TryGetValue(texId, out Texture2D cleanTex))
            {
                Color32[] pixels = srcTex.GetPixels32();
                bool hasAuthoredAlpha = false;
                for (int i = 0; i < pixels.Length; i++)
                {
                    if (pixels[i].a < 255) { hasAuthoredAlpha = true; break; }
                }
                // Preserve transparent PNGs, including dark clothing and soft effect edges.
                for (int i = 0; !hasAuthoredAlpha && i < pixels.Length; i++)
                {
                    Color32 c = pixels[i];
                    int maxCh = Mathf.Max(c.r, Mathf.Max(c.g, c.b));
                    if (maxCh <= 14)
                    {
                        c.a = 0;
                        pixels[i] = c;
                    }
                    else if (maxCh <= 32)
                    {
                        c.a = (byte)Mathf.Clamp(Mathf.RoundToInt((maxCh - 14) / 18f * 255f), 0, 255);
                        pixels[i] = c;
                    }
                }

                cleanTex = new Texture2D(srcTex.width, srcTex.height, TextureFormat.RGBA32, false);
                cleanTex.filterMode = FilterMode.Bilinear;
                cleanTex.wrapMode = TextureWrapMode.Clamp;
                cleanTex.SetPixels32(pixels);
                cleanTex.Apply(false, false);
                ProcessedTextures[texId] = cleanTex;
            }

            Rect rect = original.rect;
            Vector2 pivot = new Vector2(
                rect.width > 0 ? original.pivot.x / rect.width : 0.5f,
                rect.height > 0 ? original.pivot.y / rect.height : 0.15f
            );

            Sprite newSprite = Sprite.Create(cleanTex, rect, pivot, original.pixelsPerUnit);
            newSprite.name = original.name + "_Transparent";
            ProcessedSprites[spriteId] = newSprite;
            return newSprite;
        }

        private static void ApplyArenaFloorTile(Sprite floorSprite)
        {
            if (floorSprite == null || floorSprite.texture == null) return;

            GameObject chao = GameObject.Find("Chao");
            if (chao == null) return;

            MeshRenderer mr = chao.GetComponent<MeshRenderer>();
            if (mr == null || mr.material == null) return;

            Texture2D tex = floorSprite.texture;
            tex.wrapMode = TextureWrapMode.Repeat;

            Material mat = mr.material;
            mat.mainTexture = tex;
            mat.mainTextureScale = new Vector2(12f, 12f);

            if (mat.HasProperty("_BaseMap"))
            {
                mat.SetTexture("_BaseMap", tex);
                mat.SetTextureScale("_BaseMap", new Vector2(12f, 12f));
            }
            if (mat.HasProperty("_BaseColor"))
            {
                mat.SetColor("_BaseColor", Color.white);
            }
            mat.color = Color.white;
        }
    }
}

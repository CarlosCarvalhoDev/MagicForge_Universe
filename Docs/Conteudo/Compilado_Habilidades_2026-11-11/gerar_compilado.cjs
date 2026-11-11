// Run from the repository root after exporting the live skill catalogue (see RESUMO.md).
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = process.cwd();
const dest = __dirname;
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'scratch/runtime/skill-catalogue-2026-11-11.json'), 'utf8'));
const webDir = 'client/public/assets/skills';
const unityDir = 'MagicForgeClient/Assets/Art/Skills';
const classes = [
  ['GUERREIRO', 'Guerreiro', true, 'Sangramento, ruptura de armadura, proteção/reflexão, empurrão, buffs e resistência.', 'Docs/ENTREGA_GUERREIRO_BARBARO_2026-11-05.md'],
  ['BARBARO', 'Bárbaro', true, 'Lentidão, dreno, enfraquecimento, carga/salto, sangramento, proteção, execução e aura da Matilha.', 'Docs/ENTREGA_GUERREIRO_BARBARO_2026-11-05.md'],
  ['CLERIGO', 'Clérigo', true, 'Dano sagrado, cura, bênção, marca, áreas periódicas, Arma Espiritual e proteção.', 'Docs/ENTREGA_CLERIGO_NIVEL50_2026-11-05.md'],
  ['MAGO', 'Mago', true, 'Fogo/gelo/choque, escudo/reflexão, projéteis, áreas, cadeia, aceleração, cometas e congelamento.', 'Docs/ENTREGA_MAGO_NIVEL50_2026-11-05.md'],
  ['ARQUEIRO', 'Arqueiro', false, 'Catálogo e execução básica existem; efeitos específicos ainda não tiveram o mesmo fechamento das quatro classes acima.', null],
  ['MONGE', 'Monge', false, 'Catálogo e execução básica existem; efeitos específicos e buffs ainda pendentes.', null],
  ['BRUXO', 'Bruxo', false, 'Há execução básica e dreno híbrido em Toque Vampírico; a classe inteira ainda não está concluída.', null],
];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
function pngFiles(dir) {
  if (!fs.existsSync(path.join(root, dir))) return [];
  return fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.png')).sort().map(file => {
    const relativePath = `${dir}/${file}`;
    const bytes = fs.readFileSync(path.join(root, relativePath));
    if (bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw Error(`Invalid PNG ${file}`);
    return { file, path: relativePath, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), bytes: bytes.length, sha256: sha(bytes) };
  });
}
const web = pngFiles(webDir), unity = pngFiles(unityDir);
const groups = new Map();
for (const image of web) {
  const entry = groups.get(image.sha256) ?? { sha256: image.sha256, files: [] };
  entry.files.push(image); groups.set(image.sha256, entry);
}
const artworks = [...groups.values()].map((g, index) => {
  const representative = g.files.find(f => /^\d\d_/.test(f.file)) ?? g.files[0];
  return { artworkId: `ARTE-${String(index + 1).padStart(2, '0')}`, representative: representative.path,
    classType: classes.find(([id]) => representative.file.includes(id.toLowerCase()))?.[0] ?? 'DESCONHECIDA',
    width: representative.width, height: representative.height, sha256: g.sha256,
    webFiles: g.files.map(f => f.path), unityFilesWithSameHash: unity.filter(f => f.sha256 === g.sha256).map(f => f.path),
    semanticStatus: 'Arte existente; associação à habilidade atual precisa de revisão visual, não é validada pelo nome/slot legado.' };
});
const skills = catalog.map(s => {
  const expectedPath = `${webDir}/${s.skillId}.png`;
  const file = web.find(f => f.path === expectedPath);
  return { ...s, mechanicsStatus: classes.find(c => c[0] === s.classType)[2] ? 'efeitos implementados segundo catálogo atual; balanceamento pendente' : 'classe parcialmente implementada; não considerar efeito específico concluído',
    canonicalImage: { expectedPath, exists: !!file, artworkId: file ? artworks.find(a => a.sha256 === file.sha256).artworkId : null },
    availabilityNote: s.effectAvailableGuard ? 'Guarda permite conjurar; isso por si só não prova efeito completo.' : 'Marcada como efeito ainda indisponível pela guarda do jogo.' };
});
const summary = classes.map(([classType, label, complete, description, evidence]) => ({ classType, label,
  canonicalSkills: skills.filter(s => s.classType === classType).length,
  mechanicsCompleteAccordingToCurrentCatalogue: complete,
  canonicalImagesPresent: skills.filter(s => s.classType === classType && s.canonicalImage.exists).length,
  canonicalImagesMissing: skills.filter(s => s.classType === classType && !s.canonicalImage.exists).length,
  distinctArtworks: artworks.filter(a => a.classType === classType).length, description, evidence,
  unavailableSkills: skills.filter(s => s.classType === classType && !s.effectAvailableGuard).map(s => s.skillId),
}));
const manifest = { auditedOn: '2026-11-11', branch: 'master', scope: 'Auditoria local; não inclui busca no remoto ou nova validação de combate.',
  counts: { canonicalSkills: skills.length, webPngFiles: web.length, uniqueWebArtworks: artworks.length, canonicalImagesPresent: skills.filter(s => s.canonicalImage.exists).length, canonicalImagesMissing: skills.filter(s => !s.canonicalImage.exists).length, unityPngFiles: unity.length, unityUniqueHashes: new Set(unity.map(f => f.sha256)).size },
  sourceHashes: Object.fromEntries(['shared/src/skills.ts','shared/src/skill-targeting.ts','server/src/game/World.ts','client/src/main.ts'].map(p => [p, sha(fs.readFileSync(path.join(root,p)))])),
  classSummary: summary, artworks, skills, webFiles: web, unityFiles: unity,
};
if (skills.length !== 84 || summary.some(c => c.canonicalSkills !== 12)) throw Error('Unexpected skill catalogue; review generator.');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const readable = p => path.basename(p).replace(/^\d+_/, '').replace(/\.png$/, '').replace(/_/g, ' ');
const table = (rows, headers) => `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const intro = `
<p class="eyebrow">MagicForge: Universe · auditoria local · 11/11/2026</p><h1>Habilidades: mecânicas e imagens disponíveis</h1>
<p>Compilado para compartilhar com a equipe. Esta galeria contém as imagens embutidas e abre sem internet, sem depender da pasta do jogo.</p>
<div class="stats"><strong>4 classes com 12 efeitos implementados</strong><strong>84 habilidades no catálogo</strong><strong>${web.length} PNGs / ${artworks.length} artes diferentes</strong></div>
<aside><b>Atenção à diferença:</b> mecânica implementada, ícone existente e animação de combate são entregas distintas. As quatro classes concluídas ainda precisam de balanceamento. Apenas o Bárbaro tem todos os caminhos de ícone que o HUD procura; seus 12 arquivos repetem quatro artes. As outras seis classes têm quatro artes legadas cada, mas faltam os 12 nomes canônicos de arquivo.</aside>
<nav>${summary.map(c=>`<a href="#${c.classType}">${esc(c.label)}</a>`).join('')}<a href="#handoff">Passar ao colega</a></nav>
<h2>Visão geral</h2>${table(summary.map(c=>[esc(c.label),c.mechanicsCompleteAccordingToCurrentCatalogue?'12 efeitos implementados':'Parcial',`${c.canonicalImagesPresent}/12`,String(c.distinctArtworks),String(c.canonicalImagesMissing)]),['Classe','Mecânica','Caminhos presentes','Artes distintas','Caminhos ausentes'])}
<p>Os slots desbloqueiam nos níveis <b>1, 10, 25 e 50</b>, com três escolhas por slot. Nomes legados dos PNGs não validam associação com as escolhas atuais.</p>`;
const classHtml = summary.map(c => {
  const pictures = artworks.filter(a => a.classType === c.classType).map(a => {
    const uri = `data:image/png;base64,${fs.readFileSync(path.join(root,a.representative)).toString('base64')}`;
    return `<figure><img src="${uri}" alt="Arte existente: ${esc(readable(a.representative))}" width="180" height="180"><figcaption><b>${esc(readable(a.representative))}</b><code>${esc(a.representative)}</code><small>${a.width} × ${a.height} · ${a.webFiles.length} arquivos Web com o mesmo hash</small><details><summary>Arquivos equivalentes e Unity</summary>${a.webFiles.map(f=>`<code>${esc(f)}</code>`).join('')}${a.unityFilesWithSameHash.map(f=>`<code>${esc(f)}</code>`).join('')}</details></figcaption></figure>`;
  }).join('');
  const list = skills.filter(s=>s.classType===c.classType).map(s=>[`${esc(s.name)}<code>${esc(s.skillId)}</code><details><summary>Descrição atual</summary>${esc(s.description)}</details>`,`Slot ${s.slot} · Nv. ${s.unlockLevel}`,s.canonicalImage.exists?`Presente · ${s.canonicalImage.artworkId}<small>Arte compartilhada; revisar identidade de cada escolha.</small>`:'Arquivo canônico ausente',!c.mechanicsCompleteAccordingToCurrentCatalogue&&!s.effectAvailableGuard?'Efeito indisponível na guarda':c.mechanicsCompleteAccordingToCurrentCatalogue?'Implementada':'Revisão mecânica pendente']);
  return `<section id="${c.classType}"><h2>${esc(c.label)} <span class="badge">${c.mechanicsCompleteAccordingToCurrentCatalogue?'12 efeitos implementados':'Mecânica parcial'}</span></h2><p>${esc(c.description)}</p><h3>As quatro artes distintas existentes</h3><div class="gallery">${pictures}</div><h3>As 12 escolhas do catálogo atual</h3>${table(list,['Habilidade','Slot / nível','Ícone no HUD atual','Mecânica'])}</section>`;
}).join('');
const ending = `<section id="handoff"><h2>O que passar ao colega</h2><ol>
<li>Priorizar a arte de Guerreiro, Clérigo e Mago, que têm mecânica concluída e nenhum dos 12 caminhos canônicos presentes. Revisar também a repetição das quatro artes do Bárbaro.</li>
<li>Revisar semanticamente as 28 ilustrações antes de associá-las a novos nomes: uma imagem de arma espiritual não deve virar cura só porque ocupa o antigo slot 2; uma bola de fogo não deve representar nevasca.</li>
<li>Registrar cada associação proposta: arquivo original → skillId atual → justificativa → revisão pendente/aprovada. Não copiar uma mesma arte para todos os nomes como se fossem imagens novas.</li>
<li>Para o restante, gerar rascunhos com nomes canônicos exatos, leitura em 32/48/64 px e identidade visual consistente. Monge e Bruxo também precisam de revisão de moldura, eventuais marcas e fidelidade ao efeito; as pendências antigas não foram corrigidas nesta auditoria.</li>
<li>Separar ícones de VFX/animações: a Matilha Espectral do Bárbaro funciona como aura periódica, sem lobos independentes com IA ou animação final de invocação.</li>
<li>Não alterar código de combate, balanceamento, GUIDs ou arquivos existentes durante produção de rascunhos. Propor a integração em lote separado.</li></ol>
<p>Unity: os arquivos encontrados estão em <code>${unityDir}/</code>, e não no caminho de Textures/Sprites/Skills sugerido em instruções antigas. Existem ${unity.length} PNGs (${manifest.counts.unityUniqueHashes} hashes); presença em disco não prova ligação em cenas/prefabs nem paridade de mecânica com Web/servidor.</p>
<p>Limite: inspeção de código/documentos, hashes e arquivos locais; não houve novo teste de combate, aprovação individual das 28 artes ou busca em branches remotas. A galeria permite a revisão visual pela equipe. Não alteramos skills, imagens, interface, banco ou imports Unity.</p></section>`;
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MagicForge — Compilado de habilidades — 11/11/2026</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#080c15;color:#e2e8f0;font:15px/1.55 system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:32px 24px}h1,h2,h3{color:#fef08a;line-height:1.25}h1{font-size:34px}h2{margin-top:36px}section{padding-top:12px;border-top:1px solid #97702c;margin-top:32px}.eyebrow{color:#e9b657;font-size:13px}.stats{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}.stats strong,aside{padding:16px;border:1px solid #856029;background:#141b2a;border-radius:8px}aside{color:#dce3ef}nav{display:flex;flex-wrap:wrap;gap:12px;margin:24px 0}nav a{color:#fbbf24;text-decoration:none;border:1px solid #71562e;padding:7px 12px;border-radius:5px}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:13px}td,th{text-align:left;vertical-align:top;border-bottom:1px solid #303b50;padding:12px}th{background:#151e30;color:#fef08a}code{font:11px/1.5 ui-monospace,monospace;overflow-wrap:anywhere;white-space:normal;color:#a8bfd9}td code,figcaption code{display:block;margin:5px 0}small{display:block;color:#9db0c8;margin-top:5px}.gallery{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}figure{margin:0;background:#111a2b;border:1px solid #41506b;border-radius:8px;overflow:hidden}figure img{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:contain;background:#090d14}figcaption{padding:12px;font-size:13px}.badge{display:inline-block;font:12px system-ui;padding:6px 10px;background:#203a35;color:#b4f5cd;border-radius:20px;vertical-align:middle}details{font-size:12px;color:#c5d4e5;margin-top:7px}summary{cursor:pointer;color:#e5bb70}li{margin:12px 0}@media(max-width:700px){main{padding:18px 12px}h1{font-size:26px}.gallery{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}td,th{padding:8px}.badge{margin-top:8px}}@media print{body{background:white;color:#222}h1,h2,h3{color:#4b3100}section{break-before:page}.gallery{grid-template-columns:repeat(4,1fr)}nav{display:none}}
</style></head><body><main>${intro}${classHtml}${ending}</main></body></html>`;
const rows = summary.map(c=>`| ${c.label} | ${c.mechanicsCompleteAccordingToCurrentCatalogue?'12/12 efeitos':'Parcial'} | ${c.canonicalImagesPresent}/12 | ${c.distinctArtworks} | ${c.canonicalImagesMissing} |`).join('\n');
let md = `# Compilado de habilidades e imagens — 11/11/2026\n\n[Abra a galeria visual portátil](GALERIA.html). Envie esse HTML ao colega: as 28 imagens estão embutidas, sem necessidade de internet ou caminhos locais.\n\n## Estado confirmado\n\n**Guerreiro, Bárbaro, Clérigo e Mago** têm os 12 efeitos implementados de acordo com o catálogo atual. São 48 habilidades nessas quatro classes. Balanceamento final e arte completa ainda são pendências. **Arqueiro, Monge e Bruxo** continuam parcialmente implementados; constar no catálogo ou passar na guarda de disponibilidade não comprova o efeito completo.\n\n| Classe | Mecânica | Caminhos canônicos presentes | Artes distintas existentes | Caminhos ausentes |\n| --- | --- | --- | --- | --- |\n${rows}\n\n**Contagem conferida:** ${skills.length} habilidades canônicas, ${web.length} arquivos PNG Web, ${artworks.length} hashes distintos, ${manifest.counts.canonicalImagesPresent} caminhos canônicos presentes e ${manifest.counts.canonicalImagesMissing} ausentes. Os 12 caminhos presentes do Bárbaro repetem quatro ilustrações. Há quatro artes legadas por classe; o HUD procura o nome canônico, não o alias antigo. Não confundir caminhos faltantes com uma quantidade definitiva de imagens a gerar: o reaproveitamento depende de revisão semântica.\n\nOs slots são liberados nos níveis **1, 10, 25 e 50**, três escolhas por slot.\n\n## As 84 habilidades\n`;
for (const c of summary) {
  md += `\n### ${c.label}\n\n${c.description}\n\n${c.evidence ? `Evidência de implementação: [entrega anterior](../../../${c.evidence}).\n\n` : ''}| Habilidade | ID canônico | Slot / nível | PNG canônico |\n| --- | --- | --- | --- |\n`;
  for (const s of skills.filter(s=>s.classType===c.classType)) md += `| ${s.name} | \`${s.skillId}\` | ${s.slot} / ${s.unlockLevel} | ${s.canonicalImage.exists?'Presente, arte compartilhada':'Ausente'} |\n`;
}
md += `\n## Arquivos e limitações\n\n- [GALERIA.html](GALERIA.html): 28 ilustrações agrupadas por classe, nomes de arquivos, aliases equivalentes e lista das 84 escolhas. Portátil/offline.\n- [manifesto.json](manifesto.json): paths, dimensões, SHA-256, agrupamento por arte e estado de cada habilidade; inclui a guarda de disponibilidade sem confundi-la com efeito completo.\n- [gerar_compilado.cjs](gerar_compilado.cjs): gerador reproduzível do pacote.\n- Web: \`${webDir}/\`. Unity: \`${unityDir}/\`, com ${unity.length} PNGs e ${manifest.counts.unityUniqueHashes} hashes distintos. Ligações em cenas/prefabs e paridade de execução Unity não foram auditadas.\n\nArtes de Monge/Bruxo e as realocações sugeridas na proposta de 05/11 precisam de revisão visual. Os nomes antigos da proposta podem divergir dos arquivos reais: usar os caminhos efetivamente listados neste manifesto. Não foi aplicada correção de moldura/watermark nem aprovado automaticamente nenhum reaproveitamento. Ícone não equivale a animação/VFX. A Matilha Espectral está implementada como aura de dano periódico, sem lobos com IA independente.\n\n## Ordem sugerida ao colega\n\n1. Revisar as quatro artes existentes de Guerreiro, Clérigo e Mago e propor associações aos IDs canônicos, pois a mecânica está pronta e os caminhos atuais faltam.\n2. Revisar o reaproveitamento/repetição do Bárbaro e produzir identidade própria para as alternativas.\n3. Gerar rascunhos das escolhas restantes, com legibilidade em 32/48/64 px; reservar uma pasta nova e não sobrescrever assets atuais.\n4. Revisar Monge/Bruxo e demais artes, sem considerar que seus efeitos de combate estão todos prontos.\n5. Integrar arte e mapeamento em lote separado, preservando layout, GUIDs e nomes canônicos.\n\n## Verificação e reprodução\n\nAuditoria local na branch \`master\`, em \`E:/MagicForge_Universe\`. Foram lidos catálogo, guarda de disponibilidade, execução do servidor e documentos de entrega. PNGs inventariados por cabeçalho e SHA-256. Não foi feita busca no remoto, execução de novos testes de combate ou alteração no banco, código, imagens e arquivos Unity. As validações deste bloco são consistência de contagens/caminhos/hashes e renderização da galeria. Alterações locais anteriores foram preservadas. Sem commit/push.\n\nPara regenerar: exportar \`Object.values(SKILLS_DATABASE)\` deduplicado por \`skillId\`, com \`effectAvailableGuard: isSkillEffectAvailable(s)\`, para \`scratch/runtime/skill-catalogue-2026-11-11.json\` usando \`node --import tsx\` a partir de \`server\`; depois, da raiz, executar \`node Docs/Conteudo/Compilado_Habilidades_2026-11-11/gerar_compilado.cjs\`.\n`;
fs.writeFileSync(path.join(dest, 'manifesto.json'), JSON.stringify(manifest, null, 2)+'\n');
fs.writeFileSync(path.join(dest, 'GALERIA.html'), html);
fs.writeFileSync(path.join(dest, 'RESUMO.md'), md);
console.log(JSON.stringify({ counts: manifest.counts, classes: summary, htmlBytes: Buffer.byteLength(html) },null,2));

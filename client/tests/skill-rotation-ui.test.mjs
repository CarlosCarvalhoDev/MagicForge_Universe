import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { moveRotationSlot, setupSkillRotation } from '../src/ui/SkillRotation.ts';

test('Reordenar o ciclo preserva os quatro slots e suporta ida e volta', () => {
  const initial = [1, 2, 3, 4];
  const moved = moveRotationSlot(initial, 0, 1);
  assert.deepEqual(moved, [2, 1, 3, 4]);
  assert.deepEqual(initial, [1, 2, 3, 4]);
  assert.deepEqual(moveRotationSlot(moved, 1, 0), initial);
  assert.deepEqual(moveRotationSlot(initial, 0, -1), initial);
});

test('HUD preserva quatro habilidades e limita movimento por clique ao armazém', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const main = fs.readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../src/ui/progression.css', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /id="virtual-joystick-zone"/);
  assert.doesNotMatch(main, /sendMoveDirection\(/);
  assert.match(main, /if \(player && player\.currentHp > 0 && inWarehouse\)\s*\{\s*network\.sendMoveInput\(/);
  assert.doesNotMatch(main, /inWarehouse \|\| skillRotationUI\?\.canCastManually/);
  assert.doesNotMatch(main, /for \(let slot = 4; slot >= 1; slot--\)/);
  assert.match(html, /id="grimorio-tab-rotation"/);
  assert.match(html, /id="skill-rotation-panel"/);
  assert.match(html, /class="combat-action-container"/);
  assert.match(html, /class="skills-square-row"/);
  assert.match(html, /id="btn-combat-auto-active"/);
  assert.match(css, /\.skills-square-row/);
  for (const slot of [1, 2, 3, 4]) assert.match(html, new RegExp(`id="skill-btn-${slot}"`));
});

test('Botão aguarda confirmação, preserva ordem e sincroniza preferência do Grimório', t => {
  class Element {
    listeners = {}; children = []; attributes = {}; checked = false; disabled = false; style = {};
    querySelector() { return null; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    setAttribute(name, value) { this.attributes[name] = value; }
    replaceChildren() { this.children = []; }
    append(...items) { this.children.push(...items); }
    appendChild(item) { this.children.push(item); }
    click() { this.listeners.click?.(); }
  }
  const elements = new Map();
  const previous = globalThis.document;
  globalThis.document = { getElementById(id) { if (!elements.has(id)) elements.set(id,new Element()); return elements.get(id); }, createElement() { return new Element(); } };
  const sent = [];
  const ui = setupSkillRotation({isReady:()=>true, save:(...args)=>sent.push(args), getSkill:()=>undefined, getLevel:()=>1, applyHudOrder() {}});
  t.after(() => { ui.onDisconnected(); globalThis.document = previous; });
  const quick = elements.get('btn-toggle-auto-cast');
  const checkbox = elements.get('chk-auto-cast-enabled');
  assert.equal(quick.disabled, true);
  ui.onUpdate({order:[3,1,4,2],autoCastEnabled:true,success:true});
  quick.click();
  assert.deepEqual(sent, [[[3,1,4,2],false]]);
  assert.equal(quick.textContent, 'AUTO ON');
  assert.equal(quick.disabled, true);
  assert.equal(elements.get('combat-auto-view').style.display, 'flex');
  assert.equal(elements.get('combat-manual-view').style.display, 'flex');
  assert.equal(elements.get('skill-btn-1').attributes['aria-disabled'], 'true');
  assert.equal(ui.canCastManually(), false);
  ui.onUpdate({order:[3,1,4,2],autoCastEnabled:false,success:true});
  assert.equal(quick.textContent, 'AUTO OFF');
  assert.equal(checkbox.checked, false);
  assert.equal(elements.get('combat-auto-view').style.display, 'flex');
  assert.equal(ui.canCastManually(), true);
  assert.equal(elements.get('combat-manual-view').style.display, 'flex');
  checkbox.checked = true; checkbox.listeners.change();
  elements.get('btn-save-skill-rotation').click();
  assert.deepEqual(sent.at(-1), [[3,1,4,2],true]);
  ui.onUpdate({order:[3,1,4,2],autoCastEnabled:false,success:false,message:'Falha ao salvar'});
  assert.equal(quick.textContent, 'AUTO OFF');
  assert.equal(checkbox.checked, false);
  quick.click();
  assert.deepEqual(sent.at(-1), [[3,1,4,2],true]);
});

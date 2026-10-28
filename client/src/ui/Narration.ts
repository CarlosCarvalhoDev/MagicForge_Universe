let enabled = false;
export const supportsNarration = () => typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
export function stopNarration() { if (enabled && supportsNarration()) window.speechSynthesis.cancel(); }
export function enableNarration(value: boolean) { stopNarration(); enabled = value && supportsNarration(); return enabled; }
export function speakNarrative(text: string) {
  if (!enabled || !supportsNarration()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR'; utterance.rate = 1.05; utterance.pitch = 0.8;
  const voice = window.speechSynthesis.getVoices().find(item => item.lang.toLowerCase() === 'pt-br') || window.speechSynthesis.getVoices().find(item => item.lang.startsWith('pt'));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

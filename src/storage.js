// Armazenamento local e seguro.
//
// PRIVACIDADE: o jogo guarda APENAS o recorde e a opção de som, e só no
// próprio aparelho (localStorage). Nada é enviado para servidor nenhum.
// Não há conta, login, nome, e-mail, rastreamento ou anúncios.

const PREFIX = 'trinca.';
const MAX_SCORE = 1e9;

function safeGet(key) {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null; // modo privado ou armazenamento bloqueado
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, String(value));
  } catch {
    // sem armazenamento: o jogo continua funcionando normalmente
  }
}

export function loadBest() {
  const n = Number.parseInt(safeGet('best') ?? '0', 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, MAX_SCORE);
}

export function saveBest(score) {
  const n = Math.floor(Number(score));
  if (!Number.isFinite(n) || n < 0) return;
  safeSet('best', Math.min(n, MAX_SCORE));
}

export function loadMuted() {
  return safeGet('muted') === '1';
}

export function saveMuted(muted) {
  safeSet('muted', muted ? '1' : '0');
}

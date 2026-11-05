// Ponto de entrada: liga lógica, desenho, controles, som e telas.

import {
  COLS, ROWS, PIECE_LEN,
  createGame, update, move, rotate, softDrop, hardDrop, setPaused,
} from './logic.js';
import { drawBoard, drawNext } from './render.js';
import { loadBest, saveBest, loadMuted, saveMuted } from './storage.js';
import { sfx, setMuted, unlockAudio } from './audio.js';

const $ = (id) => document.getElementById(id);

const boardCanvas = $('board');
const boardCtx = boardCanvas.getContext('2d');
const nextCanvas = $('next');
const nextCtx = nextCanvas.getContext('2d');
const wrap = $('board-wrap');

const ui = {
  score: $('score'),
  level: $('level'),
  best: $('best'),
  overlay: $('overlay'),
  title: $('overlay-title'),
  text: $('overlay-text'),
  start: $('btn-start'),
  pause: $('btn-pause'),
  sound: $('btn-sound'),
  toast: $('toast'),
};

let state = null;
let best = loadBest();
let muted = loadMuted();
let cell = 32;
const NEXT_CELL = 22;
let lastTime = performance.now();
let toastTimer = 0;
let demo = true; // true = tabuleiro decorativo da tela inicial

setMuted(muted);

// ---------- tamanho da tela ----------
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const maxW = wrap.clientWidth;
  const maxH = wrap.clientHeight;
  cell = Math.max(16, Math.floor(Math.min(maxW / COLS, maxH / ROWS)));
  const w = cell * COLS;
  const h = cell * ROWS;
  boardCanvas.style.width = `${w}px`;
  boardCanvas.style.height = `${h}px`;
  boardCanvas.width = Math.round(w * dpr);
  boardCanvas.height = Math.round(h * dpr);
  boardCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  nextCanvas.style.width = `${NEXT_CELL}px`;
  nextCanvas.style.height = `${NEXT_CELL * PIECE_LEN}px`;
  nextCanvas.width = Math.round(NEXT_CELL * dpr);
  nextCanvas.height = Math.round(NEXT_CELL * PIECE_LEN * dpr);
  nextCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(wrap);

// ---------- telas (início / pausa / fim) ----------
function showOverlay(title, text, buttonLabel) {
  ui.title.textContent = title;
  ui.text.textContent = text;
  ui.start.textContent = buttonLabel;
  ui.overlay.hidden = false;
  ui.start.focus();
}

function hideOverlay() {
  ui.overlay.hidden = true;
}

function toast(message) {
  ui.toast.textContent = message;
  ui.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 1200);
}

function startGame() {
  unlockAudio();
  state = createGame();
  demo = false;
  hideOverlay();
  ui.pause.disabled = false;
}

function togglePause(force) {
  if (!state || state.over || demo) return;
  const paused = force ?? !state.paused;
  setPaused(state, paused);
  if (paused) showOverlay('Pausado', 'Respire fundo. Quando quiser, é só continuar.', 'Continuar');
  else hideOverlay();
}

ui.start.addEventListener('click', () => {
  if (!demo && state.paused && !state.over) togglePause(false);
  else startGame();
});
ui.pause.addEventListener('click', () => togglePause());

function renderSoundButton() {
  ui.sound.textContent = muted ? '🔇' : '🔊';
  ui.sound.setAttribute('aria-label', muted ? 'Ligar som' : 'Desligar som');
}
ui.sound.addEventListener('click', () => {
  unlockAudio();
  muted = !muted;
  setMuted(muted);
  saveMuted(muted);
  renderSoundButton();
});
renderSoundButton();

// Pausa sozinho quando o jogador troca de aba ou de app.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !demo && !state.paused && !state.over) togglePause(true);
});

// ---------- ações ----------
const actions = {
  left: () => move(state, -1) && sfx.move(),
  right: () => move(state, 1) && sfx.move(),
  rotate: () => rotate(state) && sfx.rotate(),
  down: () => softDrop(state),
  drop: () => hardDrop(state),
};

function act(name) {
  if (demo || state.over || state.paused) return;
  actions[name]();
}

// ---------- teclado ----------
const KEYS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'rotate', KeyW: 'rotate', KeyX: 'rotate',
  ArrowDown: 'down', KeyS: 'down',
  Space: 'drop',
};
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyP' || e.code === 'Escape') {
    togglePause();
    e.preventDefault();
    return;
  }
  if ((e.code === 'Enter' || e.code === 'Space') && !ui.overlay.hidden) {
    return; // o botão da tela em foco cuida disso
  }
  const name = KEYS[e.code];
  if (!name) return;
  e.preventDefault();
  if (e.repeat && (name === 'rotate' || name === 'drop')) return;
  act(name);
});

// ---------- botões na tela (celular/tablet) ----------
document.querySelectorAll('[data-action]').forEach((btn) => {
  const name = btn.dataset.action;
  if (!Object.hasOwn(actions, name)) return;
  let delayTimer = 0;
  let repeatTimer = 0;
  const repeatable = name === 'left' || name === 'right' || name === 'down';
  const stop = () => {
    clearTimeout(delayTimer);
    clearInterval(repeatTimer);
  };
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    unlockAudio();
    act(name);
    if (repeatable) {
      delayTimer = setTimeout(() => {
        repeatTimer = setInterval(() => act(name), 70);
      }, 220);
    }
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
});

// ---------- gestos no tabuleiro ----------
// Arrastar para os lados = mover. Toque rápido = girar. Deslizar para baixo = derrubar.
let touch = null;
boardCanvas.addEventListener('pointerdown', (e) => {
  unlockAudio();
  touch = { id: e.pointerId, x0: e.clientX, y0: e.clientY, lastX: e.clientX, moved: false, t0: performance.now() };
  boardCanvas.setPointerCapture(e.pointerId);
});
boardCanvas.addEventListener('pointermove', (e) => {
  if (!touch || touch.id !== e.pointerId) return;
  const dx = e.clientX - touch.lastX;
  if (Math.abs(dx) >= cell * 0.8) {
    const steps = Math.trunc(dx / (cell * 0.8));
    for (let i = 0; i < Math.abs(steps); i++) act(steps > 0 ? 'right' : 'left');
    touch.lastX += steps * cell * 0.8;
    touch.moved = true;
  }
});
boardCanvas.addEventListener('pointerup', (e) => {
  if (!touch || touch.id !== e.pointerId) return;
  const dx = e.clientX - touch.x0;
  const dy = e.clientY - touch.y0;
  const dt = performance.now() - touch.t0;
  if (!touch.moved && Math.abs(dx) < 12 && Math.abs(dy) < 12 && dt < 400) act('rotate');
  else if (dy > cell * 2 && Math.abs(dy) > Math.abs(dx) * 1.5) act('drop');
  touch = null;
});
boardCanvas.addEventListener('pointercancel', () => {
  touch = null;
});

// ---------- eventos do jogo (som e avisos) ----------
function handleEvents() {
  for (const ev of state.events) {
    switch (ev.type) {
      case 'land': sfx.land(); break;
      case 'clear':
        sfx.clear(ev.chain);
        if (ev.chain >= 2) toast(`Combo x${ev.chain}!`);
        break;
      case 'levelup':
        sfx.levelup();
        toast(`Nível ${ev.level}!`);
        break;
      case 'gameover': onGameOver(); break;
    }
  }
  state.events.length = 0;
}

function onGameOver() {
  sfx.gameover();
  ui.pause.disabled = true;
  const record = state.score > best;
  if (record) {
    best = state.score;
    saveBest(best);
  }
  showOverlay(
    record ? 'Novo recorde! 🎉' : 'Fim de jogo',
    `Você fez ${state.score.toLocaleString('pt-BR')} pontos e chegou ao nível ${state.level}.`,
    'Jogar de novo',
  );
}

// ---------- laço principal ----------
function frame(now) {
  const dt = Math.min(100, now - lastTime);
  lastTime = now;
  if (state) {
    update(state, dt);
    handleEvents();
    ui.score.textContent = state.score.toLocaleString('pt-BR');
    ui.level.textContent = String(state.level);
    ui.best.textContent = Math.max(best, state.score).toLocaleString('pt-BR');
    drawBoard(boardCtx, state, cell, now);
    drawNext(nextCtx, state.next, NEXT_CELL);
  }
  requestAnimationFrame(frame);
}

// tabuleiro de fundo na tela inicial
state = createGame({ seed: 7 });
state.paused = true;
ui.pause.disabled = true;
state.events.length = 0;
ui.best.textContent = best.toLocaleString('pt-BR');
resize();
requestAnimationFrame(frame);

// ---------- modo offline / instalável (PWA) ----------
if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

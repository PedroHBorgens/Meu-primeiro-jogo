// Lógica pura do jogo "Trinca!".
// Este arquivo NÃO mexe com tela, teclado nem rede: só regras.
// Isso deixa a lógica fácil de testar (veja tests/logic.test.js).

export const COLS = 6;
export const ROWS = 13;
export const PIECE_LEN = 3;
export const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'star', 'hexagon'];
export const CLEAR_DELAY_MS = 350; // tempo da animação de "explosão"
export const CLEARS_PER_LEVEL = 18; // peças explodidas para subir de nível
export const MAX_LEVEL = 99;

// Gerador de números aleatórios com semente (mesma semente = mesmo jogo).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Quantas formas diferentes aparecem em cada nível (começa fácil: 3).
export function shapesForLevel(level) {
  return Math.min(SHAPES.length, 3 + Math.floor((level - 1) / 2));
}

// Tempo (ms) que a peça leva para descer uma casa. Fica mais rápido por nível.
export function fallIntervalMs(level) {
  return Math.max(110, Math.round(1000 * Math.pow(0.85, level - 1)));
}

export function emptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function randomCells(state) {
  const n = shapesForLevel(state.level);
  return Array.from({ length: PIECE_LEN }, () => Math.floor(state.rng() * n));
}

export function createGame({ seed = Date.now(), rng } = {}) {
  const state = {
    grid: emptyGrid(),
    rng: rng || mulberry32(seed),
    piece: null,
    next: null,
    score: 0,
    level: 1,
    cleared: 0,
    chain: 0,
    fallTimer: 0,
    clearing: null,
    over: false,
    paused: false,
    events: [],
  };
  state.next = randomCells(state);
  spawn(state);
  return state;
}

function spawn(state) {
  const x = Math.floor(COLS / 2) - 1;
  if (state.grid[0][x] !== null) {
    state.over = true;
    state.piece = null;
    state.events.push({ type: 'gameover' });
    return;
  }
  state.piece = { x, y: -(PIECE_LEN - 1), cells: state.next };
  state.next = randomCells(state);
  state.fallTimer = 0;
}

export function canPlace(state, x, y) {
  if (x < 0 || x >= COLS) return false;
  for (let i = 0; i < PIECE_LEN; i++) {
    const row = y + i;
    if (row >= ROWS) return false;
    if (row >= 0 && state.grid[row][x] !== null) return false;
  }
  return true;
}

function canAct(state) {
  return !!state.piece && !state.over && !state.paused && !state.clearing;
}

export function move(state, dx) {
  if (!canAct(state)) return false;
  const p = state.piece;
  if (!canPlace(state, p.x + dx, p.y)) return false;
  p.x += dx;
  return true;
}

// Gira as cores da peça: a de baixo vai para cima.
export function rotate(state) {
  if (!canAct(state)) return false;
  const c = state.piece.cells;
  state.piece.cells = [c[2], c[0], c[1]];
  return true;
}

export function softDrop(state) {
  if (!canAct(state)) return false;
  const p = state.piece;
  state.fallTimer = 0;
  if (canPlace(state, p.x, p.y + 1)) {
    p.y += 1;
    state.score += 1;
    return true;
  }
  lock(state);
  return true;
}

export function hardDrop(state) {
  if (!canAct(state)) return false;
  const p = state.piece;
  while (canPlace(state, p.x, p.y + 1)) {
    p.y += 1;
    state.score += 2;
  }
  lock(state);
  return true;
}

// Linha onde a peça cairia (para desenhar a "sombra").
export function ghostY(state) {
  const p = state.piece;
  if (!p) return null;
  let y = p.y;
  while (canPlace(state, p.x, y + 1)) y++;
  return y;
}

function lock(state) {
  const p = state.piece;
  state.piece = null;
  for (let i = 0; i < PIECE_LEN; i++) {
    const row = p.y + i;
    if (row < 0) state.over = true;
    else state.grid[row][p.x] = p.cells[i];
  }
  state.events.push({ type: 'land' });
  if (state.over) {
    state.events.push({ type: 'gameover' });
    return;
  }
  state.chain = 0;
  checkMatches(state);
}

function checkMatches(state) {
  const cells = findMatches(state.grid);
  if (cells.length > 0) {
    state.chain += 1;
    state.clearing = { cells, t: CLEAR_DELAY_MS };
  } else {
    state.chain = 0;
    spawn(state);
  }
}

// Encontra todas as sequências de 3 ou mais formas iguais
// na horizontal, vertical e nas duas diagonais.
export function findMatches(grid) {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  const found = new Set();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = grid[r][c];
      if (v === null) continue;
      for (const [dr, dc] of dirs) {
        const pr = r - dr;
        const pc = c - dc;
        if (pr >= 0 && pc >= 0 && pc < COLS && grid[pr][pc] === v) continue; // não é o início
        let len = 0;
        let rr = r;
        let cc = c;
        while (rr < ROWS && cc >= 0 && cc < COLS && grid[rr][cc] === v) {
          len++;
          rr += dr;
          cc += dc;
        }
        if (len >= 3) {
          for (let k = 0; k < len; k++) found.add((r + dr * k) * COLS + (c + dc * k));
        }
      }
    }
  }
  return [...found].sort((a, b) => a - b).map((i) => [Math.floor(i / COLS), i % COLS]);
}

// Faz as formas que ficaram "no ar" caírem.
export function applyGravity(grid) {
  for (let c = 0; c < COLS; c++) {
    let write = ROWS - 1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r][c] !== null) {
        const v = grid[r][c];
        grid[r][c] = null;
        grid[write][c] = v;
        write--;
      }
    }
  }
}

export function scoreFor(count, chain, level) {
  return count * 10 * chain * level;
}

// Avança o jogo "dt" milissegundos.
export function update(state, dt) {
  if (state.over || state.paused) return;

  if (state.clearing) {
    state.clearing.t -= dt;
    if (state.clearing.t > 0) return;
    const { cells } = state.clearing;
    for (const [r, c] of cells) state.grid[r][c] = null;
    state.score += scoreFor(cells.length, state.chain, state.level);
    state.cleared += cells.length;
    const newLevel = Math.min(MAX_LEVEL, 1 + Math.floor(state.cleared / CLEARS_PER_LEVEL));
    if (newLevel > state.level) {
      state.level = newLevel;
      state.events.push({ type: 'levelup', level: newLevel });
    }
    state.events.push({ type: 'clear', count: cells.length, chain: state.chain });
    applyGravity(state.grid);
    state.clearing = null;
    checkMatches(state);
    return;
  }

  if (!state.piece) return;
  state.fallTimer += dt;
  const interval = fallIntervalMs(state.level);
  while (state.piece && state.fallTimer >= interval) {
    state.fallTimer -= interval;
    const p = state.piece;
    if (canPlace(state, p.x, p.y + 1)) p.y += 1;
    else lock(state);
  }
}

export function setPaused(state, paused) {
  if (state.over) return;
  state.paused = paused;
}

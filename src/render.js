// Desenho na tela (canvas). Cada forma tem cor E formato próprios,
// para que pessoas daltônicas também consigam jogar.

import { COLS, ROWS, PIECE_LEN, SHAPES, ghostY } from './logic.js';

export const COLORS = {
  circle: '#ef4444',
  square: '#3b82f6',
  triangle: '#22c55e',
  diamond: '#eab308',
  star: '#a855f7',
  hexagon: '#f97316',
};

function polygon(ctx, cx, cy, radius, sides, rotation) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i * 2 * Math.PI) / sides;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function starPath(ctx, cx, cy, outer, inner) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawShape(ctx, shapeIndex, cx, cy, size, alpha = 1) {
  const name = SHAPES[shapeIndex];
  const r = size * 0.4;
  ctx.save();
  ctx.globalAlpha = alpha;
  switch (name) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      break;
    case 'square': {
      const s = r * 1.6;
      ctx.beginPath();
      ctx.roundRect(cx - s / 2, cy - s / 2, s, s, size * 0.08);
      break;
    }
    case 'triangle':
      polygon(ctx, cx, cy + r * 0.15, r * 1.15, 3, -Math.PI / 2);
      break;
    case 'diamond':
      polygon(ctx, cx, cy, r * 1.1, 4, -Math.PI / 2);
      break;
    case 'star':
      starPath(ctx, cx, cy, r * 1.15, r * 0.5);
      break;
    case 'hexagon':
      polygon(ctx, cx, cy, r * 1.05, 6, 0);
      break;
  }
  ctx.fillStyle = COLORS[name];
  ctx.fill();
  ctx.lineWidth = Math.max(1, size * 0.06);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.stroke();
  ctx.restore();
}

export function drawBoard(ctx, state, cell, now) {
  const w = COLS * cell;
  const h = ROWS * cell;
  ctx.clearRect(0, 0, w, h);

  // fundo quadriculado
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(c * cell, r * cell, cell, cell);
    }
  }

  const clearingSet = new Set();
  if (state.clearing) for (const [r, c] of state.clearing.cells) clearingSet.add(r * COLS + c);
  const blink = 0.35 + 0.65 * Math.abs(Math.sin(now / 60));

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = state.grid[r][c];
      if (v === null) continue;
      const isClearing = clearingSet.has(r * COLS + c);
      const grow = isClearing ? 1 + 0.25 * (1 - blink) : 1;
      drawShape(ctx, v, c * cell + cell / 2, r * cell + cell / 2, cell * grow, isClearing ? blink : 1);
    }
  }

  const p = state.piece;
  if (p) {
    const gy = ghostY(state);
    if (gy !== null && gy !== p.y) {
      for (let i = 0; i < PIECE_LEN; i++) {
        const row = gy + i;
        if (row >= 0) drawShape(ctx, p.cells[i], p.x * cell + cell / 2, row * cell + cell / 2, cell, 0.18);
      }
    }
    for (let i = 0; i < PIECE_LEN; i++) {
      const row = p.y + i;
      if (row >= 0) drawShape(ctx, p.cells[i], p.x * cell + cell / 2, row * cell + cell / 2, cell);
    }
  }
}

export function drawNext(ctx, cells, size) {
  ctx.clearRect(0, 0, size, size * PIECE_LEN);
  if (!cells) return;
  cells.forEach((v, i) => drawShape(ctx, v, size / 2, i * size + size / 2, size));
}

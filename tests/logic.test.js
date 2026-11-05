// Testes da lógica. Rode com: npm test  (ou: node --test tests/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COLS, ROWS, CLEAR_DELAY_MS,
  createGame, emptyGrid, findMatches, applyGravity, move, rotate, hardDrop, update,
  shapesForLevel, fallIntervalMs, scoreFor, setPaused,
} from '../src/logic.js';

test('encontra 3 iguais na horizontal, vertical e diagonal', () => {
  const g = emptyGrid();
  const b = ROWS - 1;
  g[b][0] = g[b][1] = g[b][2] = 0;
  assert.equal(findMatches(g).length, 3);

  const v = emptyGrid();
  v[b][5] = v[b - 1][5] = v[b - 2][5] = v[b - 3][5] = 1;
  assert.equal(findMatches(v).length, 4);

  const d = emptyGrid();
  d[b][0] = d[b - 1][1] = d[b - 2][2] = 2;
  assert.equal(findMatches(d).length, 3);

  const a = emptyGrid();
  a[b][3] = a[b - 1][2] = a[b - 2][1] = 2;
  assert.equal(findMatches(a).length, 3);
});

test('não explode só 2 iguais nem formas diferentes', () => {
  const g = emptyGrid();
  const b = ROWS - 1;
  g[b][0] = g[b][1] = 0;
  g[b][2] = 1;
  assert.deepEqual(findMatches(g), []);
});

test('gravidade faz as formas caírem', () => {
  const g = emptyGrid();
  g[0][0] = 1;
  g[5][0] = 2;
  applyGravity(g);
  assert.equal(g[ROWS - 1][0], 2);
  assert.equal(g[ROWS - 2][0], 1);
  assert.equal(g[0][0], null);
});

test('girar muda a ordem das formas', () => {
  const s = createGame({ seed: 1 });
  s.piece.cells = [0, 1, 2];
  rotate(s);
  assert.deepEqual(s.piece.cells, [2, 0, 1]);
});

test('não sai pelas paredes', () => {
  const s = createGame({ seed: 1 });
  for (let i = 0; i < 20; i++) move(s, -1);
  assert.equal(s.piece.x, 0);
  for (let i = 0; i < 20; i++) move(s, 1);
  assert.equal(s.piece.x, COLS - 1);
});

test('derrubar 3 iguais explode, pontua e solta nova peça', () => {
  const s = createGame({ seed: 1 });
  s.piece.cells = [1, 1, 1];
  hardDrop(s);
  assert.ok(s.clearing, 'deveria estar explodindo');
  const before = s.score;
  update(s, CLEAR_DELAY_MS + 1);
  assert.equal(s.score - before, scoreFor(3, 1, 1));
  assert.equal(s.cleared, 3);
  assert.ok(s.piece, 'nova peça deveria aparecer');
  assert.ok(s.grid.every((row) => row.every((v) => v === null)));
});

test('combo em cadeia multiplica pontos', () => {
  const s = createGame({ seed: 1 });
  const b = ROWS - 1;
  // Linha de baixo: 0 0 0, em cima: 1 1 _ ; a peça [1,0,0] cai na coluna 2.
  // Explodem os 0 (linha e coluna); os 1 caem e formam nova linha = combo.
  s.grid[b][0] = 0; s.grid[b][1] = 0; s.grid[b][2] = 0;
  s.grid[b - 1][0] = 1; s.grid[b - 1][1] = 1;
  s.piece.x = 2;
  s.piece.cells = [1, 0, 0];
  hardDrop(s);
  assert.equal(s.chain, 1);
  update(s, CLEAR_DELAY_MS + 1); // explode linha de baixo, tudo cai
  assert.equal(s.chain, 2, 'deveria haver um combo');
  update(s, CLEAR_DELAY_MS + 1);
  assert.equal(s.chain, 0);
});

test('fim de jogo quando a coluna de entrada enche', () => {
  const s = createGame({ seed: 3 });
  let guard = 0;
  while (!s.over && guard++ < 500) {
    if (s.piece) {
      // alterna formas para evitar explosões
      s.piece.cells = guard % 2 ? [0, 1, 2] : [2, 0, 1];
      hardDrop(s);
    }
    update(s, CLEAR_DELAY_MS + 1);
  }
  assert.ok(s.over);
});

test('pausa congela o jogo', () => {
  const s = createGame({ seed: 1 });
  const y = s.piece.y;
  setPaused(s, true);
  update(s, 10000);
  assert.equal(s.piece.y, y);
  assert.equal(move(s, 1), false);
});

test('dificuldade começa fácil e aumenta', () => {
  assert.equal(shapesForLevel(1), 3);
  assert.ok(shapesForLevel(10) > shapesForLevel(1));
  assert.ok(fallIntervalMs(5) < fallIntervalMs(1));
  assert.ok(fallIntervalMs(99) >= 110);
});

test('mesma semente gera o mesmo jogo', () => {
  const a = createGame({ seed: 42 });
  const b = createGame({ seed: 42 });
  assert.deepEqual(a.piece.cells, b.piece.cells);
  assert.deepEqual(a.next, b.next);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  checkXOWinner,
  findBestXOMove,
  calculateTugProgress,
  calculateTriviaScore,
  checkCircleBoxCollision,
  reflectVelocity,
  createTournamentPairings,
  type XOCell,
} from './rules.ts';

test('XO win detection - row win for X', () => {
  const board: XOCell[] = ['X', 'X', 'X', null, 'O', null, 'O', null, null];
  const res = checkXOWinner(board, 3);
  assert.equal(res.winner, 'X');
  assert.deepEqual(res.winningLine, [0, 1, 2]);
});

test('XO win detection - diagonal win for O', () => {
  const board: XOCell[] = ['O', 'X', 'X', null, 'O', null, 'X', null, 'O'];
  const res = checkXOWinner(board, 3);
  assert.equal(res.winner, 'O');
  assert.deepEqual(res.winningLine, [0, 4, 8]);
});

test('XO win detection - draw check', () => {
  const board: XOCell[] = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
  const res = checkXOWinner(board, 3);
  assert.equal(res.winner, 'draw');
  assert.equal(res.winningLine, null);
});

test('XO AI smart block', () => {
  // Opponent 'O' is about to win at index 2 (has 0, 1)
  const board: XOCell[] = ['O', 'O', null, 'X', null, null, 'X', null, null];
  const move = findBestXOMove(board, 'X', 'hard');
  assert.equal(move, 2, 'AI should block opponent winning move');
});

test('Tug of War calculations', () => {
  const mid = calculateTugProgress(10, 10, 30);
  assert.equal(mid.position, 0);
  assert.equal(mid.winner, null);

  const team1Win = calculateTugProgress(35, 5, 30);
  assert.equal(team1Win.position, -1);
  assert.equal(team1Win.winner, 1);

  const team2Win = calculateTugProgress(5, 35, 30);
  assert.equal(team2Win.position, 1);
  assert.equal(team2Win.winner, 2);
});

test('Trivia score calculations', () => {
  assert.equal(calculateTriviaScore(false, 5000, 10000), 0);
  // Max speed (10000/10000)
  assert.equal(calculateTriviaScore(true, 10000, 10000), 250);
  // Zero time left
  assert.equal(calculateTriviaScore(true, 0, 10000), 100);
});

test('Circle Box collision detection', () => {
  // Box from (10, 10) to (30, 30). Circle at (15, 15) radius 5 -> inside
  assert.equal(checkCircleBoxCollision(15, 15, 5, 10, 10, 20, 20), true);
  // Circle far away at (100, 100)
  assert.equal(checkCircleBoxCollision(100, 100, 5, 10, 10, 20, 20), false);
  // Circle touching edge at (5, 20) with radius 6 -> intersects left edge at 10
  assert.equal(checkCircleBoxCollision(5, 20, 6, 10, 10, 20, 20), true);
});

test('Velocity reflection', () => {
  // Moving right (vx=10, vy=0), hitting vertical wall (normalX = -1, normalY = 0)
  const bounce = reflectVelocity(10, 0, -1, 0, 1.0);
  assert.ok(Math.abs(bounce.vx - (-10)) < 0.001);
  assert.ok(Math.abs(bounce.vy - 0) < 0.001);
});

test('Tournament pairings', () => {
  const pairings = createTournamentPairings([1, 2, 3, 4]);
  assert.equal(pairings.semiFinals.length, 2);
  assert.equal(pairings.semiFinals[0].p1, 1);
  assert.equal(pairings.semiFinals[0].p2, 2);
  assert.equal(pairings.semiFinals[1].p1, 3);
  assert.equal(pairings.semiFinals[1].p2, 4);
});

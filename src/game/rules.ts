/**
 * Pure deterministic game rules and math helpers.
 * Fully decoupled from DOM/React for instant unit testing via `node:test`.
 */

export type XOCell = 'X' | 'O' | null;

/**
 * Checks if a board (3x3 or 4x4) has a winner.
 * @param board Flat array of cells of length size * size
 * @param size Board width/height (typically 3 or 4)
 * @returns { winner: 'X' | 'O' | 'draw' | null, winningLine: number[] | null }
 */
export function checkXOWinner(
  board: XOCell[],
  size: number = 3
): { winner: 'X' | 'O' | 'draw' | null; winningLine: number[] | null } {
  const lines: number[][] = [];

  // Rows
  for (let r = 0; r < size; r++) {
    const row: number[] = [];
    for (let c = 0; c < size; c++) {
      row.push(r * size + c);
    }
    lines.push(row);
  }

  // Columns
  for (let c = 0; c < size; c++) {
    const col: number[] = [];
    for (let r = 0; r < size; r++) {
      col.push(r * size + c);
    }
    lines.push(col);
  }

  // Diagonals
  const diag1: number[] = [];
  const diag2: number[] = [];
  for (let i = 0; i < size; i++) {
    diag1.push(i * size + i);
    diag2.push(i * size + (size - 1 - i));
  }
  lines.push(diag1, diag2);

  // Check lines
  for (const line of lines) {
    const first = board[line[0]];
    if (first && line.every((idx) => board[idx] === first)) {
      return { winner: first, winningLine: line };
    }
  }

  // Check for draw
  const isFull = board.every((cell) => cell !== null);
  if (isFull) {
    return { winner: 'draw', winningLine: null };
  }

  return { winner: null, winningLine: null };
}

/**
 * Finds the optimal or smart move for AI in XO.
 */
export function findBestXOMove(
  board: XOCell[],
  aiPlayer: 'X' | 'O',
  difficulty: 'easy' | 'hard' = 'hard'
): number {
  const opponent: 'X' | 'O' = aiPlayer === 'X' ? 'O' : 'X';
  const availableIndices = board
    .map((c, i) => (c === null ? i : -1))
    .filter((i) => i !== -1);

  if (availableIndices.length === 0) return -1;

  if (difficulty === 'easy' && Math.random() < 0.4) {
    return availableIndices[Math.floor(Math.random() * availableIndices.length)];
  }

  // 1. Can AI win immediately?
  for (const idx of availableIndices) {
    const clone = [...board];
    clone[idx] = aiPlayer;
    if (checkXOWinner(clone, 3).winner === aiPlayer) {
      return idx;
    }
  }

  // 2. Can opponent win next turn? Block!
  for (const idx of availableIndices) {
    const clone = [...board];
    clone[idx] = opponent;
    if (checkXOWinner(clone, 3).winner === opponent) {
      return idx;
    }
  }

  // 3. Take center if available
  if (board[4] === null) return 4;

  // 4. Take corners
  const corners = [0, 2, 6, 8].filter((idx) => board[idx] === null);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  // 5. Default random available
  return availableIndices[Math.floor(Math.random() * availableIndices.length)];
}

/**
 * Calculates Tug of War progress between two teams / players.
 * Returns normalized position between -1 (Team 1 wins) and +1 (Team 2 wins).
 */
export function calculateTugProgress(
  pulls1: number,
  pulls2: number,
  targetDiff: number = 30
): { position: number; winner: 1 | 2 | null } {
  const diff = pulls2 - pulls1;
  const normalized = Math.max(-1, Math.min(1, diff / targetDiff));
  let winner: 1 | 2 | null = null;
  if (diff <= -targetDiff) {
    winner = 1;
  } else if (diff >= targetDiff) {
    winner = 2;
  }
  return { position: normalized, winner };
}

/**
 * Calculates Trivia score based on accuracy and speed.
 */
export function calculateTriviaScore(
  isCorrect: boolean,
  timeRemainingMs: number,
  totalTimeMs: number
): number {
  if (!isCorrect) return 0;
  const basePoints = 100;
  const speedBonus = Math.floor((Math.max(0, timeRemainingMs) / totalTimeMs) * 150);
  return basePoints + speedBonus;
}

/**
 * Circle to Axis-Aligned Bounding Box (AABB) collision detection.
 */
export function checkCircleBoxCollision(
  cx: number,
  cy: number,
  radius: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  // Find closest point to circle within box
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));

  const distanceX = cx - closestX;
  const distanceY = cy - closestY;

  return distanceX * distanceX + distanceY * distanceY < radius * radius;
}

/**
 * Calculates elastic bounce response for 2D vectors.
 */
export function reflectVelocity(
  vx: number,
  vy: number,
  normalX: number,
  normalY: number,
  elasticity: number = 0.95
): { vx: number; vy: number } {
  const dot = vx * normalX + vy * normalY;
  return {
    vx: (vx - 2 * dot * normalX) * elasticity,
    vy: (vy - 2 * dot * normalY) * elasticity,
  };
}

/**
 * Builds tournament bracket pairings for up to 4 players.
 */
export function createTournamentPairings(playerIds: number[]): {
  semiFinals: { matchId: number; p1: number; p2: number }[];
} {
  if (playerIds.length < 2) {
    return { semiFinals: [] };
  }
  if (playerIds.length === 2) {
    return {
      semiFinals: [{ matchId: 1, p1: playerIds[0], p2: playerIds[1] }],
    };
  }
  // 3 or 4 players
  const p3 = playerIds[2];
  const p4 = playerIds[3] ?? playerIds[0]; // fallback
  return {
    semiFinals: [
      { matchId: 1, p1: playerIds[0], p2: playerIds[1] },
      { matchId: 2, p1: p3, p2: p4 },
    ],
  };
}

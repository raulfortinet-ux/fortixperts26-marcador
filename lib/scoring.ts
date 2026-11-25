export const SCORE_BY_ATTEMPT = [10, 7, 4, 1];

export function pointsFor(attemptNumber: number): number {
  const idx = Math.max(1, Math.min(attemptNumber, SCORE_BY_ATTEMPT.length)) - 1;
  return SCORE_BY_ATTEMPT[idx];
}

export function nextAttemptValue(currentAttempts: number): number {
  return pointsFor(currentAttempts + 1);
}

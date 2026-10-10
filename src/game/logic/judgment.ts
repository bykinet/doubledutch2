import { GameDifficulty, GameSpeed, GameSettings, JudgmentRating } from "./types";

export const SPEED_ANGULAR_VELOCITIES: Record<GameSpeed, number> = {
  1: 180,
  2: 270,
  3: 360,
  4: 480,
  5: 600,
};

export const SPEED_SCORES: Record<GameSpeed, number> = {
  1: 5,
  2: 10,
  3: 15,
  4: 20,
  5: 25,
};

export const DIFFICULTY_SCORES: Record<GameDifficulty, number> = {
  1: 10,
  2: 20,
  3: 30,
};

export const DIFFICULTY_WINDOWS: Record<GameDifficulty, { min: number; max: number }> = {
  1: { min: 135, max: 200 }, // Easy
  2: { min: 145, max: 195 }, // Medium
  3: { min: 155, max: 190 }, // Hard
};

export const SCORE_MAX_CAP = 999999;
export const BUTTON_COOLDOWN_MS = 600;

/**
 * Evaluates whether an angle is Perfect, Good, or Miss based on difficulty window
 */
export function evaluateTiming(angle: number, difficulty: GameDifficulty): JudgmentRating {
  const window = DIFFICULTY_WINDOWS[difficulty];
  if (angle < window.min || angle > window.max) {
    return "miss";
  }

  const width = window.max - window.min;
  const center = (window.min + window.max) / 2;
  const perfectHalfWidth = (width * 0.3) / 2;

  if (angle >= center - perfectHalfWidth && angle <= center + perfectHalfWidth) {
    return "perfect";
  }
  return "good";
}

/**
 * Calculates current angular speed, applying 1.15x multiplier during the final 20% of duration
 */
export function getAngularSpeed(speed: GameSpeed, remainingSeconds: number, totalDuration: number): number {
  const baseSpeed = SPEED_ANGULAR_VELOCITIES[speed];
  const isRushPeriod = remainingSeconds <= totalDuration * 0.2;
  return isRushPeriod ? baseSpeed * 1.15 : baseSpeed;
}

/**
 * Calculates the combo multiplier based on consecutive successful rounds
 * Initial: 1.0, increases by +0.1 every 5 rounds, capped at 2.0
 */
export function getComboMultiplier(comboRounds: number): number {
  const bonusSteps = Math.floor(comboRounds / 5);
  const multiplier = 1.0 + bonusSteps * 0.1;
  return Math.min(2.0, Math.round(multiplier * 10) / 10);
}

/**
 * Computes jumper horizontal placements across the 10-unit span
 * 1-2 jumpers: between 4.5 and 5.5
 * 3-5 jumpers: evenly spaced between 3.0 and 7.0
 */
export function getJumperTargetX(index: number, totalCount: number): number {
  if (totalCount <= 1) return 5.0;
  // Symmetrically spaced horizontally around exact center (5.0)
  const spacing = 0.8;
  const startX = 5.0 - ((totalCount - 1) * spacing) / 2;
  return startX + index * spacing;
}

/**
 * Calculates theoretical maximum score for a given game setup to accurately rate grades (S, A, B, C)
 */
export function calculateTheoreticalMaxScore(settings: GameSettings): number {
  const { duration, speed, difficulty, maxJumpers } = settings;
  const normalDuration = duration * 0.8;
  const rushDuration = duration * 0.2;

  const normalSpeed = SPEED_ANGULAR_VELOCITIES[speed];
  const rushSpeed = normalSpeed * 1.15;

  const normalRounds = Math.floor((normalDuration * normalSpeed) / 360);
  const rushRounds = Math.floor((rushDuration * rushSpeed) / 360);
  const totalRounds = normalRounds + rushRounds;

  const speedScore = SPEED_SCORES[speed];
  const diffScore = DIFFICULTY_SCORES[difficulty];

  let theoreticalScore = 0;
  let combo = 0;

  for (let r = 0; r < totalRounds; r++) {
    // Jumpers take 1 round to qualify
    const count = r === 0 ? 0 : maxJumpers;
    const comboMult = getComboMultiplier(combo);
    theoreticalScore += Math.floor(count * speedScore * diffScore * comboMult);
    combo++;
  }

  return Math.min(SCORE_MAX_CAP, Math.max(100, theoreticalScore));
}

/**
 * Determines grade (S, A, B, C) based on score vs theoretical max
 * S: >= 90%, A: >= 75%, B: >= 50%, C: < 50%
 */
export function calculateGrade(score: number, theoreticalMax: number): "S" | "A" | "B" | "C" {
  if (theoreticalMax <= 0) return "C";
  const ratio = score / theoreticalMax;
  if (ratio >= 0.9) return "S";
  if (ratio >= 0.75) return "A";
  if (ratio >= 0.5) return "B";
  return "C";
}

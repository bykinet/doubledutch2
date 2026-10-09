export type GameDifficulty = 1 | 2 | 3; // 1: Easy, 2: Medium, 3: Hard
export type GameSpeed = 1 | 2 | 3 | 4 | 5; // 1 to 5
export type CameraAngle = "front" | "left" | "right" | "high";
export type CameraMode = "still" | "move";
export type JudgmentRating = "perfect" | "good" | "miss";

export interface GameSettings {
  duration: number; // 30, 60, 90, 120, 150, 180 seconds
  speed: GameSpeed; // 1 - 5
  difficulty: GameDifficulty; // 1 - 3
  maxJumpers: number; // 1 - 5
}

export interface JumperState {
  id: string;
  enteredAtAngle: number;
  enteredAtTime: number;
  survivedFullRounds: number; // incremented on each 0 pass after a full turn
  state: "enter" | "jumping" | "exit" | "trip";
  targetX: number; // relative coordinate 3.0 ~ 7.0
  currentX: number;
  jumpFrame: number; // 0 - 7
}

export interface RoundScoreRecord {
  survivedCount: number;
  speedScore: number;
  difficultyScore: number;
  comboMultiplier: number;
  addedScore: number;
}

export interface GamePlayStats {
  score: number;
  comboRounds: number; // consecutive successful rounds
  maxCombo: number;
  enteredCount: number;
  trippedCount: number;
  perfectCount: number;
  goodCount: number;
  missCount: number;
}
